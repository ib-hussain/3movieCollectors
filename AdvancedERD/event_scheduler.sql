-- MySQL Event Scheduler for 3movieCollectors
-- These events replace the node-cron jobs with native MySQL scheduled tasks

-- Enable the Event Scheduler (run this first)
SET GLOBAL event_scheduler = ON;

-- ===========================
-- EVENT 1: Send Event Reminders
-- Runs every 10 minutes to check for events starting in 50-60 minutes
-- ===========================
DROP EVENT IF EXISTS send_event_reminders;

DELIMITER $$
CREATE EVENT send_event_reminders
ON SCHEDULE EVERY 10 MINUTE
STARTS CURRENT_TIMESTAMP
DO
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_eventID INT;
    DECLARE v_eventTitle VARCHAR(255);
    DECLARE v_host INT;
    DECLARE v_participantIDs TEXT;
    DECLARE v_userID INT;
    DECLARE v_pos INT;
    DECLARE v_participant VARCHAR(20);
    
    -- Cursor for events needing reminders
    DECLARE event_cursor CURSOR FOR
        SELECT 
            e.eventID,
            e.eventTitle,
            e.host,
            GROUP_CONCAT(ep.userID) as participantIDs
        FROM WatchEvent e
        LEFT JOIN EventParticipants ep ON e.eventID = ep.eventID
        WHERE 
            e.eventDateTime BETWEEN DATE_ADD(NOW(), INTERVAL 50 MINUTE) AND DATE_ADD(NOW(), INTERVAL 60 MINUTE)
            AND NOT EXISTS (
                SELECT 1 FROM Notifications n
                WHERE n.content LIKE CONCAT('Your event "', e.eventTitle, '" starts in 1 hour%')
                AND n.receivedFROMuserID = e.host
                AND n.timeStamp > DATE_SUB(NOW(), INTERVAL 2 HOUR)
            )
        GROUP BY e.eventID, e.eventTitle, e.host;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    OPEN event_cursor;
    
    event_loop: LOOP
        FETCH event_cursor INTO v_eventID, v_eventTitle, v_host, v_participantIDs;
        
        IF done THEN
            LEAVE event_loop;
        END IF;
        
        -- Send notification to host
        INSERT INTO Notifications (receivedFROMuserID, triggerUserID, triggerEvent, content, relatedID, isSeen)
        VALUES (v_host, v_host, 'event_reminder', CONCAT('Your event "', v_eventTitle, '" starts in 1 hour!'), v_eventID, FALSE);
        
        -- Send notifications to all participants
        IF v_participantIDs IS NOT NULL THEN
            SET v_pos = 1;
            
            WHILE v_pos > 0 DO
                SET v_participant = SUBSTRING_INDEX(SUBSTRING_INDEX(v_participantIDs, ',', v_pos), ',', -1);
                SET v_userID = CAST(v_participant AS UNSIGNED);
                
                -- Only send if not the host
                IF v_userID != v_host THEN
                    INSERT INTO Notifications (receivedFROMuserID, triggerUserID, triggerEvent, content, relatedID, isSeen)
                    VALUES (v_userID, v_host, 'event_reminder', CONCAT('Your event "', v_eventTitle, '" starts in 1 hour!'), v_eventID, FALSE);
                END IF;
                
                -- Move to next participant
                IF LOCATE(',', v_participantIDs, LENGTH(SUBSTRING_INDEX(v_participantIDs, ',', v_pos)) + 1) > 0 THEN
                    SET v_pos = v_pos + 1;
                ELSE
                    SET v_pos = 0;
                END IF;
            END WHILE;
        END IF;
        
    END LOOP;
    
    CLOSE event_cursor;
END$$
DELIMITER ;

-- ===========================
-- EVENT 2: Auto-complete Events and Update Watchlists
-- Runs every 5 minutes to check for events that have ended
-- ===========================
DROP EVENT IF EXISTS auto_complete_events;

DELIMITER $$
CREATE EVENT auto_complete_events
ON SCHEDULE EVERY 5 MINUTE
STARTS CURRENT_TIMESTAMP
DO
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_eventID INT;
    DECLARE v_movieID INT;
    DECLARE v_host INT;
    DECLARE v_participantIDs TEXT;
    DECLARE v_userID INT;
    DECLARE v_pos INT;
    DECLARE v_participant VARCHAR(20);
    DECLARE v_existingCount INT;
    
    -- Cursor for completed events
    DECLARE event_cursor CURSOR FOR
        SELECT 
            e.eventID,
            e.associatedMovieID,
            e.host,
            GROUP_CONCAT(ep.userID) as participantIDs
        FROM WatchEvent e
        LEFT JOIN EventParticipants ep ON e.eventID = ep.eventID
        WHERE DATE_ADD(e.eventDateTime, INTERVAL e.duration MINUTE) < NOW()
        GROUP BY e.eventID, e.associatedMovieID, e.host;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    OPEN event_cursor;
    
    event_loop: LOOP
        FETCH event_cursor INTO v_eventID, v_movieID, v_host, v_participantIDs;
        
        IF done THEN
            LEAVE event_loop;
        END IF;
        
        -- Update watchlist for host
        SELECT COUNT(*) INTO v_existingCount
        FROM UserWatchlist
        WHERE userID = v_host AND movieID = v_movieID;
        
        IF v_existingCount > 0 THEN
            UPDATE UserWatchlist 
            SET status = 'Completed' 
            WHERE userID = v_host AND movieID = v_movieID;
        ELSE
            INSERT INTO UserWatchlist (userID, movieID, status)
            VALUES (v_host, v_movieID, 'Completed');
        END IF;
        
        -- Update watchlist for all participants
        IF v_participantIDs IS NOT NULL THEN
            SET v_pos = 1;
            
            WHILE v_pos > 0 DO
                SET v_participant = SUBSTRING_INDEX(SUBSTRING_INDEX(v_participantIDs, ',', v_pos), ',', -1);
                SET v_userID = CAST(v_participant AS UNSIGNED);
                
                -- Only update if not the host (already done)
                IF v_userID != v_host THEN
                    SELECT COUNT(*) INTO v_existingCount
                    FROM UserWatchlist
                    WHERE userID = v_userID AND movieID = v_movieID;
                    
                    IF v_existingCount > 0 THEN
                        UPDATE UserWatchlist 
                        SET status = 'Completed' 
                        WHERE userID = v_userID AND movieID = v_movieID;
                    ELSE
                        INSERT INTO UserWatchlist (userID, movieID, status)
                        VALUES (v_userID, v_movieID, 'Completed');
                    END IF;
                END IF;
                
                -- Move to next participant
                IF LOCATE(',', v_participantIDs, LENGTH(SUBSTRING_INDEX(v_participantIDs, ',', v_pos)) + 1) > 0 THEN
                    SET v_pos = v_pos + 1;
                ELSE
                    SET v_pos = 0;
                END IF;
            END WHILE;
        END IF;
        
        -- Delete the completed event
        DELETE FROM WatchEvent WHERE eventID = v_eventID;
        
    END LOOP;
    
    CLOSE event_cursor;
END$$
DELIMITER ;

-- ===========================
-- EVENT 3: Cleanup Old Read Notifications
-- Runs every hour to delete notifications older than 24 hours
-- ===========================
DROP EVENT IF EXISTS cleanup_old_notifications;

DELIMITER $$
CREATE EVENT cleanup_old_notifications
ON SCHEDULE EVERY 1 HOUR
STARTS CURRENT_TIMESTAMP
DO
BEGIN
    DELETE FROM Notifications 
    WHERE isSeen = TRUE 
    AND timeStamp < DATE_SUB(NOW(), INTERVAL 24 HOUR);
END$$
DELIMITER ;

-- Verify events are created
SHOW EVENTS;

-- To check event status:
-- SELECT EVENT_NAME, STATUS, LAST_EXECUTED, NEXT_EXECUTION FROM information_schema.EVENTS WHERE EVENT_SCHEMA = '3moviecollectors';

-- To disable events:
-- ALTER EVENT send_event_reminders DISABLE;
-- ALTER EVENT auto_complete_events DISABLE;
-- ALTER EVENT cleanup_old_notifications DISABLE;

-- To enable events:
-- ALTER EVENT send_event_reminders ENABLE;
-- ALTER EVENT auto_complete_events ENABLE;
-- ALTER EVENT cleanup_old_notifications ENABLE;
