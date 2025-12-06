"""
TMDB Movie Scraper for 3movieCollectors
Fetches movies from TMDB API and saves to CSV ONLY
Does NOT create its own database - data is imported via Node.js script
"""

import sys
import os
import csv
import requests

# Configuration
API_KEY = "5d603ec4bd433ee159af77e58efdc97d"
CSV_FILE = "data/movies.csv"
POSTER_DIR = "pictures/movie_posters"
TMDB_API = "https://api.themoviedb.org/3"

# Ensure directories exist
os.makedirs(os.path.dirname(CSV_FILE), exist_ok=True)
os.makedirs(POSTER_DIR, exist_ok=True)



def download_poster(url, filename):
    """Download movie poster image"""
    try:
        r = requests.get(url, timeout=10)
        if r.status_code == 200:
            with open(filename, "wb") as f:
                f.write(r.content)
            return True
    except Exception as e:
        print(f"  ⚠ Poster download failed: {e}")
    return False


def fetch_movie_details(movie_id):
    """Fetch detailed movie information from TMDB"""
    try:
        r = requests.get(
            f"{TMDB_API}/movie/{movie_id}",
            params={"api_key": API_KEY, "append_to_response": "credits"},
        )
        return r.json() if r.status_code == 200 else {}
    except Exception as e:
        print(f"  ⚠ Error fetching movie details: {e}")
        return {}


def scrape_movies(n=20, page=1):
    """
    Scrape n movies from TMDB and save to CSV ONLY
    
    Args:
        n: Number of movies to scrape
        page: TMDB page number (1-500)
    """
    print(f"\n{'='*60}")
    print(f"🎬 TMDB Movie Scraper for 3movieCollectors")
    print(f"{'='*60}\n")
    print(f"Fetching {n} movies from TMDB (page {page})...\n")

    try:
        # Fetch popular movies
        r = requests.get(
            f"{TMDB_API}/movie/popular",
            params={"api_key": API_KEY, "language": "en-US", "page": page},
        )
        movies = r.json().get("results", [])[:n]

        if not movies:
            print("❌ No movies found!")
            return

        # Check if CSV exists to determine if we need header
        file_exists = os.path.exists(CSV_FILE)
        
        # Open CSV file for writing
        with open(CSV_FILE, "a", newline="", encoding="utf-8") as csvfile:
            fieldnames = [
                "tmdb_id",
                "title",
                "director",
                "cast",
                "synopsis",
                "poster",
                "release_year",
                "genres",
                "runtime",
                "rating",
            ]
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)

            # Write header only if file is new
            if not file_exists or os.stat(CSV_FILE).st_size == 0:
                writer.writeheader()

            added = 0
            for movie in movies:
                movie_id = str(movie["id"])

                # Fetch detailed information
                details = fetch_movie_details(movie_id)
                if not details:
                    continue

                # Extract director
                director = ""
                crew = details.get("credits", {}).get("crew", [])
                for person in crew:
                    if person.get("job") == "Director":
                        director = person.get("name", "")
                        break

                # Extract cast (top 5)
                cast_list = details.get("credits", {}).get("cast", [])
                cast = ", ".join([actor.get("name", "") for actor in cast_list[:5]])

                # Extract genres
                genres = ", ".join([g.get("name", "") for g in details.get("genres", [])])

                # Extract other details
                year = details.get("release_date", "")[:4] or "Unknown"
                runtime = details.get("runtime", 0)
                synopsis = details.get("overview", "")
                rating = float(details.get("vote_average") or 0.0)

                # Handle poster
                poster_path = details.get("poster_path", "")
                poster_filename = f"{movie_id}.jpg"
                poster_local_path = f"movie_posters/{poster_filename}"

                if poster_path:
                    full_poster_url = f"https://image.tmdb.org/t/p/w500{poster_path}"
                    download_poster(full_poster_url, os.path.join(POSTER_DIR, poster_filename))
                else:
                    poster_local_path = "movie_posters/default.png"

                # Write to CSV
                writer.writerow({
                    "tmdb_id": movie_id,
                    "title": movie.get("title", ""),
                    "director": director,
                    "cast": cast,
                    "synopsis": synopsis,
                    "poster": poster_local_path,
                    "release_year": year,
                    "genres": genres,
                    "runtime": runtime,
                    "rating": rating,
                })

                print(f"✓ Added: {movie.get('title')} ({year})")
                added += 1

        print(f"\n{'='*60}")
        print(f"✅ Successfully scraped {added} movies!")
        print(f"📁 Data saved to: {CSV_FILE}")
        print(f"🖼️  Posters saved to: {POSTER_DIR}")
        print(f"{'='*60}\n")
        print("Next step: Run 'npm run db:import' to load movies into database")
        print()

    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python scrape_tmdb.py <number_of_movies> [page_number]")
        print("Example: python scrape_tmdb.py 20 1")
        sys.exit(1)

    num_movies = int(sys.argv[1])
    page_num = int(sys.argv[2]) if len(sys.argv) > 2 else 1

    scrape_movies(num_movies, page_num)
