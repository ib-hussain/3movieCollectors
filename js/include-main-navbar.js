document.addEventListener("DOMContentLoaded", () => {
  loadNavbar();
});

/* ===========================================
   Load Navbar HTML
=========================================== */
function loadNavbar() {
  fetch("../components/main-navbar.html")
    .then((res) => res.text())
    .then((html) => {
      const container = document.getElementById("navbar-container");

      if (container) {
        container.innerHTML = html;
      } else {
        document.body.insertAdjacentHTML("afterbegin", html);
      }

      setActiveNavbarItem();
      updateNotificationBadge();
      updateMessagesBadge();
      loadProfilePicture();
      setupSearchBar();
    })
    .catch((err) => console.error("Navbar failed to load:", err));
}

/* ===========================================
   Determine Active Page
=========================================== */
function getPageKey() {
  // 1) Allow pages to explicitly define page type
  if (document.body.dataset.page) {
    return document.body.dataset.page;
  }

  // 2) Auto-detect by filename
  const file = window.location.pathname.split("/").pop().toLowerCase();

  if (file.startsWith("notifications")) return "notifications";
  if (file.startsWith("messages")) return "messages";
  if (file.startsWith("profile")) return "profile";
  if (file.startsWith("settings")) return "settings";
  if (file.startsWith("help")) return "help";

  return null;
}

/* ===========================================
   Apply Active State to Navbar
=========================================== */
function setActiveNavbarItem() {
  const key = getPageKey();
  if (!key) return;

  const navbar = document.querySelector(".navbar");
  if (!navbar) return;

  const target = navbar.querySelector(`[data-nav="${key}"]`);
  if (!target) return;

  // Icon buttons (notifications & messages)
  if (target.classList.contains("icon-btn")) {
    target.classList.add("active");
  }

  // Profile (user-section)
  if (target.classList.contains("user-section")) {
    target.classList.add("active");
  }
}

/* ===========================================
   Update Notification Badge
=========================================== */
async function updateNotificationBadge() {
  try {
    if (!window.App) return; // App not loaded yet

    const data = await App.get("/notifications/unread-count");
    if (data.success) {
      const badge = document.querySelector(".notifications-badge");
      if (badge) {
        badge.textContent = data.count;
        badge.style.display = data.count > 0 ? "flex" : "none";
      }
    }
  } catch (error) {
    console.log(
      "Could not fetch notification count (user may not be logged in)"
    );
  }
}

// Make function available globally for updates
window.updateNotificationBadge = updateNotificationBadge;

/* ===========================================
   Update Messages Badge
=========================================== */
async function updateMessagesBadge() {
  try {
    if (!window.App) return; // App not loaded yet

    const data = await App.get("/messages/unread-count");
    if (data.success) {
      const badge = document.querySelector(".messages-badge");
      if (badge) {
        badge.textContent = data.count;
        badge.style.display = data.count > 0 ? "flex" : "none";
      }
    }
  } catch (error) {
    console.log("Could not fetch message count (user may not be logged in)");
  }
}

// Make function available globally for updates
window.updateMessagesBadge = updateMessagesBadge;

/* ===========================================
   Load User Profile Picture
=========================================== */
async function loadProfilePicture() {
  try {
    if (!window.App) return; // App not loaded yet

    const data = await App.get("/auth/me");
    if (data.success && data.user) {
      const profileImg = document.querySelector(
        ".user-section .icon-circle-profile img"
      );
      if (profileImg && data.user.profilePicture) {
        profileImg.src = data.user.profilePicture;
        profileImg.alt = data.user.name || "User";
        profileImg.style.objectFit = "cover";
      }
    }
  } catch (error) {
    console.log("Could not load profile picture (user may not be logged in)");
  }
}

// Make function available globally for updates
window.loadProfilePicture = loadProfilePicture;

/* ===========================================
   Setup Search Bar Functionality
=========================================== */
let searchTimeout;
function setupSearchBar() {
  const searchInput = document.querySelector(".nav-search input");
  const searchDropdown = document.getElementById("navbar-search-dropdown");
  if (!searchInput || !searchDropdown) return;

  // Handle input with debouncing
  searchInput.addEventListener("input", (e) => {
    clearTimeout(searchTimeout);
    const query = e.target.value.trim();

    if (query.length < 2) {
      searchDropdown.style.display = "none";
      return;
    }

    searchTimeout = setTimeout(() => {
      searchMovies(query, searchDropdown);
    }, 300);
  });

  // Handle Enter key press - go to browse page
  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      const query = searchInput.value.trim();
      if (query) {
        searchDropdown.style.display = "none";
        window.location.href = `browse-movies.html?search=${encodeURIComponent(
          query
        )}`;
      }
    }
  });

  // Close dropdown when clicking outside
  document.addEventListener("click", (e) => {
    if (!searchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
      searchDropdown.style.display = "none";
    }
  });

  // Search icon click handler
  const searchIcon = document.querySelector(".nav-search .search-icon-img");
  if (searchIcon) {
    searchIcon.style.cursor = "pointer";
    searchIcon.addEventListener("click", () => {
      const query = searchInput.value.trim();
      if (query) {
        searchDropdown.style.display = "none";
        window.location.href = `browse-movies.html?search=${encodeURIComponent(
          query
        )}`;
      }
    });
  }
}

/* ===========================================
   Search Movies and Display Results
=========================================== */
async function searchMovies(query, dropdown) {
  try {
    if (!window.App) return;

    const data = await App.get(
      `/movies?search=${encodeURIComponent(query)}&limit=5`
    );

    if (data.success && data.movies) {
      displaySearchResults(data.movies, dropdown, query);
    }
  } catch (error) {
    console.error("Search failed:", error);
    dropdown.style.display = "none";
  }
}

/* ===========================================
   Display Search Results Dropdown
=========================================== */
function displaySearchResults(movies, dropdown, query) {
  if (movies.length === 0) {
    dropdown.innerHTML = `
      <div class="search-result-item no-results">
        <p>No movies found for "${escapeHtml(query)}"</p>
      </div>
    `;
    dropdown.style.display = "block";
    return;
  }

  dropdown.innerHTML = movies
    .map(
      (movie) => `
    <div class="search-result-item" onclick="window.location.href='movie.html?id=${
      movie.movieId
    }'">
      <div class="search-result-poster" style="background-image: url('${
        movie.posterPath || "../pictures/movie_posters/default.jpg"
      }')"></div>
      <div class="search-result-info">
        <div class="search-result-title">${escapeHtml(movie.title)}</div>
        <div class="search-result-meta">
          <span>${movie.releaseYear || "N/A"}</span>
          ${movie.avgRating ? `<span>★ ${movie.avgRating}</span>` : ""}
        </div>
      </div>
    </div>
  `
    )
    .join("");

  // Add "View all results" link
  dropdown.innerHTML += `
    <div class="search-result-item view-all" onclick="window.location.href='browse-movies.html?search=${encodeURIComponent(
      query
    )}'">
      <p>View all results for "${escapeHtml(query)}"</p>
    </div>
  `;

  dropdown.style.display = "block";
}

/* ===========================================
   Escape HTML to prevent XSS
=========================================== */
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
