# Feature 3: TMDB Data Ingestion Pipeline - Testing Guide

## What Was Implemented

✅ Modified `scrape_tmdb.py` to save ONLY to CSV (no database creation)
✅ Created `database/import.js` to import CSV movies into MySQL
✅ Added `csv-parser` dependency for CSV reading
✅ Added `npm run db:import` script
✅ Complete pipeline: TMDB API → CSV → MySQL Database

## Prerequisites

- Python 3 installed
- `requests` library for Python (`pip install requests`)
- Node.js packages installed (`npm install`)
- Database setup completed (Feature 2)

## Pipeline Overview

```
TMDB API → scrape_tmdb.py → data/movies.csv → import.js → MySQL Database
```

## Testing Instructions

### Step 1: Install Python Dependencies

Make sure you have the `requests` library:

```cmd
pip install requests
```

### Step 2: Install Node.js Dependencies

Install the new csv-parser package:

```cmd
cd "d:\University Semesters\5th Semester\DB Lab\Project\3movieCollectors"
npm install
```

### Step 3: Scrape Movies from TMDB

Run the Python scraper to fetch movies and save to CSV:

```cmd
python scrape_tmdb.py 20
```

**Expected Output:**

```
═══════════════════════════════════════════════════════
🎬 TMDB Movie Scraper for 3movieCollectors
═══════════════════════════════════════════════════════

Fetching 20 movies from TMDB (page 1)...

✓ Added: Movie Title 1 (2024)
✓ Added: Movie Title 2 (2023)
... (20 movies)

═══════════════════════════════════════════════════════
✅ Successfully scraped 20 movies!
📁 Data saved to: data/movies.csv
🖼️  Posters saved to: pictures/movie_posters
═══════════════════════════════════════════════════════

Next step: Run 'npm run db:import' to load movies into database
```

**What happens:**

- Fetches 20 popular movies from TMDB
- Downloads movie posters to `pictures/movie_posters/`
- Saves all data to `data/movies.csv`
- Does NOT create any database

### Step 4: Verify CSV File

Check that the CSV was created:

```cmd
dir data\movies.csv
```

You can also open `data/movies.csv` in a text editor or Excel to see the movie data.

### Step 5: Import Movies into Database

Run the import script to load CSV data into MySQL:

```cmd
npm run db:import
```

**Expected Output:**

```
═══════════════════════════════════════════════════════
📥 Importing Movies from CSV to Database
═══════════════════════════════════════════════════════

Found 20 movies in CSV

✓ Imported: Movie Title 1 (2024)
✓ Imported: Movie Title 2 (2023)
... (20 movies)

═══════════════════════════════════════════════════════
✅ Import Complete!
═══════════════════════════════════════════════════════
   Imported: 20 movies
   Skipped:  0 duplicates
   Errors:   0
═══════════════════════════════════════════════════════
```

**What happens:**

- Reads `data/movies.csv`
- Inserts movies into `Movie` table
- Inserts cast members into `MovieCast` table
- Creates genres in `Genres` table (if new)
- Links movies to genres in `MovieGenres` table
- Skips duplicates automatically

### Step 6: Verify Database

Check that movies were imported:

```cmd
npm run db:verify
```

You should see row counts showing movies in:

- `Movie` table (20+ rows)
- `MovieCast` table (100+ rows)
- `Genres` table (10+ rows)
- `MovieGenres` table (20+ rows)

### Step 7: Optional - Add More Movies

You can scrape more movies from different pages:

```cmd
python scrape_tmdb.py 10 2
```

This fetches 10 movies from page 2. Then import again:

```cmd
npm run db:import
```

The import script will skip duplicates automatically.

## Testing Checklist

Please confirm the following:

- [ ] **Python Script Runs:** `python scrape_tmdb.py 20` completes successfully
- [ ] **CSV Created:** `data/movies.csv` file exists with movie data
- [ ] **Posters Downloaded:** Images appear in `pictures/movie_posters/`
- [ ] **Import Succeeds:** `npm run db:import` completes without errors
- [ ] **Movies in Database:** `npm run db:verify` shows movies in database
- [ ] **Duplicates Handled:** Running import twice skips duplicates

## Troubleshooting

### Error: "No module named 'requests'"

Install Python requests library:

```cmd
pip install requests
```

### Error: "CSV file not found"

Make sure you run `python scrape_tmdb.py 20` before `npm run db:import`

### Error: "Cannot find module 'csv-parser'"

Install Node.js dependencies:

```cmd
npm install
```

### Error: "Unknown column 'movieID'"

Make sure you ran `npm run db:setup` first to create all tables

### Movies Appearing as Duplicates

This is normal! The import script checks for existing movies by title and year.
If a movie already exists, it will be skipped.

## CSV File Structure

The CSV file contains these columns:

- `tmdb_id` - TMDB movie ID
- `title` - Movie title
- `director` - Director name
- `cast` - Comma-separated cast members
- `synopsis` - Movie plot summary
- `poster` - Path to poster image
- `release_year` - Release year
- `genres` - Comma-separated genres
- `runtime` - Runtime in minutes
- `rating` - TMDB rating (0-10)

## What's Next?

Once Feature 3 is confirmed working, we'll move to:

- **Feature 4:** Authentication System (signup/login)

---

**Please test all steps and confirm:**

1. Does `python scrape_tmdb.py 20` work?
2. Is the CSV file created with movie data?
3. Does `npm run db:import` successfully import movies?
4. Does `npm run db:verify` show movies in the database?

Let me know once you've tested! 🎬
