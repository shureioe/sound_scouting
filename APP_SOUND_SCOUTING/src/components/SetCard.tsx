'use client';

import { useState } from 'react';
import { LocationSet } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MapPin, Calendar, Camera, Trash2, Edit, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import SetDetailView from './SetDetailView';

interface SetCardProps {
  set: LocationSet;
  onSetUpdate: (updatedSet: LocationSet) => void;
  onSetDelete: (setId: string) => void;
}

export default function SetCard({ set, onSetUpdate, onSetDelete }: SetCardProps) {
  const [showDetail, setShowDetail] = useState(false);

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
    return format(new Date(dateString), "d 'de' MMMM", { locale: es });
  };

  const handleDelete = () => {
    onSetDelete(set.id);
  };

  const openInMaps = () => {
    if (set.coordinates) {
      const { latitude, longitude } = set.coordinates;
      const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
      window.open(url, '_blank');
    }
  };

  return (
    <>
      <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowDetail(true)}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1 flex-1">
              <CardTitle className="text-lg line-clamp-2">{set.title}</CardTitle>
              <CardDescription className="flex items-center gap-2">
                <Calendar className="h-3 w-3" />
                {formatDate(set.createdAt)}
              </CardDescription>
            </div>
            <div className="flex flex-col gap-1">
              <Badge 
                variant="secondary" 
                className={`${getEvaluationColor(set.evaluation)} text-white text-xs`}
              >
                {getEvaluationLabel(set.evaluation)}
              </Badge>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDetail(true);
                  }}
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Eliminar localización?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción eliminará permanentemente la localización "{set.title}" y todas sus fotos. Esta acción no se puede deshacer.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete}>
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          {/* Tags */}
          {set.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {set.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {set.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{set.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Photos */}
          {set.photos.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Camera className="h-3 w-3" />
              <span>{set.photos.length} foto{set.photos.length !== 1 ? 's' : ''}</span>
            </div>
          )}

          {/* Coordinates */}
          {set.coordinates && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span className="truncate">
                  {set.coordinates.latitude.toFixed(6)}, {set.coordinates.longitude.toFixed(6)}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  openInMaps();
                }}
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          )}

          {/* Preview de observaciones */}
          {set.noiseObservations && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {set.noiseObservations}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Detail View Dialog */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{set.title}</DialogTitle>
            <DialogDescription>
              Localización evaluada el {format(new Date(set.createdAt), "d 'de' MMMM 'de' yyyy", { locale: es })}
            </DialogDescription>
          </DialogHeader>
          <SetDetailView 
            set={set} 
            onSetUpdate={onSetUpdate}
            onClose={() => setShowDetail(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}