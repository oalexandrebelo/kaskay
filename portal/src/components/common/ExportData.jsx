import React from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Download, FileText, Sheet, Table } from "lucide-react";
// Imports serão feitos dinamicamente para compatibilidade

export default function ExportData({ data = [], entityName = "", columns = [] }) {
  const [format, setFormat] = React.useState("excel");
  const [isLoading, setIsLoading] = React.useState(false);

  const exportToExcel = async () => {
    setIsLoading(true);
    try {
      const XLSX = (await import("xlsx")).default;
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, entityName);
      
      const colWidths = columns.map(() => 15);
      ws['!cols'] = colWidths.map(w => ({ wch: w }));
      
      XLSX.writeFile(wb, `${entityName}_${new Date().toISOString().split('T')[0]}.xlsx`);
    } finally {
      setIsLoading(false);
    }
  };

  const exportToPDF = async () => {
    setIsLoading(true);
    try {
      const jsPDF = (await import("jspdf")).jsPDF;
      await import("jspdf-autotable");
      
      const doc = new jsPDF();
      const tableData = data.map(row =>
        columns.map(col => row[col.key] ?? "-")
      );

      doc.autoTable({
        head: [columns.map(c => c.label)],
        body: tableData,
        startY: 20,
        theme: "grid",
        didDrawPage: (data) => {
          doc.setFontSize(16);
          doc.text(entityName, 14, 15);
        },
      });

      doc.save(`${entityName}_${new Date().toISOString().split('T')[0]}.pdf`);
    } finally {
      setIsLoading(false);
    }
  };

  const exportToCSV = () => {
    setIsLoading(true);
    try {
      const headers = columns.map(c => c.label).join(",");
      const rows = data.map(row =>
        columns.map(col => `"${row[col.key] ?? "-"}"`).join(",")
      );
      const csv = [headers, ...rows].join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${entityName}_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    switch (format) {
      case "excel":
        exportToExcel();
        break;
      case "pdf":
        exportToPDF();
        break;
      case "csv":
        exportToCSV();
        break;
    }
  };

  if (!data.length) return null;

  return (
    <div className="flex items-center gap-2">
      <Select value={format} onValueChange={setFormat}>
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="excel">
            <div className="flex items-center gap-2">
              <Sheet className="w-4 h-4" />
              Excel
            </div>
          </SelectItem>
          <SelectItem value="pdf">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              PDF
            </div>
          </SelectItem>
          <SelectItem value="csv">
            <div className="flex items-center gap-2">
              <Table className="w-4 h-4" />
              CSV
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
      <Button
        onClick={handleExport}
        disabled={isLoading}
        variant="outline"
        size="sm"
      >
        <Download className="w-4 h-4 mr-2" />
        {isLoading ? "Exportando..." : "Exportar"}
      </Button>
    </div>
  );
}