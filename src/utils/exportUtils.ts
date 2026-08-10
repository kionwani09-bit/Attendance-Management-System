import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AttendanceRecord, SavedReport } from '../types';

export function exportToExcel(
  records: AttendanceRecord[],
  fileName = 'Attendance_Report.xlsx',
  sheetName = 'Attendance'
) {
  const formattedData = records.map((r) => ({
    Date: r.date,
    'Employee ID': r.employeeId,
    Name: r.employeeName,
    Department: r.department,
    Status: r.status,
    'Check-in Time': r.checkInTime || '-',
    Notes: r.notes || '-',
  }));

  const worksheet = XLSX.utils.json_to_sheet(formattedData);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 12 }, // Date
    { wch: 14 }, // Employee ID
    { wch: 22 }, // Name
    { wch: 20 }, // Department
    { wch: 12 }, // Status
    { wch: 15 }, // Check-in Time
    { wch: 25 }, // Notes
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, fileName);
}

export function exportToPDF(
  records: AttendanceRecord[],
  title = 'Attendance Management Report',
  subTitle = ''
) {
  const doc = new jsPDF();

  // Header Title
  doc.setFontSize(18);
  doc.setTextColor(30, 41, 59); // Slate-800
  doc.text(title, 14, 20);

  if (subTitle) {
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // Slate-500
    doc.text(subTitle, 14, 26);
  }

  // Summary counts
  const present = records.filter((r) => r.status === 'Present').length;
  const absent = records.filter((r) => r.status === 'Absent').length;
  const leave = records.filter((r) => r.status === 'Leave').length;
  const late = records.filter((r) => r.status === 'Late').length;
  const total = records.length;
  const rate = total > 0 ? ((present + late * 0.5) / total) * 100 : 0;

  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  doc.text(
    `Total Records: ${total}   |   Present: ${present}   |   Absent: ${absent}   |   Leave: ${leave}   |   Late: ${late}   |   Rate: ${rate.toFixed(1)}%`,
    14,
    33
  );

  const tableData = records.map((r) => [
    r.date,
    r.employeeId,
    r.employeeName,
    r.department,
    r.status,
    r.checkInTime || '-',
    r.notes || '-',
  ]);

  autoTable(doc, {
    startY: 38,
    head: [['Date', 'ID / Emp Code', 'Name', 'Department', 'Status', 'Check-In', 'Notes']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42], // Slate 900
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      4: {
        fontStyle: 'bold',
      },
    },
    didParseCell: function (data) {
      if (data.section === 'body' && data.column.index === 4) {
        const val = data.cell.raw;
        if (val === 'Present') {
          data.cell.styles.textColor = [16, 185, 129]; // Emerald
        } else if (val === 'Absent') {
          data.cell.styles.textColor = [239, 68, 68]; // Red
        } else if (val === 'Leave') {
          data.cell.styles.textColor = [245, 158, 11]; // Amber
        } else if (val === 'Late') {
          data.cell.styles.textColor = [139, 92, 246]; // Purple
        }
      }
    },
  });

  doc.save(`${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
}

export function exportToCSV(records: AttendanceRecord[], fileName = 'Attendance_Records.csv') {
  const headers = ['Date', 'Employee ID', 'Name', 'Department', 'Status', 'Check-in Time', 'Notes'];
  const rows = records.map((r) => [
    `"${r.date}"`,
    `"${r.employeeId}"`,
    `"${r.employeeName}"`,
    `"${r.department}"`,
    `"${r.status}"`,
    `"${r.checkInTime || ''}"`,
    `"${r.notes || ''}"`,
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
