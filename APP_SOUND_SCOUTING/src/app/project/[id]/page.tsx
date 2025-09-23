'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Project, LocationSet } from '@/lib/types';
import { getProjectById, getCurrentProject, setCurrentProject, updateSet, deleteSet, createSet } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Plus, MapPin, Calendar, Settings, FileText, Camera } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import SetCard from '@/components/SetCard';
import CreateSetDialog from '@/components/CreateSetDialog';

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  
  const [project, setProject] = useState<Project | null>(null);
  const [showCreateSetDialog, setShowCreateSetDialog] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const loadProject = () => {
    setLoading(true);
    const loadedProject = getProjectById(projectId);
    
    if (loadedProject) {
      setCurrentProject(projectId);
      setProject(loadedProject);
    } else {
      // Redirigir a la página principal si el proyecto no existe
      router.push('/');
    }
    setLoading(false);
  };

  const handleSetCreated = (newSet: LocationSet) => {
    console.log('handleSetCreated called with:', newSet);
    if (project) {
      // Create the set in localStorage first
      const savedSet = createSet(project.id, newSet);
      console.log('Set created in localStorage:', savedSet);
      
      if (savedSet) {
        // Update the local state
        const updatedProject = {
          ...project,
          sets: [...project.sets, savedSet],
          updatedAt: new Date().toISOString()
        };
        setProject(updatedProject);
        console.log('Project state updated after creation:', updatedProject);
      }
    }
  };

  const handleSetUpdated = (updatedSet: LocationSet) => {
    console.log('ProjectPage: handleSetUpdated called with:', updatedSet);
    if (project) {
      // Update the set in localStorage first - note the parameter order: projectId, setId, updates
      const savedSet = updateSet(project.id, updatedSet.id, updatedSet);
      console.log('ProjectPage: Set saved to localStorage:', savedSet);
      
      if (savedSet) {
        // Update the local state
        const updatedSets = project.sets.map(set => 
          set.id === updatedSet.id ? savedSet : set
        );
        const updatedProject = {
          ...project,
          sets: updatedSets,
          updatedAt: new Date().toISOString()
        };
        setProject(updatedProject);
        console.log('ProjectPage: Project state updated:', updatedProject);
      } else {
        console.error('ProjectPage: Failed to save set to localStorage');
      }
    } else {
      console.error('ProjectPage: No project found');
    }
  };

  const handleSetDeleted = (setId: string) => {
    if (project) {
      // Delete the set from localStorage first
      const deleted = deleteSet(project.id, setId);
      console.log('Set deleted from localStorage:', deleted);
      
      if (deleted) {
        // Update the local state
        const updatedSets = project.sets.filter(set => set.id !== setId);
        const updatedProject = {
          ...project,
          sets: updatedSets,
          updatedAt: new Date().toISOString()
        };
        setProject(updatedProject);
        console.log('Project state updated after deletion:', updatedProject);
      }
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "d 'de' MMMM 'de' yyyy", { locale: es });
  };

  // Debug function to check localStorage
  const debugLocalStorage = () => {
    const storedData = localStorage.getItem('soundScoutingData');
    console.log('=== DEBUG: localStorage Content ===');
    console.log('Raw data:', storedData);
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        console.log('Parsed data:', parsed);
        if (project) {
          const currentProject = parsed.projects.find((p: any) => p.id === project.id);
          console.log('Current project in localStorage:', currentProject);
          if (currentProject) {
            console.log('Sets in project:', currentProject.sets);
            currentProject.sets.forEach((set: any, index: number) => {
              console.log(`Set ${index}:`, set);
              console.log(`Set ${index} photos:`, set.photos);
            });
          }
        }
      } catch (e) {
        console.error('Error parsing localStorage data:', e);
      }
    } else {
      console.log('No data found in localStorage');
    }
    console.log('=== END DEBUG ===');
  };

  const getEvaluationColor = (evaluation: string) => {
    switch (evaluation) {
      case 'apto':
        return 'bg-green-500';
      case 'no_apto':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getEvaluationLabel = (evaluation: string) => {
    switch (evaluation) {
      case 'apto':
        return 'Apto';
      case 'no_apto':
        return 'No apto';
      default:
        return 'Sin evaluar';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 max-w-6xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl space-y-6 container-mobile safe-area-top safe-area-bottom">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push('/')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a proyectos
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={debugLocalStorage}
              className="bg-yellow-100 border-yellow-300 text-yellow-800 hover:bg-yellow-200"
            >
              🐛 Debug
            </Button>
            <Button variant="outline" size="sm" onClick={() => router.push('/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              Datos del técnico
            </Button>
            <Button variant="outline" size="sm" onClick={() => router.push(`/report/${project.id}`)}>
              <FileText className="mr-2 h-4 w-4" />
              Generar Informe
            </Button>
          </div>
        </div>
        
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Creado: {formatDate(project.createdAt)}
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {project.sets.length} localizaciones
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Sets Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Localizaciones</h2>
            <p className="text-muted-foreground">
              Gestiona las localizaciones evaluadas para este proyecto
            </p>
          </div>
          <Button onClick={() => setShowCreateSetDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Localización
          </Button>
        </div>

        {project.sets.length === 0 ? (
          <Card className="text-center p-8">
            <CardContent className="space-y-4">
              <MapPin className="mx-auto h-12 w-12 text-muted-foreground" />
              <div>
                <h3 className="text-lg font-semibold">No hay localizaciones aún</h3>
                <p className="text-muted-foreground">
                  Agrega tu primera localización para comenzar el scouting
                </p>
              </div>
              <Button onClick={() => setShowCreateSetDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Agregar Localización
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {project.sets.map((set) => (
              <SetCard
                key={set.id}
                set={set}
                onSetUpdate={handleSetUpdated}
                onSetDelete={handleSetDeleted}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Set Dialog */}
      <CreateSetDialog
        open={showCreateSetDialog}
        onOpenChange={setShowCreateSetDialog}
        projectId={projectId}
        onSetCreated={handleSetCreated}
      />
    </div>
  );
}