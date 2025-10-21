import { LocalStorageData, Project, TechnicianConfig, LocationSet, NewLocationSetInput } from './types';

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

// Obtener datos del almacenamiento local
export const getStoredData = (): LocalStorageData => {
  if (typeof window === 'undefined') {
    return defaultData;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return defaultData;
    }

    const parsed = JSON.parse(stored);
    return {
      ...defaultData,
      ...parsed,
    };
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return defaultData;
  }
};

// Guardar datos en el almacenamiento local
export const saveStoredData = (data: LocalStorageData): void => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Storage: Error writing to localStorage:', error);
  }
};

// Gestión de proyectos
export const getProjects = (): Project[] => {
  return getStoredData().projects;
};

export const getProjectById = (id: string): Project | undefined => {
  return getStoredData().projects.find(p => p.id === id);
};

export const createProject = (name: string): Project => {
  const data = getStoredData();
  const newProject: Project = {
    id: generateId(),
    name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
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

  const newSet: LocationSet = {
    id: generateId(),
    projectId,
    ...setData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  data.projects[projectIndex].sets.push(newSet);
  data.projects[projectIndex].updatedAt = new Date().toISOString();
  saveStoredData(data);

  return newSet;
};

export const updateSet = (projectId: string, setId: string, updates: Partial<LocationSet>): LocationSet | null => {
  const data = getStoredData();
  const projectIndex = data.projects.findIndex(p => p.id === projectId);

  if (projectIndex === -1) {
    return null;
  }

  const setIndex = data.projects[projectIndex].sets.findIndex(s => s.id === setId);
  if (setIndex === -1) {
    return null;
  }

  data.projects[projectIndex].sets[setIndex] = {
    ...data.projects[projectIndex].sets[setIndex],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  data.projects[projectIndex].updatedAt = new Date().toISOString();
  saveStoredData(data);
  return data.projects[projectIndex].sets[setIndex];
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
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const clearAllData = (): void => {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.removeItem(STORAGE_KEY);
};

export const exportData = (): string => {
  return JSON.stringify(getStoredData(), null, 2);
};

export const importData = (jsonData: string): boolean => {
  try {
    const data = JSON.parse(jsonData);
    saveStoredData(data);
    return true;
  } catch (error) {
    console.error('Error importing data:', error);
    return false;
  }
};