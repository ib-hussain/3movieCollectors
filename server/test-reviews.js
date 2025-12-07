const db = require("./db");

async function testReviews() {
  try {
    console.log("\n=== Testing Reviews Feature ===\n");

    const movieId = 1;
    const userId = 1;

    // 1. Check if ReviewRatings table exists
    console.log("1. Checking ReviewRatings table...");
    const tableCheck = await db.query("SHOW TABLES LIKE 'ReviewRatings'");
    console.log("Table exists:", tableCheck.length > 0);

    // 2. Get current reviews for the movie
    console.log("\n2. Current reviews for movie", movieId + ":");
    const currentReviews = await db.query(
      "SELECT * FROM ReviewRatings WHERE movieID = ?",
      [movieId]
    );
    console.log("Current reviews:", currentReviews);

    // 3. Check movie's current average rating
    console.log("\n3. Movie's current average rating:");
    const movie = await db.query(
      "SELECT movieID, title, avgRating FROM Movie WHERE movieID = ?",
      [movieId]
    );
    console.log("Movie:", movie[0]);

    // 4. Test inserting a review
    console.log("\n4. Testing review insertion...");
    try {
      await db.query(
        "INSERT INTO ReviewRatings (movieID, userID, rating, review, reviewDate, lastUpdated) VALUES (?, ?, ?, ?, NOW(), NOW())",
        [movieId, userId, 8.5, "This is a test review. Great movie!"]
      );
      console.log("✓ Review inserted successfully");
    } catch (err) {
      if (err.code === "ER_DUP_ENTRY") {
        console.log("Review already exists for this user+movie combination");
      } else {
        throw err;
      }
    }

    // 5. Verify the review was inserted
    console.log("\n5. Verifying inserted review:");
    const insertedReview = await db.query(
      "SELECT * FROM ReviewRatings WHERE movieID = ? AND userID = ?",
      [movieId, userId]
    );
    console.log("Inserted review:", insertedReview[0]);

    // 6. Calculate average rating
    console.log("\n6. Calculating average rating:");
    const avgQuery = await db.query(
      "SELECT AVG(rating) as avgRating, COUNT(*) as reviewCount FROM ReviewRatings WHERE movieID = ?",
      [movieId]
    );
    console.log("Average rating:", avgQuery[0]);

    // 7. Update movie's avgRating
    console.log("\n7. Updating movie's avgRating...");
    await db.query("UPDATE Movie SET avgRating = ? WHERE movieID = ?", [
      avgQuery[0].avgRating,
      movieId,
    ]);
    console.log("✓ Movie's avgRating updated");

    // 8. Verify the update
    console.log("\n8. Verifying movie update:");
    const updatedMovie = await db.query(
      "SELECT movieID, title, avgRating FROM Movie WHERE movieID = ?",
      [movieId]
    );
    console.log("Updated movie:", updatedMovie[0]);

    console.log("\n=== All tests completed successfully! ===\n");
    process.exit(0);
  } catch (error) {
    console.error("Error in test:", error);
    process.exit(1);
  }
}

testReviews();
