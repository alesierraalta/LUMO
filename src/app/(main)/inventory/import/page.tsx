import { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth-server";
import { isAdmin } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import ImportForm from "./import-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ImportHistory from "./import-history";

export const metadata: Metadata = {
  title: "Importar Inventario",
  description: "Importar productos de Excel con procesamiento inteligente",
};

export default async function ImportPage() {
  // Verify permissions
  const user = await getCurrentUser();
  
  

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Importar Inventario</h1>
        <p className="text-muted-foreground mt-1">
          Importa productos desde Excel con extracción inteligente de datos
        </p>
      </div>
      
      <Tabs defaultValue="import" className="w-full">
        <TabsList className="grid grid-cols-2 w-[400px]">
          <TabsTrigger value="import">Importar Datos</TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
        </TabsList>
        <TabsContent value="import" className="mt-6">
          <ImportForm userId={user?.id || ''} />
        </TabsContent>
        <TabsContent value="history" className="mt-6">
          <ImportHistory userId={user?.id || ''} />
        </TabsContent>
      </Tabs>
    </div>
  );
} 