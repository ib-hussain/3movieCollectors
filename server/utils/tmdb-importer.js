const { spawn } = require("child_process");
const fs = require("fs").promises;
const path = require("path");
const csv = require("csv-parser");
const mysql = require("mysql2/promise");

const dbConfig = {
  host: "localhost",
  user: "root",
  password: "8956",
  database: "3movieCollectors",
};

// Genre name to ID mapping (matches database genres table)
const GENRE_MAP = {
  Action: 7,
  Adventure: 3,
  Animation: 1,
  Comedy: 2,
  Crime: 13,
  Documentary: 18,
  Drama: 10,
  Family: 4,
  Fantasy: 8,
  History: 19,
  Horror: 11,
  Music: 16,
  Mystery: 5,
  Romance: 12,
  "Science Fiction": 6,
  "Sci-Fi": 14,
  Thriller: 9,
  "TV Movie": 20,
  War: 15,
  Western: 17,
};

async function runScraper(numMovies) {
  return new Promise((resolve, reject) => {
    console.log(`\n🎬 Starting TMDB scraper for ${numMovies} movies...\n`);

    // Scraper is now in the project root
    const scraperPath = path.join(__dirname, "..", "..", "scrape_tmdb.py");

    // Use 'py' launcher on Windows instead of 'python'
    const pythonProcess = spawn("py", [scraperPath, numMovies.toString()]);

    let output = "";
    let errorOutput = "";

    pythonProcess.stdout.on("data", (data) => {
      const text = data.toString();
      output += text;
      process.stdout.write(text);
    });

    pythonProcess.stderr.on("data", (data) => {
      errorOutput += data.toString();
      process.stderr.write(data.toString());
    });

    pythonProcess.on("close", (code) => {
      if (code === 0) {
        console.log("\n✓ Scraper completed successfully\n");
        resolve(output);
      } else {
        reject(
          new Error(`Scraper failed with code ${code}. Error: ${errorOutput}`)
        );
      }
    });
  });
}

async function readCSV(csvPath) {
  return new Promise((resolve, reject) => {
    const results = [];
    const stream = require("fs").createReadStream(csvPath);

    stream
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", () => resolve(results))
      .on("error", (error) => reject(error));
  });
}

function parseYearGenre(yearGenreStr) {
  // Format: "2024 | Action/Adventure/Sci-Fi | 2h 28m"
  const parts = yearGenreStr.split("|").map((s) => s.trim());
  const year = parseInt(parts[0]) || new Date().getFullYear();
  const genres = parts[1] ? parts[1].split("/").map((g) => g.trim()) : [];

  return { year, genres };
}

async function importToDatabase(csvData, adminID = 105) {
  const connection = await mysql.createConnection(dbConfig);

  let imported = 0;
  let skipped = 0;
  const errors = [];

  console.log(`\n📥 Importing ${csvData.length} movies to database...\n`);

  // Start transaction for better performance
  await connection.beginTransaction();

  try {
    for (const row of csvData) {
      try {
        const { year, genres } = parseYearGenre(row.year_genre || "");

        // Validate required fields
        if (!row.movie_name || !row.movie_name.trim()) {
          console.log(`  ⊘ Skipped (no title): ${row.movie_id}`);
          skipped++;
          continue;
        }

        // Check if movie already exists (with better indexing)
        const [existing] = await connection.execute(
          `SELECT movieID FROM movie WHERE title = ? AND releaseYear = ? LIMIT 1`,
          [row.movie_name.trim(), year]
        );

        if (existing.length > 0) {
          console.log(`  ⊘ Skipped (duplicate): ${row.movie_name}`);
          skipped++;
          continue;
        }

        // Insert movie with all fields
        const [result] = await connection.execute(
          `INSERT INTO movie (title, releaseYear, director, synopsis, posterImg, viewCount, avgRating) 
           VALUES (?, ?, ?, ?, ?, 0, 0.0)`,
          [
            row.movie_name.trim(),
            year || new Date().getFullYear(),
            row.director?.trim() || "Unknown",
            row.description?.trim() || "",
            row.poster || null,
          ]
        );

        const movieID = result.insertId;

        // Insert genres in batch
        const genreIds = genres
          .map((g) => GENRE_MAP[g.trim()])
          .filter((id) => id !== undefined);

        if (genreIds.length > 0) {
          const genreValues = genreIds.map((genreID) => [movieID, genreID]);
          await connection.query(
            `INSERT IGNORE INTO moviegenres (movieID, genreID) VALUES ?`,
            [genreValues]
          );
          console.log(
            `  ✓ Imported: ${
              row.movie_name
            } (${year}) [ID: ${movieID}] - Genres: ${genres.join(", ")}`
          );
        } else {
          // Default to Drama if no genres mapped
          await connection.execute(
            `INSERT IGNORE INTO moviegenres (movieID, genreID) VALUES (?, 10)`,
            [movieID]
          );
          console.log(
            `  ✓ Imported: ${
              row.movie_name
            } (${year}) [ID: ${movieID}] - No matching genres, defaulted to Drama (from: ${
              genres.join(", ") || "empty"
            })`
          );
        }

        // Log audit (batched at the end would be more efficient, but keeping for tracking)
        await connection.execute(
          `INSERT INTO auditlog (adminID, targetRecordID, targetTable, operationPerformed, timestamp)
           VALUES (?, ?, 'movie', 'INSERT', NOW())`,
          [adminID, movieID]
        );

        imported++;
      } catch (error) {
        const movieTitle = row.movie_name || "Unknown";
        console.error(`  ✗ Error importing "${movieTitle}":`, error.message);
        errors.push({
          title: movieTitle,
          error: error.message,
          code: error.code,
        });
        skipped++;
        // Continue with other movies instead of failing entire batch
      }
    }

    // Commit transaction
    await connection.commit();
    console.log("\n✓ Transaction committed successfully");
  } catch (error) {
    // Rollback on critical failure
    await connection.rollback();
    console.error("\n✗ Transaction rolled back:", error.message);
    throw new Error(`Database transaction failed: ${error.message}`);
  } finally {
    await connection.end();
  }

  return { imported, skipped, errors };
}

async function importMoviesFromTMDB(numMovies, adminID) {
  try {
    // Step 1: Run scraper
    await runScraper(numMovies);

    // Step 2: Read CSV
    const csvPath = path.join(__dirname, "..", "..", "data", "movies.csv");
    console.log(`📄 Reading CSV from: ${csvPath}\n`);
    const csvData = await readCSV(csvPath);
    console.log(`✓ Found ${csvData.length} movies in CSV\n`);

    // Step 3: Import to database
    const result = await importToDatabase(csvData, adminID);

    console.log("\n" + "=".repeat(60));
    console.log("📊 IMPORT SUMMARY");
    console.log("=".repeat(60));
    console.log(`✓ Successfully imported: ${result.imported}`);
    console.log(`⊘ Skipped (duplicates):  ${result.skipped}`);
    if (result.errors.length > 0) {
      console.log(`✗ Errors:                ${result.errors.length}`);
    }
    console.log("=".repeat(60) + "\n");

    return result;
  } catch (error) {
    console.error("\n❌ Import failed:", error.message);
    throw error;
  }
}

module.exports = { importMoviesFromTMDB };

// CLI usage
if (require.main === module) {
  const numMovies = parseInt(process.argv[2]) || 5;
  const adminID = parseInt(process.argv[3]) || 105;

  console.log("\n" + "=".repeat(60));
  console.log("🎬 TMDB MOVIE IMPORTER");
  console.log("=".repeat(60));
  console.log(`Requesting: ${numMovies} movies`);
  console.log(`Admin ID:   ${adminID}`);
  console.log("=".repeat(60));

  importMoviesFromTMDB(numMovies, adminID)
    .then(() => {
      console.log("\n✅ Import completed successfully!\n");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Import failed:", error);
      process.exit(1);
    });
}
