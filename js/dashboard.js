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

  // Initialize activity feed state
  window.dashboardState = {
    activityPage: 1,
    activityLimit: 10,
    hasMoreActivity: true,
  };

  // Load dashboard data
  await Promise.all([
    loadStats(),
    loadRecommended(),
    loadTrending(),
    loadRecentActivity(),
  ]);

  // Setup tab switching for trending/recommended
  setupTrendingTabs();

  // Setup load more button
  setupLoadMore();

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
 * Load trending movies
 */
async function loadTrending() {
  try {
    const data = await App.get("/dashboard/trending?limit=5&days=30");

    if (data.success && data.movies) {
      displayTrendingMovies(data.movies);
    }
  } catch (error) {
    console.error("[Dashboard] Failed to load trending:", error);
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
      <li class="empty-message" style="padding: 40px 20px; text-align: center; color: var(--TextColor); min-height: 150px; display: flex; align-items: center; justify-content: center;">
        <p style="font-size: 14px; opacity: 0.7;">No recommendations yet. Rate some movies to get personalized suggestions!</p>
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
            <span style="color: #95a5a6; font-size: 0.85em; margin-left: 4px;">(${
              movie.reviewCount || 0
            })</span>
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
 * Display trending movies
 */
function displayTrendingMovies(movies) {
  const trendingList = document.getElementById("trendingList");
  if (!trendingList) return;

  trendingList.innerHTML = "";

  if (movies.length === 0) {
    trendingList.innerHTML = `
      <li class="empty-message" style="padding: 40px 20px; text-align: center; color: var(--TextColor); min-height: 150px; display: flex; align-items: center; justify-content: center;">
        <p style="font-size: 14px; opacity: 0.7;">No trending movies in the last 30 days</p>
      </li>
    `;
    return;
  }

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
            <span style="color: #95a5a6; font-size: 0.85em; margin-left: 4px;">(${
              movie.reviewCount || 0
            })</span>
          </div>
        `
            : ""
        }
      </div>
      <span class="trending-rank">${index + 1}</span>
    `;

    trendingList.appendChild(li);
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
      // Update hasMore flag
      window.dashboardState.hasMoreActivity = data.hasMore;
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

  // Clear ALL existing cards (including dummy/static ones)
  const existingCards = activityFeed.querySelectorAll(".feed-card");
  existingCards.forEach((card) => card.remove());

  if (activities.length === 0) {
    // No friends activity - show message
    const emptyMessage = document.createElement("div");
    emptyMessage.className = "empty-activity";
    emptyMessage.style.cssText =
      "padding: 60px 20px; text-align: center; color: var(--TextColor); min-height: 250px; display: flex; flex-direction: column; align-items: center; justify-content: center;";
    emptyMessage.innerHTML = `
      <p style="font-size: 16px; font-weight: 600; margin-bottom: 10px;">No recent activity from friends</p>
      <p style="font-size: 14px; opacity: 0.7;">Add friends to see their movie reviews and updates!</p>
    `;

    activityFeed.insertBefore(emptyMessage, loadMoreBtn);
    return;
  }

  // Add real activities
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

  // Get profile picture with fallback to default
  const profilePic = activity.profilePicture || "../pictures/profile.png";

  if (activity.type === "review") {
    article.innerHTML = `
      <div class="feed-header">
        <div class="feed-avatar">
          <img src="${profilePic}" />
        </div>
        <div class="feed-meta">
          <div class="feed-title-row">
            <span class="feed-name" data-username="${
              activity.username
            }" style="cursor: pointer; color: var(--DarkBlue);" title="View ${
      activity.name || activity.username
    }'s profile">${activity.name || activity.username}</span>
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
    `;

    // Make clickable to go to movie page (reviews tab with specific review)
    article.style.cursor = "pointer";
    article.onclick = () => {
      window.location.href = `movie.html?id=${activity.movieId}&tab=reviews&reviewUserId=${activity.userId}`;
    };
  } else if (activity.type === "post") {
    article.innerHTML = `
      <div class="feed-header">
        <div class="feed-avatar">
          <img src="${profilePic}" />
        </div>
        <div class="feed-meta">
          <div class="feed-title-row">
            <span class="feed-name" data-username="${
              activity.username
            }" style="cursor: pointer; color: var(--DarkBlue);" title="View ${
      activity.name || activity.username
    }'s profile">${activity.name || activity.username}</span>
            <span class="feed-dot">•</span>
            <span class="feed-time-inline">${timeAgo}</span>
          </div>
          <span class="feed-subtitle">posted about ${activity.movieTitle}</span>
        </div>
      </div>

      <p>${activity.postContent}</p>
      
      <div class="feed-stats">
        <span>💬 ${activity.commentCount || 0} comments</span>
        <span>❤️ ${activity.likeCount || 0} likes</span>
      </div>
    `;

    // Make clickable to go to discussion tab with this specific post
    article.style.cursor = "pointer";
    article.onclick = () => {
      window.location.href = `movie.html?id=${activity.movieId}&tab=discussion&postId=${activity.postID}`;
    };
  } else if (activity.type === "comment") {
    article.innerHTML = `
      <div class="feed-header">
        <div class="feed-avatar">
          <img src="${profilePic}" />
        </div>
        <div class="feed-meta">
          <div class="feed-title-row">
            <span class="feed-name" data-username="${
              activity.username
            }" style="cursor: pointer; color: var(--DarkBlue);" title="View ${
      activity.name || activity.username
    }'s profile">${activity.name || activity.username}</span>
            <span class="feed-dot">•</span>
            <span class="feed-time-inline">${timeAgo}</span>
          </div>
          <span class="feed-subtitle">commented on your post about ${
            activity.movieTitle
          }</span>
        </div>
      </div>

      <div style="background: #f5f5f5; padding: 10px; border-radius: 8px; margin-bottom: 10px; font-size: 0.9em; color: #666;">
        Your post: "${activity.originalPost.substring(0, 100)}${
      activity.originalPost.length > 100 ? "..." : ""
    }"
      </div>

      <p>${activity.commentContent}</p>
    `;

    // Make clickable to go to discussion tab with the post being commented on
    article.style.cursor = "pointer";
    article.onclick = () => {
      window.location.href = `movie.html?id=${activity.movieId}&tab=discussion&postId=${activity.postID}`;
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
function setupLoadMore() {
  const loadMoreBtn = document.querySelector(".load-more-btn");
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener("click", async () => {
      if (!window.dashboardState.hasMoreActivity) {
        App.showInfo("No more activities to load");
        return;
      }

      loadMoreBtn.disabled = true;
      loadMoreBtn.textContent = "Loading...";

      try {
        window.dashboardState.activityPage++;
        const offset =
          (window.dashboardState.activityPage - 1) *
          window.dashboardState.activityLimit;

        const data = await App.get(
          `/dashboard/recent-activity?limit=${window.dashboardState.activityLimit}&offset=${offset}`
        );

        if (data.success && data.activities && data.activities.length > 0) {
          appendActivities(data.activities);

          // Update hasMore flag from server
          window.dashboardState.hasMoreActivity = data.hasMore;

          if (!data.hasMore) {
            loadMoreBtn.textContent = "No more activities";
            loadMoreBtn.disabled = true;
          } else {
            loadMoreBtn.textContent = "Load More Activity";
            loadMoreBtn.disabled = false;
          }
        } else {
          window.dashboardState.hasMoreActivity = false;
          loadMoreBtn.textContent = "No more activities";
          loadMoreBtn.disabled = true;
        }
      } catch (error) {
        console.error("[Dashboard] Failed to load more activity:", error);
        App.showError("Failed to load more activity");
        loadMoreBtn.textContent = "Load More Activity";
        loadMoreBtn.disabled = false;
      }
    });
  }
}

/**
 * Append activities to the feed
 */
function appendActivities(activities) {
  const activityFeed = document.querySelector(".activity-feed");
  const loadMoreBtn = activityFeed.querySelector(".load-more-wrap");

  activities.forEach((activity) => {
    const card = createActivityCard(activity);
    activityFeed.insertBefore(card, loadMoreBtn);
  });
}
