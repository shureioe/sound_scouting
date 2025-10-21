// Tipos para la aplicación de scouting de localizaciones

export interface TechnicianConfig {
  id: string;
  fullName: string;
  company: string;
  email: string;
  phone: string;
  updatedAt: string;
}

export interface LocationPhoto {
  id: string;
  url: string;
  caption?: string;
  timestamp: string;
  fileSize: number;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: string;
}

export type LocationStatus = 'apto' | 'no_apto' | 'pendiente';

export type EvaluationStatus = LocationStatus;

export interface LocationCoords {
  lat: number;
  lng: number;
}

export interface LocationSet {
  id: string;
  name: string;
  notes?: string;
  coords?: LocationCoords | null;
  photos?: string[];
  status?: LocationStatus;
  createdAt: string;
  updatedAt: string;
  // Campos legados para mantener compatibilidad con datos anteriores
  projectId?: string;
  title?: string;
  tags: string[];
  noiseObservations: string;
  technicalRequirements: string;
  evaluation?: EvaluationStatus;
  coordinates?: Coordinates | null;
  legacyPhotos?: LocationPhoto[];
}

export type NewLocationSetInput = Omit<LocationSet, 'id' | 'createdAt' | 'updatedAt'>;

export interface Project {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  sets: LocationSet[];
}

export interface SoundScoutingReport {
  id: string;
  projectId: string;
  projectName: string;
  technician: TechnicianConfig;
  generatedAt: string;
  sets: LocationSet[];
}

// Tipos para formularios
export interface ProjectFormData {
  name: string;
}

export interface TechnicianFormData {
  fullName: string;
  company: string;
  email: string;
  phone: string;
}

// Tipos para almacenamiento local
export interface LocalStorageData {
  projects: Project[];
  currentProjectId?: string;
  technicianConfig: TechnicianConfig;
}

// Tipos para utilidades
export interface MapLink {
  url: string;
  label: string;
  icon: string;
}

export interface FileUploadResult {
  success: boolean;
  url?: string;
  error?: string;
  fileSize?: number;
}