import { Metadata } from "next";
import DuplicateDetector from "@/components/inventory/DuplicateDetector";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Detectar Duplicados | LUMO",
  description: "Detectar y resolver productos duplicados en el inventario"
};

export default async function DuplicateDetectorPage() {
  const user = await getCurrentUser();
  
  // Redirect if not authenticated
  if (!user) {
    redirect("/login");
  }
  
  // Check if user has inventory management permissions
  const canManageInventory = await hasPermission(user.id, "inventory:manage");
  if (!canManageInventory) {
    redirect("/dashboard");
  }
  
  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Link href="/inventory">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al inventario
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Detector de Duplicados</h1>
        </div>
      </div>
      
      <div className="grid gap-6">
        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-1">
          <DuplicateDetector />
        </div>
      </div>
    </div>
  );
} 