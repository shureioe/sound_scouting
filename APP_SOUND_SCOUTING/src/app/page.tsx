'use client';

import { useState } from 'react';
import { Project } from '@/lib/types';
import ProjectList from '@/components/ProjectList';
import CreateProjectDialog from '@/components/CreateProjectDialog';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Separator } from '@/components/ui/Separator';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';

export default function Home() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [demoEmail, setDemoEmail] = useState('');
  const router = useRouter();

  const emailError =
    demoEmail && !demoEmail.includes('@')
      ? 'Introduce un correo válido.'
      : undefined;

  const handleProjectSelect = (project: Project) => {
    router.push(`/project/${project.id}`);
  };

  const handleProjectCreated = (project: Project) => {
    router.push(`/project/${project.id}`);
  };

  return (
    <>
      <div className="container mx-auto max-w-6xl p-4 container-mobile safe-area-top safe-area-bottom">
        <section className="mb-xl">
          <Card
            title="Componentes base"
            description="Pequeña guía visual para comenzar a diseñar SoundScouting."
            footer={
              <div className="flex flex-wrap items-center gap-2xs text-xs">
                <Badge tone="neutral">Base</Badge>
                <Badge tone="success">Listo</Badge>
              </div>
            }
          >
            <div className="flex flex-wrap items-center gap-sm">
              <Button variant="primary">Primario</Button>
              <Button variant="secondary">Secundario</Button>
              <Button variant="subtle">Sutil</Button>
              <Button variant="primary" disabled>
                Deshabilitado
              </Button>
            </div>

            <Separator className="my-md" />

            <div className="grid gap-sm sm:grid-cols-2">
              <Input label="Nombre de contacto" placeholder="Laura, técnica de sonido" />
              <Input
                label="Email de contacto"
                type="email"
                placeholder="sonido@ejemplo.com"
                value={demoEmail}
                onChange={(event) => setDemoEmail(event.target.value)}
                errorText={emailError}
              />
            </div>

            <Separator className="my-md" />

            <div className="flex flex-wrap items-center gap-2xs">
              <Badge tone="success">Activo</Badge>
              <Badge tone="warn">Pendiente</Badge>
              <Badge tone="danger">Riesgo</Badge>
              <Badge tone="neutral">Nuevo</Badge>
            </div>
          </Card>
        </section>

        <ProjectList
          onProjectSelect={handleProjectSelect}
          onCreateProject={() => setShowCreateDialog(true)}
        />
        
        <CreateProjectDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onProjectCreated={handleProjectCreated}
        />
      </div>
      
      <PWAInstallPrompt />
    </>
  );
}