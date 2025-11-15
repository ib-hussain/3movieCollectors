const express = require("express");
const connection = require("./database");
const app = express();
const PORT = 3000;
connection.connect((err) => {
  if (err) {
    console.error(" no connection to MySQL database:", err.stack);
    throw err;
  }
  console.log(`connected as id ${connection.threadId} s server is running`);
});
app.get("/", (req, res) => {
  res.send(
    "Welcome to the ibrahim's imdb  <br><br>\
    Use the following endpoints: /create-tables, /insert-data, /display-movies, /update-user, /movie-popularity-level"
  );
});
// task2
app.get("/create-tables", (req, res) => {

  const createTablesQuery = `
        set FOREIGN_KEY_CHECKS=0;
        DROP TABLE IF EXISTS Watch_History;
        DROP TABLE IF EXISTS Movie;
        DROP TABLE IF EXISTS User;
        DROP TABLE IF EXISTS Genre;
        CREATE TABLE Genre (
            genre_id INT PRIMARY KEY,
            name VARCHAR(50)
        );
        CREATE TABLE User (
            user_id INT PRIMARY KEY,
            name VARCHAR(100),
            subscription_type VARCHAR(20)
        );
        CREATE TABLE Movie (
            movie_id INT PRIMARY KEY,
            title VARCHAR(100),
            genre_id INT NOT NULL,
            release_year INT,
            rating DECIMAL(3,1),
            FOREIGN KEY (genre_id) REFERENCES Genre(genre_id)
        );
        CREATE TABLE Watch_History (
            watch_id INT PRIMARY KEY,
            user_id INT,
            movie_id INT,
            watch_date DATETIME,
            duration_watched INT,
            FOREIGN KEY (user_id) REFERENCES User(user_id),
            FOREIGN KEY (movie_id) REFERENCES Movie(movie_id)
        );
        SET FOREIGN_KEY_CHECKS=1;
    `;
  connection.query(createTablesQuery, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error creating tables...");
    }
    res.send("Tables Created!");
  });
});
// task3
app.get("/insert-data", (req, res) => {
  const insertDataQuery = `
        INSERT INTO Genre VALUES (1, 'Action'), (2, 'Drama'), (3, 'Comedy');
        INSERT INTO Movie VALUES
        (1, 'Skyfall', 1, 2012, 8.0),
        (2, 'The Pursuit', 2, 2006, 8.5),
        (3, 'The Office', 3, 2005, 8.9),
        (4, 'Interstellar', 2, 2014, 8.6),
        (5, 'Deadpool', 1, 2016, 8.1),
        (6, 'Friends', 3, 1994, 8.8);
        INSERT INTO User VALUES
        (1, 'Ayesha Iqbal', 'Premium'),
        (2, 'Bilal Hassan', 'Free'),
        (3, 'Zara Khan', 'Premium'),
        (4, 'Hamza Sheikh', 'Standard');
        INSERT INTO Watch_History VALUES
        (1, 1, 1, '2024-09-02', 130),
        (2, 2, 2, '2024-09-03', 110),
        (3, 3, 3, '2024-09-05', 90),
        (4, 4, 4, '2024-09-06', 169),
        (5, 1, 5, '2024-09-10', 108),
        (6, 2, 6, '2024-09-11', 60),
        (7, 3, 1, '2024-09-13', 125),
        (8, 1, 2, '2024-09-14', 115),
        (9, 4, 3, '2024-09-15 17:30:00', 85),
        (10, 3, 5, '2024-09-18 20:15:00', 95);
        SELECT * FROM Watch_History;
    `;
  connection.query(insertDataQuery, (err, results) => {
    if (err) {
      console.error(err);
      return res
        .status(500)
        .send("Error inserting data. ");
    }
    res.json({
      message: "Data inserted successfully. Displaying Watch_History:",
      watchHistory: results[results.length - 1],
    });
  });
});
// task4
app.get("/display-movies", (req, res) => {
  const premiumQuery = `
        SELECT DISTINCT 
            M.title, 
            G.name AS genre_name
        FROM 
            Movie M
        JOIN 
            Genre G ON M.genre_id = G.genre_id
        JOIN 
            Watch_History WH ON M.movie_id = WH.movie_id
        JOIN 
            User U ON WH.user_id = U.user_id
        WHERE 
            U.subscription_type = 'Premium';
    `;
  connection.query(premiumQuery, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error fetching premium movie data.");
    }
    res.json({
      message: "Movies watched by Premium users:",
      movies: results,
    });
  });
});
//   task5
app.get("/update-user", (req, res) => {
  const userIdToUpdate = 2; // User ID 2 (Bilal Hassan)
  const newSubscription = "Standard";
  const updateQuery = `
        UPDATE User 
        SET subscription_type = '${newSubscription}' 
        WHERE user_id = ${userIdToUpdate};
    `;
  const selectQuery = `
        SELECT * FROM User 
        WHERE user_id = ${userIdToUpdate};
    `;
  connection.query(updateQuery, (err, updateResult) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error updating user subscription.");
    }
    connection.query(selectQuery, (err, selectResult) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Error fetching updated user data.");
      }
      res.json({
        message: `Subscription for user ID ${userIdToUpdate} updated to '${newSubscription}' successfully.`,
        updatedUser: selectResult[0],
      });
    });
  });
});

// task6
app.get("/movie-popularity-level", (req, res) => {
  const popularityQuery = `
        SELECT 
            movie_id, 
            title, 
            rating,
            CASE
                WHEN rating > 8.5 THEN 'Hit'
                WHEN rating BETWEEN 7 AND 8.5 THEN 'Average'
                ELSE 'Flop'
            END AS popularity_level
        FROM 
            Movie
        ORDER BY 
            rating DESC;
    `;
  connection.query(popularityQuery, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error ");
    }
    res.json({
      message: "Movie Popularity Levels:",
      movies: results,
    });
  });
});

// main function
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(
    "Use endpoints: /create-tables, /insert-data, /display-movies, /update-user, /movie-popularity-level"
  );
});
