"use client";

import { useState } from "react";
import { 
  DownloadIcon, 
  FileTextIcon, 
  PrinterIcon, 
  CalendarIcon,
  GanttChartIcon,
  AlertCircleIcon 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "@/components/ui/toast-util";
import { 
  downloadCSV, 
  printReport, 
  getFormattedDate, 
  formatReportName,
  prepareMarginReportData,
  prepareLowStockReportData,
  ScheduledReportConfig,
  CSVExportOptions 
} from "@/lib/reportUtils";

// Types for props
export interface ReportActionsProps {
  reportType: 'margins' | 'low-stock';
  data: any[];
  categories: any[];
  className?: string;
}

export default function ReportActions({ 
  reportType, 
  data, 
  categories,
  className = "" 
}: ReportActionsProps) {
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [scheduledReport, setScheduledReport] = useState<ScheduledReportConfig>({
    name: `${formatReportName(reportType)} Report`,
    reportType: reportType,
    frequency: 'weekly',
    format: 'csv',
    active: true
  });

  const handleExportCSV = () => {
    try {
      const formattedData = reportType === 'margins' 
        ? prepareMarginReportData(data, categories)
        : prepareLowStockReportData(data, categories);
      
      const options: CSVExportOptions = {
        fileName: `${reportType}-report-${getFormattedDate()}.csv`
      };
      
      downloadCSV(formattedData, options);
      toast({
        title: "Export Successful",
        description: `${formatReportName(reportType)} report exported as CSV.`,
        variant: "default",
      });
    } catch (error) {
      console.error("Error exporting CSV:", error);
      toast({
        title: "Export Failed",
        description: "There was an error exporting the report.",
        variant: "destructive",
      });
    }
  };

  const handlePrintReport = () => {
    // Add print-optimized class to body before printing
    document.body.classList.add('print-mode');
    
    // Print the report
    printReport();
    
    // Remove print-optimized class after printing
    setTimeout(() => {
      document.body.classList.remove('print-mode');
    }, 500);
  };

  const handleScheduleReport = () => {
    // In a real application, this would save the scheduled report configuration to a database
    console.log("Scheduled report:", scheduledReport);
    
    toast({
      title: "Report Scheduled",
      description: `${scheduledReport.name} will be generated ${scheduledReport.frequency}.`,
      variant: "default",
    });
    
    setIsScheduleDialogOpen(false);
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handlePrintReport}
        className="hidden md:flex print:hidden"
      >
        <PrinterIcon className="h-4 w-4 mr-2" />
        Print
      </Button>

      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleExportCSV}
        className="print:hidden"
      >
        <DownloadIcon className="h-4 w-4 mr-2" />
        Export CSV
      </Button>

      <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            size="sm"
            className="hidden md:flex print:hidden"
          >
            <CalendarIcon className="h-4 w-4 mr-2" />
            Schedule
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Schedule Report Generation</DialogTitle>
            <DialogDescription>
              Configure automatic report generation and delivery.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="report-name" className="text-right">
                Name
              </Label>
              <Input
                id="report-name"
                value={scheduledReport.name}
                onChange={(e) => setScheduledReport({...scheduledReport, name: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="report-frequency" className="text-right">
                Frequency
              </Label>
              <Select 
                value={scheduledReport.frequency}
                onValueChange={(value: 'daily' | 'weekly' | 'monthly') => 
                  setScheduledReport({...scheduledReport, frequency: value})
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="report-format" className="text-right">
                Format
              </Label>
              <div className="col-span-3 flex space-x-4">
                <div className="flex items-center space-x-2">
                  <input 
                    type="radio" 
                    id="format-csv" 
                    value="csv" 
                    checked={scheduledReport.format === 'csv'}
                    onChange={() => setScheduledReport({...scheduledReport, format: 'csv'})}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="format-csv">CSV</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input 
                    type="radio" 
                    id="format-pdf" 
                    value="pdf"
                    checked={scheduledReport.format === 'pdf'}
                    onChange={() => setScheduledReport({...scheduledReport, format: 'pdf'})}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="format-pdf">PDF</Label>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="report-email" className="text-right">
                Email
              </Label>
              <Input
                id="report-email"
                type="email"
                placeholder="Email to receive report"
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleScheduleReport}>
              Save Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="sm"
            className="print:hidden"
          >
            <GanttChartIcon className="h-4 w-4 mr-2" />
            More
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Report Options</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={handleExportCSV}>
              <DownloadIcon className="h-4 w-4 mr-2" />
              <span>Export as CSV</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handlePrintReport}>
              <PrinterIcon className="h-4 w-4 mr-2" />
              <span>Print Report</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setIsScheduleDialogOpen(true)}>
              <CalendarIcon className="h-4 w-4 mr-2" />
              <span>Schedule Report</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
} 