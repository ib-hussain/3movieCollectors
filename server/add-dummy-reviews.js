const db = require("./db");

async function addDummyReviews() {
  try {
    console.log("Adding dummy reviews...\n");

    // Get some users and movies first
    const users = await db.query("SELECT userID, name FROM User LIMIT 5");
    const movies = await db.query("SELECT movieID, title FROM Movie LIMIT 10");

    console.log(`Found ${users.length} users and ${movies.length} movies\n`);

    const reviews = [
      // User 1 reviews
      {
        movieID: 1,
        userID: 1,
        rating: 9.5,
        review:
          "An absolute masterpiece! The character development and plot twists kept me on the edge of my seat throughout the entire movie. A must-watch for any film enthusiast.",
      },
      {
        movieID: 2,
        userID: 1,
        rating: 8.0,
        review:
          "Really enjoyed this one. Great performances from the cast and beautiful cinematography. Could have been a bit shorter though.",
      },
      {
        movieID: 3,
        userID: 1,
        rating: 7.5,
        review:
          "Solid movie with good entertainment value. Some plot holes but overall a fun watch with friends.",
      },

      // User 2 reviews
      {
        movieID: 1,
        userID: 2,
        rating: 10.0,
        review:
          "Perfect in every way! The storytelling, acting, soundtrack - everything comes together brilliantly. This is cinema at its finest.",
      },
      {
        movieID: 4,
        userID: 2,
        rating: 6.5,
        review:
          "It was okay. Had some interesting moments but felt predictable at times. Not bad for a lazy Sunday watch.",
      },
      {
        movieID: 5,
        userID: 2,
        rating: 9.0,
        review:
          "Absolutely loved it! The director's vision is clear and the execution is nearly flawless. Highly recommended.",
      },

      // User 3 reviews
      {
        movieID: 2,
        userID: 3,
        rating: 7.0,
        review:
          "Decent movie. Good for what it is but nothing groundbreaking. The action sequences were well done.",
      },
      {
        movieID: 3,
        userID: 3,
        rating: 8.5,
        review:
          "Really impressed by this one! Exceeded my expectations. The performances were outstanding.",
      },
      {
        movieID: 6,
        userID: 3,
        rating: 5.5,
        review:
          "Disappointed. Had high hopes but it fell flat. The pacing was off and the dialogue felt forced.",
      },

      // User 4 reviews
      {
        movieID: 1,
        userID: 4,
        rating: 8.0,
        review:
          "Very good movie. Strong start and ending, though the middle dragged a bit. Still worth watching.",
      },
      {
        movieID: 7,
        userID: 4,
        rating: 9.5,
        review:
          "One of the best films I've seen this year! Compelling story with amazing visuals. The twist ending was perfect.",
      },
      {
        movieID: 8,
        userID: 4,
        rating: 4.0,
        review:
          "Not my cup of tea. The story was confusing and the characters weren't likeable. Could have been much better.",
      },

      // User 5 reviews
      {
        movieID: 9,
        userID: 5,
        rating: 10.0,
        review:
          "A true cinematic gem! This movie will be remembered for years to come. Everything about it is perfect.",
      },
      {
        movieID: 2,
        userID: 5,
        rating: 6.0,
        review:
          "Average at best. Some good moments but overall forgettable. Expected more from this director.",
      },
      {
        movieID: 10,
        userID: 5,
        rating: 7.5,
        review:
          "Pretty good! Entertaining from start to finish with solid performances. Would watch again.",
      },

      // More reviews for popular movies
      {
        movieID: 1,
        userID: 5,
        rating: 9.0,
        review:
          "Fantastic movie! The attention to detail is incredible and the story is deeply moving.",
      },
      {
        movieID: 238,
        userID: 1,
        rating: 10.0,
        review:
          "The Godfather is the epitome of filmmaking excellence. Marlon Brando's performance is legendary, and Coppola's direction is masterful. A timeless classic that set the standard for crime dramas.",
      },
      {
        movieID: 238,
        userID: 2,
        rating: 9.5,
        review:
          "Simply perfect. Every scene, every line of dialogue is crafted to perfection. The cinematography and score are phenomenal.",
      },
      {
        movieID: 238,
        userID: 3,
        rating: 9.0,
        review:
          "One of the greatest films ever made. The character development and family dynamics are portrayed brilliantly.",
      },
      {
        movieID: 278,
        userID: 1,
        rating: 10.0,
        review:
          "The Shawshank Redemption is a masterpiece of hope and redemption. Morgan Freeman and Tim Robbins deliver career-defining performances. The ending still gives me chills every time!",
      },
      {
        movieID: 278,
        userID: 3,
        rating: 9.5,
        review:
          "Absolutely phenomenal! A story about hope that touches your soul. The friendship between Andy and Red is beautifully portrayed.",
      },
      {
        movieID: 278,
        userID: 4,
        rating: 10.0,
        review:
          "Perfect in every way. The pacing, acting, music - everything works in harmony to create this unforgettable experience.",
      },
      {
        movieID: 680,
        userID: 2,
        rating: 8.5,
        review:
          "Pulp Fiction revolutionized modern cinema. Tarantino's non-linear storytelling and sharp dialogue make this a must-watch. Iconic performances all around.",
      },
      {
        movieID: 680,
        userID: 4,
        rating: 9.0,
        review:
          "Brilliant and bold filmmaking. The soundtrack alone is worth the watch. Every character is memorable.",
      },
      {
        movieID: 155,
        userID: 1,
        rating: 9.5,
        review:
          "The Dark Knight transcends the superhero genre. Heath Ledger's Joker is one of the greatest villain performances in cinema history. Nolan at his best!",
      },
      {
        movieID: 155,
        userID: 5,
        rating: 10.0,
        review:
          "Heath Ledger's performance is haunting and mesmerizing. This isn't just a superhero movie - it's a crime epic. Absolutely brilliant!",
      },
    ];

    let successCount = 0;
    let skipCount = 0;

    for (const review of reviews) {
      try {
        // Check if movie and user exist
        const movieExists = await db.query(
          "SELECT movieID FROM Movie WHERE movieID = ?",
          [review.movieID]
        );
        const userExists = await db.query(
          "SELECT userID FROM User WHERE userID = ?",
          [review.userID]
        );

        if (movieExists.length === 0 || userExists.length === 0) {
          console.log(
            `⊘ Skipping review (Movie ${review.movieID}, User ${review.userID}) - doesn't exist`
          );
          skipCount++;
          continue;
        }

        // Try to insert review
        await db.query(
          `
                    INSERT INTO ReviewRatings (movieID, userID, rating, review, reviewDate, lastUpdated)
                    VALUES (?, ?, ?, ?, NOW(), NOW())
                `,
          [review.movieID, review.userID, review.rating, review.review]
        );

        console.log(
          `✓ Added review: Movie ${review.movieID}, User ${review.userID}, Rating ${review.rating}`
        );
        successCount++;
      } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
          console.log(
            `⊘ Skipping review (Movie ${review.movieID}, User ${review.userID}) - already exists`
          );
          skipCount++;
        } else {
          console.error(`✗ Error adding review:`, error.message);
        }
      }
    }

    console.log(`\n✓ Successfully added ${successCount} reviews`);
    console.log(`⊘ Skipped ${skipCount} reviews (duplicates or missing data)`);

    // Update average ratings for all movies with reviews
    console.log("\nUpdating average ratings...");
    const moviesWithReviews = await db.query(`
            SELECT DISTINCT movieID FROM ReviewRatings
        `);

    for (const { movieID } of moviesWithReviews) {
      const avgResult = await db.query(
        `
                SELECT AVG(rating) as avgRating, COUNT(*) as reviewCount
                FROM ReviewRatings
                WHERE movieID = ?
            `,
        [movieID]
      );

      const avgRating = avgResult[0].avgRating || 0;
      const reviewCount = avgResult[0].reviewCount || 0;

      await db.query(
        `
                UPDATE Movie 
                SET avgRating = ?
                WHERE movieID = ?
            `,
        [avgRating, movieID]
      );

      console.log(
        `✓ Updated Movie ${movieID}: avgRating = ${parseFloat(
          avgRating
        ).toFixed(1)}, reviewCount = ${reviewCount}`
      );
    }

    console.log("\n✓ All reviews added and ratings updated successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error adding dummy reviews:", error);
    process.exit(1);
  }
}

addDummyReviews();
