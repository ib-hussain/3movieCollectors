/**
 * Dashboard Page - Using global App utilities
 */

// Page initializer
window.initPage = window.initPage || {};
window.initPage.dashboard = async function () {
  console.log("[Dashboard] Initializing...");

  // Require authentication
  const isAuth = await App.requireAuth();
  if (!isAuth) return;

  // Get current user
  const user = await App.getCurrentUser();
  if (!user) {
    App.showError("Failed to load user data");
    return;
  }

  // Update welcome message
  updateWelcomeMessage(user);

  // Load dashboard data
  await Promise.all([loadStats(), loadRecommended(), loadRecentActivity()]);

  // Setup tab switching for trending/recommended
  setupTrendingTabs();

  console.log("[Dashboard] Initialized successfully");
};

/**
 * Update welcome message with user's name
 */
function updateWelcomeMessage(user) {
  const headerH1 = document.querySelector(".dashboard-header h1");
  if (headerH1) {
    headerH1.textContent = `Welcome back, ${user.name || user.username}!`;
  }
}

/**
 * Load dashboard statistics
 */
async function loadStats() {
  try {
    const data = await App.get("/dashboard/stats");

    if (data.success && data.stats) {
      const { watchlist, watched, friends, upcomingEvents } = data.stats;

      // Update stat cards
      const statCards = document.querySelectorAll(".stat-card");
      if (statCards[0]) {
        statCards[0].querySelector(".stat-value").textContent = watched;
        statCards[0].querySelector(".stat-top span").textContent =
          "Movies Watched";
      }
      if (statCards[1]) {
        statCards[1].querySelector(".stat-value").textContent = friends;
      }
      if (statCards[2]) {
        statCards[2].querySelector(".stat-value").textContent = upcomingEvents;
      }
    }
  } catch (error) {
    console.error("[Dashboard] Failed to load stats:", error);
    App.showError("Failed to load statistics");
  }
}

/**
 * Load recommended movies
 */
async function loadRecommended() {
  try {
    const data = await App.get("/dashboard/recommended?limit=5");

    if (data.success && data.movies) {
      displayRecommendedMovies(data.movies, data.basedOn);
    }
  } catch (error) {
    console.error("[Dashboard] Failed to load recommended:", error);
  }
}

/**
 * Display recommended movies in the trending panel
 */
function displayRecommendedMovies(movies, basedOn) {
  const trendingList = document.getElementById("trendingList");
  if (!trendingList) return;

  // Create recommended list container if it doesn't exist
  let recommendedList = document.getElementById("recommendedList");
  if (!recommendedList) {
    recommendedList = document.createElement("ul");
    recommendedList.id = "recommendedList";
    recommendedList.className = "trending-list";
    recommendedList.style.display = "none";
    trendingList.parentNode.insertBefore(
      recommendedList,
      trendingList.nextSibling
    );
  }

  // Clear and populate
  recommendedList.innerHTML = "";

  if (movies.length === 0) {
    recommendedList.innerHTML = `
      <li class="empty-message">
        <p>No recommendations yet. Rate some movies to get personalized suggestions!</p>
      </li>
    `;
    return;
  }

  // Add subtitle showing basis for recommendations
  const subtitle = document.createElement("p");
  subtitle.className = "recommended-subtitle";
  subtitle.textContent = `Based on: ${basedOn.join(", ")}`;
  subtitle.style.cssText =
    "font-size: 12px; color: #999; margin: 10px 15px; font-style: italic;";
  recommendedList.appendChild(subtitle);

  movies.forEach((movie, index) => {
    const li = document.createElement("li");
    li.className = "trending-item";
    li.style.cursor = "pointer";
    li.onclick = () => {
      window.location.href = `movie.html?id=${movie.movieId}`;
    };

    li.innerHTML = `
      <div class="trending-thumb" style="background-image: url('${
        movie.posterPath || "../pictures/movie_posters/default.jpg"
      }');"></div>
      <div class="trending-info">
        <h3>${movie.title}</h3>
        <div class="trending-meta">
          <span>${movie.releaseYear || "N/A"}</span>
        </div>
        ${
          movie.avgRating
            ? `
          <div class="trending-rating">
            <img src="../pictures/star.png" />
            <span>${movie.avgRating}</span>
          </div>
        `
            : ""
        }
      </div>
      <span class="trending-rank">${index + 1}</span>
    `;

    recommendedList.appendChild(li);
  });
}

/**
 * Load recent activity feed
 */
async function loadRecentActivity() {
  try {
    const data = await App.get("/dashboard/recent-activity?limit=10");

    if (data.success && data.activities) {
      displayActivityFeed(data.activities);
    }
  } catch (error) {
    console.error("[Dashboard] Failed to load activity:", error);
  }
}

/**
 * Display activity feed
 */
function displayActivityFeed(activities) {
  const activityFeed = document.querySelector(".activity-feed");
  if (!activityFeed) return;

  // Keep the load more button
  const loadMoreBtn = activityFeed.querySelector(".load-more-wrap");

  // Clear existing cards (keep first 2 as examples, then add real data)
  const existingCards = activityFeed.querySelectorAll(".feed-card");

  if (activities.length === 0) {
    // No friends activity - show message
    const emptyMessage = document.createElement("div");
    emptyMessage.className = "empty-activity";
    emptyMessage.style.cssText =
      "padding: 40px; text-align: center; color: #999;";
    emptyMessage.innerHTML = `
      <p>No recent activity from friends.</p>
      <p style="margin-top: 10px;">Add friends to see their movie reviews and updates!</p>
    `;

    // Replace all cards with empty message
    existingCards.forEach((card) => card.remove());
    activityFeed.insertBefore(emptyMessage, loadMoreBtn);
    return;
  }

  // Add real activities after the first 2 example cards
  activities.forEach((activity) => {
    const card = createActivityCard(activity);
    activityFeed.insertBefore(card, loadMoreBtn);
  });
}

/**
 * Create activity card HTML
 */
function createActivityCard(activity) {
  const article = document.createElement("article");
  article.className = "feed-card";

  const timeAgo = getTimeAgo(new Date(activity.activityDate));

  if (activity.type === "review") {
    article.innerHTML = `
      <div class="feed-header">
        <div class="feed-avatar">
          <img src="../pictures/profile.png" />
        </div>
        <div class="feed-meta">
          <div class="feed-title-row">
            <span class="feed-name">${activity.name || activity.username}</span>
            <span class="feed-dot">•</span>
            <span class="feed-time-inline">${timeAgo}</span>
          </div>
          <span class="feed-subtitle">reviewed ${activity.movieTitle}</span>
        </div>
        ${
          activity.rating
            ? `
          <div class="feed-rating-pill">
            <img src="../pictures/star.png" />
            <span>${activity.rating}</span>
          </div>
        `
            : ""
        }
      </div>

      <p>${activity.reviewText || "No review text provided."}</p>

      <div class="feed-footer">
        <div class="feed-stats">
          <span>View movie</span>
        </div>
        <button class="share-btn">
          <img src="../pictures/share.png" />
        </button>
      </div>
    `;

    // Make clickable to go to movie page
    article.style.cursor = "pointer";
    article.onclick = (e) => {
      if (!e.target.closest(".share-btn")) {
        window.location.href = `movie.html?id=${activity.movieId}`;
      }
    };
  }

  return article;
}

/**
 * Calculate time ago (e.g., "2 hours ago")
 */
function getTimeAgo(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  return App.formatDate(date);
}

/**
 * Setup trending/recommended tabs
 */
function setupTrendingTabs() {
  const tabs = document.querySelectorAll(".trending-tab");
  const trendingList = document.getElementById("trendingList");
  const recommendedList = document.getElementById("recommendedList");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      // Update active state
      tabs.forEach((t) => t.classList.remove("trending-tab--active"));
      tab.classList.add("trending-tab--active");

      // Show/hide lists
      const activeTab = tab.dataset.tab;
      if (activeTab === "trending") {
        if (trendingList) trendingList.style.display = "block";
        if (recommendedList) recommendedList.style.display = "none";
      } else if (activeTab === "recommended") {
        if (trendingList) trendingList.style.display = "none";
        if (recommendedList) recommendedList.style.display = "block";
      }
    });
  });
}

// Setup load more button
document.addEventListener("DOMContentLoaded", () => {
  const loadMoreBtn = document.querySelector(".load-more-btn");
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener("click", () => {
      App.showInfo("Load more functionality coming soon!");
    });
  }
});
