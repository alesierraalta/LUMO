"use client";

import dynamic from "next/dynamic";

// Dynamic import with ssr: false is allowed in client components
const ReportActions = dynamic(() => import("@/components/reports/report-actions"), { ssr: false });

type ClientReportActionsProps = {
  reportType: 'margins' | 'low-stock';
  data?: any[];
  categories?: any[];
  className?: string;
};

export default function ClientReportActions({ 
  reportType,
  data = [],
  categories = [],
  className
}: ClientReportActionsProps) {
  return (
    <ReportActions 
      reportType={reportType} 
      data={data} 
      categories={categories}
      className={className}
    />
  );
} 