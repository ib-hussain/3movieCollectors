const mysql = require("mysql2/promise");

(async () => {
  const conn = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "8956",
    database: "3movieCollectors",
  });

  console.log("Fixing sp_bulk_add_movies to use correct JSON field names...");

  await conn.query("DROP PROCEDURE IF EXISTS sp_bulk_add_movies");

  await conn.query(`
    CREATE PROCEDURE sp_bulk_add_movies(
      IN p_adminID INT,
      IN p_moviesJSON JSON,
      IN p_ipAddress VARCHAR(45),
      IN p_userAgent VARCHAR(511)
    )
    BEGIN
      DECLARE v_index INT DEFAULT 0;
      DECLARE v_count INT;
      DECLARE v_title VARCHAR(511);
      DECLARE v_year INT;
      DECLARE v_director VARCHAR(255);
      DECLARE v_synopsis TEXT;
      DECLARE v_poster VARCHAR(1023);
      DECLARE v_added INT DEFAULT 0;
      DECLARE v_skipped INT DEFAULT 0;

      -- Set admin context
      SET @current_admin_id = p_adminID;
      SET @current_ip_address = p_ipAddress;
      SET @current_user_agent = p_userAgent;

      -- Get array length
      SET v_count = JSON_LENGTH(p_moviesJSON);

      -- Loop through movies
      WHILE v_index < v_count DO
        -- Extract movie data with correct field names
        SET v_title = JSON_UNQUOTE(JSON_EXTRACT(p_moviesJSON, CONCAT('$[', v_index, '].title')));
        SET v_year = JSON_EXTRACT(p_moviesJSON, CONCAT('$[', v_index, '].releaseYear'));
        SET v_director = JSON_UNQUOTE(JSON_EXTRACT(p_moviesJSON, CONCAT('$[', v_index, '].director')));
        SET v_synopsis = JSON_UNQUOTE(JSON_EXTRACT(p_moviesJSON, CONCAT('$[', v_index, '].synopsis')));
        SET v_poster = JSON_UNQUOTE(JSON_EXTRACT(p_moviesJSON, CONCAT('$[', v_index, '].posterImg')));

        -- Skip if title or year is null
        IF v_title IS NOT NULL AND v_year IS NOT NULL THEN
          -- Check if movie already exists
          IF NOT EXISTS (
            SELECT 1 FROM Movie 
            WHERE title = v_title AND releaseYear = v_year
          ) THEN
            -- Insert movie
            INSERT INTO Movie (
              title,
              releaseYear,
              director,
              synopsis,
              posterImg,
              avgRating,
              viewCount
            ) VALUES (
              v_title,
              v_year,
              v_director,
              v_synopsis,
              v_poster,
              0.0,
              0
            );

            SET v_added = v_added + 1;
          ELSE
            SET v_skipped = v_skipped + 1;
          END IF;
        END IF;

        SET v_index = v_index + 1;
      END WHILE;

      -- Return summary (stored procedures can't return JSON, so we use a SELECT)
      SELECT v_added as added, v_skipped as skipped, v_count as total;
    END
  `);

  console.log("✓ SP sp_bulk_add_movies fixed successfully");
  console.log("  - Now expects: releaseYear, posterImg (not year, poster)");
  console.log("  - Removed tmdb_id (column does not exist in Movie table)");
  console.log("  - Matches actual database schema");
  await conn.end();
  process.exit(0);
})().catch((err) => {
  console.error("ERROR:", err.message);
  process.exit(1);
});
