import { NextResponse } from 'next/server';
import { calculateMargin, calculatePrice } from '@/lib/client-utils';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const cost = parseFloat(url.searchParams.get('cost') || '50');
  const price = parseFloat(url.searchParams.get('price') || '100');
  
  const marginFromClientUtils = calculateMargin(cost, price);
  
  // Calcular directamente para verificar
  const manualMargin = ((price - cost) / cost) * 100;
  const priceFromMargin = calculatePrice(cost, marginFromClientUtils);
  
  return NextResponse.json({
    input: { cost, price },
    clientUtilsMargin: marginFromClientUtils,
    manualMargin,
    priceFromMargin,
    formula: "(price - cost) / cost * 100"
  });
} 