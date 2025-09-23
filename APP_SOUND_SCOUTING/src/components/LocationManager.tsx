'use client';

import { useState, useEffect } from 'react';
import { Coordinates } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { MapPin, Crosshair, Link, Copy, ExternalLink, Loader2 } from 'lucide-react';

interface LocationManagerProps {
  coordinates?: Coordinates;
  onCoordinatesChange: (coordinates: Coordinates | undefined) => void;
  disabled?: boolean;
}

export default function LocationManager({ coordinates, onCoordinatesChange, disabled = false }: LocationManagerProps) {
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');
  const [mapsUrl, setMapsUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (coordinates) {
      setManualLat(coordinates.latitude.toString());
      setManualLng(coordinates.longitude.toString());
    }
  }, [coordinates]);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('La geolocalización no está disponible en este navegador');
      return;
    }

    setIsGettingLocation(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newCoordinates: Coordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date().toISOString(),
        };
        onCoordinatesChange(newCoordinates);
        setIsGettingLocation(false);
      },
      (error) => {
        let errorMessage = 'Error al obtener la ubicación';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Permiso de geolocalización denegado';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Información de ubicación no disponible';
            break;
          case error.TIMEOUT:
            errorMessage = 'Tiempo de espera agotado al obtener ubicación';
            break;
        }
        setError(errorMessage);
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleManualLocation = () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);

    if (isNaN(lat) || isNaN(lng)) {
      setError('Coordenadas inválidas');
      return;
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setError('Coordenadas fuera de rango');
      return;
    }

    const newCoordinates: Coordinates = {
      latitude: lat,
      longitude: lng,
      timestamp: new Date().toISOString(),
    };
    onCoordinatesChange(newCoordinates);
    setError(null);
  };

  const parseMapsUrl = () => {
    if (!mapsUrl.trim()) return;

    // Patrones para diferentes formatos de URLs de Google Maps
    const patterns = [
      /@(-?\d+\.?\d*),(-?\d+\.?\d*)/, // @lat,lng
      /q=(-?\d+\.?\d*),(-?\d+\.?\d*)/, // q=lat,lng
      /!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/, // !3dlat!4dlng
      /destination=(-?\d+\.?\d*),(-?\d+\.?\d*)/, // destination=lat,lng
    ];

    for (const pattern of patterns) {
      const match = mapsUrl.match(pattern);
      if (match) {
        const lat = parseFloat(match[1]);
        const lng = parseFloat(match[2]);
        
        if (!isNaN(lat) && !isNaN(lng)) {
          const newCoordinates: Coordinates = {
            latitude: lat,
            longitude: lng,
            timestamp: new Date().toISOString(),
          };
          onCoordinatesChange(newCoordinates);
          setMapsUrl('');
          setError(null);
          return;
        }
      }
    }

    setError('No se pudieron extraer coordenadas de la URL');
  };

  const clearLocation = () => {
    onCoordinatesChange(undefined);
    setManualLat('');
    setManualLng('');
    setError(null);
  };

  const copyCoordinates = () => {
    if (coordinates) {
      const text = `${coordinates.latitude}, ${coordinates.longitude}`;
      navigator.clipboard.writeText(text).then(() => {
        // Podríamos mostrar un toast aquí
      });
    }
  };

  const openInMaps = () => {
    if (coordinates) {
      const url = `https://www.google.com/maps?q=${coordinates.latitude},${coordinates.longitude}`;
      window.open(url, '_blank');
    }
  };

  const formatCoordinate = (value: number, type: 'lat' | 'lng'): string => {
    const degrees = Math.abs(value);
    const minutes = (degrees - Math.floor(degrees)) * 60;
    const seconds = (minutes - Math.floor(minutes)) * 60;
    
    const direction = type === 'lat' 
      ? value >= 0 ? 'N' : 'S'
      : value >= 0 ? 'E' : 'W';
    
    return `${Math.floor(degrees)}°${Math.floor(minutes)}'${seconds.toFixed(1)}"${direction}`;
  };

  return (
    <div className="space-y-6">
      {/* Current Location Display */}
      {coordinates && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Ubicación Actual
            </CardTitle>
            <CardDescription>
              Coordenadas GPS registradas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Latitud</Label>
                <div className="space-y-1">
                  <p className="font-mono text-sm">{coordinates.latitude.toFixed(6)}°</p>
                  <p className="text-xs text-muted-foreground">
                    {formatCoordinate(coordinates.latitude, 'lat')}
                  </p>
                </div>
              </div>
              <div>
                <Label>Longitud</Label>
                <div className="space-y-1">
                  <p className="font-mono text-sm">{coordinates.longitude.toFixed(6)}°</p>
                  <p className="text-xs text-muted-foreground">
                    {formatCoordinate(coordinates.longitude, 'lng')}
                  </p>
                </div>
              </div>
            </div>
            
            {coordinates.accuracy && (
              <div>
                <Label>Precisión</Label>
                <Badge variant="outline" className="mt-1">
                  ±{coordinates.accuracy.toFixed(0)} metros
                </Badge>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={copyCoordinates}>
                <Copy className="mr-2 h-4 w-4" />
                Copiar Coordenadas
              </Button>
              <Button variant="outline" size="sm" onClick={openInMaps}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Abrir en Maps
              </Button>
              <Button variant="destructive" size="sm" onClick={clearLocation} disabled={disabled}>
                <MapPin className="mr-2 h-4 w-4" />
                Eliminar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Get Current Location */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crosshair className="h-5 w-5" />
            Obtener Ubicación Actual
          </CardTitle>
          <CardDescription>
            Usa el GPS de tu dispositivo para obtener coordenadas precisas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={getCurrentLocation} 
            disabled={isGettingLocation || disabled}
            className="w-full"
          >
            {isGettingLocation ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Obteniendo ubicación...
              </>
            ) : (
              <>
                <Crosshair className="mr-2 h-4 w-4" />
                Obtener Ubicación GPS
              </>
            )}
          </Button>
          {error && (
            <p className="text-sm text-red-600 mt-2">{error}</p>
          )}
        </CardContent>
      </Card>

      {/* Manual Location Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Ingresar Coordenadas Manualmente
          </CardTitle>
          <CardDescription>
            Ingresa las coordenadas GPS si no puedes usar el GPS automático
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="latitude">Latitud</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                value={manualLat}
                onChange={(e) => setManualLat(e.target.value)}
                placeholder="Ej: 40.7128"
                disabled={disabled}
              />
            </div>
            <div>
              <Label htmlFor="longitude">Longitud</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                value={manualLng}
                onChange={(e) => setManualLng(e.target.value)}
                placeholder="Ej: -74.0060"
                disabled={disabled}
              />
            </div>
          </div>
          <Button onClick={handleManualLocation} disabled={disabled}>
            <MapPin className="mr-2 h-4 w-4" />
            Establecer Ubicación
          </Button>
        </CardContent>
      </Card>

      {/* Google Maps URL Parser */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Desde Google Maps
          </CardTitle>
          <CardDescription>
            Pega un enlace de Google Maps para extraer las coordenadas automáticamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="mapsUrl">Enlace de Google Maps</Label>
            <Input
              id="mapsUrl"
              value={mapsUrl}
              onChange={(e) => setMapsUrl(e.target.value)}
              placeholder="https://maps.google.com/..."
              disabled={disabled}
            />
          </div>
          <Button onClick={parseMapsUrl} disabled={!mapsUrl.trim() || disabled}>
            <Link className="mr-2 h-4 w-4" />
            Extraer Coordenadas
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}