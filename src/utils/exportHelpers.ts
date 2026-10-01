import * as XLSX from 'xlsx';
import { Invoice, Settings } from '../types/index.ts';
import { formatRupee, formatDate } from './formatters.ts';

/**
 * Export data array to an Excel file (.xlsx)
 */
export function exportToExcel(data: Record<string, any>[], fileName: string, sheetName: string = 'Report') {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}

/**
 * Export multi-sheet Excel file (e.g. for comprehensive management report)
 */
export function exportMultiSheetExcel(sheets: { name: string; data: Record<string, any>[] }[], fileName: string) {
  const workbook = XLSX.utils.book_new();
  sheets.forEach(sheet => {
    const worksheet = XLSX.utils.json_to_sheet(sheet.data);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
  });
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}

/**
 * Trigger browser print for printable elements (Invoices, Folios, Reports)
 */
export function printInvoiceDocument() {
  window.print();
}
