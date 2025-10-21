'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Separator } from '@/components/ui/Separator';
import { createSet, deleteSet, getProjectById } from '@/lib/storage';
import type { LocationSet, NewLocationSetInput, Project } from '@/lib/types';

const emptySetDefaults: Omit<NewLocationSetInput, 'title'> = {
  evaluation: 'sin_evaluar',
  tags: [],
  noiseObservations: '',
  technicalRequirements: '',
  photos: [],
};

const feedbackToneMap = {
  success: 'success',
  info: 'neutral',
  error: 'danger',
} as const;

type FeedbackState =
  | { type: 'success'; message: string }
  | { type: 'info'; message: string }
  | { type: 'error'; message: string }
  | null;

export default function ProjectPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const projectId = params?.id;

  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [locationName, setLocationName] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  const refreshProject = useCallback(() => {
    if (!projectId) {
      return;
    }

    const storedProject = getProjectById(projectId);

    if (!storedProject) {
      router.replace('/');
      return;
    }

    setProject(storedProject);
  }, [projectId, router]);

  useEffect(() => {
    setIsLoading(true);
    refreshProject();
    setIsLoading(false);
  }, [refreshProject]);

  if (!projectId) {
    return null;
  }

  if (isLoading || !project) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-xl px-md py-lg">
        <Card>
          <div className="flex h-32 items-center justify-center text-sm text-foreground/60">
            Cargando proyecto…
          </div>
        </Card>
      </div>
    );
  }

  const handleCreateLocation = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!locationName.trim()) {
      setFormError('El nombre es obligatorio.');
      return;
    }

    const payload: NewLocationSetInput = {
      ...emptySetDefaults,
      title: locationName.trim(),
    } as const;

    const savedSet = createSet(project.id, payload);

    if (!savedSet) {
      setFeedback({ type: 'error', message: 'No se pudo crear la localización.' });
      return;
    }

    setLocationName('');
    setFormError(null);
    setFeedback({ type: 'success', message: `Se creó "${savedSet.title}".` });
    refreshProject();
  };

  const handleDeleteSet = (setToRemove: LocationSet) => {
    const removed = deleteSet(project.id, setToRemove.id);

    if (!removed) {
      setFeedback({ type: 'error', message: 'No se pudo borrar la localización.' });
      return;
    }

    setFeedback({ type: 'info', message: `Se borró "${setToRemove.title}".` });
    refreshProject();
  };

  const totalLocations = project.sets.length;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-xl px-md py-lg">
      <header className="flex flex-col gap-sm">
        <Button
          variant="subtle"
          type="button"
          className="w-fit px-sm py-1 text-sm"
          onClick={() => router.push('/')}
        >
          ← Volver a proyectos
        </Button>

        <div className="flex flex-col gap-2xs sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-foreground">{project.name}</h1>
            <p className="text-sm text-foreground/70">
              Gestiona y organiza las localizaciones evaluadas para este proyecto.
            </p>
          </div>
          <Badge tone="neutral" className="w-fit">
            {totalLocations === 1
              ? '1 localización'
              : `${totalLocations} localizaciones`}
          </Badge>
        </div>
      </header>

      <Separator />

      <Card title="Crear nueva localización" description="Completa el nombre y guárdalo para comenzar.">
        <form
          onSubmit={handleCreateLocation}
          className="flex flex-col gap-sm md:flex-row md:items-end"
        >
          <div className="flex-1">
            <Input
              label="Nombre de la localización"
              placeholder="Interior fábrica principal"
              value={locationName}
              onChange={(event) => {
                if (formError) {
                  setFormError(null);
                }
                setLocationName(event.target.value);
              }}
              errorText={formError ?? undefined}
            />
          </div>
          <Button type="submit" className="md:self-center md:px-lg">
            Añadir localización
          </Button>
        </form>
      </Card>

      {feedback && (
        <Badge tone={feedbackToneMap[feedback.type]} className="w-fit">
          {feedback.message}
        </Badge>
      )}

      <section className="flex flex-col gap-sm">
        <h2 className="text-2xl font-semibold text-foreground">Listado de localizaciones</h2>
        <Separator className="my-0" />

        {isLoading ? (
          <Card>
            <div className="flex h-32 items-center justify-center text-sm text-foreground/60">
              Cargando proyecto…
            </div>
          </Card>
        ) : totalLocations === 0 ? (
          <Card title="Sin localizaciones registradas">
            <div className="flex flex-col items-start gap-2 text-sm text-foreground/70">
              <p>No hay localizaciones.</p>
              <p>Añade la primera para comenzar el scouting.</p>
            </div>
          </Card>
        ) : (
          <div className="grid gap-md sm:grid-cols-2">
            {project.sets.map((setItem, index) => (
              <Card
                key={`${setItem.id}-${index}`}
                title={setItem.title}
                footer={
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="subtle"
                      className="text-danger hover:text-danger"
                      onClick={() => handleDeleteSet(setItem)}
                    >
                      Borrar
                    </Button>
                  </div>
                }
              >
                <div className="flex flex-col gap-2xs text-sm text-foreground/70">
                  <p>Estado: <strong className="font-medium text-foreground">{setItem.evaluation}</strong></p>
                  <p className="text-xs text-foreground/60">
                    Creado el {new Date(setItem.createdAt).toLocaleDateString('es-ES')}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
