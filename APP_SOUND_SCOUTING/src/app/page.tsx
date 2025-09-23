'use client';

import { useState } from 'react';
import { Project } from '@/lib/types';
import ProjectList from '@/components/ProjectList';
import CreateProjectDialog from '@/components/CreateProjectDialog';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const router = useRouter();

  const handleProjectSelect = (project: Project) => {
    router.push(`/project/${project.id}`);
  };

  const handleProjectCreated = (project: Project) => {
    router.push(`/project/${project.id}`);
  };

  return (
    <>
      <div className="container mx-auto p-4 max-w-6xl container-mobile safe-area-top safe-area-bottom">
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