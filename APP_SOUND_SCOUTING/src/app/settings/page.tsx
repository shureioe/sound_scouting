'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TechnicianConfig, TechnicianFormData } from '@/lib/types';
import { getTechnicianConfig, updateTechnicianConfig } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Save, User, Building, Mail, Phone, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function SettingsPage() {
  const router = useRouter();
  const [config, setConfig] = useState<TechnicianConfig | null>(null);
  const [formData, setFormData] = useState<TechnicianFormData>({
    fullName: '',
    company: '',
    email: '',
    phone: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  useEffect(() => {
    if (config) {
      setFormData({
        fullName: config.fullName,
        company: config.company,
        email: config.email,
        phone: config.phone,
      });
    }
  }, [config]);

  useEffect(() => {
    if (config) {
      const changed = 
        formData.fullName !== config.fullName ||
        formData.company !== config.company ||
        formData.email !== config.email ||
        formData.phone !== config.phone;
      setHasChanges(changed);
    }
  }, [formData, config]);

  const loadConfig = () => {
    const loadedConfig = getTechnicianConfig();
    setConfig(loadedConfig);
  };

  const handleSave = async () => {
    if (!config) return;

    setIsSaving(true);
    try {
      const updatedConfig = updateTechnicianConfig(formData);
      setConfig(updatedConfig);
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving config:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof TechnicianFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es });
  };

  if (!config) {
    return (
      <div className="container mx-auto p-4 max-w-2xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
        </div>
        
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Datos del Técnico</h1>
          <p className="text-muted-foreground">
            Gestiona tu información personal y de contacto
          </p>
        </div>
      </div>

      <Separator />

      {/* Configuration Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Información Personal
          </CardTitle>
          <CardDescription>
            Estos datos se utilizarán automáticamente en los informes generados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="fullName">Nombre Completo *</Label>
            <Input
              id="fullName"
              value={formData.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              placeholder="Ej: Juan Pérez García"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company">Empresa/Estudio</Label>
            <Input
              id="company"
              value={formData.company}
              onChange={(e) => handleInputChange('company', e.target.value)}
              placeholder="Ej: AudioPro Producciones"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Correo Electrónico</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="ejemplo@correo.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="+34 600 000 000"
            />
          </div>

          <div className="flex justify-between items-center pt-4">
            <div className="text-sm text-muted-foreground">
              Última actualización: {formatDate(config.updatedAt)}
            </div>
            <Button 
              onClick={handleSave} 
              disabled={!hasChanges || isSaving || !formData.fullName.trim()}
            >
              {isSaving ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Guardar Cambios
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview Card */}
      <Card>
        <CardHeader>
          <CardTitle>Vista Previa en Informes</CardTitle>
          <CardDescription>
            Así aparecerá tu información en los informes generados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">
                {formData.fullName || 'Nombre del técnico'}
              </span>
            </div>
            {formData.company && (
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-muted-foreground" />
                <span>{formData.company}</span>
              </div>
            )}
            {formData.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{formData.email}</span>
              </div>
            )}
            {formData.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{formData.phone}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Información Importante</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <p className="text-sm">
                <strong>Nombre completo</strong> es obligatorio para generar informes válidos
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <p className="text-sm">
                Los datos se guardan localmente en tu dispositivo y no se comparten con ningún servicio externo
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <p className="text-sm">
                Puedes actualizar tu información en cualquier momento
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}