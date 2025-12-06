require("dotenv").config();
const mysql = require("mysql2/promise");

(async () => {
  const db = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "8956",
    database: "3movieCollectors",
  });

  console.log("Checking all movies and their posters:");
  const [rows] = await db.query(
    "SELECT movieID, title, releaseYear, posterImg FROM Movie ORDER BY movieID DESC LIMIT 30"
  );

  console.log("Total movies:", rows.length);
  console.log("Movies:");
  rows.forEach((r) =>
    console.log(`${r.movieID}: ${r.title} (${r.releaseYear}) -> ${r.posterImg}`)
  );

  await db.end();
})();
