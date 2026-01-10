-- ============================================================
-- MOVIE STATISTICS AUTO-CALCULATION TRIGGERS
-- ============================================================
-- Purpose: Automatically calculate avgRating and manage viewCount
-- Created: December 9, 2025
-- ============================================================

USE 3movieCollectors;

-- ============================================================
-- SECTION 1: RATING CALCULATION TRIGGERS
-- Purpose: Auto-update avgRating when reviews are added/updated/deleted
-- ============================================================

-- Drop existing triggers if any
DROP TRIGGER IF EXISTS trg_rating_insert;
DROP TRIGGER IF EXISTS trg_rating_update;
DROP TRIGGER IF EXISTS trg_rating_delete;

-- TRIGGER: When a new rating is added
CREATE TRIGGER trg_rating_insert
AFTER INSERT ON reviewratings
FOR EACH ROW
BEGIN
    UPDATE movie
    SET avgRating = (
        SELECT ROUND(AVG(rating), 1)
        FROM reviewratings
        WHERE movieID = NEW.movieID
    )
    WHERE movieID = NEW.movieID;
END;

-- TRIGGER: When a rating is updated
CREATE TRIGGER trg_rating_update
AFTER UPDATE ON reviewratings
FOR EACH ROW
BEGIN
    UPDATE movie
    SET avgRating = (
        SELECT ROUND(AVG(rating), 1)
        FROM reviewratings
        WHERE movieID = NEW.movieID
    )
    WHERE movieID = NEW.movieID;
END;

-- TRIGGER: When a rating is deleted
CREATE TRIGGER trg_rating_delete
AFTER DELETE ON reviewratings
FOR EACH ROW
BEGIN
    UPDATE movie
    SET avgRating = COALESCE((
        SELECT ROUND(AVG(rating), 1)
        FROM reviewratings
        WHERE movieID = OLD.movieID
    ), 0.0)
    WHERE movieID = OLD.movieID;
END;

-- ============================================================
-- SECTION 2: INITIAL CALCULATION
-- Purpose: Calculate avgRating for all existing movies
-- ============================================================

UPDATE movie m
SET avgRating = COALESCE((
    SELECT ROUND(AVG(r.rating), 1)
    FROM reviewratings r
    WHERE r.movieID = m.movieID
), 0.0);

-- ============================================================
-- VERIFICATION
-- ============================================================

-- Show movies with their calculated ratings
SELECT 
    m.movieID,
    m.title,
    m.avgRating as 'Current Avg Rating',
    COUNT(r.movieID) as 'Number of Reviews',
    COALESCE(ROUND(AVG(r.rating), 1), 0.0) as 'Calculated Avg'
FROM movie m
LEFT JOIN reviewratings r ON m.movieID = r.movieID
GROUP BY m.movieID, m.title, m.avgRating
HAVING COUNT(r.movieID) > 0
ORDER BY m.avgRating DESC
LIMIT 20;

SELECT '✓ Rating calculation triggers created successfully!' as Status;
