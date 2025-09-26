
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

// Interfaces para dados de relatório
export interface ReportData {
    title: string;
    data: any[];
    columns: string[];
}

class ReportExportService {

    /**
     * Exporta dados para CSV
     */
    exportToCSV(data: any[], fileName: string): void {
        const worksheet = XLSX.utils.json_to_sheet(data);
        const csv = XLSX.utils.sheet_to_csv(worksheet);
        this.download(csv, `${fileName}.csv`, 'text/csv');
    }

    /**
     * Exporta dados para Excel
     */
    exportToExcel(data: any[], fileName: string): void {
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Dados');
        XLSX.writeFile(workbook, `${fileName}.xlsx`);
    }

    /**
     * Exporta dados para PDF
     */
    exportToPDF(reportData: ReportData, fileName: string): void {
        const doc = new jsPDF();
        doc.text(reportData.title, 14, 16);
        (doc as any).autoTable({
            head: [reportData.columns],
            body: reportData.data.map(item => reportData.columns.map(col => item[col])),
            startY: 20,
        });
        doc.save(`${fileName}.pdf`);
    }

    /**
     * Prepara e gera um relatório de rotas
     */
    generateRoutesReport(routes: any[]): void {
        const reportData: ReportData = {
            title: 'Relatório de Rotas',
            columns: ['ID', 'Nome', 'Status', 'Motorista', 'Veículo'],
            data: routes.map(r => ({ ...r, motorista: r.driver?.name, veículo: r.vehicle?.plate }))
        };
        this.exportToPDF(reportData, 'relatorio_rotas');
    }

    private download(content: string, fileName: string, mimeType: string): void {
        const a = document.createElement('a');
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
    }
}

export const reportExportService = new ReportExportService();
