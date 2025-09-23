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

export interface LocationSet {
  id: string;
  projectId: string;
  title: string;
  evaluation: 'apto' | 'no_apto' | 'sin_evaluar';
  tags: string[];
  noiseObservations: string;
  technicalRequirements: string;
  photos: LocationPhoto[];
  coordinates?: Coordinates;
  createdAt: string;
  updatedAt: string;
}

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

export interface SetFormData {
  title: string;
  evaluation: 'apto' | 'no_apto' | 'sin_evaluar';
  tags: string;
  noiseObservations: string;
  technicalRequirements: string;
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

export type EvaluationStatus = 'apto' | 'no_apto' | 'sin_evaluar';

export interface FileUploadResult {
  success: boolean;
  url?: string;
  error?: string;
  fileSize?: number;
}