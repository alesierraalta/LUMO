"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

// Import the type but not the component itself
import type { ReportActionsProps } from "./report-actions";

// Dynamic import with ssr: false is allowed in client components
const ReportActions = dynamic(() => import("./report-actions"), { 
  ssr: false,
  loading: () => <div className="h-9 w-32 bg-gray-100 animate-pulse rounded-md"></div>
});

export default function ClientReportActions({ 
  reportType,
  data = [],
  categories = [],
  className
}: ReportActionsProps) {
  // We need to use useState and useEffect to handle client-side rendering
  // because dynamic imports might cause hydration mismatches
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-9 w-32 bg-gray-100 rounded-md"></div>;
  }

  return (
    <ReportActions 
      reportType={reportType} 
      data={data} 
      categories={categories}
      className={className}
    />
  );
} 