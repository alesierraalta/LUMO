"use client";

import dynamic from "next/dynamic";
import type { ReportActionsProps } from "./report-actions";

const ReportActions = dynamic(() => import("./report-actions"), { ssr: false });

export default function ReportActionsClientWrapper(props: ReportActionsProps) {
  return <ReportActions {...props} />;
} 