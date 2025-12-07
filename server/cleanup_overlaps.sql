-- Cleanup script to remove all overlapping event participations
-- This finds all cases where a user is participating in or hosting overlapping events

USE 3moviecollectors;

-- Step 1: Find and remove overlapping event participations
-- Keep the earliest event for each user and remove participations in later overlapping events

DELETE ep1 FROM EventParticipants ep1
INNER JOIN WatchEvent e1 ON ep1.eventID = e1.eventID
WHERE EXISTS (
    SELECT 1 FROM (
        -- Find overlapping events where user is host or participant
        SELECT DISTINCT e2.eventID
        FROM WatchEvent e2
        LEFT JOIN EventParticipants ep2 ON e2.eventID = ep2.eventID
        WHERE (e2.host = ep1.userID OR ep2.userID = ep1.userID)
          AND e2.eventID != e1.eventID
          AND (
              -- Check for time overlap (strict)
              (e1.eventDateTime > e2.eventDateTime AND e1.eventDateTime < DATE_ADD(e2.eventDateTime, INTERVAL e2.duration MINUTE))
              OR
              (DATE_ADD(e1.eventDateTime, INTERVAL e1.duration MINUTE) > e2.eventDateTime 
               AND DATE_ADD(e1.eventDateTime, INTERVAL e1.duration MINUTE) < DATE_ADD(e2.eventDateTime, INTERVAL e2.duration MINUTE))
              OR
              (e1.eventDateTime < e2.eventDateTime AND DATE_ADD(e1.eventDateTime, INTERVAL e1.duration MINUTE) > DATE_ADD(e2.eventDateTime, INTERVAL e2.duration MINUTE))
          )
          AND e1.eventDateTime > e2.eventDateTime -- Keep earlier event
    ) AS overlaps
);

-- Step 2: Report remaining events
SELECT 
    u.userID,
    u.name,
    e.eventID,
    e.eventTitle,
    e.eventDateTime,
    e.duration,
    CASE WHEN e.host = u.userID THEN 'Host' ELSE 'Participant' END as role
FROM User u
LEFT JOIN WatchEvent e ON e.host = u.userID
LEFT JOIN EventParticipants ep ON ep.userID = u.userID AND ep.eventID = e.eventID
WHERE e.eventID IS NOT NULL OR ep.eventID IS NOT NULL
ORDER BY u.userID, e.eventDateTime;
