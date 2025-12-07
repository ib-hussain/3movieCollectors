// Script to remove all overlapping event participations from the database
require("dotenv").config({ path: "../.env" });
const db = require("./db");

async function cleanupOverlappingEvents() {
  try {
    console.log("Starting cleanup of overlapping events...\n");

    // Get all users and their events (hosting + participating)
    const userEvents = await db.query(`
      SELECT DISTINCT
        u.userID,
        u.name,
        e.eventID,
        e.eventTitle,
        e.eventDateTime,
        e.duration,
        DATE_ADD(e.eventDateTime, INTERVAL e.duration MINUTE) as eventEndTime,
        CASE WHEN e.host = u.userID THEN 'host' ELSE 'participant' END as role
      FROM User u
      LEFT JOIN WatchEvent e ON e.host = u.userID
      LEFT JOIN EventParticipants ep ON ep.userID = u.userID AND ep.eventID = e.eventID
      WHERE e.eventID IS NOT NULL OR ep.eventID IS NOT NULL
      ORDER BY u.userID, e.eventDateTime
    `);

    console.log(`Found ${userEvents.length} user-event associations\n`);

    // Group by user
    const userEventMap = {};
    for (const ue of userEvents) {
      if (!userEventMap[ue.userID]) {
        userEventMap[ue.userID] = [];
      }
      userEventMap[ue.userID].push(ue);
    }

    let totalRemoved = 0;

    // For each user, find and remove overlapping participations
    for (const [userId, events] of Object.entries(userEventMap)) {
      console.log(`Checking user ${events[0].name} (ID: ${userId})...`);

      for (let i = 0; i < events.length; i++) {
        for (let j = i + 1; j < events.length; j++) {
          const event1 = events[i];
          const event2 = events[j];

          const e1Start = new Date(event1.eventDateTime);
          const e1End = new Date(event1.eventEndTime);
          const e2Start = new Date(event2.eventDateTime);
          const e2End = new Date(event2.eventEndTime);

          // Check for overlap (strict - events that touch at endpoints don't overlap)
          const overlaps =
            (e2Start > e1Start && e2Start < e1End) ||
            (e2End > e1Start && e2End < e1End) ||
            (e2Start < e1Start && e2End > e1End);

          if (overlaps) {
            console.log(`  ⚠️  Overlap found:`);
            console.log(
              `     Event ${event1.eventID} (${event1.eventTitle}): ${event1.eventDateTime} - ${event1.eventEndTime} [${event1.role}]`
            );
            console.log(
              `     Event ${event2.eventID} (${event2.eventTitle}): ${event2.eventDateTime} - ${event2.eventEndTime} [${event2.role}]`
            );

            // Keep the earlier event, remove participation in later event (if participant)
            // If user is host of both, delete the later event entirely
            if (event2.role === "participant") {
              await db.query(
                "DELETE FROM EventParticipants WHERE eventID = ? AND userID = ?",
                [event2.eventID, userId]
              );
              console.log(
                `     ✓ Removed participation in event ${event2.eventID}`
              );
              totalRemoved++;
            } else if (event1.role === "host" && event2.role === "host") {
              // User is hosting both overlapping events - delete the later one
              await db.query("DELETE FROM WatchEvent WHERE eventID = ?", [
                event2.eventID,
              ]);
              console.log(
                `     ✓ Deleted event ${event2.eventID} (user was hosting both)`
              );
              totalRemoved++;
              // Remove from the events array so we don't try to process it again
              events.splice(j, 1);
              j--;
            } else {
              console.log(
                `     ⚠️  Cannot remove - user is host of event ${event2.eventID}`
              );
            }
          }
        }
      }
    }

    console.log(
      `\n✓ Cleanup complete. Removed ${totalRemoved} overlapping participations.`
    );
    process.exit(0);
  } catch (error) {
    console.error("Error during cleanup:", error);
    process.exit(1);
  }
}

cleanupOverlappingEvents();
