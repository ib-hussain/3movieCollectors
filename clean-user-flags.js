const db = require("./server/db");

async function cleanUserFlags() {
  try {
    console.log("\n=== Checking for User-Flagged Content ===");

    // Check existing user flags
    const userFlags = await db.query(
      "SELECT * FROM FlaggedContent WHERE flaggedBy IS NOT NULL"
    );

    console.log(`Found ${userFlags.length} content items flagged by users:`);
    userFlags.forEach((flag, i) => {
      console.log(`\n${i + 1}. Flag ID ${flag.flagID}:`);
      console.log("   Content Type:", flag.contentType);
      console.log("   Content ID:", flag.contentID);
      console.log("   Flagged By User:", flag.flaggedBy);
      console.log("   Status:", flag.status);
      console.log("   Matched Word:", flag.matchedWord || "N/A");
    });

    if (userFlags.length > 0) {
      console.log("\n=== Cleaning User Flags ===");
      console.log(
        "Since only SYSTEM flagging is allowed, setting flaggedBy to NULL for all records..."
      );

      const result = await db.query(
        "UPDATE FlaggedContent SET flaggedBy = NULL WHERE flaggedBy IS NOT NULL"
      );

      console.log(`✓ Updated ${result.affectedRows} records`);
      console.log("All flaggedBy fields are now NULL (system-only flagging)");
    } else {
      console.log("\n✓ No user flags found. System is already clean.");
    }

    // Verify
    const check = await db.query(
      "SELECT COUNT(*) as count FROM FlaggedContent WHERE flaggedBy IS NOT NULL"
    );
    console.log(
      `\nFinal check: ${check[0].count} user-flagged items remaining`
    );

    process.exit(0);
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

cleanUserFlags();
