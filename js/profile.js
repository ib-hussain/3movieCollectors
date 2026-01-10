// PROFILE PAGE SCRIPT
document.addEventListener("DOMContentLoaded", async () => {
  // Check if App helper exists
  if (typeof App === "undefined") {
    console.error("App helper not loaded");
    return;
  }

  // Get username from URL (e.g., ?user=johndoe)
  const urlParams = new URLSearchParams(window.location.search);
  const viewingUsername = urlParams.get("user");

  let profileData = null;
  let isOwnProfile = false;

  // Load profile data
  try {
    if (viewingUsername) {
      // Viewing another user's profile
      profileData = await loadUserProfile(viewingUsername);
      isOwnProfile = false;
    } else {
      // Viewing own profile
      profileData = await loadOwnProfile();
      isOwnProfile = true;
    }

    if (profileData) {
      displayProfile(profileData, isOwnProfile);

      // Setup profile picture edit AFTER displaying profile (only for own profile)
      if (isOwnProfile) {
        setupProfilePictureEdit();
      }
    }
  } catch (error) {
    console.error("Error loading profile:", error);
    App.showToast("Failed to load profile", "error");
  }
});

// Load own profile
async function loadOwnProfile() {
  try {
    const data = await App.fetchJSON("/api/profile/me");
    return data.profile;
  } catch (error) {
    console.error("Error loading own profile:", error);

    // If not authenticated (401), redirect to login
    if (error.message && error.message.includes("401")) {
      App.showToast("Please log in to view your profile", "error");
      setTimeout(() => {
        window.location.href = "/login.html";
      }, 1500);
      return null;
    }

    throw error;
  }
}

// Load another user's profile by username
async function loadUserProfile(username) {
  try {
    const data = await App.fetchJSON(`/api/profile/${username}`);
    return data.profile;
  } catch (error) {
    console.error(`Error loading profile for ${username}:`, error);
    throw error;
  }
}

// Display profile data
function displayProfile(profile, isOwnProfile) {
  // Update profile header
  document.getElementById("profile-name").textContent = profile.name;
  document.getElementById(
    "profile-handle"
  ).textContent = `@${profile.username}`;

  // Format registration date
  const regDate = new Date(profile.registrationDate);
  const formattedDate = regDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  document.getElementById(
    "profile-meta"
  ).textContent = `Joined ${formattedDate}`;

  // Update profile avatar
  const avatar = document.getElementById("profile-avatar");
  if (profile.profilePicture) {
    avatar.src = profile.profilePicture;
  } else {
    // Use default profile picture or initials
    avatar.src = "../pictures/profile.png";
  }

  // Show edit button only for own profile
  if (isOwnProfile) {
    document.getElementById("profile-edit-btn").style.display = "flex";
  }

  // Update stats
  document.getElementById("stat-movies-watched").textContent =
    profile.stats.moviesWatched;
  document.getElementById("stat-reviews").textContent = profile.stats.reviews;
  document.getElementById("stat-friends").textContent = profile.stats.friends;
  document.getElementById("stat-watchlist").textContent =
    profile.stats.watchlist;

  // Update favorite genres
  displayFavoriteGenres(profile.favoriteGenres);

  // Display reviews
  displayReviews(
    profile.reviews,
    profile.name,
    profile.profilePicture,
    profile
  );
}

// Display favorite genres
function displayFavoriteGenres(genres) {
  const genresList = document.getElementById("profile-genres-list");

  if (!genres || genres.length === 0) {
    genresList.innerHTML = '<span class="genre-pill">No genres yet</span>';
    return;
  }

  genresList.innerHTML = genres
    .map((genre) => `<span class="genre-pill">${genre}</span>`)
    .join("");
}

// Display reviews
function displayReviews(reviews, userName, profilePicture, profile) {
  const reviewsList = document.getElementById("reviews-list");

  if (!reviews || reviews.length === 0) {
    reviewsList.innerHTML = `
      <div style="text-align: center; padding: 60px 20px; color: var(--TextColor); min-height: 200px; display: flex; align-items: center; justify-content: center;">
        <p style="font-size: 14px; opacity: 0.7;">No reviews yet</p>
      </div>
    `;
    return;
  }

  reviewsList.innerHTML = reviews
    .map((review) =>
      createReviewCard(review, userName, profilePicture, profile.username)
    )
    .join("");
}

// Create a review card HTML
function createReviewCard(review, userName, profilePicture, username) {
  const reviewDate = new Date(review.reviewDate);
  const timeAgo = getTimeAgo(reviewDate);

  // Calculate initials if no profile picture
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);

  const avatarHTML = profilePicture
    ? `<img src="${profilePicture}" alt="${userName}" class="review-avatar">`
    : `<div class="review-avatar" style="background-color: var(--DarkBlue); color: white; display: flex; align-items: center; justify-content: center; font-weight: 600;">${initials}</div>`;

  return `
        <article class="review-card" style="cursor: pointer;" onclick="window.location.href='movie.html?id=${
          review.movieID
        }'">
            <div class="review-header">
                <div class="review-user">
                    ${avatarHTML}
                    <div>
                        <h3 class="review-user-name" ${
                          username
                            ? `data-username="${username}" style="cursor: pointer; color: var(--DarkBlue);"`
                            : ""
                        }>${userName}</h3>
                        <p class="review-meta">
                            reviewed <span class="review-film">${
                              review.movieTitle
                            }</span> • ${timeAgo}
                        </p>
                    </div>
                </div>
                <div class="review-rating">
                    <img src="../pictures/star.png" alt="rating">
                    <span>${parseFloat(review.rating).toFixed(1)}</span>
                </div>
            </div>
            <p class="review-text">${review.review}</p>
        </article>
    `;
}

// Calculate time ago from date
function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 604800)} weeks ago`;
  if (seconds < 31536000) return `${Math.floor(seconds / 2592000)} months ago`;
  return `${Math.floor(seconds / 31536000)} years ago`;
}

// Setup profile picture edit functionality
function setupProfilePictureEdit() {
  const editBtn = document.getElementById("profile-edit-btn");
  const modal = document.getElementById("profile-picture-modal");

  if (!editBtn || !modal) {
    console.error("Profile picture edit elements not found");
    return;
  }

  const closeBtn = modal.querySelector(".modal-close");
  const saveBtn = document.getElementById("save-profile-picture");
  const urlInput = document.getElementById("profile-picture-url");

  if (!closeBtn || !saveBtn || !urlInput) {
    console.error("Modal elements not found");
    return;
  }

  // Open modal
  editBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    modal.style.display = "flex";
    urlInput.value = "";
    urlInput.focus();
  });

  // Close modal
  closeBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });

  // Close modal when clicking outside
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.style.display = "none";
    }
  });

  // Save profile picture
  saveBtn.addEventListener("click", async () => {
    const newPictureUrl = urlInput.value.trim();

    if (!newPictureUrl) {
      App.showToast("Please enter an image URL", "error");
      return;
    }

    try {
      const response = await App.fetchJSON("/api/profile/picture", {
        method: "PATCH",
        body: JSON.stringify({ profilePicture: newPictureUrl }),
      });

      App.showToast("Profile picture updated successfully!", "success");
      modal.style.display = "none";

      // Update the avatar image
      document.getElementById("profile-avatar").src = newPictureUrl;
    } catch (error) {
      console.error("Error updating profile picture:", error);
      const errorMessage = error.message.includes(
        "Valid profile picture URL required"
      )
        ? "Please enter a valid image URL"
        : error.message.includes("Invalid profile picture URL format")
        ? "URL must start with https:// or /pictures/"
        : "Failed to update profile picture";
      App.showToast(errorMessage, "error");
    }
  });
}
