import {
  LocalStorageData,
  Project,
  TechnicianConfig,
  LocationSet,
  NewLocationSetInput,
  LocationStatus,
} from './types';

const STORAGE_KEY = 'soundScoutingData';

// Datos iniciales por defecto
const defaultTechnicianConfig: TechnicianConfig = {
  id: 'default',
  fullName: '',
  company: '',
  email: '',
  phone: '',
  updatedAt: new Date().toISOString(),
};

const defaultData: LocalStorageData = {
  projects: [],
  currentProjectId: undefined,
  technicianConfig: defaultTechnicianConfig,
};

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const isString = (value: unknown): value is string => typeof value === 'string';

const sanitizeString = (value: unknown): string | undefined => {
  if (!isString(value)) {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const isValidIsoString = (value: unknown): value is string => {
  return isString(value) && !Number.isNaN(Date.parse(value));
};

const normalizeIsoDate = (value: unknown, fallback: string): string => {
  return isValidIsoString(value) ? value : fallback;
};

const normalizeStatus = (value: unknown): LocationStatus | undefined => {
  if (value === 'apto' || value === 'no_apto' || value === 'pendiente') {
    return value;
  }
  if (value === 'sin_evaluar') {
    return 'pendiente';
  }
  return undefined;
};

const normalizeCoords = (value: unknown): LocationSet['coords'] | null | undefined => {
  if (value === null) {
    return null;
  }
  if (!isRecord(value)) {
    return undefined;
  }

  const latCandidate =
    typeof value.lat === 'number'
      ? value.lat
      : typeof value.latitude === 'number'
        ? value.latitude
        : undefined;
  const lngCandidate =
    typeof value.lng === 'number'
      ? value.lng
      : typeof value.longitude === 'number'
        ? value.longitude
        : undefined;

  if (typeof latCandidate === 'number' && typeof lngCandidate === 'number') {
    if (Number.isFinite(latCandidate) && Number.isFinite(lngCandidate)) {
      return { lat: latCandidate, lng: lngCandidate };
    }
    return null;
  }

  return undefined;
};

const normalizePhotos = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  const urls: string[] = [];
  for (const item of value) {
    if (isString(item) && item.trim().length > 0) {
      urls.push(item.trim());
      continue;
    }

    if (isRecord(item) && isString(item.url) && item.url.trim().length > 0) {
      urls.push(item.url.trim());
    }
  }

  return urls;
};

const extractLegacyPhotos = (
  value: unknown,
): LocationSet['legacyPhotos'] => {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const photos = value.filter(
    (item): item is NonNullable<LocationSet['legacyPhotos']>[number] =>
      isRecord(item) && isString(item.url) && item.url.trim().length > 0,
  );

  return photos.length > 0 ? photos : undefined;
};

const normalizeLocationSet = (raw: Partial<LocationSet>): LocationSet => {
  const now = new Date().toISOString();
  const id = sanitizeString(raw.id) ?? generateId();
  const normalizedName = sanitizeString(raw.name) ?? sanitizeString(raw.title) ?? 'Localización sin nombre';
  const title = sanitizeString(raw.title) ?? normalizedName;

  const createdAt = normalizeIsoDate(raw.createdAt, now);
  const updatedAt = normalizeIsoDate(raw.updatedAt, createdAt);

  const coordsCandidate =
    raw.coords !== undefined ? normalizeCoords(raw.coords) : normalizeCoords(raw.coordinates);
  const coords = coordsCandidate ?? null;

  const photos = Array.from(
    new Set([...(normalizePhotos(raw.photos) ?? []), ...normalizePhotos(raw.legacyPhotos)]),
  );

  const status = normalizeStatus(raw.status ?? raw.evaluation);
  const evaluation = normalizeStatus(raw.evaluation) ?? status;

  const legacyPhotos =
    extractLegacyPhotos(raw.legacyPhotos ?? raw.photos) ?? undefined;

  const tags = Array.isArray(raw.tags) ? raw.tags.filter(isString) : [];
  const noiseObservations = isString(raw.noiseObservations) ? raw.noiseObservations : '';
  const technicalRequirements = isString(raw.technicalRequirements) ? raw.technicalRequirements : '';

  const normalized: LocationSet = {
    id,
    name: normalizedName,
    notes: isString(raw.notes)
      ? raw.notes
      : noiseObservations || undefined,
    coords,
    photos: photos.length > 0 ? photos : undefined,
    status,
    createdAt,
    updatedAt,
    title,
    tags,
    noiseObservations,
    technicalRequirements,
    evaluation,
    projectId: sanitizeString(raw.projectId),
    coordinates: isRecord(raw.coordinates) ? (raw.coordinates as LocationSet['coordinates']) : undefined,
    legacyPhotos,
  };

  return normalized;
};

const mergeLocationSets = (existing: LocationSet, incoming: LocationSet): LocationSet => {
  const existingUpdatedAt = Date.parse(existing.updatedAt ?? existing.createdAt);
  const incomingUpdatedAt = Date.parse(incoming.updatedAt ?? incoming.createdAt);
  const primary = incomingUpdatedAt >= existingUpdatedAt ? incoming : existing;
  const secondary = primary === incoming ? existing : incoming;

  const mergedPhotos = Array.from(new Set([...(secondary.photos ?? []), ...(primary.photos ?? [])]));

  return normalizeLocationSet({
    ...secondary,
    ...primary,
    photos: mergedPhotos,
    legacyPhotos: primary.legacyPhotos ?? secondary.legacyPhotos,
    coords: primary.coords ?? secondary.coords ?? null,
    notes: primary.notes ?? secondary.notes,
    tags: primary.tags ?? secondary.tags,
    noiseObservations: primary.noiseObservations ?? secondary.noiseObservations,
    technicalRequirements: primary.technicalRequirements ?? secondary.technicalRequirements,
    status: primary.status ?? secondary.status,
    evaluation: primary.status ?? secondary.status ?? primary.evaluation ?? secondary.evaluation,
    title: primary.title ?? secondary.title ?? primary.name,
    projectId: primary.projectId ?? secondary.projectId,
    coordinates: primary.coordinates ?? secondary.coordinates,
    createdAt:
      Date.parse(existing.createdAt) <= Date.parse(incoming.createdAt)
        ? existing.createdAt
        : incoming.createdAt,
    updatedAt: primary.updatedAt,
  });
};

const dedupeLocationSets = (sets: Array<Partial<LocationSet>>): LocationSet[] => {
  const unique = new Map<string, LocationSet>();

  for (const rawSet of sets) {
    const normalized = normalizeLocationSet(rawSet);
    const current = unique.get(normalized.id);

    if (current) {
      unique.set(normalized.id, mergeLocationSets(current, normalized));
    } else {
      unique.set(normalized.id, normalized);
    }
  }

  return Array.from(unique.values());
};

const normalizeProjectSets = (project: Project): boolean => {
  if (!Array.isArray(project.sets)) {
    project.sets = [];
    return true;
  }

  const normalizedSets = dedupeLocationSets(project.sets);
  const before = JSON.stringify(project.sets);
  const after = JSON.stringify(normalizedSets);

  if (before !== after) {
    project.sets = normalizedSets;
    return true;
  }

  return false;
};

const normalizeStoredData = (data: LocalStorageData): boolean => {
  let mutated = false;

  if (!Array.isArray(data.projects)) {
    data.projects = [];
    mutated = true;
  }

  data.projects.forEach(project => {
    if (!Array.isArray(project.sets)) {
      project.sets = [];
      mutated = true;
    }

    const changed = normalizeProjectSets(project);
    if (changed) {
      mutated = true;
    }

    if (!isValidIsoString(project.createdAt)) {
      project.createdAt = new Date().toISOString();
      mutated = true;
    }

    if (!isValidIsoString(project.updatedAt)) {
      project.updatedAt = project.createdAt;
      mutated = true;
    }
  });

  if (!data.technicianConfig) {
    data.technicianConfig = {
      ...defaultTechnicianConfig,
      updatedAt: new Date().toISOString(),
    };
    mutated = true;
  }

  return mutated;
};

// Obtener datos del almacenamiento local
export const getStoredData = (): LocalStorageData => {
  if (typeof window === 'undefined') {
    return { ...defaultData, projects: [...defaultData.projects] };
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return { ...defaultData, projects: [...defaultData.projects] };
    }

    const parsed = JSON.parse(stored);
    const data: LocalStorageData = {
      ...defaultData,
      ...parsed,
      projects: Array.isArray(parsed?.projects) ? parsed.projects : [],
    };

    const mutated = normalizeStoredData(data);
    if (mutated) {
      saveStoredData(data);
    }

    return data;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return { ...defaultData, projects: [...defaultData.projects] };
  }
};

// Guardar datos en el almacenamiento local
export const saveStoredData = (data: LocalStorageData): void => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Storage: Error writing to localStorage:', error);
  }
};

// Gestión de proyectos
export const getProjects = (): Project[] => {
  return getStoredData().projects;
};

export const getProjectById = (id: string): Project | undefined => {
  const data = getStoredData();
  const projectIndex = data.projects.findIndex(project => project.id === id);

  if (projectIndex === -1) {
    return undefined;
  }

  const project = data.projects[projectIndex];
  const changed = normalizeProjectSets(project);
  if (changed) {
    saveStoredData(data);
  }

  return project;
};

export const createProject = (name: string): Project => {
  const data = getStoredData();
  const now = new Date().toISOString();
  const newProject: Project = {
    id: generateId(),
    name,
    createdAt: now,
    updatedAt: now,
    sets: [],
  };

  data.projects.push(newProject);
  data.currentProjectId = newProject.id;
  saveStoredData(data);

  return newProject;
};

export const updateProject = (id: string, updates: Partial<Project>): Project | null => {
  const data = getStoredData();
  const projectIndex = data.projects.findIndex(p => p.id === id);

  if (projectIndex === -1) {
    return null;
  }

  data.projects[projectIndex] = {
    ...data.projects[projectIndex],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  saveStoredData(data);
  return data.projects[projectIndex];
};

export const deleteProject = (id: string): boolean => {
  const data = getStoredData();
  const initialLength = data.projects.length;

  data.projects = data.projects.filter(p => p.id !== id);

  if (data.currentProjectId === id) {
    data.currentProjectId = data.projects.length > 0 ? data.projects[0].id : undefined;
  }

  saveStoredData(data);
  return data.projects.length < initialLength;
};

export const setCurrentProject = (id: string): void => {
  const data = getStoredData();
  data.currentProjectId = id;
  saveStoredData(data);
};

export const getCurrentProject = (): Project | undefined => {
  const data = getStoredData();
  if (!data.currentProjectId) {
    return undefined;
  }
  return getProjectById(data.currentProjectId);
};

// Gestión de sets
export const createSet = (projectId: string, setData: NewLocationSetInput): LocationSet | null => {
  const data = getStoredData();
  const projectIndex = data.projects.findIndex(p => p.id === projectId);

  if (projectIndex === -1) {
    return null;
  }

  const now = new Date().toISOString();
  const newSet = normalizeLocationSet({
    ...setData,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
    title: setData.title ?? setData.name,
    evaluation: setData.status ?? setData.evaluation,
  });

  const project = data.projects[projectIndex];
  const duplicateIndex = project.sets.findIndex(setItem => setItem.id === newSet.id);
  if (duplicateIndex !== -1) {
    project.sets[duplicateIndex] = mergeLocationSets(project.sets[duplicateIndex], newSet);
  } else {
    project.sets.push(newSet);
  }

  project.updatedAt = now;
  saveStoredData(data);

  return newSet;
};

export const updateSet = (
  projectId: string,
  setId: string,
  updates: Partial<LocationSet>,
): LocationSet | null => {
  const data = getStoredData();
  const projectIndex = data.projects.findIndex(p => p.id === projectId);

  if (projectIndex === -1) {
    return null;
  }

  const setIndex = data.projects[projectIndex].sets.findIndex(s => s.id === setId);
  if (setIndex === -1) {
    return null;
  }

  const now = new Date().toISOString();
  const currentSet = data.projects[projectIndex].sets[setIndex];
  const updatedSet = normalizeLocationSet({
    ...currentSet,
    ...updates,
    id: currentSet.id,
    createdAt: currentSet.createdAt,
    updatedAt: now,
  });

  data.projects[projectIndex].sets[setIndex] = updatedSet;
  data.projects[projectIndex].updatedAt = now;
  saveStoredData(data);
  return updatedSet;
};

export const deleteSet = (projectId: string, setId: string): boolean => {
  const data = getStoredData();
  const projectIndex = data.projects.findIndex(p => p.id === projectId);

  if (projectIndex === -1) {
    return false;
  }

  const initialLength = data.projects[projectIndex].sets.length;
  data.projects[projectIndex].sets = data.projects[projectIndex].sets.filter(s => s.id !== setId);
  data.projects[projectIndex].updatedAt = new Date().toISOString();

  saveStoredData(data);
  return data.projects[projectIndex].sets.length < initialLength;
};

export const addSetPhoto = (
  projectId: string,
  setId: string,
  dataUrl: string,
): LocationSet | null => {
  const sanitizedPhoto = sanitizeString(dataUrl);
  if (!sanitizedPhoto) {
    return null;
  }

  const data = getStoredData();
  const projectIndex = data.projects.findIndex(project => project.id === projectId);
  if (projectIndex === -1) {
    return null;
  }

  const setIndex = data.projects[projectIndex].sets.findIndex(setItem => setItem.id === setId);
  if (setIndex === -1) {
    return null;
  }

  const project = data.projects[projectIndex];
  const currentSet = project.sets[setIndex];
  const photos = new Set(currentSet.photos ?? []);
  photos.add(sanitizedPhoto);

  const now = new Date().toISOString();
  const updatedSet = normalizeLocationSet({
    ...currentSet,
    photos: Array.from(photos),
    updatedAt: now,
  });

  project.sets[setIndex] = updatedSet;
  project.updatedAt = now;
  saveStoredData(data);

  return updatedSet;
};

export const setSetStatus = (
  projectId: string,
  setId: string,
  status: LocationStatus,
): LocationSet | null => {
  const normalizedStatus = normalizeStatus(status);
  if (!normalizedStatus) {
    return null;
  }

  const data = getStoredData();
  const projectIndex = data.projects.findIndex(project => project.id === projectId);
  if (projectIndex === -1) {
    return null;
  }

  const setIndex = data.projects[projectIndex].sets.findIndex(setItem => setItem.id === setId);
  if (setIndex === -1) {
    return null;
  }

  const project = data.projects[projectIndex];
  const now = new Date().toISOString();
  const updatedSet = normalizeLocationSet({
    ...project.sets[setIndex],
    status: normalizedStatus,
    evaluation: normalizedStatus,
    updatedAt: now,
  });

  project.sets[setIndex] = updatedSet;
  project.updatedAt = now;
  saveStoredData(data);
  return updatedSet;
};

export const setSetCoords = (
  projectId: string,
  setId: string,
  coords: { lat: number; lng: number } | null,
): LocationSet | null => {
  const normalizedCoords =
    coords === null
      ? null
      : normalizeCoords(coords);

  if (coords !== null && !normalizedCoords) {
    return null;
  }

  const data = getStoredData();
  const projectIndex = data.projects.findIndex(project => project.id === projectId);
  if (projectIndex === -1) {
    return null;
  }

  const setIndex = data.projects[projectIndex].sets.findIndex(setItem => setItem.id === setId);
  if (setIndex === -1) {
    return null;
  }

  const project = data.projects[projectIndex];
  const now = new Date().toISOString();
  const updatedSet = normalizeLocationSet({
    ...project.sets[setIndex],
    coords: normalizedCoords ?? null,
    updatedAt: now,
  });

  project.sets[setIndex] = updatedSet;
  project.updatedAt = now;
  saveStoredData(data);
  return updatedSet;
};

export const setSetNotes = (
  projectId: string,
  setId: string,
  notes: string,
): LocationSet | null => {
  const data = getStoredData();
  const projectIndex = data.projects.findIndex(project => project.id === projectId);
  if (projectIndex === -1) {
    return null;
  }

  const setIndex = data.projects[projectIndex].sets.findIndex(setItem => setItem.id === setId);
  if (setIndex === -1) {
    return null;
  }

  const project = data.projects[projectIndex];
  const now = new Date().toISOString();
  const updatedSet = normalizeLocationSet({
    ...project.sets[setIndex],
    notes,
    updatedAt: now,
  });

  project.sets[setIndex] = updatedSet;
  project.updatedAt = now;
  saveStoredData(data);
  return updatedSet;
};

// Gestión de configuración del técnico
export const getTechnicianConfig = (): TechnicianConfig => {
  return getStoredData().technicianConfig;
};

export const updateTechnicianConfig = (config: Partial<TechnicianConfig>): TechnicianConfig => {
  const data = getStoredData();
  data.technicianConfig = {
    ...data.technicianConfig,
    ...config,
    updatedAt: new Date().toISOString(),
  };

  saveStoredData(data);
  return data.technicianConfig;
};

// Utilidades
export const clearAllData = (): void => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
};

export const exportData = (): string => {
  return JSON.stringify(getStoredData(), null, 2);
};

export const importData = (jsonData: string): boolean => {
  try {
    const data = JSON.parse(jsonData) as LocalStorageData;
    normalizeStoredData(data);
    saveStoredData(data);
    return true;
  } catch (error) {
    console.error('Error importing data:', error);
    return false;
  }
};
