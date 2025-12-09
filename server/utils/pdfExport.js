/**
 * PDF Export Utility
 * Generates PDF reports using PDFKit
 */

const PDFDocument = require("pdfkit");

/**
 * Generate a basic PDF document with header and footer
 * @param {Object} options - PDF options {title, subtitle, author}
 * @returns {PDFDocument} PDF document instance
 */
function createPDFDocument(options = {}) {
  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 50, bottom: 50, left: 50, right: 50 },
    info: {
      Title: options.title || "3movieCollectors Admin Report",
      Author: options.author || "3movieCollectors Admin",
      Subject: options.subtitle || "Administrative Report",
      CreationDate: new Date(),
    },
  });

  return doc;
}

/**
 * Add header to PDF
 * @param {PDFDocument} doc - PDF document
 * @param {string} title - Report title
 * @param {string} subtitle - Report subtitle
 */
function addHeader(doc, title, subtitle = "") {
  doc
    .fontSize(20)
    .font("Helvetica-Bold")
    .text("🎬 3movieCollectors", { align: "center" });

  doc.moveDown(0.5);

  doc.fontSize(16).font("Helvetica-Bold").text(title, { align: "center" });

  if (subtitle) {
    doc.fontSize(10).font("Helvetica").text(subtitle, { align: "center" });
  }

  doc.moveDown(1);
  doc
    .strokeColor("#cccccc")
    .lineWidth(1)
    .moveTo(50, doc.y)
    .lineTo(545, doc.y)
    .stroke();

  doc.moveDown(1);
}

/**
 * Add footer to PDF
 * @param {PDFDocument} doc - PDF document
 */
function addFooter(doc) {
  const pageCount = doc.bufferedPageRange().count;

  for (let i = 0; i < pageCount; i++) {
    doc.switchToPage(i);

    doc
      .fontSize(8)
      .font("Helvetica")
      .text(
        `Generated: ${new Date().toLocaleString()} | Page ${
          i + 1
        } of ${pageCount}`,
        50,
        doc.page.height - 50,
        { align: "center", lineBreak: false }
      );
  }
}

/**
 * Add table to PDF
 * @param {PDFDocument} doc - PDF document
 * @param {Array} data - Array of row data
 * @param {Array} columns - Column definitions {key, label, width}
 */
function addTable(doc, data, columns) {
  const tableTop = doc.y;
  const tableWidth = 495; // Page width - margins
  let currentY = tableTop;

  // Calculate column widths if not specified
  const totalWidth = columns.reduce((sum, col) => sum + (col.width || 100), 0);
  const scale = tableWidth / totalWidth;

  columns.forEach((col) => {
    if (!col.width) col.width = 100;
    col.width = col.width * scale;
  });

  // Draw header
  doc.fontSize(10).font("Helvetica-Bold");
  let currentX = 50;

  columns.forEach((col) => {
    doc.text(col.label, currentX, currentY, {
      width: col.width,
      align: col.align || "left",
      continued: false,
    });
    currentX += col.width;
  });

  currentY += 20;

  // Draw header line
  doc
    .strokeColor("#000000")
    .lineWidth(1)
    .moveTo(50, currentY)
    .lineTo(545, currentY)
    .stroke();

  currentY += 5;

  // Draw data rows
  doc.fontSize(9).font("Helvetica");

  data.forEach((row, rowIndex) => {
    // Check if we need a new page
    if (currentY > 700) {
      doc.addPage();
      currentY = 50;

      // Redraw header on new page
      doc.fontSize(10).font("Helvetica-Bold");
      currentX = 50;
      columns.forEach((col) => {
        doc.text(col.label, currentX, currentY, {
          width: col.width,
          align: col.align || "left",
          continued: false,
        });
        currentX += col.width;
      });
      currentY += 20;
      doc
        .strokeColor("#000000")
        .lineWidth(1)
        .moveTo(50, currentY)
        .lineTo(545, currentY)
        .stroke();
      currentY += 5;
      doc.fontSize(9).font("Helvetica");
    }

    currentX = 50;
    const rowHeight = 15;

    columns.forEach((col) => {
      const value = formatPDFValue(row[col.key]);
      doc.text(value, currentX, currentY, {
        width: col.width,
        height: rowHeight,
        align: col.align || "left",
        ellipsis: true,
        continued: false,
      });
      currentX += col.width;
    });

    currentY += rowHeight;

    // Draw row separator (lighter)
    if (rowIndex < data.length - 1) {
      doc
        .strokeColor("#eeeeee")
        .lineWidth(0.5)
        .moveTo(50, currentY)
        .lineTo(545, currentY)
        .stroke();
      currentY += 2;
    }
  });

  doc.moveDown(2);
}

/**
 * Format value for PDF display
 * @param {*} value - Value to format
 * @returns {string} Formatted value
 */
function formatPDFValue(value) {
  if (value === null || value === undefined) {
    return "-";
  }

  if (value instanceof Date) {
    return value.toLocaleString();
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch (e) {
      return String(value);
    }
  }

  const str = String(value);
  return str.length > 50 ? str.substring(0, 47) + "..." : str;
}

/**
 * Generate PDF for audit log
 * @param {Array} auditLogs - Array of audit log entries
 * @param {Object} filters - Applied filters
 * @returns {PDFDocument} PDF document
 */
function generateAuditLogPDF(auditLogs, filters = {}) {
  const doc = createPDFDocument({
    title: "Audit Log Report",
    subtitle: "Administrative Actions Log",
  });

  addHeader(doc, "Audit Log Report", `Total Entries: ${auditLogs.length}`);

  // Add filter information
  if (Object.keys(filters).length > 0) {
    doc.fontSize(10).font("Helvetica-Bold").text("Applied Filters:");
    doc.fontSize(9).font("Helvetica");

    if (filters.operation) doc.text(`  • Operation: ${filters.operation}`);
    if (filters.tableName) doc.text(`  • Table: ${filters.tableName}`);
    if (filters.startDate)
      doc.text(
        `  • Start Date: ${new Date(filters.startDate).toLocaleDateString()}`
      );
    if (filters.endDate)
      doc.text(
        `  • End Date: ${new Date(filters.endDate).toLocaleDateString()}`
      );

    doc.moveDown(1);
  }

  // Add table
  const columns = [
    { key: "timeStamp", label: "Date/Time", width: 90 },
    { key: "username", label: "Admin", width: 70 },
    { key: "operationPerformed", label: "Operation", width: 60 },
    { key: "targetTable", label: "Table", width: 80 },
    { key: "targetRecordID", label: "Record", width: 50 },
    { key: "actionDetails", label: "Details", width: 145 },
  ];

  addTable(doc, auditLogs, columns);

  addFooter(doc);

  return doc;
}

/**
 * Generate PDF for user activity report
 * @param {Array} users - Array of user activity data
 * @returns {PDFDocument} PDF document
 */
function generateUserActivityPDF(users) {
  const doc = createPDFDocument({
    title: "User Activity Report",
    subtitle: "User Engagement Statistics",
  });

  addHeader(doc, "User Activity Report", `Total Users: ${users.length}`);

  const columns = [
    { key: "username", label: "Username", width: 100 },
    { key: "email", label: "Email", width: 120 },
    { key: "postCount", label: "Posts", width: 50, align: "right" },
    { key: "reviewCount", label: "Reviews", width: 50, align: "right" },
    { key: "commentCount", label: "Comments", width: 60, align: "right" },
    { key: "activityScore", label: "Score", width: 50, align: "right" },
    { key: "violationCount", label: "Violations", width: 65, align: "right" },
  ];

  addTable(doc, users, columns);

  addFooter(doc);

  return doc;
}

/**
 * Generate PDF for flagged content report
 * @param {Array} flags - Array of flagged content
 * @returns {PDFDocument} PDF document
 */
function generateFlaggedContentPDF(flags) {
  const doc = createPDFDocument({
    title: "Flagged Content Report",
    subtitle: "Content Moderation Queue",
  });

  addHeader(
    doc,
    "Flagged Content Report",
    `Total Flagged Items: ${flags.length}`
  );

  const columns = [
    { key: "contentType", label: "Type", width: 60 },
    { key: "flagReason", label: "Reason", width: 100 },
    { key: "flaggedDate", label: "Date", width: 90 },
    { key: "flaggerUsername", label: "Flagged By", width: 80 },
    { key: "status", label: "Status", width: 60 },
    { key: "contentPreview", label: "Preview", width: 105 },
  ];

  addTable(doc, flags, columns);

  addFooter(doc);

  return doc;
}

/**
 * Generate PDF for security events
 * @param {Array} events - Array of security events
 * @returns {PDFDocument} PDF document
 */
function generateSecurityEventsPDF(events) {
  const doc = createPDFDocument({
    title: "Security Events Report",
    subtitle: "Security Incidents and Authentication Logs",
  });

  addHeader(doc, "Security Events Report", `Total Events: ${events.length}`);

  const columns = [
    { key: "eventDate", label: "Date/Time", width: 90 },
    { key: "eventType", label: "Event Type", width: 100 },
    { key: "username", label: "User", width: 80 },
    { key: "ipAddress", label: "IP Address", width: 90 },
    { key: "eventDetails", label: "Details", width: 135 },
  ];

  addTable(doc, events, columns);

  addFooter(doc);

  return doc;
}

module.exports = {
  createPDFDocument,
  addHeader,
  addFooter,
  addTable,
  generateAuditLogPDF,
  generateUserActivityPDF,
  generateFlaggedContentPDF,
  generateSecurityEventsPDF,
  formatPDFValue,
};
