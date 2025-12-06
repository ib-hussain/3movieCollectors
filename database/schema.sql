-- ============================================================
-- 3movieCollectors Database Schema
-- ============================================================
-- Drop database if exists and create fresh
DROP DATABASE IF EXISTS 3movieCollectors;
CREATE DATABASE 3movieCollectors CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE 3movieCollectors;

-- ============================================================
-- TABLE: User
-- ============================================================
CREATE TABLE User(
    userID INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL DEFAULT "",
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    registrationDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    role ENUM('user', 'admin') DEFAULT 'user',
    INDEX idx_email (email),
    INDEX idx_username (username)
);

-- ============================================================
-- TABLE: Genres
-- ============================================================
CREATE TABLE Genres (
    genreID INT AUTO_INCREMENT PRIMARY KEY,
    genreName VARCHAR(100) NOT NULL UNIQUE,
    INDEX idx_genreName (genreName)
);

-- ============================================================
-- TABLE: UserGenres (User's favorite genres)
-- ============================================================
CREATE TABLE UserGenres (
    userID INT NOT NULL,
    genreID INT NOT NULL,
    PRIMARY KEY (userID, genreID),
    FOREIGN KEY (userID) REFERENCES User(userID) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (genreID) REFERENCES Genres(genreID) ON DELETE CASCADE ON UPDATE CASCADE
);

-- ============================================================
-- TABLE: Movie
-- ============================================================
CREATE TABLE Movie(
    movieID INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(1023) NOT NULL,
    synopsis TEXT,
    director VARCHAR(255) DEFAULT "",
    releaseYear INT NOT NULL,
    posterImg VARCHAR(255) DEFAULT 'default.png',
    totalViews INT DEFAULT 0,
    viewCount INT DEFAULT 0,
    avgRating DECIMAL(3, 1) DEFAULT 0.0,
    INDEX idx_title (title(255)),
    INDEX idx_releaseYear (releaseYear),
    INDEX idx_avgRating (avgRating)
);

-- ============================================================
-- TABLE: MovieCast
-- ============================================================
CREATE TABLE MovieCast (
    movieID INT NOT NULL,
    castMember VARCHAR(255) NOT NULL,
    FOREIGN KEY (movieID) REFERENCES Movie(movieID) ON DELETE CASCADE ON UPDATE CASCADE
);

-- ============================================================
-- TABLE: MovieGenres
-- ============================================================
CREATE TABLE MovieGenres (
    movieID INT NOT NULL,
    genreID INT NOT NULL,
    PRIMARY KEY (movieID, genreID),
    FOREIGN KEY (movieID) REFERENCES Movie(movieID) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (genreID) REFERENCES Genres(genreID) ON DELETE CASCADE ON UPDATE CASCADE
);

-- ============================================================
-- TABLE: WatchList
-- ============================================================
CREATE TABLE WatchList(
    movieID INT NOT NULL,
    userID INT NOT NULL,
    status ENUM('to-watch', 'watching', 'completed', 'not seen') DEFAULT 'to-watch',
    lastUpdated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    addedDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (movieID, userID),
    FOREIGN KEY (movieID) REFERENCES Movie(movieID) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (userID) REFERENCES User(userID) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_userID_status (userID, status)
);

-- ============================================================
-- TABLE: FriendRequest
-- ============================================================
CREATE TABLE FriendRequest(
    reqID INT AUTO_INCREMENT PRIMARY KEY,
    senderID INT NOT NULL,
    receiverID INT NOT NULL,
    status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
    reqDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    responseDate DATETIME DEFAULT NULL,
    FOREIGN KEY (senderID) REFERENCES User(userID) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (receiverID) REFERENCES User(userID) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_receiverID_status (receiverID, status)
);

-- ============================================================
-- TABLE: Friends
-- ============================================================
CREATE TABLE Friends(
    user1 INT NOT NULL,
    user2 INT NOT NULL,
    friendshipDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user1, user2),
    FOREIGN KEY (user1) REFERENCES User(userID) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (user2) REFERENCES User(userID) ON DELETE CASCADE ON UPDATE CASCADE
);

-- ============================================================
-- TABLE: ReviewRatings
-- ============================================================
CREATE TABLE ReviewRatings(
    movieID INT NOT NULL,
    userID INT NOT NULL,
    rating DECIMAL(2, 1) NOT NULL DEFAULT 0.0,
    review TEXT,
    reviewDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    lastUpdated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (movieID, userID),
    FOREIGN KEY (movieID) REFERENCES Movie(movieID) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (userID) REFERENCES User(userID) ON DELETE CASCADE ON UPDATE CASCADE
);

-- ============================================================
-- TABLE: Post
-- ============================================================
CREATE TABLE Post(
    postID INT AUTO_INCREMENT PRIMARY KEY,
    movieID INT NOT NULL,
    userID INT NOT NULL,
    postContent TEXT,
    likeCount INT DEFAULT 0,
    commentCount INT DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (movieID) REFERENCES Movie(movieID) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (userID) REFERENCES User(userID) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_userID (userID),
    INDEX idx_createdAt (createdAt)
);

-- ============================================================
-- TABLE: Comments
-- ============================================================
CREATE TABLE Comments(
    commentID INT AUTO_INCREMENT PRIMARY KEY,
    postID INT NOT NULL,
    userID INT NOT NULL,
    commentContent TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (postID) REFERENCES Post(postID) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (userID) REFERENCES User(userID) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_postID (postID)
);

-- ============================================================
-- TABLE: Likes
-- ============================================================
CREATE TABLE Likes(
    postID INT NOT NULL,
    userID INT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (postID, userID),
    FOREIGN KEY (postID) REFERENCES Post(postID) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (userID) REFERENCES User(userID) ON DELETE CASCADE ON UPDATE CASCADE
);

-- ============================================================
-- TABLE: Notifications
-- ============================================================
CREATE TABLE Notifications(
    notificationID INT AUTO_INCREMENT PRIMARY KEY,
    receivedFROMuserID INT NOT NULL,
    content VARCHAR(255) NOT NULL,
    triggerEvent ENUM('friend_request', 'friend_accept', 'new_post', 'post_like', 'post_comment') NOT NULL,
    isSeen BOOLEAN DEFAULT FALSE,
    timeStamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (receivedFROMuserID) REFERENCES User(userID) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_receivedFROMuserID_isSeen (receivedFROMuserID, isSeen)
);

-- ============================================================
-- TABLE: WatchEvent
-- ============================================================
CREATE TABLE WatchEvent(
    eventID INT AUTO_INCREMENT PRIMARY KEY,
    eventTitle VARCHAR(255) NOT NULL,
    associatedMovieID INT NOT NULL,
    host INT NOT NULL,
    description TEXT,
    eventDateTime DATETIME NOT NULL,
    capacity INT NOT NULL DEFAULT 0,
    currentCapacity INT DEFAULT 0,
    FOREIGN KEY (associatedMovieID) REFERENCES Movie(movieID) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (host) REFERENCES User(userID) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_host (host),
    INDEX idx_eventDateTime (eventDateTime)
);

-- ============================================================
-- TABLE: EventParticipants
-- ============================================================
CREATE TABLE EventParticipants(
    eventID INT NOT NULL,
    userID INT NOT NULL,
    PRIMARY KEY (eventID, userID),
    FOREIGN KEY (eventID) REFERENCES WatchEvent(eventID) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (userID) REFERENCES User(userID) ON DELETE CASCADE ON UPDATE CASCADE
);

-- ============================================================
-- TABLE: Message
-- ============================================================
CREATE TABLE Message(
    messageID INT AUTO_INCREMENT PRIMARY KEY,
    friendID INT NOT NULL,
    senderID INT NOT NULL,
    receiverID INT NOT NULL,
    content TEXT,
    timeStamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    isRead BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (senderID) REFERENCES User(userID) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (receiverID) REFERENCES User(userID) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_receiverID_isRead (receiverID, isRead)
);

-- ============================================================
-- TABLE: RestrictedWords
-- ============================================================
CREATE TABLE RestrictedWords(
    wordID INT AUTO_INCREMENT PRIMARY KEY,
    word VARCHAR(255) NOT NULL UNIQUE,
    addedDate DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE: AuditLog
-- ============================================================
CREATE TABLE AuditLog(
    logID INT AUTO_INCREMENT PRIMARY KEY,
    adminID INT NOT NULL,
    targetRecordID INT NOT NULL,
    targetTable VARCHAR(100) NOT NULL,
    timeStamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    operationPerformed ENUM('INSERT', 'UPDATE', 'DELETE CONTENT', 'MODERATION', 'MANAGEMENT', 'REPORT CREATION', 'VIEW RESTRICTED CONTENT') NOT NULL,
    FOREIGN KEY (adminID) REFERENCES User(userID) ON DELETE CASCADE ON UPDATE CASCADE
);

-- ============================================================
-- Success Message
-- ============================================================
SELECT 'Database schema created successfully!' AS Status;
