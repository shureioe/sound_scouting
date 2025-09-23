'use client';

import { useState } from 'react';
import { LocationSet, LocationPhoto } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Calendar, Camera, ExternalLink, Edit2, Save, X, Image as ImageIcon } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import PhotoManager from './PhotoManager';
import LocationManager from './LocationManager';

interface SetDetailViewProps {
  set: LocationSet;
  onSetUpdate: (updatedSet: LocationSet) => void;
  onClose: () => void;
}

export default function SetDetailView({ set, onSetUpdate, onClose }: SetDetailViewProps) {
  const [editing, setEditing] = useState(false);
  const [editedSet, setEditedSet] = useState<LocationSet>(set);
  const [tagsInput, setTagsInput] = useState(set.tags.join(', '));

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

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es });
  };

  const handleSave = () => {
    const tags = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    const updatedSet = {
      ...editedSet,
      tags,
      updatedAt: new Date().toISOString()
    };
    onSetUpdate(updatedSet);
    setEditing(false);
  };

  // Handle photos change - auto-save when photos are updated
  const handlePhotosChange = (photos: LocationPhoto[]) => {
    console.log('Photos changed:', photos);
    const updatedSet = {
      ...editedSet,
      photos,
      updatedAt: new Date().toISOString()
    };
    console.log('Updated set before save:', updatedSet);
    setEditedSet(updatedSet);
    // Auto-save photos immediately
    console.log('Calling onSetUpdate with:', updatedSet);
    onSetUpdate(updatedSet);
  };

  const handleCancel = () => {
    setEditedSet(set);
    setTagsInput(set.tags.join(', '));
    setEditing(false);
  };

  const openInMaps = () => {
    if (editedSet.coordinates) {
      const { latitude, longitude } = editedSet.coordinates;
      const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
      window.open(url, '_blank');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          {editing ? (
            <Input
              value={editedSet.title}
              onChange={(e) => setEditedSet({ ...editedSet, title: e.target.value })}
              className="text-2xl font-bold"
            />
          ) : (
            <h2 className="text-2xl font-bold">{editedSet.title}</h2>
          )}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formatDate(editedSet.createdAt)}
            </div>
            <Badge 
              variant="secondary" 
              className={`${getEvaluationColor(editedSet.evaluation)} text-white`}
            >
              {getEvaluationLabel(editedSet.evaluation)}
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
          <TabsTrigger value="photos">Fotos ({editedSet.photos.length})</TabsTrigger>
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
                    onValueChange={(value: any) => setEditedSet({ ...editedSet, evaluation: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="apto">Apto</SelectItem>
                      <SelectItem value="no_apto">No apto</SelectItem>
                      <SelectItem value="sin_evaluar">Sin evaluar</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge 
                    variant="secondary" 
                    className={`${getEvaluationColor(editedSet.evaluation)} text-white mt-2`}
                  >
                    {getEvaluationLabel(editedSet.evaluation)}
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
                {editedSet.photos.length} foto{editedSet.photos.length !== 1 ? 's' : ''} cargada{editedSet.photos.length !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PhotoManager
                photos={editedSet.photos}
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
                coordinates={editedSet.coordinates}
                onCoordinatesChange={(coords) => setEditedSet({ ...editedSet, coordinates: coords })}
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