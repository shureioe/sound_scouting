'use client';

import { useEffect, useState } from 'react';
import { EvaluationStatus, LocationSet, LocationPhoto } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Calendar, Camera, ExternalLink, Edit2, Save, X } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import PhotoManager from './PhotoManager';
import LocationManager from './LocationManager';
import { getEvaluationColor, getEvaluationLabel } from '@/lib/evaluation';

interface SetDetailViewProps {
  set: LocationSet;
  onSetUpdate: (updatedSet: LocationSet) => void;
  onClose: () => void;
}

export default function SetDetailView({ set, onSetUpdate, onClose }: SetDetailViewProps) {
  const [editing, setEditing] = useState(false);
  const [editedSet, setEditedSet] = useState<LocationSet>(set);
  const [tagsInput, setTagsInput] = useState(set.tags.join(', '));

  useEffect(() => {
    setEditedSet(set);
    setTagsInput(set.tags.join(', '));
  }, [set]);

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es });
  };

  const handleSave = () => {
    const tags = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    const updatedSet = {
      ...editedSet,
      tags,
      updatedAt: new Date().toISOString(),
    };
    onSetUpdate(updatedSet);
    setEditing(false);
  };

  // Handle photos change - auto-save when photos are updated
  const handlePhotosChange = (photos: LocationPhoto[]) => {
    const updatedSet = {
      ...editedSet,
      legacyPhotos: photos,
      photos: photos.map(photo => photo.url),
      updatedAt: new Date().toISOString(),
    };
    setEditedSet(updatedSet);
    // Auto-save photos immediately
    onSetUpdate(updatedSet);
  };

  const handleCancel = () => {
    setEditedSet(set);
    setTagsInput(set.tags.join(', '));
    setEditing(false);
  };

  const openInMaps = () => {
    const coords = editedSet.coords ?? (editedSet.coordinates
      ? { lat: editedSet.coordinates.latitude, lng: editedSet.coordinates.longitude }
      : null);

    if (coords) {
      const url = `https://www.google.com/maps?q=${coords.lat},${coords.lng}`;
      window.open(url, '_blank');
    }
  };

  const photoCount = editedSet.photos?.length ?? editedSet.legacyPhotos?.length ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          {editing ? (
            <Input
              value={editedSet.name}
              onChange={(e) =>
                setEditedSet({
                  ...editedSet,
                  name: e.target.value,
                  title: e.target.value,
                })
              }
              className="text-2xl font-bold"
            />
          ) : (
            <h2 className="text-2xl font-bold">{editedSet.name}</h2>
          )}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formatDate(editedSet.createdAt)}
            </div>
            <Badge
              variant="secondary"
              className={`${getEvaluationColor(editedSet.status ?? editedSet.evaluation)} text-white`}
            >
              {getEvaluationLabel(editedSet.status ?? editedSet.evaluation)}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <Button variant="outline" onClick={handleCancel}>
                <X className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" />
                Guardar
              </Button>
            </>
          ) : (
            <Button onClick={() => setEditing(true)}>
              <Edit2 className="mr-2 h-4 w-4" />
              Editar
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="info" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="info">Información</TabsTrigger>
          <TabsTrigger value="photos">Fotos ({photoCount})</TabsTrigger>
          <TabsTrigger value="location">Ubicación</TabsTrigger>
          <TabsTrigger value="technical">Técnico</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Información General</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="evaluation">Evaluación</Label>
                {editing ? (
                  <Select 
                    value={editedSet.evaluation} 
                    onValueChange={(value: EvaluationStatus) =>
                      setEditedSet({ ...editedSet, evaluation: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="apto">Apto</SelectItem>
                      <SelectItem value="no_apto">No apto</SelectItem>
                      <SelectItem value="pendiente">Pendiente</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge
                    variant="secondary"
                    className={`${getEvaluationColor(editedSet.status ?? editedSet.evaluation)} text-white mt-2`}
                  >
                    {getEvaluationLabel(editedSet.status ?? editedSet.evaluation)}
                  </Badge>
                )}
              </div>

              <div>
                <Label htmlFor="tags">Etiquetas</Label>
                {editing ? (
                  <Input
                    id="tags"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="Separar etiquetas por comas"
                    className="mt-2"
                  />
                ) : (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {editedSet.tags.map((tag, index) => (
                      <Badge key={index} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                    {editedSet.tags.length === 0 && (
                      <span className="text-muted-foreground">Sin etiquetas</span>
                    )}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="noiseObservations">Observaciones</Label>
                {editing ? (
                  <Textarea
                    id="noiseObservations"
                    value={editedSet.noiseObservations}
                    onChange={(e) => setEditedSet({ ...editedSet, noiseObservations: e.target.value })}
                    placeholder="Describe las condiciones, observaciones generales, etc."
                    className="mt-2"
                    rows={4}
                  />
                ) : (
                  <div className="mt-2 p-3 bg-muted rounded-md">
                    {editedSet.noiseObservations || (
                      <span className="text-muted-foreground">Sin observaciones</span>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="photos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Fotografías
              </CardTitle>
              <CardDescription>
                {photoCount} foto{photoCount !== 1 ? 's' : ''} cargada{photoCount !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PhotoManager
                photos={editedSet.legacyPhotos ?? []}
                onPhotosChange={handlePhotosChange}
                disabled={false} // Always enabled for photo management
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="location" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Ubicación GPS
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LocationManager
                coordinates={
                  editedSet.coordinates ??
                  (editedSet.coords
                    ? {
                        latitude: editedSet.coords.lat,
                        longitude: editedSet.coords.lng,
                        timestamp: new Date().toISOString(),
                      }
                    : undefined)
                }
                onCoordinatesChange={(coords) =>
                  setEditedSet({
                    ...editedSet,
                    coordinates: coords,
                    coords: coords
                      ? {
                          lat: coords.latitude,
                          lng: coords.longitude,
                        }
                      : null,
                  })
                }
                disabled={!editing}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="technical" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Requerimientos Técnicos</CardTitle>
              <CardDescription>
                Solicitudes y requerimientos técnicos para producción
              </CardDescription>
            </CardHeader>
            <CardContent>
              {editing ? (
                <Textarea
                  value={editedSet.technicalRequirements}
                  onChange={(e) => setEditedSet({ ...editedSet, technicalRequirements: e.target.value })}
                  placeholder="Describe los requerimientos técnicos, equipos necesarios, permisos, etc."
                  rows={6}
                />
              ) : (
                <div className="p-3 bg-muted rounded-md">
                  {editedSet.technicalRequirements || (
                    <span className="text-muted-foreground">Sin requerimientos técnicos especificados</span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}