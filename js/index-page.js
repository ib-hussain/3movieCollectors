/**
 * Landing Page (index.html) - Featured Movies
 * Fetches and displays random popular movies
 */

document.addEventListener("DOMContentLoaded", async () => {
  await loadFeaturedMovies();
});

/**
 * Load popular movies from the API
 */
async function loadFeaturedMovies() {
  try {
    const response = await fetch("/api/movies/popular?limit=4");
    const data = await response.json();

    if (data.success && data.movies && data.movies.length > 0) {
      displayFeaturedMovies(data.movies);
    } else {
      console.warn("No popular movies found");
    }
  } catch (error) {
    console.error("Error loading featured movies:", error);
  }
}

/**
 * Display movies in the featured grid
 */
function displayFeaturedMovies(movies) {
  const featuredGrid = document.querySelector(".featured-grid");

  if (!featuredGrid) {
    console.warn("Featured grid not found");
    return;
  }

  // Clear existing content
  featuredGrid.innerHTML = "";

  // Create movie cards
  movies.forEach((movie) => {
    const card = createMovieCard(movie);
    featuredGrid.appendChild(card);
  });
}

/**
 * Create a movie card element
 */
function createMovieCard(movie) {
  const card = document.createElement("div");
  card.className = "featured-card";

  // Poster
  const poster = document.createElement("div");
  poster.className = "featured-poster";
  const img = document.createElement("img");
  img.src = movie.posterPath || "/pictures/movie_posters/white.png";
  img.alt = movie.title;
  img.onerror = function () {
    this.src = "/pictures/movie_posters/white.png";
  };
  poster.appendChild(img);

  // Info section
  const info = document.createElement("div");
  info.className = "featured-info";

  const title = document.createElement("h3");
  title.textContent = movie.title;

  const meta = document.createElement("p");
  meta.textContent = `${movie.releaseYear} • ${movie.genres || "Unknown"}`;

  const rating = document.createElement("span");
  rating.className = "rating";
  rating.textContent = `★ ${movie.avgRating}`;

  info.appendChild(title);
  info.appendChild(meta);
  info.appendChild(rating);

  card.appendChild(poster);
  card.appendChild(info);

  return card;
}
