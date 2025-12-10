// movie.js - Movie Detail Page
// Handles dynamic loading of movie details, watchlist, discussions, and similar movies

window.initPage = window.initPage || {};

window.initPage.movie = async function () {
  // Get movie ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const movieId = urlParams.get("id");

  if (!movieId) {
    alert("No movie selected");
    window.location.href = "browse-movies.html";
    return;
  }

  // Initialize
  await loadMovieDetails(movieId);
  await loadWatchlistStatus(movieId);
  await loadReviews(movieId);
  await loadUserReview(movieId);
  await loadPosts(movieId);
  await loadSimilarMovies(movieId);

  setupTabSwitching();
  setupWatchlistButton(movieId);
  setupReviewForm(movieId);
  setupPostForm(movieId);

  // Handle tab and postId from URL parameters
  handleUrlParameters(urlParams);
};

// ==================== MOVIE DETAILS ====================

async function loadMovieDetails(movieId) {
  try {
    const data = await App.get(`/movies/${movieId}`);

    console.log("Movie API Response:", data);

    if (!data.success) {
      console.error("API returned error:", data);
      throw new Error(data.message || "Failed to load movie");
    }

    const movie = data.movie;
    console.log("Movie data:", movie);

    // Update page title
    const pageTitle = document.getElementById("page-title");
    if (pageTitle) {
      pageTitle.textContent = `${movie.title} – 3movieCollectors`;
    }

    // Update movie info
    const titleEl = document.getElementById("movie-title");
    if (titleEl) titleEl.textContent = movie.title;

    const yearEl = document.getElementById("movie-year");
    if (yearEl) yearEl.textContent = movie.releaseYear;

    const directorEl = document.getElementById("movie-director");
    if (directorEl) directorEl.textContent = movie.director || "Unknown";

    const ratingEl = document.getElementById("movie-rating");
    if (ratingEl) ratingEl.textContent = movie.avgRating;

    const synopsisEl = document.getElementById("movie-synopsis");
    if (synopsisEl)
      synopsisEl.textContent = movie.synopsis || "No synopsis available.";

    // Update poster
    const posterImg = document.getElementById("movie-poster");
    if (posterImg) {
      posterImg.src = movie.posterPath || "/pictures/white.png";
      posterImg.alt = movie.title;
    }

    // Update genres
    const genresContainer = document.getElementById("movie-genres");
    if (genresContainer) {
      genresContainer.innerHTML = "";
      if (movie.genres) {
        const genreList = movie.genres.split(", ");
        genreList.forEach((genre) => {
          const pill = document.createElement("span");
          pill.className = "genre-pill";
          pill.textContent = genre;
          genresContainer.appendChild(pill);
        });
      }
    }

    // Update discussion title
    const discussionTitle = document.getElementById("discussion-title");
    if (discussionTitle) {
      discussionTitle.textContent = `Discussion about ${movie.title}`;
    }

    console.log("Movie details loaded successfully");
  } catch (error) {
    console.error("Error loading movie details:", error);
    console.error("Error stack:", error.stack);
    alert("Failed to load movie details. Please try again.");
    window.location.href = "browse-movies.html";
  }
}

// ==================== WATCHLIST ====================

let isInWatchlist = false;

async function loadWatchlistStatus(movieId) {
  try {
    const data = await App.get(`/watchlist/${movieId}`);
    isInWatchlist = data.inWatchlist;
    updateWatchlistButton();
  } catch (error) {
    console.error("Error loading watchlist status:", error);
  }
}

function updateWatchlistButton() {
  const btn = document.getElementById("watchlist-btn");
  const text = document.getElementById("watchlist-text");

  if (isInWatchlist) {
    text.textContent = "Remove from Watchlist";
    btn.style.background = "#95a5a6";
  } else {
    text.textContent = "Add to Watchlist";
    btn.style.background = "#e74c3c";
  }
}

function setupWatchlistButton(movieId) {
  const btn = document.getElementById("watchlist-btn");

  btn.addEventListener("click", async () => {
    try {
      if (isInWatchlist) {
        // Remove from watchlist
        await App.delete(`/watchlist/${movieId}`);
        isInWatchlist = false;
        App.showToast("Removed from watchlist", "success");
      } else {
        // Add to watchlist
        await App.post("/watchlist", { movieId: parseInt(movieId) });
        isInWatchlist = true;
        App.showToast("Added to watchlist", "success");
      }

      updateWatchlistButton();
    } catch (error) {
      console.error("Watchlist error:", error);
      if (error.message && error.message.includes("log in")) {
        alert("Please log in to manage your watchlist");
        window.location.href = "login.html";
      } else {
        alert("Failed to update watchlist. Please try again.");
      }
    }
  });
}

// ==================== DISCUSSION POSTS ====================

let currentMovieId = null;

async function loadPosts(movieId) {
  currentMovieId = movieId;

  try {
    const data = await App.get(`/movies/${movieId}/posts`);

    if (data.success) {
      displayPosts(data.posts);
      document.getElementById("discussion-count").textContent =
        data.posts.length;
    }
  } catch (error) {
    console.error("Error loading posts:", error);
  }
}

function displayPosts(posts) {
  const container = document.getElementById("posts-container");
  container.innerHTML = "";

  if (posts.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 60px 20px; color: var(--TextColor); min-height: 300px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
        <p style="font-size: 18px; margin-bottom: 10px; font-weight: 600;">No discussions yet</p>
        <p style="font-size: 14px; opacity: 0.7;">Be the first to share your thoughts!</p>
      </div>
    `;
    return;
  }

  posts.forEach((post) => {
    const postEl = createPostElement(post);
    container.appendChild(postEl);
  });
}

function createPostElement(post) {
  const postDiv = document.createElement("div");
  postDiv.className = "comment-card";
  postDiv.id = `post-${post.postId}`; // Add ID for scrolling
  postDiv.dataset.postId = post.postId;

  const likeButtonClass = post.isLikedByCurrentUser ? "liked" : "";
  const likeButtonText = post.isLikedByCurrentUser ? "♥" : "♡";

  postDiv.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: start;">
      <div style="flex: 1;">
        <h3>${escapeHtml(
          post.author.name
        )} <span style="color: #95a5a6; font-size: 14px; font-weight: normal;">@${escapeHtml(
    post.author.username
  )}</span></h3>
        <p style="margin: 10px 0;">${escapeHtml(post.content)}</p>
        <div style="display: flex; gap: 15px; margin-top: 10px; font-size: 14px;">
          <button class="like-btn ${likeButtonClass}" data-post-id="${
    post.postId
  }" style="padding: 5px 12px; background: ${
    post.isLikedByCurrentUser ? "#e74c3c" : "#ecf0f1"
  }; color: ${
    post.isLikedByCurrentUser ? "white" : "#2c3e50"
  }; border: none; border-radius: 5px; cursor: pointer; font-size: 14px;">
            Like (<span class="like-count">${post.likeCount}</span>)
          </button>
          <button class="comment-toggle-btn" data-post-id="${
            post.postId
          }" style="padding: 5px 12px; background: #ecf0f1; color: #2c3e50; border: none; border-radius: 5px; cursor: pointer; font-size: 14px;">
            Comment (${post.commentCount})
          </button>
          ${
            post.isAuthor
              ? `<button class="delete-post-btn" data-post-id="${post.postId}" style="background: none; border: none; cursor: pointer; color: #e74c3c; margin-left: auto;">Delete</button>`
              : ""
          }
        </div>
      </div>
    </div>
    <div class="comments-section" data-post-id="${
      post.postId
    }" style="display: none; margin-top: 20px; padding-top: 20px; border-top: 1px solid #ecf0f1;">
      <!-- Comments will be loaded here -->
    </div>
  `;

  // Attach event listeners
  const likeBtn = postDiv.querySelector(".like-btn");
  likeBtn.addEventListener("click", () => handleLikePost(post.postId));

  const commentToggle = postDiv.querySelector(".comment-toggle-btn");
  commentToggle.addEventListener("click", () => toggleComments(post.postId));

  const deleteBtn = postDiv.querySelector(".delete-post-btn");
  if (deleteBtn) {
    deleteBtn.addEventListener("click", () => handleDeletePost(post.postId));
  }

  return postDiv;
}

function setupPostForm(movieId) {
  const postBtn = document.getElementById("post-btn");
  const postInput = document.getElementById("post-input");

  postBtn.addEventListener("click", async () => {
    const content = postInput.value.trim();

    if (!content) {
      alert("Please enter some text");
      return;
    }

    try {
      const data = await App.post(`/movies/${movieId}/posts`, { content });

      if (data.success) {
        postInput.value = "";
        await loadPosts(movieId); // Reload all posts
        App.showToast("Post created successfully", "success");
      }
    } catch (error) {
      console.error("Error creating post:", error);
      if (error.message && error.message.includes("log in")) {
        alert("Please log in to post");
        window.location.href = "login.html";
      } else {
        alert("Failed to create post. Please try again.");
      }
    }
  });
}

async function handleLikePost(postId) {
  try {
    const data = await App.post(`/posts/${postId}/like`);

    if (data.success) {
      // Update UI
      const postEl = document.querySelector(`[data-post-id="${postId}"]`);
      const likeBtn = postEl.querySelector(".like-btn");
      const likeCount = likeBtn.querySelector(".like-count");

      likeCount.textContent = data.likeCount;

      if (data.action === "liked") {
        likeBtn.classList.add("liked");
        likeBtn.style.background = "#e74c3c";
        likeBtn.style.color = "white";
        likeBtn.innerHTML = `Like (<span class="like-count">${data.likeCount}</span>)`;
      } else {
        likeBtn.classList.remove("liked");
        likeBtn.style.background = "#ecf0f1";
        likeBtn.style.color = "#2c3e50";
        likeBtn.innerHTML = `Like (<span class="like-count">${data.likeCount}</span>)`;
      }
    }
  } catch (error) {
    console.error("Error liking post:", error);
    if (error.message && error.message.includes("log in")) {
      alert("Please log in to like posts");
      window.location.href = "login.html";
    } else if (error.message && error.message.includes("own post")) {
      alert("You cannot like your own post");
    } else {
      alert("Failed to like post. Please try again.");
    }
  }
}

async function handleDeletePost(postId) {
  if (!confirm("Are you sure you want to delete this post?")) {
    return;
  }

  try {
    const data = await App.delete(`/posts/${postId}`);

    if (data.success) {
      await loadPosts(currentMovieId);
      App.showToast("Post deleted successfully", "success");
    }
  } catch (error) {
    console.error("Error deleting post:", error);
    alert("Failed to delete post. Please try again.");
  }
}

async function toggleComments(postId) {
  const commentsSection = document.querySelector(
    `.comments-section[data-post-id="${postId}"]`
  );

  if (commentsSection.style.display === "none") {
    // Load and show comments
    await loadComments(postId);
    commentsSection.style.display = "block";
  } else {
    // Hide comments
    commentsSection.style.display = "none";
  }
}

async function loadComments(postId) {
  try {
    const data = await App.get(`/posts/${postId}/comments`);

    if (data.success) {
      displayComments(postId, data.comments);
    }
  } catch (error) {
    console.error("Error loading comments:", error);
  }
}

function displayComments(postId, comments) {
  const commentsSection = document.querySelector(
    `.comments-section[data-post-id="${postId}"]`
  );

  let html = `
    <div class="comment-input-area" style="margin-bottom: 15px; margin-left: 20px;">
      <textarea class="comment-input" placeholder="Write a comment..." style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; min-height: 60px;"></textarea>
      <button class="add-comment-btn" data-post-id="${postId}" style="margin-top: 5px; padding: 8px 15px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer;">Comment</button>
    </div>
  `;

  if (comments.length === 0) {
    html += `
      <div style="text-align: center; padding: 30px 20px; color: var(--TextColor); opacity: 0.7;">
        <p style="font-size: 14px; font-style: italic;">No comments yet. Be the first to comment!</p>
      </div>
    `;
  } else {
    comments.forEach((comment) => {
      html += `
        <div class="comment-item" style="padding: 10px 0; padding-left: 20px; margin-left: 20px; border-bottom: 1px solid #ecf0f1; border-left: 2px solid #ecf0f1;">
          <strong>${escapeHtml(
            comment.author.name
          )}</strong> <span style="color: #95a5a6; font-size: 12px;">@${escapeHtml(
        comment.author.username
      )}</span>
          <p style="margin: 5px 0 0 0;">${escapeHtml(comment.content)}</p>
        </div>
      `;
    });
  }

  commentsSection.innerHTML = html;

  // Attach comment button listener
  const addCommentBtn = commentsSection.querySelector(".add-comment-btn");
  addCommentBtn.addEventListener("click", () => handleAddComment(postId));
}

async function handleAddComment(postId) {
  const commentsSection = document.querySelector(
    `.comments-section[data-post-id="${postId}"]`
  );
  const commentInput = commentsSection.querySelector(".comment-input");
  const content = commentInput.value.trim();

  if (!content) {
    alert("Please enter a comment");
    return;
  }

  try {
    const data = await App.post(`/posts/${postId}/comments`, { content });

    if (data.success) {
      commentInput.value = "";
      await loadComments(postId); // Reload comments

      // Update comment count in post
      const postCard = document.querySelector(
        `.comment-card[data-post-id="${postId}"]`
      );
      const commentToggle = postCard.querySelector(".comment-toggle-btn");
      const currentCount = parseInt(commentToggle.textContent.match(/\d+/)[0]);
      commentToggle.innerHTML = `💬 ${currentCount + 1}`;

      App.showToast("Comment added", "success");
    }
  } catch (error) {
    console.error("Error adding comment:", error);
    if (error.message && error.message.includes("log in")) {
      alert("Please log in to comment");
      window.location.href = "login.html";
    } else {
      alert("Failed to add comment. Please try again.");
    }
  }
}

// ==================== SIMILAR MOVIES ====================

async function loadSimilarMovies(movieId) {
  try {
    const data = await App.get(`/movies/${movieId}/similar?limit=8`);

    if (data.success) {
      displaySimilarMovies(data.movies);
    }
  } catch (error) {
    console.error("Error loading similar movies:", error);
  }
}

function displaySimilarMovies(movies) {
  const container = document.getElementById("similar-movies");
  container.innerHTML = "";

  if (movies.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px 20px; color: var(--TextColor); min-height: 150px; display: flex; align-items: center; justify-content: center;">
        <p style="font-size: 14px; opacity: 0.7;">No similar movies found</p>
      </div>
    `;
    return;
  }

  movies.forEach((movie) => {
    const card = document.createElement("div");
    card.className = "movie-card";
    card.style.cursor = "pointer";
    card.onclick = () => {
      window.location.href = `movie.html?id=${movie.movieId}`;
    };

    card.innerHTML = `
      <div class="thumb" style="background-image: url('${
        movie.posterPath || "/pictures/white.png"
      }'); background-size: cover; background-position: center;"></div>
      <h3>${escapeHtml(movie.title)}</h3>
      <p>${movie.releaseYear} • ${escapeHtml(movie.genres || "Unknown")}</p>
    `;

    container.appendChild(card);
  });
}

// ==================== REVIEWS & RATINGS ====================

let userReviewData = null;

async function loadReviews(movieId) {
  try {
    const data = await App.get(`/movies/${movieId}/reviews`);

    if (data.success) {
      displayReviews(data.reviews);
      displayRatingStats(data.stats);
      document.getElementById("reviews-count").textContent =
        data.stats.totalReviews;
    }
  } catch (error) {
    console.error("Error loading reviews:", error);
  }
}

async function loadUserReview(movieId) {
  try {
    const data = await App.get(`/movies/${movieId}/reviews/me`);

    if (data.success && data.review) {
      userReviewData = data.review;
      displayUserReview(data.review);
      document.getElementById("review-form-box").style.display = "none";
    } else {
      userReviewData = null;
      document.getElementById("user-review-container").style.display = "none";
      document.getElementById("review-form-box").style.display = "block";
    }
  } catch (error) {
    // User not logged in or no review - show form
    console.log("No user review found");
    document.getElementById("user-review-container").style.display = "none";
    document.getElementById("review-form-box").style.display = "block";
  }
}

function displayRatingStats(stats) {
  // Update average rating
  document.getElementById("avg-rating").textContent = stats.averageRating;
  document.getElementById("total-reviews").textContent = stats.totalReviews;

  // Update rating distribution bars
  const total = stats.totalReviews;

  for (let rating = 1; rating <= 10; rating++) {
    const count = stats.ratingDistribution[rating] || 0;
    const percentage = total > 0 ? (count / total) * 100 : 0;

    const barElement = document.querySelector(
      `.rating-bar[data-rating="${rating}"]`
    );
    if (barElement) {
      const fill = barElement.querySelector(".bar-fill");
      const percentText = barElement.querySelector(".rating-percent");

      if (fill) fill.style.width = `${percentage}%`;
      if (percentText) percentText.textContent = `${Math.round(percentage)}%`;
    }
  }
}

function displayReviews(reviews) {
  const container = document.getElementById("reviews-container");
  container.innerHTML = "";

  if (reviews.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 60px 20px; color: var(--TextColor); min-height: 200px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
        <p style="font-size: 18px; margin-bottom: 10px; font-weight: 600;">No reviews yet</p>
        <p style="font-size: 14px; opacity: 0.7;">Be the first to review this movie!</p>
      </div>
    `;
    return;
  }

  reviews.forEach((review) => {
    const reviewCard = createReviewCard(review);
    container.appendChild(reviewCard);
  });
}

function createReviewCard(review) {
  const card = document.createElement("div");
  card.className = "review-card";
  card.id = `review-${review.userID}`; // Add ID for scrolling

  const initials = review.userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);

  const reviewDate = new Date(review.reviewDate);
  const dateStr = reviewDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const isEdited =
    review.lastUpdated &&
    new Date(review.lastUpdated).getTime() !== reviewDate.getTime();

  card.innerHTML = `
    <div class="review-header">
      <div class="review-user">
        <div class="review-avatar">${initials}</div>
        <div class="review-user-info">
          <h4>${escapeHtml(review.userName)}</h4>
          <div class="review-date">${dateStr}</div>
        </div>
      </div>
      <div class="review-rating-badge">${review.rating}/10</div>
    </div>
    <div class="review-text">${escapeHtml(review.review)}</div>
    ${isEdited ? '<div class="review-edited">(Edited)</div>' : ""}
  `;

  return card;
}

function displayUserReview(review) {
  const container = document.getElementById("user-review-container");
  container.style.display = "block";

  const reviewDate = new Date(review.reviewDate);
  const dateStr = reviewDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  container.innerHTML = `
    <div class="review-header">
      <h4>Your Review</h4>
      <div class="review-rating">${review.rating}/10</div>
    </div>
    <div class="review-date" style="opacity: 0.8; font-size: 13px; margin-bottom: 8px;">${dateStr}</div>
    <div class="review-text">${escapeHtml(review.review)}</div>
    <div class="review-actions">
      <button id="edit-review-btn">Edit Review</button>
      <button id="delete-review-btn">Delete Review</button>
    </div>
  `;

  // Setup action buttons
  document.getElementById("edit-review-btn").addEventListener("click", () => {
    editUserReview(review);
  });

  document.getElementById("delete-review-btn").addEventListener("click", () => {
    deleteUserReview();
  });
}

function setupReviewForm(movieId) {
  const submitBtn = document.getElementById("submit-review-btn");
  const cancelBtn = document.getElementById("cancel-review-btn");
  const ratingSelect = document.getElementById("review-rating");
  const reviewText = document.getElementById("review-text");

  submitBtn.addEventListener("click", async () => {
    const rating = parseFloat(ratingSelect.value);
    const review = reviewText.value.trim();

    if (!rating || rating < 1 || rating > 10) {
      App.showToast("Please select a rating", "error");
      return;
    }

    if (!review) {
      App.showToast("Please write a review", "error");
      return;
    }

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = "Submitting...";

      if (userReviewData) {
        // Update existing review
        await App.patch(`/reviews/${movieId}`, { rating, review });
        App.showToast("Review updated successfully", "success");
      } else {
        // Create new review
        await App.post(`/movies/${movieId}/reviews`, { rating, review });
        App.showToast("Review posted successfully", "success");
      }

      // Reload reviews
      await Promise.all([
        loadReviews(movieId),
        loadUserReview(movieId),
        loadMovieDetails(movieId),
      ]);

      // Reset form
      ratingSelect.value = "";
      reviewText.value = "";
      cancelBtn.style.display = "none";
    } catch (error) {
      console.error("Error submitting review:", error);
      App.showToast(
        error.error || "Failed to submit review. Please try again.",
        "error"
      );
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit Review";
    }
  });

  cancelBtn.addEventListener("click", () => {
    // Reset form
    ratingSelect.value = "";
    reviewText.value = "";
    cancelBtn.style.display = "none";
    submitBtn.textContent = "Submit Review";

    // Show user's existing review if any
    if (userReviewData) {
      document.getElementById("review-form-box").style.display = "none";
      document.getElementById("user-review-container").style.display = "block";
    }
  });
}

function editUserReview(review) {
  // Hide user review display, show form
  document.getElementById("user-review-container").style.display = "none";
  document.getElementById("review-form-box").style.display = "block";

  // Populate form with existing data
  document.getElementById("review-rating").value = review.rating;
  document.getElementById("review-text").value = review.review;
  document.getElementById("submit-review-btn").textContent = "Update Review";
  document.getElementById("cancel-review-btn").style.display = "inline-block";
}

async function deleteUserReview() {
  if (!confirm("Are you sure you want to delete your review?")) {
    return;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const movieId = urlParams.get("id");

  try {
    await App.delete(`/reviews/${movieId}`);
    App.showToast("Review deleted successfully", "success");

    // Reload reviews
    await Promise.all([
      loadReviews(movieId),
      loadUserReview(movieId),
      loadMovieDetails(movieId),
    ]);
  } catch (error) {
    console.error("Error deleting review:", error);
    App.showToast("Failed to delete review. Please try again.", "error");
  }
}

// ==================== TAB SWITCHING ====================

function setupTabSwitching() {
  document.querySelectorAll(".overview-tabs .tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document
        .querySelectorAll(".overview-tabs .tab")
        .forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");

      const target = tab.getAttribute("data-target");

      document
        .querySelectorAll(".tab-content")
        .forEach((sec) => sec.classList.remove("active"));

      document.getElementById(target).classList.add("active");
    });
  });
}

// ==================== URL PARAMETER HANDLING ====================

function handleUrlParameters(urlParams) {
  const tab = urlParams.get("tab");
  const postId = urlParams.get("postId");
  const reviewUserId = urlParams.get("reviewUserId");

  // Switch to the specified tab if provided
  if (tab) {
    const targetSection = `${tab}-section`;
    const tabButton = document.querySelector(
      `.overview-tabs .tab[data-target="${targetSection}"]`
    );

    if (tabButton) {
      // Remove active from all tabs and sections
      document
        .querySelectorAll(".overview-tabs .tab")
        .forEach((t) => t.classList.remove("active"));
      document
        .querySelectorAll(".tab-content")
        .forEach((sec) => sec.classList.remove("active"));

      // Activate the target tab
      tabButton.classList.add("active");
      const targetElement = document.getElementById(targetSection);
      if (targetElement) {
        targetElement.classList.add("active");
      }
    }
  }

  // Scroll to specific post if postId is provided
  if (postId) {
    // Wait a bit for the DOM to update
    setTimeout(() => {
      const postElement = document.getElementById(`post-${postId}`);
      if (postElement) {
        postElement.scrollIntoView({ behavior: "smooth", block: "center" });
        // Add a highlight effect
        postElement.style.backgroundColor = "#fff3cd";
        setTimeout(() => {
          postElement.style.transition = "background-color 2s";
          postElement.style.backgroundColor = "";
        }, 1000);
      }
    }, 500);
  }

  // Scroll to specific review if reviewUserId is provided
  if (reviewUserId) {
    // Wait a bit for the DOM to update
    setTimeout(() => {
      const reviewElement = document.getElementById(`review-${reviewUserId}`);
      if (reviewElement) {
        reviewElement.scrollIntoView({ behavior: "smooth", block: "center" });
        // Add a highlight effect
        reviewElement.style.backgroundColor = "#fff3cd";
        setTimeout(() => {
          reviewElement.style.transition = "background-color 2s";
          reviewElement.style.backgroundColor = "";
        }, 1000);
      }
    }, 500);
  }
}

// ==================== UTILITY ====================

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Initialize on page load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", window.initPage.movie);
} else {
  window.initPage.movie();
}
