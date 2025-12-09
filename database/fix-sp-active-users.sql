-- Fix sp_get_most_active_users to use correct column names and exclude admins

DROP PROCEDURE IF EXISTS sp_get_most_active_users;

DELIMITER $$

CREATE PROCEDURE sp_get_most_active_users(
    IN p_limit INT,
    IN p_days INT  -- 0 = all time, 7 = last week, 30 = last month
)
BEGIN
    DECLARE v_date_filter DATE;

    IF p_days > 0 THEN
        SET v_date_filter = DATE_SUB(NOW(), INTERVAL p_days DAY);
    END IF;

    SELECT
        u.userID,
        u.username,
        u.email,
        u.registrationDate,
        u.profilePicture,
        COUNT(DISTINCT p.postID) as postCount,
        COUNT(DISTINCT c.commentID) as commentCount,
        COUNT(DISTINCT rr.movieID) as reviewCount,
        COUNT(DISTINCT w.movieID) as watchlistCount,
        (COUNT(DISTINCT p.postID) +
         COUNT(DISTINCT c.commentID) +
         COUNT(DISTINCT rr.movieID) * 2) as activityScore
    FROM User u
    LEFT JOIN Post p ON u.userID = p.userID
        AND (p_days = 0 OR p.createdAt >= v_date_filter)
    LEFT JOIN Comments c ON u.userID = c.userID
        AND (p_days = 0 OR c.createdAt >= v_date_filter)
    LEFT JOIN ReviewRatings rr ON u.userID = rr.userID
        AND (p_days = 0 OR rr.reviewDate >= v_date_filter)
    LEFT JOIN WatchList w ON u.userID = w.userID
    WHERE u.isDeleted = 0
        AND u.role != 'admin'  -- Exclude admin users
    GROUP BY u.userID, u.username, u.email, u.registrationDate, u.profilePicture
    HAVING (postCount > 0 OR commentCount > 0 OR reviewCount > 0)  -- Only show users with activity
    ORDER BY activityScore DESC, postCount DESC
    LIMIT p_limit;
END$$

DELIMITER ;
