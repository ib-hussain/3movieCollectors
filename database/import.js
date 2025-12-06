const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const db = require("../server/db");

/**
 * Import movies from CSV into MySQL database
 */

async function importMovies() {
  console.log("\n═══════════════════════════════════════════════════════");
  console.log("📥 Importing Movies from CSV to Database");
  console.log("═══════════════════════════════════════════════════════\n");

  const csvPath = path.join(__dirname, "../data/movies.csv");

  // Check if CSV file exists
  if (!fs.existsSync(csvPath)) {
    console.error("❌ CSV file not found!");
    console.error(`   Expected: ${csvPath}`);
    console.error("\n   Please run: python scrape_tmdb.py <number>\n");
    process.exit(1);
  }

  try {
    const movies = [];

    // Read CSV file
    await new Promise((resolve, reject) => {
      fs.createReadStream(csvPath)
        .pipe(csv())
        .on("data", (row) => movies.push(row))
        .on("end", resolve)
        .on("error", reject);
    });

    console.log(`Found ${movies.length} movies in CSV\n`);

    let imported = 0;
    let skipped = 0;
    let errors = 0;

    // Import each movie
    for (const movie of movies) {
      try {
        // Check if movie already exists
        const existing = await db.query(
          "SELECT movieID FROM Movie WHERE title = ? AND releaseYear = ?",
          [movie.title, movie.release_year]
        );

        if (existing.length > 0) {
          console.log(`⊘ Skipped (duplicate): ${movie.title}`);
          skipped++;
          continue;
        }

        // Insert movie
        const result = await db.query(
          `INSERT INTO Movie (title, synopsis, director, releaseYear, posterImg, avgRating)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            movie.title,
            movie.synopsis || "",
            movie.director || "",
            movie.release_year || 0,
            movie.poster || "movie_posters/default.png",
            movie.rating || 0.0,
          ]
        );

        const movieID = result.insertId;

        // Insert cast members
        if (movie.cast) {
          const castMembers = movie.cast.split(",").map((c) => c.trim());
          for (const member of castMembers) {
            if (member) {
              await db.query(
                "INSERT INTO MovieCast (movieID, castMember) VALUES (?, ?)",
                [movieID, member]
              );
            }
          }
        }

        // Insert genres
        if (movie.genres) {
          const genreNames = movie.genres.split(",").map((g) => g.trim());
          for (const genreName of genreNames) {
            if (genreName) {
              // Get or create genre
              let [genre] = await db.query(
                "SELECT genreID FROM Genres WHERE genreName = ?",
                [genreName]
              );

              let genreID;
              if (genre) {
                genreID = genre.genreID;
              } else {
                const genreResult = await db.query(
                  "INSERT INTO Genres (genreName) VALUES (?)",
                  [genreName]
                );
                genreID = genreResult.insertId;
              }

              // Link movie to genre
              await db.query(
                "INSERT INTO MovieGenres (movieID, genreID) VALUES (?, ?)",
                [movieID, genreID]
              );
            }
          }
        }

        console.log(`✓ Imported: ${movie.title} (${movie.release_year})`);
        imported++;
      } catch (err) {
        console.error(`✗ Error importing ${movie.title}: ${err.message}`);
        errors++;
      }
    }

    console.log("\n═══════════════════════════════════════════════════════");
    console.log("✅ Import Complete!");
    console.log("═══════════════════════════════════════════════════════");
    console.log(`   Imported: ${imported} movies`);
    console.log(`   Skipped:  ${skipped} duplicates`);
    console.log(`   Errors:   ${errors}`);
    console.log("═══════════════════════════════════════════════════════\n");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Import failed:", error.message);
    process.exit(1);
  }
}

importMovies();
