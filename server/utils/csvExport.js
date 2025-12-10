/**
 * CSV Export Utility
 * Generates CSV files from data arrays
 */

/**
 * Convert array of objects to CSV string
 * @param {Array} data - Array of objects to convert
 * @param {Array} columns - Optional array of column definitions {key, label}
 * @returns {string} CSV string
 */
function generateCSV(data, columns = null) {
  if (!data || data.length === 0) {
    return "";
  }

  // If no columns specified, use all keys from first object
  if (!columns) {
    const firstRow = data[0];
    columns = Object.keys(firstRow).map((key) => ({
      key,
      label: key.charAt(0).toUpperCase() + key.slice(1),
    }));
  }

  // Generate header row
  const headers = columns.map((col) => escapeCSV(col.label)).join(",");

  // Generate data rows
  const rows = data.map((row) => {
    return columns
      .map((col) => {
        const value = row[col.key];
        return escapeCSV(formatValue(value));
      })
      .join(",");
  });

  return [headers, ...rows].join("\n");
}

/**
 * Escape CSV value (handle commas, quotes, newlines)
 * @param {*} value - Value to escape
 * @returns {string} Escaped value
 */
function escapeCSV(value) {
  if (value === null || value === undefined) {
    return "";
  }

  const stringValue = String(value);

  // If contains comma, quote, or newline, wrap in quotes and escape existing quotes
  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n")
  ) {
    return '"' + stringValue.replace(/"/g, '""') + '"';
  }

  return stringValue;
}

/**
 * Format value for CSV (dates, booleans, etc.)
 * @param {*} value - Value to format
 * @returns {string} Formatted value
 */
function formatValue(value) {
  if (value === null || value === undefined) {
    return "";
  }

  // Format dates
  if (value instanceof Date) {
    return value.toISOString();
  }

  // Format booleans
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  // Handle objects (convert to JSON string)
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch (e) {
      return String(value);
    }
  }

  return String(value);
}

/**
 * Generate CSV for audit log entries
 * @param {Array} auditLogs - Array of audit log objects
 * @returns {string} CSV string
 */
function generateAuditLogCSV(auditLogs) {
  const columns = [
    { key: "logID", label: "Log ID" },
    { key: "timeStamp", label: "Date/Time" },
    { key: "username", label: "Admin User" },
    { key: "operationPerformed", label: "Operation" },
    { key: "targetTable", label: "Table" },
    { key: "targetRecordID", label: "Record ID" },
    { key: "actionDetails", label: "Details" },
    { key: "ipAddress", label: "IP Address" },
  ];

  return generateCSV(auditLogs, columns);
}

/**
 * Generate CSV for flagged content
 * @param {Array} flags - Array of flagged content objects
 * @returns {string} CSV string
 */
function generateFlaggedContentCSV(flags) {
  const columns = [
    { key: "flagID", label: "Flag ID" },
    { key: "contentType", label: "Content Type" },
    { key: "contentID", label: "Content ID" },
    { key: "matchedWord", label: "Matched Word" },
    { key: "flaggedDate", label: "Flagged Date" },
    { key: "flaggerUsername", label: "Flagged By" },
    { key: "status", label: "Status" },
    { key: "contentPreview", label: "Content Preview" },
  ];

  return generateCSV(flags, columns);
}

/**
 * Generate CSV for user activity report
 * @param {Array} users - Array of user activity objects
 * @returns {string} CSV string
 */
function generateUserActivityCSV(users) {
  const columns = [
    { key: "userID", label: "User ID" },
    { key: "username", label: "Username" },
    { key: "email", label: "Email" },
    { key: "registrationDate", label: "Registered" },
    { key: "postCount", label: "Posts" },
    { key: "reviewCount", label: "Reviews" },
    { key: "commentCount", label: "Comments" },
    { key: "violationCount", label: "Violations" },
  ];

  return generateCSV(users, columns);
}

/**
 * Generate CSV for security events
 * @param {Array} events - Array of security event objects
 * @returns {string} CSV string
 */
function generateSecurityEventsCSV(events) {
  const columns = [
    { key: "eventID", label: "Event ID" },
    { key: "eventType", label: "Event Type" },
    { key: "eventDate", label: "Date/Time" },
    { key: "userID", label: "User ID" },
    { key: "username", label: "Username" },
    { key: "ipAddress", label: "IP Address" },
    { key: "userAgent", label: "User Agent" },
    { key: "eventDetails", label: "Details" },
  ];

  return generateCSV(events, columns);
}

/**
 * Generate CSV for movie statistics
 * @param {Array} movies - Array of movie objects
 * @returns {string} CSV string
 */
function generateMovieStatsCSV(movies) {
  const columns = [
    { key: "movieID", label: "Movie ID" },
    { key: "title", label: "Title" },
    { key: "releaseYear", label: "Year" },
    { key: "director", label: "Director" },
    { key: "viewCount", label: "Views" },
    { key: "avgRating", label: "Avg Rating" },
    { key: "reviewCount", label: "Reviews" },
    { key: "postCount", label: "Forum Posts" },
  ];

  return generateCSV(movies, columns);
}

module.exports = {
  generateCSV,
  generateAuditLogCSV,
  generateFlaggedContentCSV,
  generateUserActivityCSV,
  generateSecurityEventsCSV,
  generateMovieStatsCSV,
  escapeCSV,
  formatValue,
};
