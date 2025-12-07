// server/scheduler.js
// MySQL Event Scheduler management
const db = require("./db");

// Helper function to log with timestamp
function log(message) {
  console.log(`${new Date().toISOString()} - [Scheduler] ${message}`);
}

// Check if MySQL Event Scheduler is enabled
async function checkEventScheduler() {
  try {
    const [result] = await db.query("SHOW VARIABLES LIKE 'event_scheduler'");
    return result[0]?.Value === "ON";
  } catch (error) {
    log(`Error checking event scheduler: ${error.message}`);
    return false;
  }
}

// Enable MySQL Event Scheduler
async function enableEventScheduler() {
  try {
    await db.query("SET GLOBAL event_scheduler = ON");
    log("MySQL Event Scheduler enabled");
    return true;
  } catch (error) {
    log(`Error enabling event scheduler: ${error.message}`);
    return false;
  }
}

// Check status of scheduled events
async function checkScheduledEvents() {
  try {
    const [rows] = await db.query(
      `SELECT EVENT_NAME, STATUS, LAST_EXECUTED 
       FROM information_schema.EVENTS 
       WHERE EVENT_SCHEMA = DATABASE()`
    );

    const events = Array.isArray(rows) ? rows : [];

    log(`Found ${events.length} scheduled events:`);
    if (events.length > 0) {
      events.forEach((event) => {
        log(
          `  - ${event.EVENT_NAME}: ${event.STATUS} (Last: ${
            event.LAST_EXECUTED || "Never"
          })`
        );
      });
    } else {
      log(
        "  No scheduled events found. Run event_scheduler.sql to create them."
      );
    }

    return events;
  } catch (error) {
    log(`Error checking scheduled events: ${error.message}`);
    return [];
  }
}

// Start all jobs
async function startScheduler() {
  log("Starting MySQL Event Scheduler...");

  const isEnabled = await checkEventScheduler();

  if (!isEnabled) {
    log("Event Scheduler is OFF, attempting to enable...");
    await enableEventScheduler();
  }

  await checkScheduledEvents();
  log("MySQL Event Scheduler initialized");
}

// Stop all jobs (for graceful shutdown)
async function stopScheduler() {
  log("MySQL Event Scheduler will continue running in database");
  log("To disable events, run: ALTER EVENT <event_name> DISABLE");
}

module.exports = { startScheduler, stopScheduler };
