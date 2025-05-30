import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { 
  TrendingDown, 
  AlertTriangle, 
  Calendar, 
  BarChart3,
  FileText,
  DollarSign 
} from "lucide-react";

export default function ReportsPage() {
  const reports = [
    {
      title: "Stock Bajo",
      description: "Productos con inventario crítico que requieren reabastecimiento",
      href: "/reports/low-stock",
      icon: <AlertTriangle className="h-6 w-6 text-amber-600" />,
      color: "border-amber-200 bg-amber-50"
    },
    {
      title: "Análisis de Márgenes",
      description: "Análisis de rentabilidad y márgenes por producto y categoría",
      href: "/reports/margins",
      icon: <TrendingDown className="h-6 w-6 text-green-600" />,
      color: "border-green-200 bg-green-50"
    },
    {
      title: "Reportes Programados",
      description: "Configurar y gestionar reportes automáticos",
      href: "/reports/scheduled",
      icon: <Calendar className="h-6 w-6 text-blue-600" />,
      color: "border-blue-200 bg-blue-50"
    }
  ];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reportes</h1>
          <p className="text-muted-foreground">
            Análisis e informes del sistema de inventario
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {reports.map((report) => (
          <Link key={report.href} href={report.href} className="block">
            <Card className={`cursor-pointer transition-colors hover:shadow-md ${report.color}`}>
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <div className="flex items-center space-x-2 flex-1">
                  {report.icon}
                  <CardTitle className="text-lg">{report.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm">
                  {report.description}
                </CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Resumen del Sistema</span>
          </CardTitle>
          <CardDescription>
            Vista general del estado actual del inventario
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Total de Productos
              </p>
              <p className="text-2xl font-bold">-</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Productos con Stock Bajo
              </p>
              <p className="text-2xl font-bold text-amber-600">-</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Valor Total del Inventario
              </p>
              <p className="text-2xl font-bold text-green-600">-</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Categorías Activas
              </p>
              <p className="text-2xl font-bold">-</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 