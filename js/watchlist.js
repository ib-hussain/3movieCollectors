// Watchlist page functionality
let allMovies = [];
let currentFilter = "all";

document.addEventListener("DOMContentLoaded", async () => {
  await loadWatchlist();
  setupFilterChips();
});

async function loadWatchlist() {
  try {
    const data = await App.get("/watchlist");

    if (data.success) {
      allMovies = data.movies;
      displayMovies(allMovies);
      updateFilterCounts();
    }
  } catch (error) {
    console.error("Error loading watchlist:", error);
    const grid = document.getElementById("watchlist-grid");
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #7f8c8d;">
        <p>Failed to load watchlist. Please try again.</p>
      </div>
    `;
  }
}

function displayMovies(movies) {
  const grid = document.getElementById("watchlist-grid");

  if (movies.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #7f8c8d;">
        <p>No movies in your watchlist yet.</p>
        <p style="margin-top: 10px;"><a href="browse-movies.html" style="color: #3498db;">Browse movies</a> to add some!</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = "";

  movies.forEach((movie) => {
    const card = createMovieCard(movie);
    grid.appendChild(card);
  });
}

function createMovieCard(movie) {
  const card = document.createElement("article");
  card.className = "movie-card";
  card.dataset.status = movie.status;
  card.dataset.movieId = movie.movieId;

  const statusLabel = movie.status === "added" ? "Added" : "Completed";
  const statusClass =
    movie.status === "added" ? "status-pill--want" : "status-pill--completed";

  // Action buttons based on status
  const actionButton =
    movie.status === "added"
      ? `<button class="action-btn completed-btn" data-movie-id="${movie.movieId}">Mark as Completed</button>`
      : `<button class="action-btn added-btn" data-movie-id="${movie.movieId}">Mark as Added</button>`;

  card.innerHTML = `
    <div class="movie-poster-wrap" onclick="window.location.href='movie.html?id=${
      movie.movieId
    }'">
      <img src="${
        movie.posterPath || "../pictures/white.png"
      }" alt="${escapeHtml(movie.title)}" class="movie-poster">
      <span class="status-pill ${statusClass}">${statusLabel}</span>
    </div>
    <div class="movie-info">
      <h3 class="movie-title" onclick="window.location.href='movie.html?id=${
        movie.movieId
      }'" style="cursor: pointer;">
        ${escapeHtml(movie.title)}
      </h3>
      <div class="movie-meta">
        <span>${movie.releaseYear}</span>
        ${
          movie.genres
            ? `<span class="dot">•</span><span>${escapeHtml(
                movie.genres
              )}</span>`
            : ""
        }
      </div>
      <div class="movie-rating">
        ⭐ ${movie.avgRating}
      </div>
      <div class="movie-actions" style="margin-top: 10px; display: flex; gap: 8px; flex-direction: column;">
        ${actionButton}
        <button class="action-btn remove-btn" data-movie-id="${
          movie.movieId
        }">Remove from Watchlist</button>
      </div>
    </div>
  `;

  // Attach event listeners
  const completedBtn = card.querySelector(".completed-btn");
  const addedBtn = card.querySelector(".added-btn");
  const removeBtn = card.querySelector(".remove-btn");

  if (completedBtn) {
    completedBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleStatus(movie.movieId, "completed");
    });
  }

  if (addedBtn) {
    addedBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleStatus(movie.movieId, "added");
    });
  }

  if (removeBtn) {
    removeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      removeFromWatchlist(movie.movieId);
    });
  }

  return card;
}

async function toggleStatus(movieId, newStatus) {
  try {
    const data = await App.patch(`/watchlist/${movieId}`, {
      status: newStatus,
    });

    if (data.success) {
      // Update local data
      const movie = allMovies.find((m) => m.movieId === movieId);
      if (movie) {
        movie.status = newStatus;
      }

      // Re-render filtered movies
      applyFilter(currentFilter);
      updateFilterCounts();
    }
  } catch (error) {
    console.error("Error updating status:", error);
    alert("Failed to update status. Please try again.");
  }
}

async function removeFromWatchlist(movieId) {
  try {
    const data = await App.delete(`/watchlist/${movieId}`);

    if (data.success) {
      // Remove from local data
      allMovies = allMovies.filter((m) => m.movieId !== movieId);

      // Re-render
      applyFilter(currentFilter);
      updateFilterCounts();

      if (App.showToast) {
        App.showToast("Movie removed from watchlist", "success");
      }
    }
  } catch (error) {
    console.error("Error removing from watchlist:", error);
    alert("Failed to remove movie. Please try again.");
  }
}

function setupFilterChips() {
  const chips = document.querySelectorAll(".filter-chip");

  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      // Update active state
      chips.forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");

      // Apply filter
      const filter = chip.dataset.filter;
      currentFilter = filter;
      applyFilter(filter);
    });
  });
}

function applyFilter(filter) {
  let filteredMovies;

  if (filter === "all") {
    filteredMovies = allMovies;
  } else {
    filteredMovies = allMovies.filter((m) => m.status === filter);
  }

  displayMovies(filteredMovies);
}

function updateFilterCounts() {
  const addedCount = allMovies.filter((m) => m.status === "added").length;
  const completedCount = allMovies.filter(
    (m) => m.status === "completed"
  ).length;
  const totalCount = allMovies.length;

  const chips = document.querySelectorAll(".filter-chip");
  chips.forEach((chip) => {
    const filter = chip.dataset.filter;
    let count = 0;

    if (filter === "all") {
      count = totalCount;
    } else if (filter === "added") {
      count = addedCount;
    } else if (filter === "completed") {
      count = completedCount;
    }

    // Update text with count
    const baseText = chip.textContent.replace(/\s*\(\d+\)/, "").trim();
    chip.textContent = `${baseText} (${count})`;
  });
}

function escapeHtml(unsafe) {
  if (!unsafe) return "";
  return unsafe
    .toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
