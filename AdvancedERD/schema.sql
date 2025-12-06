CREATE DATABASE MovieCommunity;
USE MovieCommunity;

CREATE TABLE User(
    userID INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL DEFAULT "",
    name VARCHAR(255) NOT NULL DEFAULT "",
    email VARCHAR(255) NOT NULL DEFAULT "",
    password VARCHAR(255) NOT NULL DEFAULT "",
    registrationDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    role ENUM('user', 'admin') DEFAULT 'user'              
);
-- issues:
-- add fields to movie fie;ld - done
-- add username to user - done
CREATE TABLE Genres (
    genreID INT AUTO_INCREMENT PRIMARY KEY,
    genreName VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE UserGenres (
    userID INT NOT NULL,
    genreID INT NOT NULL,
    PRIMARY KEY (userID, genreID),
    FOREIGN KEY (userID) REFERENCES User(userID) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (genreID) REFERENCES Genres(genreID) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE Movie(
    movieID INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(1023) NOT NULL DEFAULT "",
    synopsis VARCHAR(2047) NOT NULL DEFAULT "", -- basically plot summary
    director  VARCHAR(255) NOT NULL DEFAULT "",
    releaseYear INT NOT NULL,
    posterImg VARCHAR(255) NOT NULL DEFAULT 'default.png',
    totalViews INT DEFAULT 0,
    viewCount INT DEFAULT 0,
    avgRating DECIMAL(3, 1) DEFAULT 0.0
);

CREATE TABLE MovieGenres (
    movieID INT NOT NULL,
    genreID INT NOT NULL,
    PRIMARY KEY (movieID, genreID),
    FOREIGN KEY (movieID) REFERENCES Movie(movieID) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (genreID) REFERENCES Genres(genreID) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE WatchList(
    movieID INT NOT NULL,
    userID INT NOT NULL,
    PRIMARY KEY (movieID, userID),
    FOREIGN KEY (movieID) REFERENCES Movie(movieID) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (userID) REFERENCES User(userID) ON DELETE CASCADE ON UPDATE CASCADE,
    status ENUM('added', 'completed') DEFAULT 'added',
    lastUpdated DATETIME DEFAULT CURRENT_TIMESTAMP,
    addedDate DATETIME NOT NULL
);

CREATE TABLE FriendRequest(
    reqID INT AUTO_INCREMENT PRIMARY KEY,
    senderID INT NOT NULL,
    receiverID INT NOT NULL,
    status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
    reqDate DATETIME NOT NULL,
    responseDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (senderID) REFERENCES User(userID) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (receiverID) REFERENCES User(userID) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE Friends(
    user1 INT NOT NULL,
    user2 INT NOT NULL,
    PRIMARY KEY (user1, user2),
    friendshipDate DATETIME NOT NULL,
    FOREIGN KEY (user1) REFERENCES User(userID) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (user2) REFERENCES User(userID) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE ReviewRatings(
    movieID INT NOT NULL,
    userID INT NOT NULL,
    PRIMARY KEY (movieID, userID),
    FOREIGN KEY (movieID) REFERENCES Movie(movieID) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (userID) REFERENCES User(userID) ON DELETE CASCADE ON UPDATE CASCADE,
    rating DECIMAL(2, 1) NOT NULL DEFAULT 0.0,
    review VARCHAR(8095) NOT NULL DEFAULT "",
    reviewDate DATETIME NOT NULL,
    lastUpdated DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Post(
    postID INT AUTO_INCREMENT PRIMARY KEY,
    movieID INT NOT NULL,
    userID INT NOT NULL,
    FOREIGN KEY (movieID) REFERENCES Movie(movieID) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (userID) REFERENCES User(userID) ON DELETE CASCADE ON UPDATE CASCADE,
    postContent VARCHAR(8095) NOT NULL DEFAULT "",
    likeCount INT DEFAULT 0,
    commentCount INT DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Comments(
    commentID INT AUTO_INCREMENT PRIMARY KEY,
    postID INT NOT NULL,
    userID INT NOT NULL,
    FOREIGN KEY (postID) REFERENCES Post(postID) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (userID) REFERENCES User(userID) ON DELETE CASCADE ON UPDATE CASCADE,
    commentContent VARCHAR(8095) NOT NULL DEFAULT "",
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Likes(
    postID INT NOT NULL,
    userID INT NOT NULL,
    PRIMARY KEY (postID, userID),
    FOREIGN KEY (postID) REFERENCES Post(postID) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (userID) REFERENCES User(userID) ON DELETE CASCADE ON UPDATE CASCADE,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Notifications(
    notificationID INT AUTO_INCREMENT PRIMARY KEY,
    receivedFROMuserID INT NOT NULL,
    FOREIGN KEY (receivedFROMuserID) REFERENCES User(userID) ON DELETE CASCADE ON UPDATE CASCADE,
    content VARCHAR(255) NOT NULL DEFAULT "",
    triggerEvent ENUM('friend_request', 'friend_accept', 'new_post', 'post_like', 'post_comment') NOT NULL,
    isSeen BOOLEAN DEFAULT FALSE,
    timeStamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE WatchEvent(
    eventID INT AUTO_INCREMENT PRIMARY KEY,
    eventTitle VARCHAR(255) NOT NULL DEFAULT "",
    associatedMovieID INT NOT NULL,
    host INT NOT NULL,
    FOREIGN KEY (associatedMovieID) REFERENCES Movie(movieID) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (host) REFERENCES User(userID) ON DELETE CASCADE ON UPDATE CASCADE,
    description VARCHAR(1023) NOT NULL DEFAULT "",
    eventDateTime DATETIME NOT NULL,
    capacity INT NOT NULL DEFAULT 0,
    currentCapacity INT DEFAULT 0
);

CREATE TABLE EventParticipants(
    eventID INT NOT NULL,
    userID INT NOT NULL,
    PRIMARY KEY (eventID, userID),
    FOREIGN KEY (eventID) REFERENCES WatchEvent(eventID) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (userID) REFERENCES User(userID) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE Message(
    messageID INT AUTO_INCREMENT PRIMARY KEY,
    friendID INT NOT NULL,
    senderID INT NOT NULL,
    receiverID INT NOT NULL,
    FOREIGN KEY (senderID) REFERENCES User(userID) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (receiverID) REFERENCES User(userID) ON DELETE CASCADE ON UPDATE CASCADE,
    content VARCHAR(2047) NOT NULL DEFAULT "",
    timeStamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    isRead BOOLEAN DEFAULT FALSE
);

CREATE TABLE RestrictedWords(
    wordID INT AUTO_INCREMENT PRIMARY KEY,
    word VARCHAR(255) NOT NULL UNIQUE,
    addedDate DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE AuditLog(
    logID INT AUTO_INCREMENT PRIMARY KEY,
    adminID INT NOT NULL,
    FOREIGN KEY (adminID) REFERENCES User(userID) ON DELETE CASCADE ON UPDATE CASCADE,
    targetRecordID INT NOT NULL,
    targetTable VARCHAR(100) NOT NULL,
    timeStamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    operationPerformed ENUM('INSERT', 'UPDATE', 'DELETE CONTENT', 'MODERATION', 'MANAGEMENT', 'REPORT CREATION', 'VIEW RESTRICTED CONTENT') NOT NULL
);




USE MovieCommunity;

-- ==========================================================
-- USERS (20 users, 3 of them admins)
-- ==========================================================
INSERT INTO User (name, email, password, role)
VALUES 
('User1', 'user1@example.com', 'pass1', 'admin'),
('User2', 'user2@example.com', 'pass2', 'admin'),
('User3', 'user3@example.com', 'pass3', 'admin'),
('User4', 'user4@example.com', 'pass4', 'user'),
('User5', 'user5@example.com', 'pass5', 'user'),
('User6', 'user6@example.com', 'pass6', 'user'),
('User7', 'user7@example.com', 'pass7', 'user'),
('User8', 'user8@example.com', 'pass8', 'user'),
('User9', 'user9@example.com', 'pass9', 'user'),
('User10', 'user10@example.com', 'pass10', 'user'),
('User11', 'user11@example.com', 'pass11', 'user'),
('User12', 'user12@example.com', 'pass12', 'user'),
('User13', 'user13@example.com', 'pass13', 'user'),
('User14', 'user14@example.com', 'pass14', 'user'),
('User15', 'user15@example.com', 'pass15', 'user'),
('User16', 'user16@example.com', 'pass16', 'user'),
('User17', 'user17@example.com', 'pass17', 'user'),
('User18', 'user18@example.com', 'pass18', 'user'),
('User19', 'user19@example.com', 'pass19', 'user'),
('User20', 'user20@example.com', 'pass20', 'user');

-- ==========================================================
-- GENRES (3 genres)
-- ==========================================================
INSERT INTO Genres (genreName)
VALUES ('Action'), ('Comedy'), ('Drama');

-- ==========================================================
-- MOVIES (18 movies)
-- ==========================================================
INSERT INTO Movie (title, synopsis, releaseYear, posterImg, totalViews, viewCount, avgRating)
VALUES
('Movie1', 'Synopsis for Movie1', 2020, 'poster1.png', 100, 10, 4.2),
('Movie2', 'Synopsis for Movie2', 2021, 'poster2.png', 150, 15, 3.9),
('Movie3', 'Synopsis for Movie3', 2022, 'poster3.png', 200, 20, 4.5),
('Movie4', 'Synopsis for Movie4', 2019, 'poster4.png', 110, 11, 4.0),
('Movie5', 'Synopsis for Movie5', 2018, 'poster5.png', 120, 12, 3.8),
('Movie6', 'Synopsis for Movie6', 2017, 'poster6.png', 90, 9, 4.1),
('Movie7', 'Synopsis for Movie7', 2020, 'poster7.png', 250, 25, 4.3),
('Movie8', 'Synopsis for Movie8', 2021, 'poster8.png', 300, 30, 4.7),
('Movie9', 'Synopsis for Movie9', 2022, 'poster9.png', 130, 13, 3.5),
('Movie10', 'Synopsis for Movie10', 2020, 'poster10.png', 170, 17, 4.4),
('Movie11', 'Synopsis for Movie11', 2021, 'poster11.png', 180, 18, 4.2),
('Movie12', 'Synopsis for Movie12', 2019, 'poster12.png', 190, 19, 4.0),
('Movie13', 'Synopsis for Movie13', 2018, 'poster13.png', 160, 16, 3.7),
('Movie14', 'Synopsis for Movie14', 2017, 'poster14.png', 140, 14, 4.1),
('Movie15', 'Synopsis for Movie15', 2020, 'poster15.png', 210, 21, 4.6),
('Movie16', 'Synopsis for Movie16', 2021, 'poster16.png', 220, 22, 3.9),
('Movie17', 'Synopsis for Movie17', 2022, 'poster17.png', 230, 23, 4.3),
('Movie18', 'Synopsis for Movie18', 2023, 'poster18.png', 240, 24, 4.5);

-- ==========================================================
-- MOVIE GENRES (assign random genres)
-- ==========================================================
INSERT INTO MovieGenres (movieID, genreID)
VALUES
(1,1),(1,2),(2,3),(3,1),(4,2),(5,3),(6,1),(7,2),(8,3),
(9,1),(10,2),(11,3),(12,1),(13,2),(14,3),(15,1),(16,2),(17,3),(18,1);

-- ==========================================================
-- FRIENDS (each has at least 2 friends)
-- ==========================================================
INSERT INTO Friends (user1, user2, friendshipDate)
VALUES
(1,2,NOW()),(1,3,NOW()),(2,3,NOW()),(4,5,NOW()),(5,6,NOW()),
(7,8,NOW()),(8,9,NOW()),(9,10,NOW()),(10,11,NOW()),(11,12,NOW()),
(12,13,NOW()),(13,14,NOW()),(14,15,NOW()),(15,16,NOW()),(16,17,NOW()),
(17,18,NOW()),(18,19,NOW()),(19,20,NOW()),(2,4,NOW()),(3,5,NOW());

-- ==========================================================
-- FRIEND REQUESTS (2 per user)
-- ==========================================================
INSERT INTO FriendRequest (senderID, receiverID, status, reqDate)
VALUES
(1,4,'pending',NOW()),(1,5,'accepted',NOW()),
(2,6,'pending',NOW()),(2,7,'accepted',NOW()),
(3,8,'pending',NOW()),(3,9,'accepted',NOW()),
(4,10,'accepted',NOW()),(4,11,'pending',NOW()),
(5,12,'accepted',NOW()),(5,13,'pending',NOW()),
(6,14,'pending',NOW()),(6,15,'accepted',NOW()),
(7,16,'accepted',NOW()),(7,17,'pending',NOW()),
(8,18,'pending',NOW()),(8,19,'accepted',NOW()),
(9,20,'accepted',NOW()),(9,1,'pending',NOW());

-- ==========================================================
-- POSTS (5 posts)
-- ==========================================================
INSERT INTO Post (movieID, userID, postContent)
VALUES
(1,1,'Post about Movie1'),
(2,2,'Post about Movie2'),
(3,3,'Post about Movie3'),
(4,4,'Post about Movie4'),
(5,5,'Post about Movie5');

-- ==========================================================
-- LIKES (3 likes per post)
-- ==========================================================
INSERT INTO Likes (postID, userID)
VALUES
(1,2),(1,3),(1,4),
(2,3),(2,4),(2,5),
(3,4),(3,5),(3,6),
(4,5),(4,6),(4,7),
(5,6),(5,7),(5,8);

-- ==========================================================
-- COMMENTS (3 per post)
-- ==========================================================
INSERT INTO Comments (postID, userID, commentContent)
VALUES
(1,2,'Nice post!'),(1,3,'Agreed!'),(1,4,'Awesome!'),
(2,3,'Great post!'),(2,4,'Well said!'),(2,5,'Cool movie!'),
(3,4,'Love this!'),(3,5,'Interesting!'),(3,6,'Fantastic!'),
(4,5,'Great info!'),(4,6,'Amazing!'),(4,7,'Nice review!'),
(5,6,'Very nice!'),(5,7,'Loved it!'),(5,8,'Good summary!');

-- ==========================================================
-- REVIEWS (7 reviews)
-- ==========================================================
INSERT INTO ReviewRatings (movieID, userID, rating, review, reviewDate)
VALUES
(1,2,4.5,'Great movie!',NOW()),
(2,3,4.0,'Good storyline.',NOW()),
(3,4,3.5,'Average movie.',NOW()),
(4,5,5.0,'Loved it!',NOW()),
(5,6,4.2,'Well directed.',NOW()),
(6,7,3.8,'Nice one.',NOW()),
(7,8,4.6,'Fantastic experience!',NOW());

-- ==========================================================
-- WATCH EVENTS (4 events)
-- ==========================================================
INSERT INTO WatchEvent (eventTitle, associatedMovieID, host, description, eventDateTime, capacity, currentCapacity)
VALUES
('Event1',1,1,'Watch Party for Movie1','2025-11-20 19:00:00',10,5),
('Event2',2,2,'Discussion about Movie2','2025-11-22 18:00:00',8,4),
('Event3',3,3,'Review Night for Movie3','2025-11-25 20:00:00',12,6),
('Event4',4,4,'Fan Meetup for Movie4','2025-11-28 17:00:00',15,7);

-- ==========================================================
-- EVENT PARTICIPANTS (5)
-- ==========================================================
INSERT INTO EventParticipants (eventID, userID)
VALUES
(1,2),(1,3),(2,4),(3,5),(4,6);

-- ==========================================================
-- NOTIFICATIONS (3 per user)
-- ==========================================================
INSERT INTO Notifications (receivedFROMuserID, content, triggerEvent)
VALUES
(1,'You have a new friend request','friend_request'),
(1,'Your post got a like','post_like'),
(1,'New comment on your post','post_comment'),
(2,'You have a new friend request','friend_request'),
(2,'Your post got a like','post_like'),
(2,'New comment on your post','post_comment'),
(3,'You have a new friend request','friend_request'),
(3,'Your post got a like','post_like'),
(3,'New comment on your post','post_comment');

-- ==========================================================
-- MESSAGES (3 messages)
-- ==========================================================
INSERT INTO Message (friendID, senderID, receiverID, content)
VALUES
(1,1,2,'Hello!'),
(2,2,3,'How are you?'),
(3,3,4,'Great movie last night!');

-- ==========================================================
-- RESTRICTED WORDS (7)
-- ==========================================================
INSERT INTO RestrictedWords (word)
VALUES
('badword1'),('badword2'),('spoiler'),('hate'),('offensive'),('spam'),('troll');

-- ==========================================================
-- AUDIT LOG (5 records)
-- ==========================================================
INSERT INTO AuditLog (adminID, targetRecordID, targetTable, operationPerformed)
VALUES
(1,1,'User','INSERT'),
(2,2,'Movie','UPDATE'),
(3,3,'Post','DELETE CONTENT'),
(1,4,'Comments','MODERATION'),
(2,5,'ReviewRatings','REPORT CREATION');

-- ==========================================================
-- USER GENRES (each user has 2 favorite genres)
-- ==========================================================
INSERT INTO UserGenres (userID, genreID)
VALUES
(1,1),(1,2),
(2,2),(2,3),
(3,1),(3,3),
(4,1),(4,2),
(5,2),(5,3),
(6,1),(6,3),
(7,1),(7,2),
(8,2),(8,3),
(9,1),(9,3),
(10,1),(10,2),
(11,2),(11,3),
(12,1),(12,3),
(13,1),(13,2),
(14,2),(14,3),
(15,1),(15,3),
(16,1),(16,2),
(17,2),(17,3),
(18,1),(18,3),
(19,1),(19,2),
(20,2),(20,3);

-- ==========================================================
-- WATCHLIST (each user has 2 movies)
-- ==========================================================
INSERT INTO WatchList (movieID, userID, status, addedDate)
VALUES
(1,1,'to-watch',NOW()),(2,1,'completed',NOW()),
(3,2,'to-watch',NOW()),(4,2,'completed',NOW()),
(5,3,'to-watch',NOW()),(6,3,'completed',NOW()),
(7,4,'to-watch',NOW()),(8,4,'completed',NOW()),
(9,5,'to-watch',NOW()),(10,5,'completed',NOW()),
(11,6,'to-watch',NOW()),(12,6,'completed',NOW()),
(13,7,'to-watch',NOW()),(14,7,'completed',NOW()),
(15,8,'to-watch',NOW()),(16,8,'completed',NOW()),
(17,9,'to-watch',NOW()),(18,9,'completed',NOW()),
(1,10,'to-watch',NOW()),(3,10,'completed',NOW()),
(4,11,'to-watch',NOW()),(5,11,'completed',NOW()),
(6,12,'to-watch',NOW()),(7,12,'completed',NOW()),
(8,13,'to-watch',NOW()),(9,13,'completed',NOW()),
(10,14,'to-watch',NOW()),(11,14,'completed',NOW()),
(12,15,'to-watch',NOW()),(13,15,'completed',NOW()),
(14,16,'to-watch',NOW()),(15,16,'completed',NOW()),
(16,17,'to-watch',NOW()),(17,17,'completed',NOW()),
(18,18,'to-watch',NOW()),(1,18,'completed',NOW()),
(2,19,'to-watch',NOW()),(3,19,'completed',NOW()),
(4,20,'to-watch',NOW()),(5,20,'completed',NOW());


