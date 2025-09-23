'use client';

import { useState, useRef, useEffect } from 'react';
import { LocationPhoto, FileUploadResult } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Camera, Upload, X, Edit2, Download, Trash2, Image as ImageIcon, AlertCircle, Smartphone, Monitor } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface PhotoManagerProps {
  photos: LocationPhoto[];
  onPhotosChange: (photos: LocationPhoto[]) => void;
  disabled?: boolean;
}

export default function PhotoManager({ photos, onPhotosChange, disabled = false }: PhotoManagerProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<LocationPhoto | null>(null);
  const [editingPhoto, setEditingPhoto] = useState<LocationPhoto | null>(null);
  const [newCaption, setNewCaption] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [deviceInfo, setDeviceInfo] = useState({
    isMobile: false,
    hasCamera: false,
    hasFileUpload: true, // Assume file upload is always available by default
    cameraError: null as string | null
  });

  // Detect device capabilities on component mount
  useEffect(() => {
    const detectDeviceCapabilities = () => {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      // File upload should always be available in modern browsers
      // We'll only check for basic functionality as a fallback
      const hasFileUpload = true; // Assume it's always available
      
      // Debug info
      console.log('Device detection debug:', {
        isMobile,
        hasFileUpload,
        userAgent: navigator.userAgent
      });
      
      // Check camera availability
      let hasCamera = false;
      let cameraError = null;
      
      if (isMobile) {
        // On mobile, assume camera is available
        hasCamera = true;
      } else {
        // On desktop, check if getUserMedia is available
        hasCamera = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
        if (!hasCamera) {
          cameraError = 'La cámara no está disponible en este navegador o dispositivo';
        }
      }
      
      setDeviceInfo({
        isMobile,
        hasCamera,
        hasFileUpload,
        cameraError
      });
    };

    detectDeviceCapabilities();
  }, []);

  const handleFileUpload = async (files: FileList | null, isCamera = false) => {
    if (!files || files.length === 0) return;

    const newPhotos: LocationPhoto[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Validar que sea una imagen
      if (!file.type.startsWith('image/')) {
        console.error(`El archivo ${file.name} no es una imagen válida`);
        continue;
      }

      try {
        // Optimizar imagen
        const optimizedFile = await optimizeImage(file);
        const url = await fileToBase64(optimizedFile);
        
        const newPhoto: LocationPhoto = {
          id: Date.now().toString() + Math.random().toString(36).substr(2),
          url,
          caption: '',
          timestamp: new Date().toISOString(),
          fileSize: optimizedFile.size,
        };
        
        newPhotos.push(newPhoto);
      } catch (error) {
        console.error('Error procesando imagen:', error);
      }
    }

    if (newPhotos.length > 0) {
      onPhotosChange([...photos, ...newPhotos]);
    }
  };

  const optimizeImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        // Calcular nuevas dimensiones (máximo 1920x1080)
        let { width, height } = img;
        const maxWidth = 1920;
        const maxHeight = 1080;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;

        // Dibujar imagen optimizada
        ctx?.drawImage(img, 0, 0, width, height);

        // Convertir a blob con calidad reducida
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const optimizedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(optimizedFile);
            } else {
              reject(new Error('Error al optimizar imagen'));
            }
          },
          'image/jpeg',
          0.8 // 80% de calidad
        );
      };

      img.onerror = () => reject(new Error('Error al cargar imagen'));
      img.src = URL.createObjectURL(file);
    });
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleDeletePhoto = (photoId: string) => {
    const updatedPhotos = photos.filter(photo => photo.id !== photoId);
    onPhotosChange(updatedPhotos);
  };

  const handleUpdateCaption = () => {
    if (editingPhoto && newCaption.trim() !== editingPhoto.caption) {
      const updatedPhotos = photos.map(photo =>
        photo.id === editingPhoto.id
          ? { ...photo, caption: newCaption.trim() }
          : photo
      );
      onPhotosChange(updatedPhotos);
      setEditingPhoto(null);
      setNewCaption('');
    }
  };

  const openEditDialog = (photo: LocationPhoto) => {
    setEditingPhoto(photo);
    setNewCaption(photo.caption || '');
  };

  const downloadPhoto = (photo: LocationPhoto) => {
    const link = document.createElement('a');
    link.href = photo.url;
    link.download = `scouting-${photo.id}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es });
  };

  return (
    <div className="space-y-4">
      {/* Device Info Banner */}
      {!deviceInfo.isMobile && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-blue-800">
              <Monitor className="h-5 w-5" />
              <div className="text-sm">
                <p className="font-medium">Modo escritorio detectado</p>
                <p className="text-blue-600">
                  {deviceInfo.hasCamera 
                    ? "Puedes usar la cámara si tu navegador lo permite, o subir fotos desde tu computadora."
                    : "La cámara no está disponible en este navegador. Puedes subir fotos desde tu computadora."
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {deviceInfo.cameraError && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-orange-800">
              <AlertCircle className="h-5 w-5" />
              <div className="text-sm">
                <p className="font-medium">Limitación de cámara</p>
                <p className="text-orange-600">{deviceInfo.cameraError}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Fotografías</h3>
          <p className="text-sm text-muted-foreground">
            {photos.length} foto{photos.length !== 1 ? 's' : ''} cargada{photos.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFileUpload(e.target.files)}
            disabled={disabled}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture={deviceInfo.isMobile ? "environment" : undefined}
            className="hidden"
            onChange={(e) => handleFileUpload(e.target.files, true)}
            disabled={disabled || !deviceInfo.hasCamera}
          />
          
          {/* Gallery Upload Button - Always enabled for modern browsers */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            title={deviceInfo.isMobile ? "Subir fotos desde galería" : "Subir fotos desde tu computadora"}
          >
            <Upload className="mr-2 h-4 w-4" />
            {deviceInfo.isMobile ? "Galería" : "Subir fotos"}
          </Button>
          
          {/* Camera Button - only show if camera is available */}
          {deviceInfo.hasCamera && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => cameraInputRef.current?.click()}
              disabled={disabled}
              title={deviceInfo.isMobile ? "Tomar foto con cámara" : "Usar cámara (si está disponible)"}
            >
              <Camera className="mr-2 h-4 w-4" />
              Cámara
            </Button>
          )}
        </div>
      </div>

      {photos.length === 0 ? (
        <Card className="text-center p-8">
          <CardContent className="space-y-4">
            <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold">No hay fotos</h3>
              <p className="text-muted-foreground">
                {deviceInfo.isMobile ? (
                  "Agrega fotografías desde tu galería o toma fotos con la cámara"
                ) : (
                  deviceInfo.hasCamera ? 
                  "Agrega fotografías desde tu computadora o usa la cámara si está disponible" :
                  "Agrega fotografías desde tu computadora"
                )}
              </p>
              {!deviceInfo.hasCamera && !deviceInfo.isMobile && (
                <p className="text-sm text-orange-600 mt-2">
                  Para usar la cámara en escritorio, necesitas un navegador compatible como Chrome o Firefox y conceder permisos de cámara.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {photos.map((photo) => (
            <Card key={photo.id} className="overflow-hidden">
              <CardHeader className="p-0">
                <div className="aspect-square relative group cursor-pointer" onClick={() => setSelectedPhoto(photo)}>
                  <img
                    src={photo.url}
                    alt={photo.caption || 'Foto de localización'}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditDialog(photo);
                      }}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadPhoto(photo);
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar foto?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción eliminará permanentemente la foto. Esta acción no se puede deshacer.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeletePhoto(photo.id)}>
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-3 space-y-2">
                {photo.caption && (
                  <p className="text-sm line-clamp-2">{photo.caption}</p>
                )}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{formatDate(photo.timestamp)}</span>
                  <Badge variant="outline">{formatFileSize(photo.fileSize)}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Photo Viewer Dialog */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {selectedPhoto?.caption || 'Foto de localización'}
            </DialogTitle>
            <DialogDescription>
              {selectedPhoto && formatDate(selectedPhoto.timestamp)}
            </DialogDescription>
          </DialogHeader>
          {selectedPhoto && (
            <div className="space-y-4">
              <div className="relative">
                <img
                  src={selectedPhoto.url}
                  alt={selectedPhoto.caption || 'Foto de localización'}
                  className="w-full max-h-[60vh] object-contain"
                />
              </div>
              {selectedPhoto.caption && (
                <p className="text-sm text-muted-foreground">{selectedPhoto.caption}</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Caption Dialog */}
      <Dialog open={!!editingPhoto} onOpenChange={() => setEditingPhoto(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Descripción</DialogTitle>
            <DialogDescription>
              Agrega o modifica la descripción de la foto
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="caption">Descripción</Label>
            <Input
              id="caption"
              value={newCaption}
              onChange={(e) => setNewCaption(e.target.value)}
              placeholder="Describe lo que se ve en la foto..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPhoto(null)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateCaption}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}