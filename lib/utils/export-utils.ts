import * as XLSX from 'xlsx';

/**
 * Export data to an Excel file (.xlsx)
 * @param data Array of objects to export
 * @param filename Name of the file (without extension)
 * @param sheetName Name of the sheet
 */
export function exportToExcel(data: any[], filename: string, sheetName: string = 'Data') {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}
