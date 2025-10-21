'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Separator } from '@/components/ui/Separator';
import {
  addSetPhoto,
  getProjectById,
  setSetCoords,
  updateSet,
} from '@/lib/storage';
import type { LocationSet, LocationStatus, Project } from '@/lib/types';

const statusOptions: Array<{ value: LocationStatus; label: string }> = [
  { value: 'apto', label: 'Apto' },
  { value: 'no_apto', label: 'No apto' },
  { value: 'pendiente', label: 'Pendiente' },
];

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

type FormState = {
  name: string;
  notes: string;
  status: LocationStatus;
};

const defaultFormState: FormState = {
  name: '',
  notes: '',
  status: 'pendiente',
};

const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Formato de archivo no soportado.'));
      }
    };
    reader.onerror = () => {
      reject(new Error('No se pudo leer el archivo.'));
    };
    reader.readAsDataURL(file);
  });

export default function LocationDetailPage() {
  const params = useParams<{ id: string; setId: string }>();
  const router = useRouter();

  const projectId = params?.id;
  const locationId = params?.setId;

  const [project, setProject] = useState<Project | null>(null);
  const [locationSet, setLocationSet] = useState<LocationSet | null>(null);
  const [formState, setFormState] = useState<FormState>(defaultFormState);
  const [formError, setFormError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const syncState = useCallback(() => {
    if (!projectId || !locationId) {
      return false;
    }

    const storedProject = getProjectById(projectId);
    if (!storedProject) {
      router.replace('/');
      return false;
    }

    const foundSet = storedProject.sets.find(setItem => setItem.id === locationId);
    if (!foundSet) {
      router.replace(`/project/${projectId}`);
      return false;
    }

    setProject(storedProject);
    setLocationSet(foundSet);
    return true;
  }, [locationId, projectId, router]);

  useEffect(() => {
    if (!projectId || !locationId) {
      return;
    }
    setIsLoading(true);
    const loaded = syncState();
    if (!loaded) {
      setIsLoading(false);
      return;
    }
    setIsLoading(false);
  }, [locationId, projectId, syncState]);

  useEffect(() => {
    if (!locationSet) {
      setFormState(defaultFormState);
      return;
    }

    setFormState({
      name: locationSet.name ?? '',
      notes: locationSet.notes ?? '',
      status: locationSet.status ?? locationSet.evaluation ?? 'pendiente',
    });
  }, [locationSet]);

  const totalPhotos = locationSet?.photos?.length ?? 0;

  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!projectId || !locationId) {
      return;
    }

    const trimmedName = formState.name.trim();

    if (!trimmedName) {
      setFormError('El nombre es obligatorio.');
      return;
    }

    setIsSaving(true);

    const trimmedNotes = formState.notes.trim();
    const updated = updateSet(projectId, locationId, {
      name: trimmedName,
      title: trimmedName,
      notes: trimmedNotes.length > 0 ? trimmedNotes : undefined,
      status: formState.status,
      evaluation: formState.status,
    });

    if (!updated) {
      setFeedback({ type: 'error', message: 'No se pudo guardar la localización.' });
      setIsSaving(false);
      return;
    }

    setFeedback({ type: 'success', message: 'Cambios guardados correctamente.' });
    setFormError(null);
    setLocationSet(updated);
    setProject(previous =>
      previous
        ? {
            ...previous,
            sets: previous.sets.map(setItem => (setItem.id === updated.id ? updated : setItem)),
          }
        : previous,
    );
    setIsSaving(false);
  };

  const handlePhotoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!projectId || !locationId) {
      return;
    }

    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setIsUploading(true);

    try {
      const dataUrl = await readFileAsDataUrl(file);
      const updated = addSetPhoto(projectId, locationId, dataUrl);

      if (!updated) {
        setFeedback({ type: 'error', message: 'No se pudo añadir la foto.' });
        return;
      }

      setFeedback({ type: 'success', message: 'Foto añadida correctamente.' });
      setLocationSet(updated);
      setProject(previous =>
        previous
          ? {
              ...previous,
              sets: previous.sets.map(setItem => (setItem.id === updated.id ? updated : setItem)),
            }
          : previous,
      );
    } catch (error) {
      console.error('Error al procesar la imagen', error);
      setFeedback({ type: 'error', message: 'No se pudo procesar la imagen seleccionada.' });
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setIsUploading(false);
    }
  };

  const handleUseLocation = () => {
    if (!projectId || !locationId) {
      return;
    }

    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      setFeedback({
        type: 'info',
        message: 'La geolocalización no está disponible en este dispositivo.',
      });
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      position => {
        const updated = setSetCoords(projectId, locationId, {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });

        if (!updated) {
          setFeedback({ type: 'error', message: 'No se pudo guardar la ubicación.' });
        } else {
          setFeedback({ type: 'success', message: 'Ubicación guardada correctamente.' });
          setLocationSet(updated);
          setProject(previous =>
            previous
              ? {
                  ...previous,
                  sets: previous.sets.map(setItem => (setItem.id === updated.id ? updated : setItem)),
                }
              : previous,
          );
        }

        setIsLocating(false);
      },
      error => {
        console.error('Error al obtener geolocalización', error);
        setFeedback({ type: 'error', message: 'No se pudo obtener la ubicación actual.' });
        setIsLocating(false);
      },
      { enableHighAccuracy: true, maximumAge: 0 },
    );
  };

  const projectName = project?.name ?? 'Proyecto';
  const locationName = locationSet?.name ?? 'Localización';

  const coordinates = locationSet?.coords ?? null;

  const createdAt = useMemo(() => {
    if (!locationSet?.createdAt) {
      return '';
    }
    return new Date(locationSet.createdAt).toLocaleDateString('es-ES');
  }, [locationSet?.createdAt]);

  if (!projectId || !locationId) {
    return null;
  }

  if (isLoading || !project || !locationSet) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-xl px-md py-lg">
        <Card>
          <div className="flex h-40 items-center justify-center text-sm text-foreground/60">
            Cargando localización…
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-xl px-md py-lg">
      <header className="flex flex-col gap-sm">
        <Button
          variant="subtle"
          type="button"
          className="w-fit px-sm py-1 text-sm"
          onClick={() => router.push(`/project/${projectId}`)}
        >
          ← Volver al proyecto
        </Button>

        <div className="flex flex-col gap-2xs">
          <h1 className="text-3xl font-semibold text-foreground">{locationName}</h1>
          <p className="text-sm text-foreground/70">
            Gestiona los detalles de la localización dentro del proyecto "{projectName}".
          </p>
          {createdAt && (
            <p className="text-xs text-foreground/50">Creada el {createdAt}</p>
          )}
        </div>
      </header>

      <Separator />

      {feedback && (
        <Badge tone={feedbackToneMap[feedback.type]} className="w-fit">
          {feedback.message}
        </Badge>
      )}

      <form className="flex flex-col gap-lg" onSubmit={handleSave}>
        <Card title="Información general">
          <div className="flex flex-col gap-md">
            <Input
              label="Nombre"
              placeholder="Interior fábrica principal"
              value={formState.name}
              onChange={event => {
                if (formError) {
                  setFormError(null);
                }
                setFormState(current => ({ ...current, name: event.target.value }));
              }}
              errorText={formError ?? undefined}
              required
            />

            <div className="flex flex-col gap-2xs">
              <label
                htmlFor="location-notes"
                className="text-xs font-medium uppercase tracking-wide text-foreground/70"
              >
                Notas
              </label>
              <textarea
                id="location-notes"
                name="notes"
                value={formState.notes}
                onChange={event =>
                  setFormState(current => ({ ...current, notes: event.target.value }))
                }
                rows={4}
                placeholder="Observaciones sobre ruido, accesos, contactos…"
                className="min-h-[120px] w-full rounded-md border border-border bg-background px-md py-sm text-base text-foreground shadow-soft-sm transition-colors placeholder:text-foreground/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="flex flex-col gap-2xs">
              <label
                htmlFor="location-status"
                className="text-xs font-medium uppercase tracking-wide text-foreground/70"
              >
                Estado
              </label>
              <select
                id="location-status"
                name="status"
                value={formState.status}
                onChange={event =>
                  setFormState(current => ({
                    ...current,
                    status: event.target.value as LocationStatus,
                  }))
                }
                className="h-11 w-full rounded-md border border-border bg-background px-md text-base text-foreground shadow-soft-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        <Card title="Fotos" description="Añade referencias visuales para tu equipo.">
          <div className="flex flex-col gap-sm">
            <div className="flex flex-wrap items-center gap-sm">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handlePhotoChange}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? 'Añadiendo…' : 'Añadir foto'}
              </Button>
              <p className="text-xs text-foreground/60">
                Las imágenes se guardarán localmente en este navegador.
              </p>
            </div>

            {totalPhotos > 0 ? (
              <ul className="grid grid-cols-2 gap-sm sm:grid-cols-3">
                {locationSet?.photos?.map((photo, index) => (
                  <li
                    key={`${locationSet.id}-photo-${index}`}
                    className="overflow-hidden rounded-lg border border-border/40"
                  >
                    <Image
                      src={photo}
                      alt={`Foto ${index + 1} de ${locationName}`}
                      width={320}
                      height={200}
                      className="h-32 w-full object-cover"
                      unoptimized
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-foreground/70">Aún no hay fotos añadidas.</p>
            )}
          </div>
        </Card>

        <Card title="Geolocalización" description="Guarda las coordenadas para compartir con tu equipo.">
          <div className="flex flex-col gap-sm">
            <Button
              type="button"
              variant="secondary"
              onClick={handleUseLocation}
              disabled={isLocating}
            >
              {isLocating ? 'Obteniendo ubicación…' : 'Usar mi ubicación'}
            </Button>

            {coordinates ? (
              <dl className="grid grid-cols-1 gap-xs text-sm text-foreground/70 sm:grid-cols-2">
                <div className="flex flex-col">
                  <dt className="uppercase tracking-wide text-foreground/50">Latitud</dt>
                  <dd className="text-base font-medium text-foreground">
                    {coordinates.lat.toFixed(6)}
                  </dd>
                </div>
                <div className="flex flex-col">
                  <dt className="uppercase tracking-wide text-foreground/50">Longitud</dt>
                  <dd className="text-base font-medium text-foreground">
                    {coordinates.lng.toFixed(6)}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="text-sm text-foreground/70">
                Todavía no has guardado coordenadas para esta localización.
              </p>
            )}
          </div>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSaving} className="md:px-xl">
            {isSaving ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        </div>
      </form>
    </div>
  );
}
