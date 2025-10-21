'use client';

import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react';
import { useParams, useRouter } from 'next/navigation';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Separator } from '@/components/ui/Separator';
import { getEvaluationLabel } from '@/lib/evaluation';
import { createPdfDocument, downloadPdfDocument, getImageFormatFromDataUrl, loadImageDimensions } from '@/lib/pdf';
import { createSet, deleteSet, getProjectById } from '@/lib/storage';
import type { LocationSet, NewLocationSetInput, Project } from '@/lib/types';

const emptySetDefaults: Omit<NewLocationSetInput, 'name' | 'title'> = {
  status: 'pendiente',
  notes: '',
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
  const [isExportingProject, setIsExportingProject] = useState(false);

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

    const trimmedName = locationName.trim();
    const payload: NewLocationSetInput = {
      ...emptySetDefaults,
      name: trimmedName,
      title: trimmedName,
    } as const;

    const savedSet = createSet(project.id, payload);

    if (!savedSet) {
      setFeedback({ type: 'error', message: 'No se pudo crear la localización.' });
      return;
    }

    setLocationName('');
    setFormError(null);
    setFeedback({ type: 'success', message: `Se creó "${savedSet.name}".` });
    refreshProject();
  };

  const handleDeleteSet = (setToRemove: LocationSet) => {
    const removed = deleteSet(project.id, setToRemove.id);

    if (!removed) {
      setFeedback({ type: 'error', message: 'No se pudo borrar la localización.' });
      return;
    }

    setFeedback({ type: 'info', message: `Se borró "${setToRemove.name}".` });
    refreshProject();
  };

  const totalLocations = project.sets.length;

  const handleNavigateToSet = (setId: string) => {
    router.push(`/project/${project.id}/location/${setId}`);
  };

  const handleCardKeyDown = (event: KeyboardEvent<HTMLElement>, setId: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleNavigateToSet(setId);
    }
  };

  const handleExportProjectPdf = async () => {
    if (!project) {
      return;
    }

    setIsExportingProject(true);

    try {
      const doc = await createPdfDocument();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - margin * 2;
      let cursorY = margin;

      const ensureSpace = (height: number) => {
        if (cursorY + height > pageHeight - margin) {
          doc.addPage();
          cursorY = margin;
        }
      };

      doc.setFontSize(22);
      doc.text(project.name, margin, cursorY);
      cursorY += 14;

      doc.setFontSize(12);
      doc.text(`Fecha de exportación: ${new Date().toLocaleString('es-ES')}`, margin, cursorY);
      cursorY += 10;

      doc.setFontSize(16);
      doc.text('Localizaciones', margin, cursorY);
      cursorY += 10;

      doc.setFontSize(12);
      if (project.sets.length === 0) {
        doc.text('No hay localizaciones registradas en este proyecto.', margin, cursorY);
      } else {
        for (const setItem of project.sets) {
          ensureSpace(30);

          doc.setFontSize(14);
          doc.text(setItem.name ?? 'Localización sin nombre', margin, cursorY);
          cursorY += 8;

          doc.setFontSize(12);
          const statusLabel = getEvaluationLabel(setItem.status ?? setItem.evaluation ?? 'pendiente');
          doc.text(`Estado: ${statusLabel}`, margin, cursorY);
          cursorY += 6;

          const notesSummary = (setItem.notes ?? '')
            .split(/\r?\n/)
            .map(line => line.trim())
            .find(line => line.length > 0);

          const summaryText = notesSummary ?? 'Sin notas registradas.';
          const summaryLines = doc.splitTextToSize(`Notas: ${summaryText}`, contentWidth) as string[];
          const summaryHeight = summaryLines.length * 6;
          ensureSpace(summaryHeight);
          doc.text(summaryLines, margin, cursorY);
          cursorY += summaryHeight + 4;

          const firstPhoto = setItem.photos?.[0];
          if (firstPhoto) {
            const { width, height } = await loadImageDimensions(firstPhoto);
            const ratio = height > 0 ? height / width : 0;
            const maxWidth = Math.min(60, contentWidth);
            let renderWidth = maxWidth;
            let renderHeight = ratio > 0 ? maxWidth * ratio : maxWidth * 0.75;

            if (renderHeight > pageHeight - margin * 2) {
              renderHeight = pageHeight - margin * 2;
              renderWidth = renderHeight / (ratio || 1);
            }

            if (cursorY + renderHeight > pageHeight - margin) {
              doc.addPage();
              cursorY = margin;
            }

            doc.addImage(firstPhoto, getImageFormatFromDataUrl(firstPhoto), margin, cursorY, renderWidth, renderHeight);
            cursorY += renderHeight + 6;
          }

          doc.setDrawColor(220);
          doc.line(margin, cursorY, pageWidth - margin, cursorY);
          doc.setDrawColor(0);
          cursorY += 6;
        }
      }

      downloadPdfDocument(doc, `Proyecto-${project.id}.pdf`);
      setFeedback({ type: 'success', message: 'Se exportó el PDF del proyecto.' });
    } catch (error) {
      console.error('Error al exportar el proyecto', error);
      setFeedback({ type: 'error', message: 'No se pudo generar el PDF del proyecto.' });
    } finally {
      setIsExportingProject(false);
    }
  };

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

        <div className="flex flex-col gap-sm sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-foreground">{project.name}</h1>
            <p className="text-sm text-foreground/70">
              Gestiona y organiza las localizaciones evaluadas para este proyecto.
            </p>
          </div>
          <div className="flex flex-col items-start gap-xs sm:items-end">
            <Badge tone="neutral" className="w-fit">
              {totalLocations === 1
                ? '1 localización'
                : `${totalLocations} localizaciones`}
            </Badge>
            <Button
              type="button"
              variant="secondary"
              onClick={handleExportProjectPdf}
              disabled={isExportingProject}
              className="w-full sm:w-auto"
            >
              {isExportingProject ? 'Exportando…' : 'Exportar PDF del proyecto'}
            </Button>
          </div>
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
                title={setItem.name}
                role="button"
                tabIndex={0}
                onClick={() => handleNavigateToSet(setItem.id)}
                onKeyDown={event => handleCardKeyDown(event, setItem.id)}
                footer={
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="subtle"
                      className="text-danger hover:text-danger"
                      onClick={event => {
                        event.stopPropagation();
                        handleDeleteSet(setItem);
                      }}
                    >
                      Borrar
                    </Button>
                  </div>
                }
              >
                <div className="flex flex-col gap-2xs text-sm text-foreground/70">
                  <p>
                    Estado:{' '}
                    <strong className="font-medium text-foreground">
                      {getEvaluationLabel(setItem.status ?? setItem.evaluation ?? 'pendiente')}
                    </strong>
                  </p>
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
