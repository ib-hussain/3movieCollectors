// events.js - Dynamic Events Page with real-time updates

// Prevent double execution
if (window.eventsPageInitialized) {
  console.warn(
    "[Events] Page already initialized, skipping duplicate execution"
  );
} else {
  window.eventsPageInitialized = true;

  document.addEventListener("DOMContentLoaded", async () => {
    // Wait for app.js to load
    await new Promise((resolve) => {
      if (window.App) resolve();
      else document.addEventListener("appLoaded", resolve);
    });

    // State
    let currentFilter = "upcoming";
    let events = [];

    // DOM Elements
    const tabs = document.querySelectorAll(".events-tab");
    const panels = document.querySelectorAll(".events-tab-panel");
    const hostBtn = document.querySelector(".events-host-btn");

    // Initialize
    init();

    async function init() {
      // Get current user
      const user = await App.getCurrentUser();
      if (!user) {
        console.error("[Events] Failed to load user");
        return;
      }

      setupEventListeners();
      await loadEvents("upcoming");
    }

    function setupEventListeners() {
      // Tab switching
      tabs.forEach((tab) => {
        tab.addEventListener("click", () => {
          const targetId = tab.dataset.tab;
          if (!targetId) return;

          const filter = targetId.replace("events-", "");
          activateTab(filter);
          loadEvents(filter);
        });
      });

      // Host Event button
      if (hostBtn) {
        hostBtn.addEventListener("click", showHostEventModal);
      }
    }

    function activateTab(filter) {
      currentFilter = filter;
      const targetId = `events-${filter}`;

      tabs.forEach((tab) => {
        const isActive = tab.dataset.tab === targetId;
        tab.classList.toggle("events-tab--active", isActive);
        tab.setAttribute("aria-selected", isActive ? "true" : "false");
      });

      panels.forEach((panel) => {
        const isActive = panel.id === targetId;
        panel.classList.toggle("events-tab-panel--active", isActive);
        panel.classList.toggle("events-tab-panel--hidden", !isActive);
      });
    }

    async function loadEvents(filter) {
      try {
        const data = await App.get(`/events?filter=${filter}`);
        events = data.events || [];
        renderEvents(filter);
      } catch (error) {
        console.error("Error loading events:", error);
        App.showError("Failed to load events");
      }
    }

    function renderEvents(filter) {
      const panelId = `events-${filter}`;
      const panel = document.getElementById(panelId);
      if (!panel) return;

      // Clear existing content
      panel.innerHTML = "";

      if (events.length === 0) {
        panel.innerHTML = `
        <div style="text-align: center; padding: 60px 20px; color: var(--TextColor); min-height: 300px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
          <p style="font-size: 16px; margin: 0; opacity: 0.7;">No ${filter} events found</p>
        </div>
      `;
        return;
      }

      // Render event cards
      events.forEach((event) => {
        const card = createEventCard(event, filter);
        panel.appendChild(card);
      });
    }

    function createEventCard(event, filter) {
      const article = document.createElement("article");
      article.className = "event-card";
      article.dataset.eventId = event.eventID;

      const eventDate = new Date(event.eventDateTime);
      const dateStr = eventDate.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      });
      const timeStr = eventDate.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });
      const durationStr = `${event.duration} min`;

      let actionButton = "";
      if (filter === "upcoming") {
        if (event.isJoined) {
          actionButton = `<button class="event-cta-button event-leave-btn" data-event-id="${event.eventID}">Leave Event</button>`;
        } else {
          const isFull = event.currentCapacity >= event.capacity;
          actionButton = `<button class="event-cta-button" data-event-id="${
            event.eventID
          }" ${isFull ? "disabled" : ""}>${
            isFull ? "Event Full" : "Join Event"
          }</button>`;
        }
      } else if (filter === "hosting") {
        actionButton = `<button class="event-cta-button event-cancel-btn" data-event-id="${event.eventID}">Cancel Event</button>`;
      }

      article.innerHTML = `
      <div class="event-card-body">
        <div class="event-icon-column">
          <div class="event-main-icon">
            <img src="../pictures/${
              filter === "past" ? "check" : "calendar"
            }.png" alt="">
          </div>
        </div>
        
        <div class="event-main-content">
          <h3 class="event-title">${App.escapeHtml(event.eventTitle)}</h3>
          <p class="event-watching">${
            filter === "hosting"
              ? "You are hosting this event"
              : `Hosted by ${App.escapeHtml(event.hostName)}`
          }</p>
          
          <div class="event-meta">
            <div class="event-meta-row">
              <img src="../pictures/film.png" alt="movie">
              <span>${App.escapeHtml(event.title)}</span>
            </div>
            
            <div class="event-meta-row">
              <img src="../pictures/clock.png" alt="time">
              <span>${dateStr}, ${timeStr} • ${durationStr}</span>
            </div>
            
            <div class="event-meta-row">
              <img src="../pictures/people.png" alt="participants">
              <span>${event.currentCapacity}/${event.capacity} ${
        filter === "past" ? "attended" : "attending"
      }</span>
            </div>
            
            ${
              event.description
                ? `
              <div class="event-meta-row" style="margin-top: 8px; color: var(--TextColor); opacity: 0.8; font-size: 13px;">
                <span>${App.escapeHtml(event.description)}</span>
              </div>
            `
                : ""
            }
          </div>
          
          ${
            actionButton
              ? `<div class="event-cta-row">${actionButton}</div>`
              : ""
          }
        </div>
      </div>
    `;

      // Add event listeners
      const joinBtn = article.querySelector(
        ".event-cta-button:not(.event-leave-btn):not(.event-cancel-btn)"
      );
      const leaveBtn = article.querySelector(".event-leave-btn");
      const cancelBtn = article.querySelector(".event-cancel-btn");

      if (joinBtn) {
        joinBtn.addEventListener("click", () => joinEvent(event.eventID));
      }
      if (leaveBtn) {
        leaveBtn.addEventListener("click", () => leaveEvent(event.eventID));
      }
      if (cancelBtn) {
        cancelBtn.addEventListener("click", () => cancelEvent(event.eventID));
      }

      return article;
    }

    async function joinEvent(eventID) {
      try {
        await App.post(`/events/${eventID}/join`, {});
        App.showSuccess("Successfully joined the event!");
        await loadEvents(currentFilter);
      } catch (error) {
        App.showError(error.message || "Failed to join event");
      }
    }

    async function leaveEvent(eventID) {
      if (!confirm("Are you sure you want to leave this event?")) return;

      try {
        await App.post(`/events/${eventID}/leave`, {});
        App.showSuccess("Successfully left the event");
        await loadEvents(currentFilter);
      } catch (error) {
        App.showError(error.message || "Failed to leave event");
      }
    }

    async function cancelEvent(eventID) {
      if (
        !confirm(
          "Are you sure you want to cancel this event? All participants will be notified and the event will be deleted."
        )
      )
        return;

      try {
        await App.delete(`/events/${eventID}`);
        App.showSuccess("Event cancelled successfully");
        await loadEvents(currentFilter);
      } catch (error) {
        App.showError(error.message || "Failed to cancel event");
      }
    }

    function showHostEventModal() {
      // Create modal HTML
      const modalHTML = `
      <div class="modal-overlay" id="hostEventModal">
        <div class="modal-content" style="max-width: 600px; max-height: 90vh; overflow-y: auto;">
          <div class="modal-header">
            <h2>Host an Event</h2>
            <button class="modal-close" id="closeHostModal">&times;</button>
          </div>
          
          <form id="hostEventForm" class="modal-body">
            <div class="form-group">
              <label for="eventTitle">Event Title *</label>
              <input type="text" id="eventTitle" class="form-input" required placeholder="Movie Night with Friends">
            </div>
            
            <div class="form-group">
              <label for="eventMovie">Movie *</label>
              <input 
                type="text" 
                id="eventMovieSearch" 
                class="form-input" 
                placeholder="Search for a movie..." 
                autocomplete="off"
              />
              <input type="hidden" id="eventMovie" />
              <div id="movieSearchResults" class="search-results"></div>
            </div>
            
            <div class="form-group">
              <label for="eventDescription">Description</label>
              <textarea id="eventDescription" class="form-input" rows="3" placeholder="Tell people what to expect..."></textarea>
            </div>
            
            <div class="form-row" style="display: flex; gap: 15px;">
              <div class="form-group" style="flex: 1;">
                <label for="eventDate">Date *</label>
                <input type="date" id="eventDate" class="form-input" required>
              </div>
              
              <div class="form-group" style="flex: 1;">
                <label for="eventTime">Time *</label>
                <input type="time" id="eventTime" class="form-input" required>
              </div>
            </div>
            
            <div class="form-row" style="display: flex; gap: 15px;">
              <div class="form-group" style="flex: 1;">
                <label for="eventDuration">Duration (minutes) *</label>
                <input type="number" id="eventDuration" class="form-input" required min="30" max="300" value="120">
              </div>
              
              <div class="form-group" style="flex: 1;">
                <label for="eventCapacity">Max Participants *</label>
                <input type="number" id="eventCapacity" class="form-input" required min="2" max="50" value="10">
              </div>
            </div>
            
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" id="cancelHostModal">Cancel</button>
              <button type="submit" class="btn btn-primary">Create Event</button>
            </div>
          </form>
        </div>
      </div>
    `;

      // Add modal to page
      document.body.insertAdjacentHTML("beforeend", modalHTML);

      // Load movies for dropdown
      loadMoviesForEvent();

      // Set minimum date to today
      const dateInput = document.getElementById("eventDate");
      const today = new Date().toISOString().split("T")[0];
      dateInput.min = today;

      // Event listeners
      document
        .getElementById("closeHostModal")
        .addEventListener("click", closeHostEventModal);
      document
        .getElementById("cancelHostModal")
        .addEventListener("click", closeHostEventModal);

      // Use once: true to prevent duplicate submissions
      const form = document.getElementById("hostEventForm");
      form.addEventListener("submit", handleHostEventSubmit, { once: true });

      // Close on overlay click
      document
        .getElementById("hostEventModal")
        .addEventListener("click", (e) => {
          if (e.target.id === "hostEventModal") closeHostEventModal();
        });
    }

    function closeHostEventModal() {
      const modal = document.getElementById("hostEventModal");
      if (modal) modal.remove();
    }

    async function loadMoviesForEvent() {
      // Set up movie search functionality
      const searchInput = document.getElementById("eventMovieSearch");
      const resultsDiv = document.getElementById("movieSearchResults");
      const hiddenInput = document.getElementById("eventMovie");

      let searchTimeout;
      let selectedMovie = null;

      searchInput.addEventListener("input", async (e) => {
        const query = e.target.value.trim();

        if (query.length < 2) {
          resultsDiv.innerHTML = "";
          resultsDiv.style.display = "none";
          hiddenInput.value = "";
          selectedMovie = null;
          return;
        }

        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(async () => {
          try {
            const data = await App.get(
              `/movies?search=${encodeURIComponent(query)}&limit=10`
            );
            const movies = data.movies || [];

            if (movies.length === 0) {
              resultsDiv.innerHTML =
                '<div class="search-result-item no-results">No movies found</div>';
              resultsDiv.style.display = "block";
              return;
            }

            resultsDiv.innerHTML = movies
              .map(
                (movie) => `
            <div class="search-result-item" data-movie-id="${
              movie.movieId
            }" data-movie-title="${movie.title}">
              <div class="search-result-info">
                <div class="search-result-title">${movie.title}</div>
                <div class="search-result-year">${
                  movie.releaseYear || "N/A"
                }</div>
              </div>
            </div>
          `
              )
              .join("");
            resultsDiv.style.display = "block";

            // Add click handlers to results
            resultsDiv
              .querySelectorAll(".search-result-item[data-movie-id]")
              .forEach((item) => {
                item.addEventListener("click", () => {
                  const movieId = item.dataset.movieId;
                  const movieTitle = item.dataset.movieTitle;

                  searchInput.value = movieTitle;
                  hiddenInput.value = movieId;
                  selectedMovie = { id: movieId, title: movieTitle };
                  resultsDiv.innerHTML = "";
                  resultsDiv.style.display = "none";
                });
              });
          } catch (error) {
            console.error("Error searching movies:", error);
            resultsDiv.innerHTML =
              '<div class="search-result-item no-results">Error loading movies</div>';
            resultsDiv.style.display = "block";
          }
        }, 300);
      });

      // Hide results when clicking outside
      document.addEventListener("click", (e) => {
        if (!searchInput.contains(e.target) && !resultsDiv.contains(e.target)) {
          resultsDiv.style.display = "none";
        }
      });
    }

    async function handleHostEventSubmit(e) {
      e.preventDefault();

      // Prevent double submission
      const submitBtn = e.target.querySelector('button[type="submit"]');
      if (submitBtn.disabled) return;
      submitBtn.disabled = true;
      submitBtn.textContent = "Creating...";

      const title = document.getElementById("eventTitle").value.trim();
      const movieID = parseInt(document.getElementById("eventMovie").value);
      const description = document
        .getElementById("eventDescription")
        .value.trim();
      const date = document.getElementById("eventDate").value;
      const time = document.getElementById("eventTime").value;
      const duration = parseInt(document.getElementById("eventDuration").value);
      const capacity = parseInt(document.getElementById("eventCapacity").value);

      // Validate required fields
      if (!title) {
        App.showError("Please enter an event title");
        submitBtn.disabled = false;
        submitBtn.textContent = "Create Event";
        return;
      }
      if (!movieID || isNaN(movieID)) {
        App.showError("Please select a movie");
        submitBtn.disabled = false;
        submitBtn.textContent = "Create Event";
        return;
      }
      if (!date) {
        App.showError("Please select an event date");
        submitBtn.disabled = false;
        submitBtn.textContent = "Create Event";
        return;
      }
      if (!time) {
        App.showError("Please select an event time");
        submitBtn.disabled = false;
        submitBtn.textContent = "Create Event";
        return;
      }
      if (!duration || isNaN(duration) || duration < 30 || duration > 300) {
        App.showError("Please enter a valid duration (30-300 minutes)");
        submitBtn.disabled = false;
        submitBtn.textContent = "Create Event";
        return;
      }
      if (!capacity || isNaN(capacity) || capacity < 2 || capacity > 50) {
        App.showError("Please enter a valid capacity (2-50 participants)");
        submitBtn.disabled = false;
        submitBtn.textContent = "Create Event";
        return;
      }

      // Combine date and time
      const eventDateTime = `${date} ${time}:00`;

      try {
        await App.post("/events", {
          eventTitle: title,
          associatedMovieID: movieID,
          description,
          eventDateTime,
          duration,
          capacity,
        });

        App.showSuccess("Event created successfully!");
        closeHostEventModal();

        // Switch to "Hosted by Me" tab and reload
        activateTab("hosting");
        await loadEvents("hosting");
      } catch (error) {
        App.showError(error.message || "Failed to create event");
        submitBtn.disabled = false;
        submitBtn.textContent = "Create Event";
      }
    }
  });
} // End of double-execution guard
