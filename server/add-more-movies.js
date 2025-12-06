/**
 * Add More Movies Script
 * Adds additional movies to test pagination
 */

const mysql = require("mysql2/promise");

const movies = [
  {
    title: "The Shawshank Redemption",
    synopsis:
      "Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.",
    director: "Frank Darabont",
    releaseYear: 1994,
    posterImg: "movie_posters/white.png",
    avgRating: 9.3,
    genres: ["Drama"],
  },
  {
    title: "The Dark Knight",
    synopsis:
      "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests.",
    director: "Christopher Nolan",
    releaseYear: 2008,
    posterImg: "movie_posters/white.png",
    avgRating: 9.0,
    genres: ["Action", "Crime", "Drama"],
  },
  {
    title: "The Godfather",
    synopsis:
      "The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son.",
    director: "Francis Ford Coppola",
    releaseYear: 1972,
    posterImg: "movie_posters/white.png",
    avgRating: 9.2,
    genres: ["Crime", "Drama"],
  },
  {
    title: "Pulp Fiction",
    synopsis:
      "The lives of two mob hitmen, a boxer, a gangster and his wife intertwine in four tales of violence and redemption.",
    director: "Quentin Tarantino",
    releaseYear: 1994,
    posterImg: "movie_posters/white.png",
    avgRating: 8.9,
    genres: ["Crime", "Drama"],
  },
  {
    title: "Forrest Gump",
    synopsis:
      "The presidencies of Kennedy and Johnson unfold through the perspective of an Alabama man with an IQ of 75.",
    director: "Robert Zemeckis",
    releaseYear: 1994,
    posterImg: "movie_posters/white.png",
    avgRating: 8.8,
    genres: ["Drama", "Romance"],
  },
  {
    title: "The Matrix",
    synopsis:
      "A computer hacker learns from mysterious rebels about the true nature of his reality and his role in the war against its controllers.",
    director: "Lana Wachowski, Lilly Wachowski",
    releaseYear: 1999,
    posterImg: "movie_posters/white.png",
    avgRating: 8.7,
    genres: ["Action", "Sci-Fi"],
  },
  {
    title: "Goodfellas",
    synopsis:
      "The story of Henry Hill and his life in the mob, covering his relationship with his wife and his partners in crime.",
    director: "Martin Scorsese",
    releaseYear: 1990,
    posterImg: "movie_posters/white.png",
    avgRating: 8.7,
    genres: ["Crime", "Drama"],
  },
  {
    title: "The Silence of the Lambs",
    synopsis:
      "A young FBI cadet must receive the help of an incarcerated cannibal killer to catch another serial killer.",
    director: "Jonathan Demme",
    releaseYear: 1991,
    posterImg: "movie_posters/white.png",
    avgRating: 8.6,
    genres: ["Crime", "Drama", "Thriller"],
  },
  {
    title: "Saving Private Ryan",
    synopsis:
      "Following the Normandy Landings, a group of U.S. soldiers go behind enemy lines to retrieve a paratrooper.",
    director: "Steven Spielberg",
    releaseYear: 1998,
    posterImg: "movie_posters/white.png",
    avgRating: 8.6,
    genres: ["Drama", "War"],
  },
  {
    title: "Interstellar",
    synopsis:
      "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.",
    director: "Christopher Nolan",
    releaseYear: 2014,
    posterImg: "movie_posters/white.png",
    avgRating: 8.6,
    genres: ["Adventure", "Drama", "Sci-Fi"],
  },
  {
    title: "Parasite",
    synopsis:
      "Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.",
    director: "Bong Joon Ho",
    releaseYear: 2019,
    posterImg: "movie_posters/white.png",
    avgRating: 8.6,
    genres: ["Drama", "Thriller"],
  },
  {
    title: "The Green Mile",
    synopsis:
      "The lives of guards on Death Row are affected by one of their charges: a black man accused of child murder.",
    director: "Frank Darabont",
    releaseYear: 1999,
    posterImg: "movie_posters/white.png",
    avgRating: 8.6,
    genres: ["Crime", "Drama", "Fantasy"],
  },
  {
    title: "Spider-Man: No Way Home",
    synopsis:
      "With Spider-Man's identity now revealed, Peter asks Doctor Strange for help. When a spell goes wrong, dangerous foes from other worlds start to appear.",
    director: "Jon Watts",
    releaseYear: 2021,
    posterImg: "movie_posters/white.png",
    avgRating: 8.3,
    genres: ["Action", "Adventure", "Fantasy"],
  },
  {
    title: "Avengers: Endgame",
    synopsis:
      "After the devastating events of Infinity War, the Avengers assemble once more to reverse Thanos' actions.",
    director: "Anthony Russo, Joe Russo",
    releaseYear: 2019,
    posterImg: "movie_posters/white.png",
    avgRating: 8.4,
    genres: ["Action", "Adventure", "Drama"],
  },
  {
    title: "Top Gun: Maverick",
    synopsis:
      "After thirty years, Maverick is still pushing the envelope as a top naval aviator, training a new generation.",
    director: "Joseph Kosinski",
    releaseYear: 2022,
    posterImg: "movie_posters/white.png",
    avgRating: 8.3,
    genres: ["Action", "Drama"],
  },
  {
    title: "Dune",
    synopsis:
      "Paul Atreides arrives on Arrakis after his father accepts the stewardship of the dangerous planet.",
    director: "Denis Villeneuve",
    releaseYear: 2021,
    posterImg: "movie_posters/white.png",
    avgRating: 8.0,
    genres: ["Action", "Adventure", "Drama"],
  },
  {
    title: "Joker",
    synopsis:
      "In Gotham City, mentally troubled comedian Arthur Fleck is disregarded and mistreated by society.",
    director: "Todd Phillips",
    releaseYear: 2019,
    posterImg: "movie_posters/white.png",
    avgRating: 8.4,
    genres: ["Crime", "Drama", "Thriller"],
  },
  {
    title: "The Departed",
    synopsis:
      "An undercover cop and a mole in the police attempt to identify each other while infiltrating an Irish gang in Boston.",
    director: "Martin Scorsese",
    releaseYear: 2006,
    posterImg: "movie_posters/white.png",
    avgRating: 8.5,
    genres: ["Crime", "Drama", "Thriller"],
  },
  {
    title: "Whiplash",
    synopsis:
      "A promising young drummer enrolls at a cut-throat music conservatory where his dreams are mentored by a teacher who will stop at nothing.",
    director: "Damien Chazelle",
    releaseYear: 2014,
    posterImg: "movie_posters/white.png",
    avgRating: 8.5,
    genres: ["Drama", "Music"],
  },
  {
    title: "The Prestige",
    synopsis:
      "After a tragic accident, two stage magicians engage in a battle to create the ultimate illusion.",
    director: "Christopher Nolan",
    releaseYear: 2006,
    posterImg: "movie_posters/white.png",
    avgRating: 8.5,
    genres: ["Drama", "Mystery", "Sci-Fi"],
  },
  {
    title: "Gladiator",
    synopsis:
      "A former Roman General sets out to exact vengeance against the corrupt emperor who murdered his family.",
    director: "Ridley Scott",
    releaseYear: 2000,
    posterImg: "movie_posters/white.png",
    avgRating: 8.5,
    genres: ["Action", "Adventure", "Drama"],
  },
  {
    title: "The Lion King",
    synopsis:
      "Lion prince Simba and his father are targeted by his bitter uncle, who wants to ascend the throne himself.",
    director: "Roger Allers, Rob Minkoff",
    releaseYear: 1994,
    posterImg: "movie_posters/white.png",
    avgRating: 8.5,
    genres: ["Animation", "Adventure", "Drama"],
  },
  {
    title: "Back to the Future",
    synopsis:
      "Marty McFly is accidentally sent 30 years into the past in a time-traveling DeLorean invented by his friend.",
    director: "Robert Zemeckis",
    releaseYear: 1985,
    posterImg: "movie_posters/white.png",
    avgRating: 8.5,
    genres: ["Adventure", "Comedy", "Sci-Fi"],
  },
  {
    title: "Django Unchained",
    synopsis:
      "With the help of a German bounty-hunter, a freed slave sets out to rescue his wife from a brutal plantation owner.",
    director: "Quentin Tarantino",
    releaseYear: 2012,
    posterImg: "movie_posters/white.png",
    avgRating: 8.4,
    genres: ["Drama", "Western"],
  },
  {
    title: "The Usual Suspects",
    synopsis:
      "A sole survivor tells of the twisty events leading up to a horrific gun battle on a boat.",
    director: "Bryan Singer",
    releaseYear: 1995,
    posterImg: "movie_posters/white.png",
    avgRating: 8.5,
    genres: ["Crime", "Mystery", "Thriller"],
  },
];

async function addMovies() {
  let connection;
  try {
    console.log("Connecting to database...");
    connection = await mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "8956",
      database: "3movieCollectors",
    });

    console.log("Connected! Adding movies...\n");

    for (const movie of movies) {
      try {
        // Check if movie already exists
        const [existing] = await connection.query(
          "SELECT movieID FROM Movie WHERE title = ?",
          [movie.title]
        );

        if (existing.length > 0) {
          console.log(`⏭️  Skipping "${movie.title}" (already exists)`);
          continue;
        }

        // Insert movie
        const [result] = await connection.query(
          `INSERT INTO Movie (title, synopsis, director, releaseYear, posterImg, avgRating) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            movie.title,
            movie.synopsis,
            movie.director,
            movie.releaseYear,
            movie.posterImg,
            movie.avgRating,
          ]
        );

        const movieId = result.insertId;

        // Add genres
        for (const genreName of movie.genres) {
          // Get or create genre
          let [genreRows] = await connection.query(
            "SELECT genreID FROM Genres WHERE genreName = ?",
            [genreName]
          );

          let genreId;
          if (genreRows.length === 0) {
            const [genreResult] = await connection.query(
              "INSERT INTO Genres (genreName) VALUES (?)",
              [genreName]
            );
            genreId = genreResult.insertId;
          } else {
            genreId = genreRows[0].genreID;
          }

          // Link movie to genre
          await connection.query(
            "INSERT INTO MovieGenres (movieID, genreID) VALUES (?, ?)",
            [movieId, genreId]
          );
        }

        console.log(
          `✅ Added "${movie.title}" (${
            movie.releaseYear
          }) - ${movie.genres.join(", ")}`
        );
      } catch (error) {
        console.error(`❌ Error adding "${movie.title}":`, error.message);
      }
    }

    // Get final count
    const [count] = await connection.query(
      "SELECT COUNT(*) as total FROM Movie"
    );
    console.log(`\n🎬 Total movies in database: ${count[0].total}`);
  } catch (error) {
    console.error("Database error:", error);
  } finally {
    if (connection) {
      await connection.end();
      console.log("\nDatabase connection closed.");
    }
  }
}

addMovies();
