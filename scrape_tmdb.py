import sys
import os
import csv
import requests

# Force UTF-8 encoding for stdout to handle all Unicode characters
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

# --- CONFIG ---
API_KEY = os.getenv('TMDB_API_KEY', '8c8e1a50c79254661d8bdb8ba6889fd0')
CSV_FILE = 'data/movies.csv'
POSTER_DIR = 'pictures/movie_posters'
TMDB_API = 'https://api.themoviedb.org/3'

os.makedirs(os.path.dirname(CSV_FILE), exist_ok=True)
os.makedirs(POSTER_DIR, exist_ok=True)

# --- Helpers ---
def download_poster(url, filename):
    try:
        r = requests.get(url, timeout=10)
        if r.status_code == 200:
            with open(filename, 'wb') as f:
                f.write(r.content)
            return True
    except Exception as e:
        print(f"Poster download failed: {e}")
    return False

def format_runtime(minutes):
    h = minutes // 60
    m = minutes % 60
    return f"{h}h {m}m" if h else f"{m}m"

def fetch_movie_details(movie_id):
    r = requests.get(f"{TMDB_API}/movie/{movie_id}?api_key={API_KEY}&append_to_response=credits")
    return r.json() if r.status_code == 200 else {}

def scrape_and_upload(n):
    print(f"Scraping {n} movies from TMDB...")
    import random
    
    # Fetch movies from multiple pages if needed (20 per page)
    movies = []
    pages_needed = (n + 19) // 20  # Round up division
    start_page = random.randint(1, max(1, 450 - pages_needed))
    
    print(f"Fetching {pages_needed} page(s) starting from page {start_page}...")
    
    for page_num in range(start_page, start_page + pages_needed):
        r = requests.get(f"{TMDB_API}/movie/popular?api_key={API_KEY}&language=en-US&page={page_num}")
        if r.status_code == 200:
            page_movies = r.json().get('results', [])
            movies.extend(page_movies)
            print(f"  Fetched {len(page_movies)} movies from page {page_num}")
        else:
            print(f"  Error fetching page {page_num}: {r.status_code}")
    
    # Take exactly n movies
    movies = movies[:n]
    print(f"Total movies to process: {len(movies)}\n")

    # Clear existing CSV and write fresh data
    csvfile = open(CSV_FILE, 'w', newline='', encoding='utf-8')
    fieldnames = ['movie_id', 'movie_name', 'director', 'writer', 'stars', 'description', 'poster',
                  'year_genre', 'total_weighted', 'num_ratings']
    csv_writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
    csv_writer.writeheader()

    added = 0
    for movie in movies:
        movie_id = str(movie['id'])

        details = fetch_movie_details(movie_id)
        if not details:
            print(f"Skipped: {movie.get('title', 'Unknown')} (no details)")
            continue

        director = ''
        writer_ = ''
        stars = ''

        crew = details.get('credits', {}).get('crew', [])
        cast = details.get('credits', {}).get('cast', [])

        for person in crew:
            if person['job'] == 'Director':
                director = person['name']
                break
        
        writers = [p['name'] for p in crew if p.get('department') == 'Writing']
        writer_ = ', '.join(writers[:2])
        
        stars = ', '.join([a['name'] for a in cast[:3]])

        # Get genres from TMDB
        tmdb_genres = details.get('genres', [])
        genre_names = [g['name'] for g in tmdb_genres]
        genre_str = '/'.join(genre_names) if genre_names else 'Drama'  # Default to Drama if no genres
        
        year = details.get('release_date', '????')[:4]
        runtime = format_runtime(details.get('runtime', 0))
        year_genre = f"{year} | {genre_str} | {runtime}"

        description = details.get('overview', '')
        rating = float(details.get('vote_average') or 8.0)
        num_ratings = int(details.get('vote_count', 100))
        total_weighted = round(rating * num_ratings, 1)

        poster_path = details.get('poster_path', '')
        poster_filename = f"{movie_id}.jpg"
        full_poster_url = f"https://image.tmdb.org/t/p/w500{poster_path}" if poster_path else ""
        poster_local_path = f"movie_posters/{poster_filename}"
        
        if full_poster_url:
            success = download_poster(full_poster_url, os.path.join(POSTER_DIR, poster_filename))
            if success:
                print(f"  Downloaded poster for {movie['title']}")

        csv_writer.writerow({
            'movie_id': movie_id,
            'movie_name': movie['title'],
            'director': director or 'Unknown',
            'writer': writer_ or 'Unknown',
            'stars': stars or 'Unknown',
            'description': description,
            'poster': poster_local_path,
            'year_genre': year_genre,
            'total_weighted': total_weighted,
            'num_ratings': num_ratings
        })

        print(f"  Added: {movie['title']} ({year})")
        added += 1

    csvfile.close()
    print(f"\nDone! {added} movie(s) scraped and saved to {CSV_FILE}\n")

# --- Run
if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python scrape_tmdb.py <number_of_movies>")
    else:
        scrape_and_upload(int(sys.argv[1]))
