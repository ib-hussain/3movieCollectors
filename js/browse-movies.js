/**
 * Browse Movies Page
 * Handles movie browsing with filters, search, sort, and pagination
 */

// Page initialization
window.initPage = window.initPage || {};
window.initPage.browse = async function () {
  console.log("[Browse] Initializing...");

  // Check authentication
  if (!(await App.requireAuth())) return;

  // Load filters and movies
  await Promise.all([loadGenres(), loadYears()]);
  await loadMovies();

  // Setup event listeners
  setupFilters();
  setupSort();
  setupLoadMore();
  setupSearch();

  console.log("[Browse] Initialized successfully");
};

// Current filter state
const state = {
  genres: [], // Array of selected genres (empty = all)
  year: "all",
  search: "",
  sort: "top-rated",
  page: 1,
  limit: 20,
};

/**
 * Load available genres from API
 */
async function loadGenres() {
  try {
    const data = await App.get("/movies/genres");
    if (data.success && data.genres) {
      const genreChips = document.getElementById("genreChips");
      if (!genreChips) return;

      // Keep the "All" chip, add dynamic genres
      const allChip = genreChips.querySelector('[data-genre="all"]');
      genreChips.innerHTML = "";
      if (allChip) genreChips.appendChild(allChip);

      data.genres.forEach((genre) => {
        const chip = document.createElement("button");
        chip.className = "chip";
        chip.dataset.genre = genre.name;
        chip.textContent = genre.name;
        genreChips.appendChild(chip);
      });
    }
  } catch (error) {
    console.error("[Browse] Failed to load genres:", error);
  }
}

/**
 * Load available years from API
 */
async function loadYears() {
  try {
    const data = await App.get("/movies/years");
    if (data.success && data.years) {
      const yearSelect = document.getElementById("yearSelect");
      if (!yearSelect) return;

      // Keep "All Years" option, add dynamic years
      yearSelect.innerHTML = '<option value="all">All Years</option>';
      data.years.forEach((year) => {
        const option = document.createElement("option");
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
      });
    }
  } catch (error) {
    console.error("[Browse] Failed to load years:", error);
  }
}

/**
 * Load movies with current filters
 */
async function loadMovies(append = false) {
  try {
    const params = new URLSearchParams({
      year: state.year,
      search: state.search,
      sort: state.sort,
      page: state.page,
      limit: state.limit,
    });

    // Add genres as separate params
    if (state.genres.length > 0) {
      state.genres.forEach((genre) => params.append("genre", genre));
    }

    const data = await App.get(`/movies?${params}`);

    if (data.success) {
      // Fetch watchlist status for all movies
      const watchlistData = await App.get("/watchlist");
      const watchlistMovieIds = watchlistData.success
        ? watchlistData.movies.map((m) => m.movieId)
        : [];

      displayMovies(data.movies, append, watchlistMovieIds);
      updateLoadMoreButton(data.pagination);
      if (!append) {
        updateMovieCount(data.pagination.total);
      }
    }
  } catch (error) {
    console.error("[Browse] Failed to load movies:", error);
    App.showToast("Failed to load movies", "error");
  }
}

/**
 * Display movies in the grid
 */
function displayMovies(movies, append = false, watchlistMovieIds = []) {
  const grid = document.getElementById("moviesGrid");
  if (!grid) return;

  if (movies.length === 0 && !append) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: #999;">
        <p style="font-size: 18px; margin-bottom: 10px;">No movies found</p>
        <p style="font-size: 14px;">Try adjusting your filters or search query</p>
      </div>
    `;
    return;
  }

  const moviesHTML = movies
    .map((movie) => {
      console.log(
        `[Browse] Movie: ${movie.title}, posterPath: ${movie.posterPath}`
      );

      const isInWatchlist = watchlistMovieIds.includes(movie.movieId);
      const buttonText = isInWatchlist
        ? "Added to Watchlist"
        : "Add to Watchlist";
      const buttonStyle = isInWatchlist
        ? "background: #27ae60; cursor: not-allowed;"
        : "";
      const buttonDisabled = isInWatchlist ? "disabled" : "";

      return `
    <article class="movie-card" onclick="window.location.href='movie.html?id=${
      movie.movieId
    }'">
      <div class="movie-poster">
        <div class="poster-placeholder">
          <img src="${movie.posterPath || "/pictures/white.png"}" alt="${
        movie.title
      }" onerror="this.src='/pictures/white.png'; console.error('Failed to load poster for ${
        movie.title
      }');">
        </div>
      </div>
      <div class="movie-info">
        <h3>${movie.title}</h3>
        <p class="movie-meta">
          <span>${movie.releaseYear || "N/A"}</span>
          ${
            movie.genres
              ? `<span class="dot">•</span><span>${movie.genres}</span>`
              : ""
          }
        </p>
        <div class="movie-rating">
          <img src="/pictures/star.png" alt="Star">
          <span>${movie.avgRating}</span>
        </div>
        <button class="add-watchlist-btn" data-movie-id="${
          movie.movieId
        }" style="${buttonStyle}" ${buttonDisabled} onclick="event.stopPropagation(); addToWatchlistFromBrowse(${
        movie.movieId
      })">
          ${buttonText}
        </button>
      </div>
    </article>
  `;
    })
    .join("");

  if (append) {
    grid.insertAdjacentHTML("beforeend", moviesHTML);
  } else {
    grid.innerHTML = moviesHTML;
  }
}

/**
 * Update Load More button visibility
 */
function updateLoadMoreButton(pagination) {
  const loadMoreWrap = document.querySelector(".load-more-wrap");
  const loadMoreBtn = document.querySelector(".load-more-btn");

  if (!loadMoreWrap || !loadMoreBtn) return;

  // Show button if there are more movies to load
  const hasMore = pagination.page < pagination.totalPages;
  loadMoreWrap.style.display = hasMore ? "block" : "none";
}

/**
 * Update movie count display
 */
function updateMovieCount(total) {
  const moviesCount = document.querySelector(".movies-count");
  if (moviesCount) {
    moviesCount.innerHTML = `Showing <span>${total}</span> movies`;
  }
}

/**
 * Setup filter event listeners
 */
function setupFilters() {
  const genreChips = document.getElementById("genreChips");
  const yearSelect = document.getElementById("yearSelect");
  const resetBtn = document.querySelector(".filters-reset");

  // Genre filter (multiple selection)
  if (genreChips) {
    genreChips.addEventListener("click", (e) => {
      if (e.target.classList.contains("chip")) {
        const genre = e.target.dataset.genre;

        if (genre === "all") {
          // Clear all genres
          state.genres = [];
          genreChips
            .querySelectorAll(".chip")
            .forEach((c) => c.classList.remove("chip--active"));
          e.target.classList.add("chip--active");
        } else {
          // Remove "All" if active
          const allChip = genreChips.querySelector('[data-genre="all"]');
          if (allChip) allChip.classList.remove("chip--active");

          // Toggle genre
          if (state.genres.includes(genre)) {
            // Remove genre
            state.genres = state.genres.filter((g) => g !== genre);
            e.target.classList.remove("chip--active");

            // If no genres selected, activate "All"
            if (state.genres.length === 0 && allChip) {
              allChip.classList.add("chip--active");
            }
          } else {
            // Add genre
            state.genres.push(genre);
            e.target.classList.add("chip--active");
          }
        }

        state.page = 1;
        loadMovies();
      }
    });
  }

  // Year filter
  if (yearSelect) {
    yearSelect.addEventListener("change", () => {
      state.year = yearSelect.value;
      state.page = 1;
      loadMovies();
    });
  }

  // Reset button
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      // Reset state
      state.genres = [];
      state.year = "all";
      state.search = "";
      state.sort = "top-rated";
      state.page = 1;

      // Reset UI
      genreChips
        .querySelectorAll(".chip")
        .forEach((c) => c.classList.remove("chip--active"));
      const allChip = genreChips.querySelector('[data-genre="all"]');
      if (allChip) allChip.classList.add("chip--active");

      if (yearSelect) yearSelect.value = "all";
      const searchInput = document.getElementById("searchInput");
      if (searchInput) searchInput.value = "";
      const sortSelect = document.getElementById("sortSelect");
      if (sortSelect) sortSelect.value = "top-rated";

      // Reload movies
      loadMovies();
    });
  }
}

/**
 * Setup sort event listener
 */
function setupSort() {
  const sortSelect = document.getElementById("sortSelect");
  if (sortSelect) {
    sortSelect.addEventListener("change", () => {
      state.sort = sortSelect.value;
      state.page = 1;
      loadMovies();
    });
  }
}

/**
 * Setup Load More button event listener
 */
function setupLoadMore() {
  const loadMoreBtn = document.querySelector(".load-more-btn");

  if (loadMoreBtn) {
    loadMoreBtn.addEventListener("click", async () => {
      state.page++;
      await loadMovies(true); // Append mode
    });
  }
}

/**
 * Setup search with debouncing
 */
function setupSearch() {
  const searchInput = document.getElementById("searchInput");
  if (!searchInput) return;

  let debounceTimer;
  searchInput.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      state.search = searchInput.value.trim();
      state.page = 1;
      loadMovies();
    }, 500); // Wait 500ms after user stops typing
  });
}

/**
 * Add movie to watchlist from browse page
 */
async function addToWatchlistFromBrowse(movieId) {
  try {
    const data = await App.post("/watchlist", { movieId });

    if (data.success) {
      // Update button to show it's added
      const btn = document.querySelector(`button[data-movie-id="${movieId}"]`);
      if (btn) {
        btn.textContent = "Added ✓";
        btn.style.background = "#27ae60";
        btn.disabled = true;
      }

      if (App.showToast) {
        App.showToast("Added to watchlist", "success");
      }
    }
  } catch (error) {
    console.error("Error adding to watchlist:", error);
    if (error.message && error.message.includes("already in your watchlist")) {
      alert("This movie is already in your watchlist");
    } else if (error.message && error.message.includes("log in")) {
      alert("Please log in to add movies to your watchlist");
    } else {
      alert("Failed to add to watchlist. Please try again.");
    }
  }
}

// Make function globally accessible
window.addToWatchlistFromBrowse = addToWatchlistFromBrowse;
