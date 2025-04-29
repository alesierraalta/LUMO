"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
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
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import { formatReportName } from "@/lib/reportUtils";
import { 
  PlusIcon, 
  CalendarIcon, 
  TrashIcon, 
  PauseIcon, 
  PlayIcon, 
  ClockIcon 
} from "lucide-react";

// Mock data for scheduled reports
const mockScheduledReports = [
  {
    id: "1",
    name: "Monthly Margin Analysis",
    reportType: "margins",
    frequency: "monthly",
    format: "csv",
    recipients: ["finance@example.com"],
    active: true,
    lastRun: "2023-10-01T10:00:00Z",
    nextRun: "2023-11-01T10:00:00Z"
  },
  {
    id: "2",
    name: "Weekly Low Stock Alert",
    reportType: "low-stock",
    frequency: "weekly",
    format: "pdf",
    recipients: ["inventory@example.com", "purchasing@example.com"],
    active: true,
    lastRun: "2023-10-22T08:00:00Z",
    nextRun: "2023-10-29T08:00:00Z"
  },
  {
    id: "3",
    name: "Daily Inventory Value",
    reportType: "inventory-value",
    frequency: "daily",
    format: "csv",
    recipients: ["ceo@example.com"],
    active: false,
    lastRun: "2023-10-20T07:00:00Z",
    nextRun: null
  }
];

export default function ScheduledReportsPage() {
  const [scheduledReports, setScheduledReports] = useState(mockScheduledReports);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newReport, setNewReport] = useState({
    name: "",
    reportType: "margins",
    frequency: "monthly",
    format: "csv",
    recipients: [""],
    active: true
  });
  
  const handleToggleActive = (id: string) => {
    setScheduledReports(reports => 
      reports.map(report => 
        report.id === id ? { ...report, active: !report.active } : report
      )
    );
    
    const report = scheduledReports.find(r => r.id === id);
    
    toast({
      title: report?.active ? "Report Paused" : "Report Activated",
      description: `${report?.name} has been ${report?.active ? "paused" : "activated"}.`,
      variant: "default",
    });
  };
  
  const handleDeleteReport = (id: string) => {
    const report = scheduledReports.find(r => r.id === id);
    setScheduledReports(reports => reports.filter(report => report.id !== id));
    
    toast({
      title: "Report Deleted",
      description: `${report?.name} has been removed from scheduled reports.`,
      variant: "default",
    });
  };
  
  const handleCreateReport = () => {
    const newReportWithId = {
      ...newReport,
      id: Math.random().toString(36).substring(2, 9),
      lastRun: null,
      nextRun: null
    };
    
    setScheduledReports([...scheduledReports, newReportWithId]);
    setIsCreateDialogOpen(false);
    
    toast({
      title: "Report Scheduled",
      description: `${newReport.name} has been added to scheduled reports.`,
      variant: "default",
    });
    
    // Reset form
    setNewReport({
      name: "",
      reportType: "margins",
      frequency: "monthly",
      format: "csv",
      recipients: [""],
      active: true
    });
  };
  
  const handleAddRecipient = () => {
    setNewReport({
      ...newReport,
      recipients: [...newReport.recipients, ""]
    });
  };
  
  const handleUpdateRecipient = (index: number, value: string) => {
    const updatedRecipients = [...newReport.recipients];
    updatedRecipients[index] = value;
    setNewReport({
      ...newReport,
      recipients: updatedRecipients
    });
  };
  
  const handleRemoveRecipient = (index: number) => {
    const updatedRecipients = [...newReport.recipients];
    updatedRecipients.splice(index, 1);
    setNewReport({
      ...newReport,
      recipients: updatedRecipients
    });
  };
  
  // Format date to readable format
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not scheduled";
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Scheduled Reports</h1>
          <p className="text-muted-foreground">
            Manage your automated report generation and delivery.
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="mr-2 h-4 w-4" />
              New Schedule
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Scheduled Report</DialogTitle>
              <DialogDescription>
                Set up automatic report generation and delivery.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="report-name" className="text-right">
                  Name
                </Label>
                <Input
                  id="report-name"
                  value={newReport.name}
                  onChange={(e) => setNewReport({...newReport, name: e.target.value})}
                  placeholder="Monthly Margin Analysis"
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="report-type" className="text-right">
                  Report Type
                </Label>
                <Select 
                  value={newReport.reportType}
                  onValueChange={(value) => 
                    setNewReport({...newReport, reportType: value as any})
                  }
                >
                  <SelectTrigger id="report-type" className="col-span-3">
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="margins">Margin Analysis</SelectItem>
                    <SelectItem value="low-stock">Low Stock</SelectItem>
                    <SelectItem value="inventory-value">Inventory Value</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="report-frequency" className="text-right">
                  Frequency
                </Label>
                <Select 
                  value={newReport.frequency}
                  onValueChange={(value) => 
                    setNewReport({...newReport, frequency: value as any})
                  }
                >
                  <SelectTrigger id="report-frequency" className="col-span-3">
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
                      checked={newReport.format === 'csv'}
                      onChange={() => setNewReport({...newReport, format: 'csv'})}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="format-csv">CSV</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="radio" 
                      id="format-pdf" 
                      value="pdf"
                      checked={newReport.format === 'pdf'}
                      onChange={() => setNewReport({...newReport, format: 'pdf'})}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="format-pdf">PDF</Label>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-4 items-start gap-4 pt-2">
                <Label className="text-right pt-2">
                  Recipients
                </Label>
                <div className="col-span-3 space-y-2">
                  {newReport.recipients.map((recipient, index) => (
                    <div key={index} className="flex space-x-2">
                      <Input
                        type="email"
                        value={recipient}
                        onChange={(e) => handleUpdateRecipient(index, e.target.value)}
                        placeholder="email@example.com"
                        className="flex-1"
                      />
                      {newReport.recipients.length > 1 && (
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => handleRemoveRecipient(index)}
                          type="button"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddRecipient}
                    type="button"
                    className="mt-2"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Recipient
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="report-active" className="text-right">
                  Active
                </Label>
                <div className="flex items-center space-x-2 col-span-3">
                  <Switch
                    id="report-active"
                    checked={newReport.active}
                    onCheckedChange={(checked) => 
                      setNewReport({...newReport, active: checked})
                    }
                  />
                  <span className="text-sm text-muted-foreground">
                    {newReport.active ? "Report is active" : "Report is paused"}
                  </span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="submit" 
                onClick={handleCreateReport}
                disabled={!newReport.name || newReport.recipients.some(r => !r)}
              >
                Create Schedule
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Automated Reports</CardTitle>
          <CardDescription>
            All your scheduled reports and their current status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Format</TableHead>
                <TableHead>Recipients</TableHead>
                <TableHead className="w-[100px]">Last Run</TableHead>
                <TableHead className="w-[100px]">Next Run</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scheduledReports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-10">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <CalendarIcon className="h-10 w-10 text-muted-foreground" />
                      <p className="text-muted-foreground text-lg">No scheduled reports yet</p>
                      <Button 
                        variant="outline" 
                        onClick={() => setIsCreateDialogOpen(true)}
                      >
                        <PlusIcon className="mr-2 h-4 w-4" />
                        Create Your First Schedule
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                scheduledReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">{report.name}</TableCell>
                    <TableCell>{formatReportName(report.reportType)}</TableCell>
                    <TableCell className="capitalize">{report.frequency}</TableCell>
                    <TableCell className="uppercase">{report.format}</TableCell>
                    <TableCell>
                      {report.recipients?.length ? (
                        <span>{report.recipients.join(", ")}</span>
                      ) : (
                        <span className="text-muted-foreground italic">None</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {report.lastRun ? (
                        <div className="flex items-center space-x-1">
                          <ClockIcon className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs">{formatDate(report.lastRun)}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Never</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {report.active && report.nextRun ? (
                        <div className="flex items-center space-x-1">
                          <ClockIcon className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs">{formatDate(report.nextRun)}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Not scheduled</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <div className={`h-2.5 w-2.5 rounded-full mr-2 ${report.active ? 'bg-green-500' : 'bg-amber-500'}`} />
                        <span className="text-sm">
                          {report.active ? 'Active' : 'Paused'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleActive(report.id)}
                          title={report.active ? "Pause report" : "Activate report"}
                        >
                          {report.active ? (
                            <PauseIcon className="h-4 w-4" />
                          ) : (
                            <PlayIcon className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteReport(report.id)}
                          title="Delete report"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
} 