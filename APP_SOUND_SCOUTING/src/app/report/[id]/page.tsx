'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Project, SoundScoutingReport, LocationSet } from '@/lib/types';
import { getProjectById, getTechnicianConfig } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { ArrowLeft, FileText, Download, User, Calendar, MapPin, Camera, CheckCircle, XCircle, Clock, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ReportPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  
  const [project, setProject] = useState<Project | null>(null);
  const [technicianConfig, setTechnicianConfig] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = () => {
    setLoading(true);
    const loadedProject = getProjectById(projectId);
    const config = getTechnicianConfig();
    
    if (loadedProject) {
      setProject(loadedProject);
      setTechnicianConfig(config);
    } else {
      // Redirigir si el proyecto no existe
      router.push('/');
    }
    setLoading(false);
  };

  const generateReport = (): SoundScoutingReport => {
    if (!project || !technicianConfig) {
      throw new Error('Datos no disponibles');
    }

    return {
      id: Date.now().toString(),
      projectId: project.id,
      projectName: project.name,
      technician: technicianConfig,
      generatedAt: new Date().toISOString(),
      sets: project.sets,
    };
  };

  const downloadReport = () => {
    if (!project || !technicianConfig) return;

    setIsGenerating(true);
    try {
      const report = generateReport();
      const htmlContent = generateReportHTML(report);
      
      // Crear y descargar el archivo
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `informe-scouting-${project.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-${format(new Date(), 'yyyy-MM-dd')}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generando informe:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateReportHTML = (report: SoundScoutingReport): string => {
    const getEvaluationStatus = (evaluation: string) => {
      switch (evaluation) {
        case 'apto':
          return { icon: '✅', label: 'Apto', color: '#22c55e' };
        case 'no_apto':
          return { icon: '❌', label: 'No apto', color: '#ef4444' };
        default:
          return { icon: '⏳', label: 'Sin evaluar', color: '#6b7280' };
      }
    };

    const formatDate = (dateString: string) => {
      return format(new Date(dateString), "d 'de' MMMM 'de' yyyy", { locale: es });
    };

    const formatDateTime = (dateString: string) => {
      return format(new Date(dateString), "d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es });
    };

    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Informe de Scouting de Sonido - ${report.projectName}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #fff;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding: 40px 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 10px;
        }
        
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            font-weight: 700;
        }
        
        .header .subtitle {
            font-size: 1.2em;
            opacity: 0.9;
        }
        
        .section {
            margin-bottom: 30px;
            padding: 20px;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            background: #f9fafb;
        }
        
        .section h2 {
            color: #4f46e5;
            margin-bottom: 15px;
            font-size: 1.5em;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 5px;
        }
        
        .technician-info {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
        }
        
        .info-item {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .info-item strong {
            color: #6b7280;
            min-width: 80px;
        }
        
        .set-card {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .set-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 15px;
        }
        
        .set-title {
            font-size: 1.3em;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 5px;
        }
        
        .set-date {
            color: #6b7280;
            font-size: 0.9em;
        }
        
        .evaluation-badge {
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 0.9em;
            font-weight: 500;
            color: white;
        }
        
        .tags {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin: 10px 0;
        }
        
        .tag {
            background: #e5e7eb;
            color: #374151;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 0.85em;
        }
        
        .photos-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: 10px;
            margin: 15px 0;
        }
        
        .photo-item {
            aspect-ratio: 1;
            border-radius: 8px;
            overflow: hidden;
            background: #f3f4f6;
        }
        
        .photo-item img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        
        .coordinates {
            background: #f3f4f6;
            padding: 10px;
            border-radius: 6px;
            font-family: monospace;
            font-size: 0.9em;
            margin: 10px 0;
        }
        
        .maps-link {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            color: #4f46e5;
            text-decoration: none;
            font-weight: 500;
        }
        
        .content-section {
            margin: 15px 0;
        }
        
        .content-section h4 {
            color: #4b5563;
            margin-bottom: 8px;
            font-weight: 600;
        }
        
        .content-section p {
            color: #6b7280;
            line-height: 1.6;
        }
        
        .footer {
            text-align: center;
            margin-top: 40px;
            padding: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 0.9em;
        }
        
        @media print {
            .container {
                max-width: none;
                margin: 0;
                padding: 10px;
            }
            
            .section {
                break-inside: avoid;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>Informe de Scouting de Sonido</h1>
            <div class="subtitle">${report.projectName}</div>
        </div>

        <!-- Project Information -->
        <div class="section">
            <h2>📋 Información del Proyecto</h2>
            <div class="technician-info">
                <div class="info-item">
                    <strong>Proyecto:</strong> ${report.projectName}
                </div>
                <div class="info-item">
                    <strong>Generado:</strong> ${formatDateTime(report.generatedAt)}
                </div>
                <div class="info-item">
                    <strong>Localizaciones:</strong> ${report.sets.length}
                </div>
            </div>
        </div>

        <!-- Technician Information -->
        <div class="section">
            <h2>👤 Técnico Responsable</h2>
            <div class="technician-info">
                <div class="info-item">
                    <strong>Nombre:</strong> ${report.technician.fullName || 'No especificado'}
                </div>
                ${report.technician.company ? `<div class="info-item"><strong>Empresa:</strong> ${report.technician.company}</div>` : ''}
                ${report.technician.email ? `<div class="info-item"><strong>Email:</strong> ${report.technician.email}</div>` : ''}
                ${report.technician.phone ? `<div class="info-item"><strong>Teléfono:</strong> ${report.technician.phone}</div>` : ''}
            </div>
        </div>

        <!-- Locations -->
        <div class="section">
            <h2>📍 Localizaciones Evaluadas</h2>
            ${report.sets.length === 0 ? 
                '<p>No hay localizaciones evaluadas en este proyecto.</p>' :
                report.sets.map(set => {
                  const status = getEvaluationStatus(set.evaluation);
                  return `
                    <div class="set-card">
                        <div class="set-header">
                            <div>
                                <div class="set-title">${set.title}</div>
                                <div class="set-date">Evaluado el ${formatDate(set.createdAt)}</div>
                            </div>
                            <div class="evaluation-badge" style="background-color: ${status.color}">
                                ${status.icon} ${status.label}
                            </div>
                        </div>

                        ${set.tags.length > 0 ? `
                            <div class="tags">
                                ${set.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                            </div>
                        ` : ''}

                        ${set.coordinates ? `
                            <div class="coordinates">
                                <strong>Coordenadas:</strong> ${set.coordinates.latitude.toFixed(6)}, ${set.coordinates.longitude.toFixed(6)}
                                ${set.coordinates.accuracy ? `<br><small>Precisión: ±${set.coordinates.accuracy.toFixed(0)}m</small>` : ''}
                            </div>
                            <a href="https://www.google.com/maps?q=${set.coordinates.latitude},${set.coordinates.longitude}" 
                               target="_blank" class="maps-link">
                                🗺️ Abrir en Google Maps
                            </a>
                        ` : ''}

                        ${set.photos.length > 0 ? `
                            <div class="content-section">
                                <h4>📷 Fotografías (${set.photos.length})</h4>
                                <div class="photos-grid">
                                    ${set.photos.map(photo => `
                                        <div class="photo-item">
                                            <img src="${photo.url}" alt="${photo.caption || 'Foto de localización'}" />
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}

                        ${set.noiseObservations ? `
                            <div class="content-section">
                                <h4>📝 Observaciones</h4>
                                <p>${set.noiseObservations.replace(/\n/g, '<br>')}</p>
                            </div>
                        ` : ''}

                        ${set.technicalRequirements ? `
                            <div class="content-section">
                                <h4>⚙️ Requerimientos Técnicos</h4>
                                <p>${set.technicalRequirements.replace(/\n/g, '<br>')}</p>
                            </div>
                        ` : ''}
                    </div>
                  `;
                }).join('')
            }
        </div>

        <!-- Footer -->
        <div class="footer">
            <p>Informe generado por Sound Scouting App - ${formatDateTime(report.generatedAt)}</p>
        </div>
    </div>
</body>
</html>
    `.trim();
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "d 'de' MMMM 'de' yyyy", { locale: es });
  };

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

  const getEvaluationIcon = (evaluation: string) => {
    switch (evaluation) {
      case 'apto':
        return CheckCircle;
      case 'no_apto':
        return XCircle;
      default:
        return Clock;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="space-y-2">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!project || !technicianConfig) {
    return null;
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <div className="flex-1"></div>
          <Button 
            onClick={downloadReport} 
            disabled={isGenerating || project.sets.length === 0}
            size="lg"
          >
            {isGenerating ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Generando...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Descargar Informe
              </>
            )}
          </Button>
        </div>
        
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-8 w-8" />
            Informe de Scouting
          </h1>
          <p className="text-muted-foreground">
            Genera un informe profesional para el proyecto "{project.name}"
          </p>
        </div>
      </div>

      <Separator />

      {/* Preview */}
      <div className="space-y-6">
        {/* Project Info */}
        <Card>
          <CardHeader>
            <CardTitle>Información del Proyecto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium">Nombre del Proyecto</Label>
                <p className="text-lg font-semibold">{project.name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Localizaciones</Label>
                <p className="text-lg font-semibold">{project.sets.length}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Fecha de Generación</Label>
                <p className="text-lg font-semibold">{formatDate(new Date().toISOString())}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Technician Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Técnico Responsable
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-medium">Nombre:</span>
              <span>{technicianConfig.fullName || 'No especificado'}</span>
            </div>
            {technicianConfig.company && (
              <div className="flex items-center gap-2">
                <span className="font-medium">Empresa:</span>
                <span>{technicianConfig.company}</span>
              </div>
            )}
            {technicianConfig.email && (
              <div className="flex items-center gap-2">
                <span className="font-medium">Email:</span>
                <span>{technicianConfig.email}</span>
              </div>
            )}
            {technicianConfig.phone && (
              <div className="flex items-center gap-2">
                <span className="font-medium">Teléfono:</span>
                <span>{technicianConfig.phone}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sets Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Resumen de Localizaciones</CardTitle>
            <CardDescription>
              {project.sets.length} localizaciones evaluadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {project.sets.length === 0 ? (
              <div className="text-center py-8">
                <MapPin className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  No hay localizaciones para incluir en el informe
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Agrega algunas localizaciones para generar un informe completo
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {project.sets.map((set) => {
                  const EvaluationIcon = getEvaluationIcon(set.evaluation);
                  return (
                    <div key={set.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">{set.title}</h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(set.createdAt)}
                            </div>
                            {set.coordinates && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {set.coordinates.latitude.toFixed(4)}, {set.coordinates.longitude.toFixed(4)}
                              </div>
                            )}
                            {set.photos.length > 0 && (
                              <div className="flex items-center gap-1">
                                <Camera className="h-3 w-3" />
                                {set.photos.length} foto{set.photos.length !== 1 ? 's' : ''}
                              </div>
                            )}
                          </div>
                        </div>
                        <Badge 
                          variant="secondary" 
                          className={`${getEvaluationColor(set.evaluation)} text-white`}
                        >
                          <EvaluationIcon className="mr-1 h-3 w-3" />
                          {getEvaluationLabel(set.evaluation)}
                        </Badge>
                      </div>

                      {set.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {set.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {set.coordinates && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const url = `https://www.google.com/maps?q=${set.coordinates.latitude},${set.coordinates.longitude}`;
                              window.open(url, '_blank');
                            }}
                          >
                            <ExternalLink className="mr-2 h-3 w-3" />
                            Ver en Maps
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info */}
        <Card>
          <CardHeader>
            <CardTitle>Información del Informe</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <p className="text-sm">
                  El informe se generará en formato HTML, optimizado para impresión y visualización en cualquier navegador
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <p className="text-sm">
                  Incluirá toda la información de las localizaciones: fotos, coordenadas, observaciones y requerimientos técnicos
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <p className="text-sm">
                  Los enlaces a Google Maps serán funcionales para facilitar la localización de cada punto
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}