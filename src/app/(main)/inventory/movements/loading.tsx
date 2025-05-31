import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Breadcrumb } from "@/components/ui/breadcrumb";

export default function MovementsLoading() {
  return (
    <div className="container mx-auto py-4 space-y-6">
      <Breadcrumb
        items={[
          { title: "Inventario", href: "/inventory" },
          { title: "Movimientos" }
        ]}
        includeHome={true}
      />
      
      <Card>
        <CardHeader>
          <CardTitle>Historial de Movimientos</CardTitle>
          <CardDescription>
            Registro histórico de todas las entradas, salidas y ajustes del inventario
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4">
              <Skeleton className="h-10 w-40 mb-4 sm:mb-0" />
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Skeleton className="h-10 w-full sm:w-60" />
                <Skeleton className="h-10 w-10" />
                <Skeleton className="h-10 w-10" />
              </div>
            </div>
            
            <div className="rounded-md border">
              <div className="py-3 px-4 border-b">
                <div className="grid grid-cols-6 gap-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-8" />
                  ))}
                </div>
              </div>
              
              <div className="py-6">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="px-4 py-3 border-b last:border-none">
                    <div className="grid grid-cols-6 gap-2">
                      {Array.from({ length: 6 }).map((_, j) => (
                        <Skeleton key={j} className="h-8" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 