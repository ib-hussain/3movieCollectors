/**
 * Admin Movie Management - JavaScript
 * Handles movie CRUD operations, bulk import, search, and filtering
 */

const API_BASE = "/api/admin";
let currentPage = 1;
let pageSize = 10;
let totalPages = 1;
let totalItems = 0;
let currentFilters = {
  search: "",
  genre: "",
  year: "",
  sortBy: "title",
};
let allGenres = [];
let movieToDelete = null;

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  checkAuth();
  initializeEventListeners();
  loadGenres();
  loadMovieStats();
  loadMovies();
});

// Check authentication
async function checkAuth() {
  try {
    const response = await fetch("/api/auth/me");
    if (!response.ok) {
      window.location.href = "../login.html";
      return;
    }
    const data = await response.json();
    if (!data.success || data.user.role !== "admin") {
      window.location.href = "../login.html";
      return;
    }
    document.getElementById("adminName").textContent = data.user.username;
  } catch (error) {
    console.error("Auth check failed:", error);
    window.location.href = "../login.html";
  }
}

// Initialize event listeners
function initializeEventListeners() {
  // Search
  const searchInput = document.getElementById("searchInput");
  let searchTimeout;
  searchInput.addEventListener("input", (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      currentFilters.search = e.target.value;
      currentPage = 1;
      loadMovies();
    }, 500);
  });

  // Filters
  document.getElementById("genreFilter").addEventListener("change", (e) => {
    currentFilters.genre = e.target.value;
    console.log("Genre filter changed to:", currentFilters.genre);
    currentPage = 1;
    loadMovies();
  });

  document.getElementById("yearFilter").addEventListener("change", (e) => {
    currentFilters.year = e.target.value;
    console.log("Year filter changed to:", currentFilters.year);
    currentPage = 1;
    loadMovies();
  });

  document.getElementById("sortBy").addEventListener("change", (e) => {
    currentFilters.sortBy = e.target.value;
    console.log("Sort changed to:", currentFilters.sortBy);
    loadMovies();
  });

  document.getElementById("resetFilters").addEventListener("click", () => {
    currentFilters = { search: "", genre: "", year: "", sortBy: "title" };
    document.getElementById("searchInput").value = "";
    document.getElementById("genreFilter").value = "";
    document.getElementById("yearFilter").value = "";
    document.getElementById("sortBy").value = "title";
    currentPage = 1;
    loadMovies();
  });

  // Pagination
  document.getElementById("prevPage").addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      loadMovies();
    }
  });

  document.getElementById("nextPage").addEventListener("click", () => {
    if (currentPage < totalPages) {
      currentPage++;
      loadMovies();
    }
  });

  // Modals
  document
    .getElementById("addMovieBtn")
    .addEventListener("click", () => openMovieModal());
  document
    .getElementById("bulkImportBtn")
    .addEventListener("click", () => openBulkImportModal());
  document
    .getElementById("closeModal")
    .addEventListener("click", closeMovieModal);
  document
    .getElementById("cancelBtn")
    .addEventListener("click", closeMovieModal);
  document
    .getElementById("closeBulkModal")
    .addEventListener("click", closeBulkImportModal);
  document
    .getElementById("closeDeleteModal")
    .addEventListener("click", closeDeleteModal);
  document
    .getElementById("cancelDeleteBtn")
    .addEventListener("click", closeDeleteModal);

  // Notification button
  document.getElementById("notificationBtn").addEventListener("click", () => {
    window.location.href = "/admin/admin-dashboard.html#notifications";
  });

  // Forms
  document
    .getElementById("movieForm")
    .addEventListener("submit", handleMovieSubmit);
  document
    .getElementById("importTmdbBtn")
    .addEventListener("click", handleBulkImport);
  document
    .getElementById("confirmDeleteBtn")
    .addEventListener("click", handleDeleteConfirm);

  // Logout
  document.getElementById("logoutBtn").addEventListener("click", handleLogout);

  // Close modals on outside click
  window.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal")) {
      e.target.style.display = "none";
    }
  });
}

// Load genres for filters and form
async function loadGenres() {
  try {
    const response = await fetch(`${API_BASE}/movies/genres`);
    if (!response.ok) throw new Error("Failed to load genres");

    const data = await response.json();
    allGenres = data.genres || [];

    // Populate genre filter
    const genreFilter = document.getElementById("genreFilter");
    allGenres.forEach((genre) => {
      const option = document.createElement("option");
      option.value = genre.genreName;
      option.textContent = genre.genreName;
      genreFilter.appendChild(option);
    });

    // Populate genre checkboxes in form
    const genreCheckboxes = document.getElementById("genreCheckboxes");
    allGenres.forEach((genre) => {
      const label = document.createElement("label");
      label.className = "checkbox-label";
      label.innerHTML = `
                <input type="checkbox" name="genres" value="${genre.genreID}">
                <span>${genre.genreName}</span>
            `;
      genreCheckboxes.appendChild(label);
    });
  } catch (error) {
    console.error("Error loading genres:", error);
    showNotification("Failed to load genres", "error");
  }
}

// Load movie statistics
async function loadMovieStats() {
  try {
    const response = await fetch(`${API_BASE}/movies/stats`);
    if (!response.ok) throw new Error("Failed to load stats");

    const data = await response.json();
    document.getElementById("totalMovies").textContent = data.totalMovies || 0;
    document.getElementById("totalViews").textContent = formatNumber(
      data.totalViews || 0
    );
    document.getElementById("avgRating").textContent = data.recentReviews || 0;
  } catch (error) {
    console.error("Error loading stats:", error);
  }
}

// Load movies with current filters
async function loadMovies() {
  try {
    const tbody = document.getElementById("moviesTableBody");
    tbody.innerHTML =
      '<tr><td colspan="8" class="loading"><i class="fas fa-spinner fa-spin"></i> Loading movies...</td></tr>';

    // Build query parameters
    const params = new URLSearchParams({
      page: currentPage,
      limit: pageSize,
    });

    if (currentFilters.search) params.append("search", currentFilters.search);
    if (currentFilters.genre) params.append("genre", currentFilters.genre);
    if (currentFilters.year) params.append("year", currentFilters.year);

    console.log("Loading movies with params:", Object.fromEntries(params));
    console.log("Current filters:", currentFilters);

    // Handle sort with _desc suffix
    if (currentFilters.sortBy) {
      const sortValue = currentFilters.sortBy;
      if (sortValue.endsWith("_desc")) {
        params.append("sortBy", sortValue.replace("_desc", ""));
        params.append("sortOrder", "DESC");
      } else {
        params.append("sortBy", sortValue);
        params.append("sortOrder", "ASC");
      }
    }

    const response = await fetch(`${API_BASE}/movies?${params}`);
    if (!response.ok) throw new Error("Failed to load movies");

    const data = await response.json();
    const movies = data.movies || [];
    totalPages = data.pagination?.pages || 1;
    totalItems = data.pagination?.total || 0;

    if (movies.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="8" class="no-data">No movies found</td></tr>';
      updatePagination();
      return;
    }

    tbody.innerHTML = movies.map((movie) => createMovieRow(movie)).join("");
    updatePagination();
    attachRowEventListeners();

    // Populate year filter if empty
    populateYearFilter(movies);
  } catch (error) {
    console.error("Error loading movies:", error);
    const tbody = document.getElementById("moviesTableBody");
    tbody.innerHTML =
      '<tr><td colspan="8" class="error">Failed to load movies. Please try again.</td></tr>';
  }
}

// Create movie table row
function createMovieRow(movie) {
  // Fix poster path - ensure it starts with /pictures/ if it exists
  let posterUrl = "";
  if (movie.posterImg) {
    if (movie.posterImg.startsWith("http")) {
      posterUrl = movie.posterImg;
    } else if (movie.posterImg.startsWith("/pictures/")) {
      posterUrl = movie.posterImg;
    } else if (movie.posterImg.startsWith("movie_posters/")) {
      posterUrl = "/pictures/" + movie.posterImg;
    } else {
      posterUrl = "/pictures/movie_posters/" + movie.posterImg;
    }
  }

  const genres = movie.genres
    ? movie.genres.split(",").slice(0, 3).join(", ")
    : "N/A";
  const rating = movie.avgRating
    ? parseFloat(movie.avgRating).toFixed(1)
    : "N/A";
  const views = movie.viewCount || 0;

  return `
        <tr data-movie-id="${movie.movieID}">
            <td>
                ${
                  posterUrl
                    ? `<img src="${escapeHtml(posterUrl)}" 
                       alt="${escapeHtml(movie.title)}" 
                       class="movie-poster"
                       onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                  <div class="poster-placeholder" style="display: none;"><i class="fas fa-film"></i></div>`
                    : `<div class="poster-placeholder"><i class="fas fa-film"></i></div>`
                }
            </td>
            <td><strong>${escapeHtml(movie.title)}</strong></td>
            <td>${escapeHtml(movie.director || "N/A")}</td>
            <td>${movie.releaseYear || "N/A"}</td>
            <td><span class="genre-tags">${escapeHtml(genres)}</span></td>
            <td>
                <span class="rating">
                    <i class="fas fa-star"></i> ${rating}
                </span>
            </td>
            <td>${formatNumber(views)}</td>
            <td>
                <div class="action-buttons-cell">
                    <button class="btn-icon btn-edit" data-movie-id="${
                      movie.movieID
                    }" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-delete" data-movie-id="${
                      movie.movieID
                    }" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `;
}

// Attach event listeners to table rows
function attachRowEventListeners() {
  document.querySelectorAll(".btn-edit").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const movieId = e.currentTarget.getAttribute("data-movie-id");
      openMovieModal(movieId);
    });
  });

  document.querySelectorAll(".btn-delete").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const movieId = e.currentTarget.getAttribute("data-movie-id");
      const row = e.currentTarget.closest("tr");
      const title = row.querySelector("strong").textContent;
      openDeleteModal(movieId, title);
    });
  });
}

// Update pagination controls
function updatePagination() {
  document.getElementById("currentPage").textContent = currentPage;
  document.getElementById("totalPages").textContent = totalPages;
  document.getElementById("totalItems").textContent = totalItems;

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);
  document.getElementById("showingStart").textContent =
    totalItems > 0 ? start : 0;
  document.getElementById("showingEnd").textContent = end;

  document.getElementById("prevPage").disabled = currentPage <= 1;
  document.getElementById("nextPage").disabled = currentPage >= totalPages;
}

// Populate year filter dynamically
function populateYearFilter(movies) {
  const yearFilter = document.getElementById("yearFilter");
  if (yearFilter.options.length > 1) return; // Already populated

  const years = new Set();
  movies.forEach((movie) => {
    if (movie.releaseYear) years.add(movie.releaseYear);
  });

  Array.from(years)
    .sort((a, b) => b - a)
    .forEach((year) => {
      const option = document.createElement("option");
      option.value = year;
      option.textContent = year;
      yearFilter.appendChild(option);
    });
}

// Open movie modal (add or edit)
async function openMovieModal(movieId = null) {
  const modal = document.getElementById("movieModal");
  const form = document.getElementById("movieForm");
  const modalTitle = document.getElementById("modalTitle");

  form.reset();
  document
    .querySelectorAll('input[name="genres"]')
    .forEach((cb) => (cb.checked = false));

  if (movieId) {
    modalTitle.textContent = "Edit Movie";
    document.getElementById("movieId").value = movieId;

    try {
      const response = await fetch(`${API_BASE}/movies/${movieId}`);
      if (!response.ok) throw new Error("Failed to load movie");

      const movie = await response.json();
      document.getElementById("movieTitle").value = movie.title || "";
      document.getElementById("movieYear").value = movie.releaseYear || "";
      document.getElementById("movieDirector").value = movie.director || "";
      document.getElementById("movieSynopsis").value = movie.synopsis || "";
      document.getElementById("moviePoster").value = movie.posterImg || "";

      // Check genre checkboxes
      if (movie.genreIds) {
        const genreIds = movie.genreIds.split(",").map((id) => id.trim());
        genreIds.forEach((genreId) => {
          const checkbox = document.querySelector(
            `input[name="genres"][value="${genreId}"]`
          );
          if (checkbox) checkbox.checked = true;
        });
      }
    } catch (error) {
      console.error("Error loading movie:", error);
      showNotification("Failed to load movie details", "error");
      return;
    }
  } else {
    modalTitle.textContent = "Add New Movie";
    document.getElementById("movieId").value = "";
  }

  modal.style.display = "flex";
}

// Close movie modal
function closeMovieModal() {
  document.getElementById("movieModal").style.display = "none";
}

// Handle movie form submission
async function handleMovieSubmit(e) {
  e.preventDefault();

  const movieId = document.getElementById("movieId").value;
  const title = document.getElementById("movieTitle").value.trim();
  const year = parseInt(document.getElementById("movieYear").value);
  const director = document.getElementById("movieDirector").value.trim();
  const synopsis = document.getElementById("movieSynopsis").value.trim();
  const posterImg = document.getElementById("moviePoster").value.trim();

  const selectedGenres = Array.from(
    document.querySelectorAll('input[name="genres"]:checked')
  ).map((cb) => cb.value);

  if (!title || !year || !director) {
    showNotification("Please fill in all required fields", "error");
    return;
  }

  if (selectedGenres.length === 0) {
    showNotification("Please select at least one genre", "error");
    return;
  }

  const movieData = {
    title,
    releaseYear: year,
    director,
    synopsis: synopsis || null,
    posterImg: posterImg || null,
    genreIds: selectedGenres,
  };

  try {
    const url = movieId
      ? `${API_BASE}/movies/${movieId}`
      : `${API_BASE}/movies`;
    const method = movieId ? "PUT" : "POST";

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(movieData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to save movie");
    }

    showNotification(
      movieId ? "Movie updated successfully" : "Movie added successfully",
      "success"
    );
    closeMovieModal();
    loadMovies();
    loadMovieStats();
  } catch (error) {
    console.error("Error saving movie:", error);
    showNotification(error.message, "error");
  }
}

// Open delete confirmation modal
function openDeleteModal(movieId, title) {
  movieToDelete = movieId;
  document.getElementById("deleteMovieTitle").textContent = title;
  document.getElementById("deleteModal").style.display = "flex";
}

// Close delete modal
function closeDeleteModal() {
  movieToDelete = null;
  document.getElementById("deleteModal").style.display = "none";
}

// Handle delete confirmation
async function handleDeleteConfirm() {
  if (!movieToDelete) return;

  try {
    const response = await fetch(`${API_BASE}/movies/${movieToDelete}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to delete movie");
    }

    showNotification("Movie deleted successfully", "success");
    closeDeleteModal();
    loadMovies();
    loadMovieStats();
  } catch (error) {
    console.error("Error deleting movie:", error);
    showNotification(error.message, "error");
  }
}

// Open bulk import modal
function openBulkImportModal() {
  document.getElementById("bulkImportModal").style.display = "flex";
  document.getElementById("numMovies").value = "5";
  document.getElementById("importProgress").style.display = "none";
  document.getElementById("importResults").innerHTML = "";
}

// Close bulk import modal
function closeBulkImportModal() {
  document.getElementById("bulkImportModal").style.display = "none";
}

// Handle bulk import from TMDB
async function handleBulkImport() {
  const numMoviesInput = document.getElementById("numMovies").value.trim();
  const numMovies = parseInt(numMoviesInput);

  if (!numMoviesInput || isNaN(numMovies) || numMovies < 1 || numMovies > 100) {
    showNotification("Please enter a valid number between 1 and 100", "error");
    return;
  }

  const progressDiv = document.getElementById("importProgress");
  const progressFill = document.getElementById("progressFill");
  const progressText = document.getElementById("progressText");
  const resultsDiv = document.getElementById("importResults");

  progressDiv.style.display = "block";
  resultsDiv.innerHTML = "";
  progressFill.style.width = "0%";
  progressText.textContent = "Connecting to TMDB...";

  let currentProgress = 0;
  let progressInterval;

  // Simulate realistic progress
  const updateProgress = (target, message) => {
    if (progressInterval) clearInterval(progressInterval);

    progressInterval = setInterval(() => {
      if (currentProgress < target) {
        currentProgress += 1;
        progressFill.style.width = `${currentProgress}%`;
      } else {
        clearInterval(progressInterval);
      }
    }, 50);

    if (message) progressText.textContent = message;
  };

  try {
    // Phase 1: Scraping (0-50%)
    updateProgress(10, "Connecting to TMDB...");
    await new Promise((resolve) => setTimeout(resolve, 300));

    updateProgress(20, `Scraping ${numMovies} movies from TMDB...`);

    const startTime = Date.now();
    const response = await fetch(`${API_BASE}/movies/bulk-add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ numMovies }),
    });

    // Estimate progress based on time (scraping typically takes 2-5 seconds per movie)
    const elapsed = Date.now() - startTime;
    const estimatedProgress = Math.min(50, 20 + elapsed / 100);
    updateProgress(estimatedProgress, "Processing movie data...");

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to import movies");
    }

    // Phase 2: Database import (50-90%)
    updateProgress(60, "Importing to database...");
    const result = await response.json();

    updateProgress(90, "Finalizing import...");
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Phase 3: Complete (100%)
    clearInterval(progressInterval);
    progressFill.style.width = "100%";
    progressText.textContent = "Import complete!";

    // Display results
    resultsDiv.innerHTML = `
            <div class="import-success">
                <i class="fas fa-check-circle"></i>
                <h3>Import Successful</h3>
                <p><strong>${
                  result.imported || 0
                }</strong> movies imported successfully</p>
                ${
                  result.skipped > 0
                    ? `<p><small>${result.skipped} movies were skipped (already exist)</small></p>`
                    : ""
                }
                ${
                  result.errors && result.errors.length > 0
                    ? `<p class="warning"><small>${result.errors.length} errors occurred during import</small></p>`
                    : ""
                }
            </div>
        `;

    setTimeout(() => {
      closeBulkImportModal();
      loadMovies();
      loadMovieStats();
    }, 2000);
  } catch (error) {
    console.error("Error importing movies:", error);
    clearInterval(progressInterval);
    progressFill.style.width = "0%";
    progressText.textContent = "Import failed";
    resultsDiv.innerHTML = `
            <div class="import-error">
                <i class="fas fa-exclamation-circle"></i>
                <h3>Import Failed</h3>
                <p>${error.message}</p>
            </div>
        `;
  }
}

// Handle logout
async function handleLogout() {
  try {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "../../Cinemago/login.html";
  } catch (error) {
    console.error("Logout error:", error);
    window.location.href = "../../Cinemago/login.html";
  }
}

// Utility functions
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}

function showNotification(message, type = "info") {
  // Simple notification system
  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
        <i class="fas fa-${
          type === "success"
            ? "check-circle"
            : type === "error"
            ? "exclamation-circle"
            : "info-circle"
        }"></i>
        <span>${message}</span>
    `;
  notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${
          type === "success"
            ? "#10b981"
            : type === "error"
            ? "#ef4444"
            : "#3b82f6"
        };
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = "slideOut 0.3s ease";
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}
