// server/routes/events.js
const express = require("express");
const router = express.Router();
const db = require("../db");

// Middleware to require authentication
const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  next();
};

// Helper function to check event overlap for a user
async function checkEventOverlap(
  userId,
  eventDateTime,
  duration,
  excludeEventId = null
) {
  const eventStart = new Date(eventDateTime);
  const eventEnd = new Date(eventStart.getTime() + duration * 60000);

  // Check if user is hosting or participating in any event that overlaps
  let query = `
    SELECT 
      e.eventID,
      e.eventTitle,
      e.eventDateTime,
      e.duration,
      DATE_ADD(e.eventDateTime, INTERVAL e.duration MINUTE) as eventEndTime
    FROM WatchEvent e
    LEFT JOIN EventParticipants ep ON e.eventID = ep.eventID AND ep.userID = ?
    WHERE 
      (e.host = ? OR ep.userID IS NOT NULL)
      AND (
        -- New event starts during existing event (strict - boundaries don't overlap)
        (? > e.eventDateTime AND ? < DATE_ADD(e.eventDateTime, INTERVAL e.duration MINUTE))
        OR
        -- New event ends during existing event (strict - boundaries don't overlap)
        (? > e.eventDateTime AND ? < DATE_ADD(e.eventDateTime, INTERVAL e.duration MINUTE))
        OR
        -- New event completely contains existing event (strict - boundaries don't overlap)
        (? < e.eventDateTime AND ? > DATE_ADD(e.eventDateTime, INTERVAL e.duration MINUTE))
      )
  `;

  const params = [
    userId,
    userId,
    eventStart,
    eventStart,
    eventEnd,
    eventEnd,
    eventStart,
    eventEnd,
  ];

  if (excludeEventId) {
    query += ` AND e.eventID != ?`;
    params.push(excludeEventId);
  }

  try {
    const overlapping = await db.query(query, params);
    const results = Array.isArray(overlapping) ? overlapping : [];
    return results.length > 0 ? results[0] : null;
  } catch (error) {
    console.error("Error checking event overlap:", error);
    return null;
  }
}

// GET /api/events - Get events based on filter
router.get("/events", requireAuth, async (req, res) => {
  const userId = req.session.userId;
  const { filter = "upcoming" } = req.query;
  const limit = parseInt(req.query.limit) || 20;
  const offset = parseInt(req.query.offset) || 0;

  console.log(`${new Date().toISOString()} - GET /api/events?filter=${filter}`);

  try {
    let query;
    let params;

    if (filter === "upcoming") {
      // Get all upcoming events (not hosted by user, user not already joined)
      query = `
        SELECT 
          e.eventID,
          e.eventTitle,
          e.description,
          e.eventDateTime,
          e.duration,
          e.capacity,
          e.currentCapacity,
          e.associatedMovieID,
          m.title,
          m.posterImg,
          u.userID as hostID,
          u.name as hostName,
          u.profilePicture as hostPicture,
          CASE WHEN ep.userID IS NOT NULL THEN TRUE ELSE FALSE END as isJoined
        FROM WatchEvent e
        INNER JOIN Movie m ON e.associatedMovieID = m.movieID
        INNER JOIN User u ON e.host = u.userID
        LEFT JOIN EventParticipants ep ON e.eventID = ep.eventID AND ep.userID = ?
        WHERE 
          e.eventDateTime > NOW()
          AND e.host != ?
        ORDER BY e.eventDateTime ASC
        LIMIT ? OFFSET ?
      `;
      params = [userId, userId, limit + 1, offset];
    } else if (filter === "hosting") {
      // Get events hosted by user
      query = `
        SELECT 
          e.eventID,
          e.eventTitle,
          e.description,
          e.eventDateTime,
          e.duration,
          e.capacity,
          e.currentCapacity,
          e.associatedMovieID,
          m.title,
          m.posterImg,
          u.userID as hostID,
          u.name as hostName,
          u.profilePicture as hostPicture,
          TRUE as isHosting
        FROM WatchEvent e
        INNER JOIN Movie m ON e.associatedMovieID = m.movieID
        INNER JOIN User u ON e.host = u.userID
        WHERE 
          e.host = ?
          AND e.eventDateTime > NOW()
        ORDER BY e.eventDateTime ASC
        LIMIT ? OFFSET ?
      `;
      params = [userId, limit + 1, offset];
    } else if (filter === "past") {
      // Get past events user participated in or hosted
      query = `
        SELECT DISTINCT
          e.eventID,
          e.eventTitle,
          e.description,
          e.eventDateTime,
          e.duration,
          e.capacity,
          e.currentCapacity,
          e.associatedMovieID,
          m.title,
          m.posterImg,
          u.userID as hostID,
          u.name as hostName,
          u.profilePicture as hostPicture,
          CASE WHEN e.host = ? THEN TRUE ELSE FALSE END as wasHosting
        FROM WatchEvent e
        INNER JOIN Movie m ON e.associatedMovieID = m.movieID
        INNER JOIN User u ON e.host = u.userID
        LEFT JOIN EventParticipants ep ON e.eventID = ep.eventID
        WHERE 
          e.eventDateTime < NOW()
          AND (e.host = ? OR ep.userID = ?)
        ORDER BY e.eventDateTime DESC
        LIMIT ? OFFSET ?
      `;
      params = [userId, userId, userId, limit + 1, offset];
    }

    const events = await db.query(query, params);
    const eventsList = Array.isArray(events) ? events : [];

    // Check for more events
    const hasMore = eventsList.length > limit;
    const paginatedEvents = hasMore ? eventsList.slice(0, limit) : eventsList;

    res.json({
      success: true,
      events: paginatedEvents,
      hasMore,
      pagination: {
        limit,
        offset,
        nextOffset: hasMore ? offset + limit : null,
      },
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ success: false, message: "Failed to fetch events" });
  }
});

// POST /api/events - Create a new event
router.post("/events", requireAuth, async (req, res) => {
  const userId = req.session.userId;
  const {
    eventTitle,
    associatedMovieID,
    description,
    eventDateTime,
    duration,
    capacity,
  } = req.body;

  console.log(`${new Date().toISOString()} - POST /api/events`);

  try {
    // Validate input
    if (!eventTitle || !associatedMovieID || !eventDateTime || !duration) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: eventTitle, associatedMovieID, eventDateTime, duration",
      });
    }

    // Validate capacity (max 50)
    const eventCapacity = capacity || 50;
    if (eventCapacity > 50) {
      return res.status(400).json({
        success: false,
        message: "Maximum capacity is 50 users per event",
      });
    }

    // Check if event is in the future
    const eventDate = new Date(eventDateTime);
    if (eventDate <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "Event must be scheduled in the future",
      });
    }

    // Check for overlap with user's existing events
    const overlap = await checkEventOverlap(userId, eventDateTime, duration);
    if (overlap) {
      const overlapTime = new Date(overlap.eventDateTime).toLocaleString();
      return res.status(400).json({
        success: false,
        message: `You have an overlapping event "${overlap.eventTitle}" at ${overlapTime}`,
      });
    }

    // Verify movie exists
    const movieList = await db.query(
      "SELECT movieID, title FROM Movie WHERE movieID = ?",
      [associatedMovieID]
    );
    if (movieList.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Movie not found" });
    }

    // Create the event
    const queryResult = await db.query(
      `INSERT INTO WatchEvent 
       (eventTitle, associatedMovieID, host, description, eventDateTime, duration, capacity, currentCapacity) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        eventTitle,
        associatedMovieID,
        userId,
        description || "",
        eventDateTime,
        duration,
        eventCapacity,
      ]
    );

    // Extract result - handle both array and non-array formats
    const result = Array.isArray(queryResult) ? queryResult[0] : queryResult;

    res.json({
      success: true,
      message: "Event created successfully",
      eventID: result.insertId,
    });
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({ success: false, message: "Failed to create event" });
  }
});

// POST /api/events/:id/join - Join an event
router.post("/events/:id/join", requireAuth, async (req, res) => {
  const userId = req.session.userId;
  const eventID = parseInt(req.params.id);

  console.log(`${new Date().toISOString()} - POST /api/events/${eventID}/join`);

  try {
    // Check if event exists and is upcoming
    const eventList = await db.query(
      `SELECT e.*, u.name as hostName 
       FROM WatchEvent e 
       INNER JOIN User u ON e.host = u.userID
       WHERE e.eventID = ? AND e.eventDateTime > NOW()`,
      [eventID]
    );

    if (!Array.isArray(eventList) || eventList.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Event not found or already completed",
      });
    }

    const event = eventList[0];

    // Check if user is the host
    if (event.host === userId) {
      return res
        .status(400)
        .json({ success: false, message: "You cannot join your own event" });
    }

    // Check if already joined
    const existingList = await db.query(
      "SELECT * FROM EventParticipants WHERE eventID = ? AND userID = ?",
      [eventID, userId]
    );

    if (Array.isArray(existingList) && existingList.length > 0) {
      return res.status(400).json({
        success: false,
        message: "You have already joined this event",
      });
    }

    // Check capacity
    if (event.currentCapacity >= event.capacity) {
      return res
        .status(400)
        .json({ success: false, message: "No more room left" });
    }

    // Check for overlap, excluding the event being joined
    const overlap = await checkEventOverlap(
      userId,
      event.eventDateTime,
      event.duration,
      eventID // exclude the event being joined
    );
    if (overlap) {
      const overlapTime = new Date(overlap.eventDateTime).toLocaleString();
      return res.status(400).json({
        success: false,
        message: `You have an overlapping event "${overlap.eventTitle}" at ${overlapTime}`,
      });
    }

    // Join the event
    await db.query(
      "INSERT INTO EventParticipants (eventID, userID) VALUES (?, ?)",
      [eventID, userId]
    );

    // Update current capacity
    await db.query(
      "UPDATE WatchEvent SET currentCapacity = currentCapacity + 1 WHERE eventID = ?",
      [eventID]
    );

    // Create notification for host
    await db.query(
      `INSERT INTO Notifications (receivedFROMuserID, triggerUserID, triggerEvent, content, relatedID, isSeen)
       VALUES (?, ?, ?, ?, ?, FALSE)`,
      [
        event.host,
        userId,
        "new_post",
        `joined your event "${event.eventTitle}"`,
        eventID,
      ]
    );

    res.json({ success: true, message: "Successfully joined the event" });
  } catch (error) {
    console.error("Error joining event:", error);
    res.status(500).json({ success: false, message: "Failed to join event" });
  }
});

// POST /api/events/:id/leave - Leave an event
router.post("/events/:id/leave", requireAuth, async (req, res) => {
  const userId = req.session.userId;
  const eventID = parseInt(req.params.id);

  console.log(
    `${new Date().toISOString()} - POST /api/events/${eventID}/leave`
  );

  try {
    // Check if user is a participant
    const participantList = await db.query(
      "SELECT * FROM EventParticipants WHERE eventID = ? AND userID = ?",
      [eventID, userId]
    );

    if (!Array.isArray(participantList) || participantList.length === 0) {
      return res.status(400).json({
        success: false,
        message: "You are not a participant of this event",
      });
    }

    // Remove from event
    await db.query(
      "DELETE FROM EventParticipants WHERE eventID = ? AND userID = ?",
      [eventID, userId]
    );

    // Update current capacity
    await db.query(
      "UPDATE WatchEvent SET currentCapacity = currentCapacity - 1 WHERE eventID = ?",
      [eventID]
    );

    res.json({ success: true, message: "Successfully left the event" });
  } catch (error) {
    console.error("Error leaving event:", error);
    res.status(500).json({ success: false, message: "Failed to leave event" });
  }
});

// DELETE /api/events/:id - Cancel an event (host only)
router.delete("/events/:id", requireAuth, async (req, res) => {
  const userId = req.session.userId;
  const eventID = parseInt(req.params.id);

  console.log(`${new Date().toISOString()} - DELETE /api/events/${eventID}`);

  try {
    // Check if event exists and user is the host
    const eventList = await db.query(
      "SELECT * FROM WatchEvent WHERE eventID = ? AND host = ?",
      [eventID, userId]
    );

    if (!Array.isArray(eventList) || eventList.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Event not found or you are not the host",
      });
    }

    const event = eventList[0];

    // Get all participants to notify them
    const participantList = await db.query(
      "SELECT userID FROM EventParticipants WHERE eventID = ?",
      [eventID]
    );

    // Create notifications for all participants
    if (Array.isArray(participantList) && participantList.length > 0) {
      const notificationValues = participantList.map((p) => [
        p.userID,
        userId,
        "new_post",
        `cancelled the event "${event.eventTitle}"`,
        eventID,
        false,
      ]);

      await db.query(
        `INSERT INTO Notifications (receivedFROMuserID, triggerUserID, triggerEvent, content, relatedID, isSeen)
         VALUES ?`,
        [notificationValues]
      );
    }

    // Delete the event (cascade will remove participants)
    await db.query("DELETE FROM WatchEvent WHERE eventID = ?", [eventID]);

    res.json({ success: true, message: "Event cancelled successfully" });
  } catch (error) {
    console.error("Error cancelling event:", error);
    res.status(500).json({ success: false, message: "Failed to cancel event" });
  }
});

// GET /api/events/:id/participants - Get event participants
router.get("/events/:id/participants", requireAuth, async (req, res) => {
  const eventID = parseInt(req.params.id);

  console.log(
    `${new Date().toISOString()} - GET /api/events/${eventID}/participants`
  );

  try {
    const participantList = await db.query(
      `SELECT u.userID, u.name, u.profilePicture
       FROM EventParticipants ep
       INNER JOIN User u ON ep.userID = u.userID
       WHERE ep.eventID = ?
       ORDER BY u.name`,
      [eventID]
    );

    res.json({
      success: true,
      participants: Array.isArray(participantList) ? participantList : [],
    });
  } catch (error) {
    console.error("Error fetching participants:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch participants" });
  }
});

module.exports = router;
