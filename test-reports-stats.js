const db = require("./server/db");

async function testReportStats() {
  try {
    // Check REPORT CREATION logs
    const logs = await db.query(
      "SELECT * FROM AuditLog WHERE operationPerformed = 'REPORT CREATION' ORDER BY timeStamp DESC LIMIT 5"
    );

    console.log("\n=== Recent REPORT CREATION Logs ===");
    console.log("Total count:", logs.length);
    logs.forEach((log, i) => {
      console.log(`\n${i + 1}. Log ID ${log.logID}:`);
      console.log("   Timestamp:", log.timeStamp);
      console.log("   Admin ID:", log.adminID);
      console.log("   Details:", log.actionDetails);
    });

    // Check today's count
    const today = new Date().toISOString().split("T")[0];
    const todayLogs = logs.filter((log) => {
      const logDate = new Date(log.timeStamp).toISOString().split("T")[0];
      return logDate === today;
    });
    console.log("\n=== Stats ===");
    console.log("Today's date:", today);
    console.log("Reports today:", todayLogs.length);

    // Check FlaggedContent for user flags
    const userFlags = await db.query(
      "SELECT COUNT(*) as count FROM FlaggedContent WHERE flaggedBy IS NOT NULL"
    );
    console.log("\n=== FlaggedContent Check ===");
    console.log("Content flagged BY USERS:", userFlags[0].count);

    process.exit(0);
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

testReportStats();
