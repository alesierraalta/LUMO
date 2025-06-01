import { Loader2 } from 'lucide-react';

export default function MovementsLoading() {
  return (
    <div className="container mx-auto py-12 flex flex-col items-center justify-center min-h-[300px]">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <p className="text-muted-foreground">Cargando datos de movimientos...</p>
    </div>
  );
} 