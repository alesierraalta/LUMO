"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { DEFAULT_MARGIN_THRESHOLDS, getMarginThresholds, saveMarginThresholds, MarginThresholds } from "@/lib/margin-settings";

export function MarginSettings() {
  const [settings, setSettings] = useState<MarginThresholds>(getMarginThresholds());
  
  // Handle input changes
  const handleChange = (category: 'low' | 'medium' | 'high', field: 'min' | 'max', value: string) => {
    const numValue = Number(value);
    if (isNaN(numValue)) return;
    
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: numValue
      }
    }));
  };
  
  // Save settings
  const handleSave = () => {
    // Validate settings
    if (settings.low.max > settings.medium.min) {
      toast.error("El máximo de margen bajo debe ser menor o igual al mínimo de margen medio");
      return;
    }
    
    if (settings.medium.max > settings.high.min) {
      toast.error("El máximo de margen medio debe ser menor o igual al mínimo de margen alto");
      return;
    }
    
    saveMarginThresholds(settings);
    toast.success("Configuración de márgenes guardada correctamente");
  };
  
  // Reset to defaults
  const handleReset = () => {
    setSettings(DEFAULT_MARGIN_THRESHOLDS);
    toast.info("Configuración restablecida a valores predeterminados");
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuración de Márgenes</CardTitle>
        <CardDescription>
          Define los umbrales para categorizar márgenes como bajos, medios o altos.
          Estos valores se usan en reportes y visualizaciones.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Low Margin Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Margen Bajo</h3>
              <Badge variant="outline" className="bg-[var(--chart-1)]">
                {settings.low.min}% - {settings.low.max}%
              </Badge>
            </div>
            
            <div className="grid gap-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-sm">Mínimo</label>
                <div className="col-span-3">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={settings.low.min}
                    onChange={(e) => handleChange('low', 'min', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-sm">Máximo</label>
                <div className="col-span-3">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={settings.low.max}
                    onChange={(e) => handleChange('low', 'max', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Medium Margin Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Margen Medio</h3>
              <Badge variant="outline" className="bg-[var(--chart-2)]">
                {settings.medium.min}% - {settings.medium.max}%
              </Badge>
            </div>
            
            <div className="grid gap-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-sm">Mínimo</label>
                <div className="col-span-3">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={settings.medium.min}
                    onChange={(e) => handleChange('medium', 'min', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-sm">Máximo</label>
                <div className="col-span-3">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={settings.medium.max}
                    onChange={(e) => handleChange('medium', 'max', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* High Margin Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Margen Alto</h3>
              <Badge variant="outline" className="bg-[var(--chart-3)]">
                {settings.high.min}% - {settings.high.max}%
              </Badge>
            </div>
            
            <div className="grid gap-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-sm">Mínimo</label>
                <div className="col-span-3">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={settings.high.min}
                    onChange={(e) => handleChange('high', 'min', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-sm">Máximo</label>
                <div className="col-span-3">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={settings.high.max}
                    onChange={(e) => handleChange('high', 'max', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Visual representation */}
          <div className="pt-4">
            <div className="bg-muted rounded-md p-4">
              <div className="text-sm font-medium mb-2">Vista previa de márgenes</div>
              <div className="flex h-4 rounded-full overflow-hidden">
                <div 
                  className="bg-[var(--chart-1)]" 
                  style={{ width: `${settings.low.max}%` }}
                ></div>
                <div 
                  className="bg-[var(--chart-2)]" 
                  style={{ width: `${settings.medium.max - settings.medium.min}%` }}
                ></div>
                <div 
                  className="bg-[var(--chart-3)]" 
                  style={{ width: `${settings.high.max - settings.high.min}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span>0%</span>
                <span>{settings.low.max}%</span>
                <span>{settings.medium.max}%</span>
                <span>100%</span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={handleSave}>Guardar Configuración</Button>
            <Button variant="outline" onClick={handleReset}>Restablecer Valores</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 