import { Metadata } from "next";
import { Settings, Sliders } from "lucide-react";
import { MarginSettings } from "@/components/margin-settings";

export const metadata: Metadata = {
  title: "Configuración | Sistema de Inventario",
  description: "Ajusta las configuraciones del sistema de inventario",
};

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="h-6 w-6" />
          <h1 className="text-2xl font-bold tracking-tight">Configuración</h1>
        </div>
      </div>
      
      <div className="grid gap-6">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Sliders className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Configuración de Márgenes</h2>
          </div>
          <MarginSettings />
        </div>
      </div>
    </div>
  );
} 