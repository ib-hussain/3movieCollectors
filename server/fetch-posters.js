/**
 * Fetch Movie Posters from TMDB
 * Updates movies with white.png to have actual poster images
 */

const mysql = require("mysql2/promise");
const https = require("https");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";
const POSTER_DIR = path.join(__dirname, "..", "pictures", "movie_posters");

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      })
      .on("error", reject);
  });
}

function downloadImage(imageUrl, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https
      .get(imageUrl, (response) => {
        response.pipe(file);
        file.on("finish", () => {
          file.close();
          resolve();
        });
      })
      .on("error", (err) => {
        fs.unlink(filepath, () => {});
        reject(err);
      });
  });
}

async function searchMovie(title, year) {
  try {
    const query = encodeURIComponent(title);
    const url = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${query}&year=${year}`;
    
    const data = await httpsGet(url);
    
    if (data.results && data.results.length > 0) {
      return data.results[0]; // Return first match
    }
    return null;
  } catch (error) {
    console.error(`Error searching for ${title}:`, error.message);
    return null;
  }
}

async function updateMoviePosters() {
  let connection;
  try {
    console.log("Connecting to database...");
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "3movieCollectors",
    });

    console.log("Connected! Fetching movies with white.png posters...\n");

    // Get all movies with white.png posters
    const movies = await connection.query(
      "SELECT movieID, title, releaseYear FROM Movie WHERE posterImg = 'movie_posters/white.png'"
    );

    if (movies.length === 0) {
      console.log("✅ No movies need poster updates!");
      return;
    }

    console.log(`Found ${movies.length} movies to update\n`);

    for (const movie of movies) {
      try {
        console.log(`🔍 Searching for: ${movie.title} (${movie.releaseYear})`);

        // Search TMDB for the movie
        const tmdbMovie = await searchMovie(movie.title, movie.releaseYear);

        if (!tmdbMovie || !tmdbMovie.poster_path) {
          console.log(`   ⚠️  No poster found on TMDB, keeping white.png\n`);
          continue;
        }

        // Download poster image
        const posterUrl = `${TMDB_IMAGE_BASE}${tmdbMovie.poster_path}`;
        const filename = `${tmdbMovie.id}.jpg`;

        console.log(`   📥 Downloading poster...`);
        await downloadImage(posterUrl, path.join(POSTER_DIR, filename));

        // Update database
        await connection.query(
          "UPDATE Movie SET posterImg = ? WHERE movieID = ?",
          [`movie_posters/${filename}`, movie.movieID]
        );

        console.log(`   ✅ Updated poster to ${filename}\n`);

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 250));
      } catch (error) {
        console.error(`   ❌ Error updating ${movie.title}:`, error.message);
        console.log();
      }
    }

    console.log("\n🎉 Poster update complete!");
  } catch (error) {
    console.error("Database error:", error);
  } finally {
    if (connection) {
      await connection.end();
      console.log("\nDatabase connection closed.");
    }
  }
}

// Run the update
updateMoviePosters();
