'use client';

import { useState, useEffect } from 'react';
import { Project } from '@/lib/types';
import { getProjects, deleteProject, setCurrentProject, updateProject } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FolderOpen, Plus, Trash2, Edit, Calendar, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ProjectListProps {
  onProjectSelect: (project: Project) => void;
  onCreateProject: () => void;
}

export default function ProjectList({ onProjectSelect, onCreateProject }: ProjectListProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = () => {
    const loadedProjects = getProjects();
    setProjects(loadedProjects);
  };

  const handleDeleteProject = (projectId: string) => {
    deleteProject(projectId);
    loadProjects();
  };

  const handleRenameProject = () => {
    if (editingProject && newName.trim()) {
      const updated = updateProject(editingProject.id, { name: newName.trim() });
      if (updated) {
        loadProjects();
        setEditingProject(null);
        setNewName('');
      }
    }
  };

  const openRenameDialog = (project: Project) => {
    setEditingProject(project);
    setNewName(project.name);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "d 'de' MMMM 'de' yyyy", { locale: es });
  };

  return (
    <div className="space-y-6 touch-manipulation">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-responsive">Scouting de Sonido</h1>
          <p className="text-muted-foreground text-responsive">
            Gestiona tus proyectos de localización para rodajes
          </p>
        </div>
        <Button onClick={onCreateProject} size="lg" className="btn-touch w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Proyecto
        </Button>
      </div>

      {projects.length === 0 ? (
        <Card className="text-center p-6 sm:p-8 card-touch">
          <CardContent className="space-y-4">
            <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold">No hay proyectos aún</h3>
              <p className="text-muted-foreground text-responsive">
                Crea tu primer proyecto para comenzar a hacer scouting de localizaciones
              </p>
            </div>
            <Button onClick={onCreateProject} className="btn-touch">
              <Plus className="mr-2 h-4 w-4" />
              Crear Proyecto
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id} className="cursor-pointer hover:shadow-md transition-shadow card-touch touch-manipulation" onClick={() => onProjectSelect(project)}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1 min-w-0">
                    <CardTitle className="text-base sm:text-lg line-clamp-2">{project.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2 text-xs sm:text-sm">
                      <Calendar className="h-3 w-3 flex-shrink-0" />
                      <span className="line-clamp-1">{formatDate(project.createdAt)}</span>
                    </CardDescription>
                  </div>
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="btn-touch"
                      onClick={(e) => {
                        e.stopPropagation();
                        openRenameDialog(project);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="btn-touch"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar proyecto?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción eliminará permanentemente el proyecto "{project.name}" y todos sus sets. Esta acción no se puede deshacer.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteProject(project.id)}>
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent 
                className="pt-0"
                onClick={() => {
                  setCurrentProject(project.id);
                  onProjectSelect(project);
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    <span className="text-responsive">{project.sets.length} localizaciones</span>
                  </div>
                  <Badge variant={project.sets.length > 0 ? "default" : "secondary"} className="text-xs">
                    {project.sets.length > 0 ? "Activo" : "Vacío"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Diálogo para renombrar proyecto */}
      <Dialog open={!!editingProject} onOpenChange={() => setEditingProject(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renombrar Proyecto</DialogTitle>
            <DialogDescription>
              Cambia el nombre del proyecto "{editingProject?.name}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="project-name">Nombre del proyecto</Label>
            <Input
              id="project-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ingresa el nuevo nombre"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingProject(null)}>
              Cancelar
            </Button>
            <Button onClick={handleRenameProject} disabled={!newName.trim()}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}