"use client";

import { formatReportName, getFormattedDate } from "@/lib/reportUtils";

interface PrintHeaderProps {
  reportType: string;
  title?: string;
}

export default function PrintHeader({ title }: { title: string }) {
  return (
    <div className="mb-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-sm text-muted-foreground">
          Generated on {new Date().toLocaleDateString()}
        </p>
      </div>
    </div>
  );
} 