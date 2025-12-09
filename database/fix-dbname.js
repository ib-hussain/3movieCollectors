// Quick script to replace MovieCommunity with 3movieCollectors in SQL files
const fs = require("fs");
const path = require("path");

const files = [
  "admin_schema.sql",
  "admin_triggers.sql",
  "admin_procedures.sql",
  "admin_functions.sql",
  "admin_privileges.sql",
  "admin_events.sql",
];

files.forEach((file) => {
  const filePath = path.join(__dirname, file);
  let content = fs.readFileSync(filePath, "utf8");
  content = content.replace(/MovieCommunity/g, "3movieCollectors");
  fs.writeFileSync(filePath, content);
  console.log(`✓ Updated ${file}`);
});

console.log("\nAll files updated successfully!");
