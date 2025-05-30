"use client";

import { BarChart3, Settings } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function HomePage() {
  const navigationCards = [
    {
      title: "Dashboard",
      description: "Ver resumen y estadísticas del sistema",
      href: "/dashboard",
      icon: <BarChart3 className="h-6 w-6" />,
      color: "from-primary/20 to-primary/10 hover:from-primary/30 hover:to-primary/20 border-primary/20"
    },
    {
      title: "Settings",
      description: "Personaliza la configuración del sistema",
      href: "/settings",
      icon: <Settings className="h-6 w-6" />,
      color: "from-slate-500/20 to-slate-400/10 hover:from-slate-500/30 hover:to-slate-400/20 border-slate-500/20"
    }
  ];

  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold mb-8">Bienvenido a LUMO</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {navigationCards.map((card, i) => (
          <Link 
            key={i} 
            href={card.href}
            className={cn(
              "flex flex-col p-6 bg-gradient-to-b border rounded-lg shadow-sm transition-all hover:shadow-md",
              card.color
            )}
          >
            <div className="mb-3">{card.icon}</div>
            <h2 className="text-xl font-semibold mb-2">{card.title}</h2>
            <p className="text-muted-foreground">{card.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
} 