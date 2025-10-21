'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EvaluationStatus, NewLocationSetInput } from '@/lib/types';

interface CreateSetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (setData: NewLocationSetInput) => Promise<boolean> | boolean;
}

export default function CreateSetDialog({ open, onOpenChange, onSubmit }: CreateSetDialogProps) {
  const [title, setTitle] = useState('');
  const [evaluation, setEvaluation] = useState<EvaluationStatus>('sin_evaluar');
  const [tags, setTags] = useState('');
  const [noiseObservations, setNoiseObservations] = useState('');
  const [technicalRequirements, setTechnicalRequirements] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateSet = async () => {
    if (!title.trim()) return;

    setIsCreating(true);
    try {
      const tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      const wasCreated = await onSubmit({
        title: title.trim(),
        evaluation,
        tags: tagsArray,
        noiseObservations,
        technicalRequirements,
        photos: [],
      });
      if (!wasCreated) {
        return;
      }

      // Reset form
      setTitle('');
      setEvaluation('sin_evaluar');
      setTags('');
      setNoiseObservations('');
      setTechnicalRequirements('');
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating set:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey && title.trim()) {
      handleCreateSet();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva Localización</DialogTitle>
          <DialogDescription>
            Agrega una nueva localización para evaluar en tu proyecto de scouting.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4" onKeyDown={handleKeyDown}>
          <div className="space-y-2">
            <Label htmlFor="title">Título de la Localización *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Plaza Central - Escena Diurna"
              disabled={isCreating}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="evaluation">Evaluación Inicial</Label>
            <Select value={evaluation} onValueChange={(value: EvaluationStatus) => setEvaluation(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sin_evaluar">Sin evaluar</SelectItem>
                <SelectItem value="apto">Apto</SelectItem>
                <SelectItem value="no_apto">No apto</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Etiquetas</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Separar etiquetas por comas (ej: exterior, diurno, ciudad)"
              disabled={isCreating}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="noiseObservations">Observaciones</Label>
            <Textarea
              id="noiseObservations"
              value={noiseObservations}
              onChange={(e) => setNoiseObservations(e.target.value)}
              placeholder="Describe las condiciones, observaciones generales, notas importantes..."
              disabled={isCreating}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="technicalRequirements">Requerimientos Técnicos</Label>
            <Textarea
              id="technicalRequirements"
              value={technicalRequirements}
              onChange={(e) => setTechnicalRequirements(e.target.value)}
              placeholder="Equipamiento necesario, permisos, solicitudes a producción..."
              disabled={isCreating}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isCreating}>
            Cancelar
          </Button>
          <Button onClick={handleCreateSet} disabled={!title.trim() || isCreating}>
            {isCreating ? 'Creando...' : 'Crear Localización'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}