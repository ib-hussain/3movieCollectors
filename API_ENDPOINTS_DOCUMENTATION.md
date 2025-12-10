# 3movieCollectors - API Endpoints Documentation

Complete reference guide for all user-facing API endpoints in the 3movieCollectors application.

---

## 📋 Table of Contents

1. [Authentication](#authentication)
2. [Movies](#movies)
3. [Watchlist](#watchlist)
4. [Reviews & Ratings](#reviews--ratings)
5. [Posts & Discussions](#posts--discussions)
6. [Friends](#friends)
7. [Messages](#messages)
8. [Watch Events](#watch-events)
9. [Notifications](#notifications)
10. [Dashboard](#dashboard)
11. [Profile](#profile)
12. [Settings](#settings)

---

## 🔐 Authentication

Base path: `/api/auth`

### 1. Register New User

- **Endpoint:** `POST /api/auth/signup`
- **Authentication:** Not required
- **Request Body:**
  ```json
  {
    "username": "string (3-50 chars, alphanumeric + underscore)",
    "name": "string (2-100 chars)",
    "email": "string (valid email)",
    "password": "string (min 6 chars)"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Registration successful",
    "user": {
      "userID": 1,
      "username": "johndoe",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user"
    }
  }
  ```
- **MySQL Operations:**
  - Check username/email uniqueness
  - Hash password with bcrypt (10 salt rounds)
  - INSERT into User table
  - Create session

### 2. User Login

- **Endpoint:** `POST /api/auth/login`
- **Authentication:** Not required
- **Request Body:**
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Login successful",
    "user": {
      "userID": 1,
      "username": "johndoe",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user"
    }
  }
  ```
- **MySQL Operations:**
  - SELECT user by email
  - Verify bcrypt password
  - Check isSuspended flag (returns 403 if suspended)
  - Create session

### 3. User Logout

- **Endpoint:** `POST /api/auth/logout`
- **Authentication:** Not required
- **Response:**
  ```json
  {
    "success": true,
    "message": "Logout successful"
  }
  ```
- **Operations:**
  - Destroy session
  - Clear cookies

### 4. Get Current User

- **Endpoint:** `GET /api/auth/me`
- **Authentication:** Required
- **Response:**
  ```json
  {
    "success": true,
    "user": {
      "userID": 1,
      "username": "johndoe",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "registrationDate": "2025-01-01T00:00:00.000Z",
      "profilePicture": "/pictures/avatar.jpg"
    }
  }
  ```
- **MySQL Operations:**
  - SELECT user details by session userId

### 5. Quick Auth Check

- **Endpoint:** `GET /api/auth/check`
- **Authentication:** Not required
- **Response:**
  ```json
  {
    "success": true,
    "authenticated": true
  }
  ```

---

## 🎬 Movies

Base path: `/api/movies`

### 6. Browse Movies

- **Endpoint:** `GET /api/movies`
- **Authentication:** Not required
- **Query Parameters:**
  - `genre` (string, repeatable): Filter by genre names (OR logic for multiple)
  - `search` (string): Search in movie titles
  - `year` (number): Filter by release year
  - `sort` (string): `top-rated` | `az` | `latest` (default: `top-rated`)
  - `page` (number): Page number (default: 1)
  - `limit` (number): Items per page (default: 20)
- **Response:**
  ```json
  {
    "success": true,
    "movies": [
      {
        "movieId": 1,
        "title": "The Shawshank Redemption",
        "synopsis": "Two imprisoned men...",
        "director": "Frank Darabont",
        "releaseYear": 1994,
        "posterPath": "/pictures/movie_posters/278.jpg",
        "genres": "Drama, Crime",
        "avgRating": "9.3",
        "reviewCount": 150
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 500,
      "totalPages": 25
    }
  }
  ```
- **MySQL Operations:**
  - Complex 4-way JOIN: Movie + MovieGenres + Genres + ReviewRatings
  - WHERE clause for filters (genre IN, title LIKE, releaseYear =)
  - GROUP BY movieID
  - ORDER BY based on sort parameter
  - LIMIT/OFFSET for pagination
  - COUNT for total records

### 7. Get All Genres

- **Endpoint:** `GET /api/movies/genres`
- **Authentication:** Not required
- **Response:**
  ```json
  {
    "success": true,
    "genres": [
      { "id": 1, "name": "Action" },
      { "id": 2, "name": "Drama" }
    ]
  }
  ```
- **MySQL Operations:**
  - SELECT genreID, genreName FROM Genres ORDER BY genreName

### 8. Get Release Years

- **Endpoint:** `GET /api/movies/years`
- **Authentication:** Not required
- **Response:**
  ```json
  {
    "success": true,
    "years": [2024, 2023, 2022, 2021]
  }
  ```
- **MySQL Operations:**
  - SELECT DISTINCT releaseYear ORDER BY releaseYear DESC

### 9. Get Popular Movies

- **Endpoint:** `GET /api/movies/popular`
- **Authentication:** Not required
- **Query Parameters:**
  - `limit` (number): Number of movies (default: 4)
- **Response:**
  ```json
  {
    "success": true,
    "movies": [
      {
        "movieId": 1,
        "title": "The Shawshank Redemption",
        "releaseYear": 1994,
        "posterPath": "/pictures/movie_posters/278.jpg",
        "genres": "Drama, Crime",
        "avgRating": "9.3"
      }
    ]
  }
  ```
- **MySQL Operations:**
  - SELECT movies WHERE avgRating >= 7.0
  - ORDER BY RAND()
  - LIMIT

### 10. Get Movie Details

- **Endpoint:** `GET /api/movies/:id`
- **Authentication:** Not required
- **Response:**
  ```json
  {
    "success": true,
    "movie": {
      "movieId": 1,
      "title": "The Shawshank Redemption",
      "synopsis": "Two imprisoned men...",
      "director": "Frank Darabont",
      "releaseYear": 1994,
      "posterPath": "/pictures/movie_posters/278.jpg",
      "genres": "Drama, Crime",
      "avgRating": "9.3",
      "reviewCount": 150
    }
  }
  ```
- **MySQL Operations:**
  - JOIN Movie + MovieGenres + Genres
  - GROUP_CONCAT for genres
  - COUNT reviews

### 11. Get Similar Movies

- **Endpoint:** `GET /api/movies/:id/similar`
- **Authentication:** Not required
- **Query Parameters:**
  - `limit` (number): Number of movies (default: 8)
- **Response:**
  ```json
  {
    "success": true,
    "movies": [
      {
        "movieId": 2,
        "title": "The Godfather",
        "posterPath": "/pictures/movie_posters/238.jpg",
        "releaseYear": 1972,
        "genres": "Drama, Crime",
        "avgRating": "9.2"
      }
    ]
  }
  ```
- **MySQL Operations:**
  - Get genres of current movie
  - Find movies with shared genres (JOIN MovieGenres)
  - COUNT shared genres
  - ORDER BY sharedGenres DESC, avgRating DESC
  - EXCLUDE current movie

---

## 📋 Watchlist

Base path: `/api/watchlist`

### 12. Get User's Watchlist

- **Endpoint:** `GET /api/watchlist`
- **Authentication:** Required
- **Query Parameters:**
  - `limit` (number): Items per page (default: 50)
  - `offset` (number): Pagination offset (default: 0)
- **Response:**
  ```json
  {
    "success": true,
    "movies": [
      {
        "movieId": 1,
        "title": "Inception",
        "posterPath": "/pictures/movie_posters/27205.jpg",
        "releaseYear": 2010,
        "genres": "Action, Sci-Fi, Thriller",
        "avgRating": "8.8",
        "reviewCount": 200,
        "status": "added",
        "addedDate": "2025-01-01T00:00:00.000Z"
      }
    ],
    "hasMore": true,
    "pagination": {
      "limit": 50,
      "offset": 0,
      "nextOffset": 50
    }
  }
  ```
- **MySQL Operations:**
  - JOIN WatchList + Movie + MovieGenres + Genres + ReviewRatings
  - WHERE userID = session.userId
  - GROUP BY movieID
  - ORDER BY addedDate DESC
  - LIMIT/OFFSET pagination

### 13. Check Movie in Watchlist

- **Endpoint:** `GET /api/watchlist/:movieId`
- **Authentication:** Optional
- **Response:**
  ```json
  {
    "success": true,
    "inWatchlist": true,
    "status": "added"
  }
  ```
- **MySQL Operations:**
  - SELECT status FROM WatchList WHERE movieID AND userID

### 14. Add Movie to Watchlist

- **Endpoint:** `POST /api/watchlist`
- **Authentication:** Required
- **Request Body:**
  ```json
  {
    "movieId": 1,
    "status": "added"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Movie added to watchlist"
  }
  ```
- **MySQL Operations:**
  - Check movie exists
  - Check if already in watchlist
  - INSERT INTO WatchList (movieID, userID, status, addedDate)

### 15. Update Watchlist Status

- **Endpoint:** `PATCH /api/watchlist/:movieId`
- **Authentication:** Required
- **Request Body:**
  ```json
  {
    "status": "completed"
  }
  ```
- **Valid statuses:** `added`, `completed`
- **Response:**
  ```json
  {
    "success": true,
    "message": "Watchlist status updated"
  }
  ```
- **MySQL Operations:**
  - UPDATE WatchList SET status, lastUpdated WHERE movieID AND userID

### 16. Remove from Watchlist

- **Endpoint:** `DELETE /api/watchlist/:movieId`
- **Authentication:** Required
- **Response:**
  ```json
  {
    "success": true,
    "message": "Movie removed from watchlist"
  }
  ```
- **MySQL Operations:**
  - DELETE FROM WatchList WHERE movieID AND userID

---

## ⭐ Reviews & Ratings

Base paths: `/api/movies/:movieId/reviews`, `/api/reviews`, `/api/users/:userId/reviews`

### 17. Get Movie Reviews

- **Endpoint:** `GET /api/movies/:movieId/reviews`
- **Authentication:** Not required
- **Query Parameters:**
  - `limit` (number): Reviews per page (default: 20)
  - `offset` (number): Pagination offset (default: 0)
- **Response:**
  ```json
  {
    "success": true,
    "reviews": [
      {
        "movieID": 1,
        "userID": 5,
        "rating": 9,
        "review": "Absolutely brilliant movie!",
        "reviewDate": "2025-01-01T00:00:00.000Z",
        "lastUpdated": "2025-01-01T00:00:00.000Z",
        "userName": "John Doe",
        "username": "johndoe"
      }
    ],
    "stats": {
      "totalReviews": 150,
      "averageRating": "8.7",
      "ratingDistribution": {
        "1": 0,
        "2": 1,
        "3": 2,
        "4": 5,
        "5": 10,
        "6": 15,
        "7": 20,
        "8": 35,
        "9": 40,
        "10": 22
      }
    },
    "hasMore": true,
    "pagination": {
      "limit": 20,
      "offset": 0,
      "nextOffset": 20
    }
  }
  ```
- **MySQL Operations:**
  - JOIN ReviewRatings + User
  - WHERE movieID
  - ORDER BY reviewDate DESC
  - Calculate AVG, COUNT, distribution

### 18. Get User's Review for Movie

- **Endpoint:** `GET /api/movies/:movieId/reviews/me`
- **Authentication:** Required
- **Response:**
  ```json
  {
    "success": true,
    "review": {
      "movieID": 1,
      "userID": 5,
      "rating": 9,
      "review": "Absolutely brilliant!",
      "reviewDate": "2025-01-01T00:00:00.000Z",
      "lastUpdated": "2025-01-01T00:00:00.000Z"
    }
  }
  ```
- **MySQL Operations:**
  - SELECT FROM ReviewRatings WHERE movieID AND userID

### 19. Create Review

- **Endpoint:** `POST /api/movies/:movieId/reviews`
- **Authentication:** Required
- **Request Body:**
  ```json
  {
    "rating": 9,
    "review": "Absolutely brilliant movie!"
  }
  ```
- **Validation:**
  - rating: 1-10
  - review: required, max 8000 chars
- **Response:**
  ```json
  {
    "success": true,
    "message": "Review posted successfully"
  }
  ```
- **MySQL Operations:**
  - Check if user already reviewed
  - INSERT INTO ReviewRatings (movieID, userID, rating, review, reviewDate, lastUpdated)
  - Trigger: Auto-update Movie.avgRating via AVG calculation

### 20. Update Review

- **Endpoint:** `PATCH /api/reviews/:movieId`
- **Authentication:** Required
- **Request Body:**
  ```json
  {
    "rating": 10,
    "review": "Updated review text"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Review updated successfully"
  }
  ```
- **MySQL Operations:**
  - UPDATE ReviewRatings SET rating, review, lastUpdated WHERE movieID AND userID
  - Recalculate Movie.avgRating

### 21. Delete Review

- **Endpoint:** `DELETE /api/reviews/:movieId`
- **Authentication:** Required
- **Response:**
  ```json
  {
    "success": true,
    "message": "Review deleted successfully"
  }
  ```
- **MySQL Operations:**
  - DELETE FROM ReviewRatings WHERE movieID AND userID
  - Recalculate Movie.avgRating

### 22. Get User's All Reviews

- **Endpoint:** `GET /api/users/:userId/reviews`
- **Authentication:** Not required
- **Response:**
  ```json
  {
    "success": true,
    "reviews": [
      {
        "movieID": 1,
        "userID": 5,
        "rating": 9,
        "review": "Great movie!",
        "reviewDate": "2025-01-01T00:00:00.000Z",
        "lastUpdated": "2025-01-01T00:00:00.000Z",
        "movieTitle": "Inception",
        "posterImg": "27205.jpg",
        "releaseYear": 2010
      }
    ],
    "count": 25
  }
  ```
- **MySQL Operations:**
  - JOIN ReviewRatings + Movie
  - WHERE userID
  - ORDER BY reviewDate DESC

---

## 💬 Posts & Discussions

Base paths: `/api/movies/:movieId/posts`, `/api/posts/:postId`

### 23. Get Movie Posts

- **Endpoint:** `GET /api/movies/:movieId/posts`
- **Authentication:** Optional
- **Query Parameters:**
  - `limit` (number): Posts per page (default: 20)
  - `offset` (number): Pagination offset (default: 0)
- **Response:**
  ```json
  {
    "success": true,
    "posts": [
      {
        "postId": 1,
        "content": "This movie was amazing!",
        "likeCount": 15,
        "commentCount": 8,
        "createdAt": "2025-01-01T00:00:00.000Z",
        "author": {
          "userId": 5,
          "username": "johndoe",
          "name": "John Doe"
        },
        "isLikedByCurrentUser": false,
        "isAuthor": false
      }
    ],
    "hasMore": true,
    "pagination": {
      "limit": 20,
      "offset": 0,
      "nextOffset": 20
    }
  }
  ```
- **MySQL Operations:**
  - JOIN Post + User
  - WHERE movieID
  - Check user's likes with subquery
  - ORDER BY createdAt DESC

### 24. Create Post

- **Endpoint:** `POST /api/movies/:movieId/posts`
- **Authentication:** Required
- **Request Body:**
  ```json
  {
    "content": "This movie was amazing!"
  }
  ```
- **Validation:**
  - content: required, max 8095 chars
- **Response:**
  ```json
  {
    "success": true,
    "message": "Post created successfully",
    "post": {
      "postId": 1,
      "content": "This movie was amazing!",
      "likeCount": 0,
      "commentCount": 0,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "author": {
        "userId": 5,
        "username": "johndoe",
        "name": "John Doe"
      },
      "isLikedByCurrentUser": false,
      "isAuthor": true
    }
  }
  ```
- **MySQL Operations:**
  - Verify movie exists
  - INSERT INTO Post (movieID, userID, postContent, createdAt)
  - Trigger: Check restricted words

### 25. Delete Post

- **Endpoint:** `DELETE /api/posts/:postId`
- **Authentication:** Required (author only)
- **Response:**
  ```json
  {
    "success": true,
    "message": "Post deleted successfully"
  }
  ```
- **MySQL Operations:**
  - Verify ownership
  - DELETE FROM Post WHERE postID
  - CASCADE: Automatically delete Comments and Likes

### 26. Toggle Post Like

- **Endpoint:** `POST /api/posts/:postId/like`
- **Authentication:** Required
- **Response:**
  ```json
  {
    "success": true,
    "action": "liked",
    "likeCount": 16
  }
  ```
- **MySQL Operations:**
  - Check if already liked
  - If liked: DELETE FROM Likes, UPDATE Post SET likeCount - 1
  - If not: INSERT INTO Likes, UPDATE Post SET likeCount + 1
  - Create notification for post author
  - Prevent self-likes

### 27. Get Post Comments

- **Endpoint:** `GET /api/posts/:postId/comments`
- **Authentication:** Optional
- **Query Parameters:**
  - `limit` (number): Comments per page (default: 50)
  - `offset` (number): Pagination offset (default: 0)
- **Response:**
  ```json
  {
    "success": true,
    "comments": [
      {
        "commentId": 1,
        "content": "I totally agree!",
        "createdAt": "2025-01-01T00:00:00.000Z",
        "author": {
          "userId": 6,
          "username": "janedoe",
          "name": "Jane Doe"
        },
        "isAuthor": false
      }
    ],
    "hasMore": false,
    "pagination": {
      "limit": 50,
      "offset": 0,
      "nextOffset": null
    }
  }
  ```
- **MySQL Operations:**
  - JOIN Comments + User
  - WHERE postID
  - ORDER BY createdAt ASC

### 28. Add Comment

- **Endpoint:** `POST /api/posts/:postId/comments`
- **Authentication:** Required
- **Request Body:**
  ```json
  {
    "content": "I totally agree!"
  }
  ```
- **Validation:**
  - content: required, max 8095 chars
- **Response:**
  ```json
  {
    "success": true,
    "message": "Comment added successfully",
    "comment": {
      "commentId": 1,
      "content": "I totally agree!",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "author": {
        "userId": 6,
        "username": "janedoe",
        "name": "Jane Doe"
      },
      "isAuthor": true
    }
  }
  ```
- **MySQL Operations:**
  - Verify post exists
  - INSERT INTO Comments (postID, userID, commentContent, createdAt)
  - UPDATE Post SET commentCount + 1
  - Create notification for post author
  - Trigger: Check restricted words

---

## 👥 Friends

Base path: `/api/friends`

### 29. Get Friends List

- **Endpoint:** `GET /api/friends`
- **Authentication:** Required
- **Query Parameters:**
  - `limit` (number): Friends per page (default: 50)
  - `offset` (number): Pagination offset (default: 0)
- **Response:**
  ```json
  {
    "success": true,
    "friends": [
      {
        "userID": 10,
        "username": "janedoe",
        "firstName": "Jane Doe",
        "lastName": "",
        "email": "jane@example.com",
        "friendshipDate": "2025-01-01T00:00:00.000Z"
      }
    ],
    "hasMore": false,
    "pagination": {
      "limit": 50,
      "offset": 0,
      "nextOffset": null
    }
  }
  ```
- **MySQL Operations:**
  - JOIN Friends + User (bidirectional with CASE)
  - WHERE user1 = userId OR user2 = userId
  - ORDER BY name

### 30. Get Friend Requests

- **Endpoint:** `GET /api/friends/requests`
- **Authentication:** Required
- **Response:**
  ```json
  {
    "incoming": [
      {
        "requestID": 1,
        "senderID": 15,
        "requestDate": "2025-01-01T00:00:00.000Z",
        "firstName": "Bob Smith",
        "lastName": "",
        "email": "bob@example.com",
        "requestType": "incoming"
      }
    ],
    "outgoing": [
      {
        "requestID": 2,
        "receiverID": 20,
        "requestDate": "2025-01-01T00:00:00.000Z",
        "firstName": "Alice Brown",
        "lastName": "",
        "email": "alice@example.com",
        "requestType": "outgoing"
      }
    ]
  }
  ```
- **MySQL Operations:**
  - Two queries: incoming (receiverID = userId) and outgoing (senderID = userId)
  - JOIN FriendRequest + User
  - WHERE status = 'pending'
  - ORDER BY reqDate DESC

### 31. Get Friend Suggestions

- **Endpoint:** `GET /api/friends/suggestions`
- **Authentication:** Required
- **Query Parameters:**
  - `limit` (number): Suggestions per page (default: 20)
  - `offset` (number): Pagination offset (default: 0)
- **Response:**
  ```json
  {
    "success": true,
    "suggestions": [
      {
        "userID": 25,
        "firstName": "Charlie Wilson",
        "lastName": "",
        "email": "charlie@example.com",
        "mutualFriendsCount": 3
      }
    ],
    "hasMore": true,
    "pagination": {
      "limit": 20,
      "offset": 0,
      "nextOffset": 20
    }
  }
  ```
- **MySQL Operations:**
  - Complex algorithm: friends of friends
  - COUNT mutual friends with nested CASE statements
  - EXCLUDE: current friends, pending requests, self
  - ORDER BY mutualFriendsCount DESC, name ASC

### 32. Send Friend Request

- **Endpoint:** `POST /api/friends/requests`
- **Authentication:** Required
- **Request Body:**
  ```json
  {
    "receiverId": 25
  }
  ```
- **Response:**
  ```json
  {
    "message": "Friend request sent successfully",
    "requestId": 5
  }
  ```
- **MySQL Operations:**
  - Check if already friends
  - Check if request already exists (both directions)
  - INSERT INTO FriendRequest (senderID, receiverID, status='pending', reqDate)
  - Create notification for receiver

### 33. Accept Friend Request

- **Endpoint:** `POST /api/friends/requests/:id/accept`
- **Authentication:** Required (receiver only)
- **Response:**
  ```json
  {
    "message": "Friend request accepted successfully"
  }
  ```
- **MySQL Operations:**
  - Transaction START
  - INSERT INTO Friends (user1, user2, friendshipDate)
  - UPDATE FriendRequest SET status='accepted'
  - Transaction COMMIT
  - Create notification for sender

### 34. Decline Friend Request

- **Endpoint:** `POST /api/friends/requests/:id/decline`
- **Authentication:** Required (receiver only)
- **Response:**
  ```json
  {
    "message": "Friend request declined successfully"
  }
  ```
- **MySQL Operations:**
  - UPDATE FriendRequest SET status='rejected' WHERE reqID AND receiverID

### 35. Unfriend User

- **Endpoint:** `DELETE /api/friends/:userId`
- **Authentication:** Required
- **Response:**
  ```json
  {
    "message": "Unfriended successfully"
  }
  ```
- **MySQL Operations:**
  - DELETE FROM Friends WHERE (user1=userId AND user2=friendId) OR (user1=friendId AND user2=userId)

---

## 💌 Messages

Base path: `/api/messages`

### 36. Get Message Threads

- **Endpoint:** `GET /api/messages/threads`
- **Authentication:** Required
- **Response:**
  ```json
  {
    "success": true,
    "threads": [
      {
        "friendId": 10,
        "friendUsername": "janedoe",
        "friendName": "Jane Doe",
        "friendProfilePicture": "/pictures/avatar.jpg",
        "lastMessage": "See you tomorrow!",
        "lastMessageTime": "2025-01-01T12:00:00.000Z",
        "unreadCount": 2
      }
    ]
  }
  ```
- **MySQL Operations:**
  - JOIN Friends + User (get all friends)
  - Subqueries for last message, timestamp, unread count
  - ORDER BY lastMessageTime DESC

### 37. Get Conversation with Friend

- **Endpoint:** `GET /api/messages/threads/:friendId`
- **Authentication:** Required
- **Query Parameters:**
  - `limit` (number): Messages per page (default: 50)
  - `offset` (number): Pagination offset (default: 0)
- **Response:**
  ```json
  {
    "success": true,
    "messages": [
      {
        "messageID": 1,
        "senderID": 5,
        "receiverID": 10,
        "content": "Hey, how are you?",
        "timeStamp": "2025-01-01T12:00:00.000Z",
        "isRead": true,
        "senderUsername": "johndoe",
        "senderName": "John Doe",
        "senderProfilePicture": "/pictures/avatar.jpg"
      }
    ],
    "hasMore": false,
    "pagination": {
      "limit": 50,
      "offset": 0,
      "nextOffset": null
    }
  }
  ```
- **MySQL Operations:**
  - Verify friendship
  - JOIN Message + User
  - WHERE (senderID=userId AND receiverID=friendId) OR (senderID=friendId AND receiverID=userId)
  - ORDER BY timeStamp DESC (then reverse for UI)
  - UPDATE Message SET isRead=TRUE for unread messages from friend

### 38. Send Message

- **Endpoint:** `POST /api/messages/threads/:friendId/messages`
- **Authentication:** Required
- **Request Body:**
  ```json
  {
    "content": "Hey, how are you?"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": {
      "messageID": 1,
      "senderID": 5,
      "receiverID": 10,
      "content": "Hey, how are you?",
      "timeStamp": "2025-01-01T12:00:00.000Z",
      "isRead": false,
      "senderUsername": "johndoe",
      "senderName": "John Doe",
      "senderProfilePicture": "/pictures/avatar.jpg"
    }
  }
  ```
- **MySQL Operations:**
  - Verify friendship
  - Calculate friendID: MIN(userId, friendId) \* 10000 + MAX(userId, friendId)
  - INSERT INTO Message (friendID, senderID, receiverID, content, timeStamp, isRead)

### 39. Get Unread Message Count

- **Endpoint:** `GET /api/messages/unread-count`
- **Authentication:** Required
- **Response:**
  ```json
  {
    "success": true,
    "count": 5
  }
  ```
- **MySQL Operations:**
  - SELECT COUNT(\*) FROM Message WHERE receiverID=userId AND isRead=FALSE

---

## 🎉 Watch Events

Base path: `/api/events`

### 40. Get Events

- **Endpoint:** `GET /api/events`
- **Authentication:** Required
- **Query Parameters:**
  - `filter` (string): `upcoming` | `hosting` | `past` (default: `upcoming`)
  - `limit` (number): Events per page (default: 20)
  - `offset` (number): Pagination offset (default: 0)
- **Response:**
  ```json
  {
    "success": true,
    "events": [
      {
        "eventID": 1,
        "eventTitle": "Inception Watch Party",
        "description": "Let's watch this masterpiece together!",
        "eventDateTime": "2025-01-15T19:00:00.000Z",
        "duration": 120,
        "capacity": 50,
        "currentCapacity": 15,
        "associatedMovieID": 27205,
        "title": "Inception",
        "posterImg": "27205.jpg",
        "hostID": 5,
        "hostName": "John Doe",
        "hostPicture": "/pictures/avatar.jpg",
        "isJoined": false
      }
    ],
    "hasMore": true,
    "pagination": {
      "limit": 20,
      "offset": 0,
      "nextOffset": 20
    }
  }
  ```
- **MySQL Operations:**
  - JOIN WatchEvent + Movie + User
  - Filter based on query: upcoming (eventDateTime > NOW), hosting (host=userId), past (eventDateTime < NOW AND participated)
  - LEFT JOIN EventParticipants for isJoined status
  - ORDER BY eventDateTime

### 41. Create Event

- **Endpoint:** `POST /api/events`
- **Authentication:** Required
- **Request Body:**
  ```json
  {
    "eventTitle": "Inception Watch Party",
    "associatedMovieID": 27205,
    "description": "Let's watch this masterpiece!",
    "eventDateTime": "2025-01-15T19:00:00.000Z",
    "duration": 120,
    "capacity": 50
  }
  ```
- **Validation:**
  - capacity: max 50
  - eventDateTime: must be in future
  - Check for overlapping events (complex datetime logic)
- **Response:**
  ```json
  {
    "success": true,
    "message": "Event created successfully",
    "eventID": 1
  }
  ```
- **MySQL Operations:**
  - Verify movie exists
  - Check overlap with existing events using INTERVAL calculations
  - INSERT INTO WatchEvent (eventTitle, associatedMovieID, host, description, eventDateTime, duration, capacity, currentCapacity)

### 42. Join Event

- **Endpoint:** `POST /api/events/:id/join`
- **Authentication:** Required
- **Response:**
  ```json
  {
    "success": true,
    "message": "Successfully joined the event"
  }
  ```
- **MySQL Operations:**
  - Verify event exists and is upcoming
  - Prevent host from joining own event
  - Check if already joined
  - Check capacity
  - Check for overlapping events
  - INSERT INTO EventParticipants (eventID, userID)
  - UPDATE WatchEvent SET currentCapacity + 1
  - Create notification for host

### 43. Leave Event

- **Endpoint:** `POST /api/events/:id/leave`
- **Authentication:** Required
- **Response:**
  ```json
  {
    "success": true,
    "message": "Successfully left the event"
  }
  ```
- **MySQL Operations:**
  - Verify participation
  - DELETE FROM EventParticipants WHERE eventID AND userID
  - UPDATE WatchEvent SET currentCapacity - 1

### 44. Cancel Event

- **Endpoint:** `DELETE /api/events/:id`
- **Authentication:** Required (host only)
- **Response:**
  ```json
  {
    "success": true,
    "message": "Event cancelled successfully"
  }
  ```
- **MySQL Operations:**
  - Verify host ownership
  - Get all participants
  - Bulk INSERT notifications for all participants
  - DELETE FROM WatchEvent WHERE eventID
  - CASCADE: Automatically delete EventParticipants

### 45. Get Event Participants

- **Endpoint:** `GET /api/events/:id/participants`
- **Authentication:** Required
- **Response:**
  ```json
  {
    "success": true,
    "participants": [
      {
        "userID": 10,
        "name": "Jane Doe",
        "profilePicture": "/pictures/avatar.jpg"
      }
    ]
  }
  ```
- **MySQL Operations:**
  - JOIN EventParticipants + User
  - WHERE eventID
  - ORDER BY name

---

## 🔔 Notifications

Base path: `/api/notifications`

### 46. Get Notifications

- **Endpoint:** `GET /api/notifications`
- **Authentication:** Required
- **Query Parameters:**
  - `filter` (string): `all` | `unread` (default: `all`)
  - `limit` (number): Notifications per page (default: 50)
  - `offset` (number): Pagination offset (default: 0)
- **Response:**
  ```json
  {
    "success": true,
    "notifications": [
      {
        "notificationID": 1,
        "content": "liked your post",
        "triggerEvent": "post_like",
        "isSeen": false,
        "timeStamp": "2025-01-01T12:00:00.000Z",
        "triggerUserID": 10,
        "relatedID": 5,
        "triggerUsername": "janedoe",
        "triggerName": "Jane Doe",
        "triggerProfilePicture": "/pictures/avatar.jpg",
        "movieId": 1
      }
    ],
    "unreadCount": 5,
    "hasMore": true,
    "pagination": {
      "limit": 50,
      "offset": 0,
      "nextOffset": 50
    }
  }
  ```
- **MySQL Operations:**
  - JOIN Notifications + User + Post (for movieId)
  - WHERE receivedFROMuserID=userId
  - Optional: AND isSeen=FALSE
  - ORDER BY timeStamp DESC
  - COUNT unread separately

### 47. Mark Notification as Read

- **Endpoint:** `PATCH /api/notifications/:id/read`
- **Authentication:** Required
- **Response:**
  ```json
  {
    "success": true,
    "message": "Notification marked as read"
  }
  ```
- **MySQL Operations:**
  - UPDATE Notifications SET isSeen=TRUE WHERE notificationID AND receivedFROMuserID=userId

### 48. Mark All Notifications as Read

- **Endpoint:** `POST /api/notifications/mark-all-read`
- **Authentication:** Required
- **Response:**
  ```json
  {
    "success": true,
    "message": "All notifications marked as read"
  }
  ```
- **MySQL Operations:**
  - UPDATE Notifications SET isSeen=TRUE WHERE receivedFROMuserID=userId AND isSeen=FALSE

### 49. Get Unread Notification Count

- **Endpoint:** `GET /api/notifications/unread-count`
- **Authentication:** Required
- **Response:**
  ```json
  {
    "success": true,
    "count": 5
  }
  ```
- **MySQL Operations:**
  - SELECT COUNT(\*) FROM Notifications WHERE receivedFROMuserID=userId AND isSeen=FALSE

---

## 📊 Dashboard

Base path: `/api/dashboard`

### 50. Get Dashboard Stats

- **Endpoint:** `GET /api/dashboard/stats`
- **Authentication:** Required
- **Response:**
  ```json
  {
    "success": true,
    "stats": {
      "watchlist": 25,
      "watched": 100,
      "friends": 15,
      "reviews": 45,
      "upcomingEvents": 3
    }
  }
  ```
- **MySQL Operations:**
  - 5 separate COUNT queries:
    - WatchList WHERE status='added'
    - WatchList WHERE status='completed'
    - Friends WHERE user1 OR user2 (bidirectional)
    - ReviewRatings count
    - WatchEvent + EventParticipants WHERE eventDateTime >= NOW

### 51. Get Recommended Movies

- **Endpoint:** `GET /api/dashboard/recommended`
- **Authentication:** Required
- **Query Parameters:**
  - `limit` (number): Movies to return (default: 6)
- **Response:**
  ```json
  {
    "success": true,
    "movies": [
      {
        "movieId": 1,
        "title": "Inception",
        "synopsis": "A thief who steals...",
        "director": "Christopher Nolan",
        "releaseYear": 2010,
        "posterPath": "/pictures/movie_posters/27205.jpg",
        "genres": "Action, Sci-Fi, Thriller",
        "avgRating": "8.8",
        "reviewCount": 200
      }
    ],
    "basedOn": ["Action", "Sci-Fi", "Thriller"]
  }
  ```
- **MySQL Operations:**
  - Get user's favorite genres (from highly rated movies: rating >= 4)
  - JOIN ReviewRatings + MovieGenres + Genres
  - GROUP BY genreId, ORDER BY count DESC, LIMIT 3
  - Find movies matching those genres
  - ORDER BY avgRating DESC, reviewCount DESC

### 52. Get Trending Movies

- **Endpoint:** `GET /api/dashboard/trending`
- **Authentication:** Not required
- **Query Parameters:**
  - `limit` (number): Movies to return (default: 6)
  - `days` (number): Days to look back (default: 30)
- **Response:**
  ```json
  {
    "success": true,
    "movies": [
      {
        "movieId": 1,
        "title": "Inception",
        "synopsis": "A thief who steals...",
        "director": "Christopher Nolan",
        "releaseYear": 2010,
        "posterPath": "/pictures/movie_posters/27205.jpg",
        "genres": "Action, Sci-Fi, Thriller",
        "avgRating": "8.8",
        "reviewCount": 50,
        "watchlistCount": 30
      }
    ]
  }
  ```
- **MySQL Operations:**
  - JOIN Movie + MovieGenres + Genres + ReviewRatings + WatchList
  - WHERE reviewDate/addedDate >= DATE_SUB(NOW(), INTERVAL days DAY)
  - COUNT reviews and watchlist additions
  - ORDER BY (reviewCount \* 2 + watchlistCount) DESC

### 53. Get Recent Watchlist Items

- **Endpoint:** `GET /api/dashboard/recent-watchlist`
- **Authentication:** Required
- **Query Parameters:**
  - `limit` (number): Items to return (default: 5)
- **Response:**
  ```json
  {
    "success": true,
    "items": [
      {
        "listId": 1,
        "movieId": 27205,
        "title": "Inception",
        "releaseYear": 2010,
        "posterPath": "/pictures/movie_posters/27205.jpg",
        "genres": "Action, Sci-Fi, Thriller",
        "addedDate": "2025-01-01T00:00:00.000Z"
      }
    ]
  }
  ```
- **MySQL Operations:**
  - JOIN WatchList + Movie + MovieGenres + Genres
  - WHERE userID
  - GROUP BY listId
  - ORDER BY addedDate DESC
  - LIMIT

### 54. Get Recent Activity Feed

- **Endpoint:** `GET /api/dashboard/recent-activity`
- **Authentication:** Required
- **Query Parameters:**
  - `limit` (number): Activities to return (default: 10)
  - `offset` (number): Pagination offset (default: 0)
- **Response:**
  ```json
  {
    "success": true,
    "activities": [
      {
        "type": "review",
        "movieId": 1,
        "userId": 10,
        "username": "janedoe",
        "name": "Jane Doe",
        "profilePicture": "/pictures/avatar.jpg",
        "movieTitle": "Inception",
        "rating": 9,
        "reviewText": "Amazing movie!",
        "activityDate": "2025-01-01T12:00:00.000Z"
      },
      {
        "type": "post",
        "movieId": 1,
        "userId": 10,
        "username": "janedoe",
        "name": "Jane Doe",
        "movieTitle": "Inception",
        "postContent": "Just watched this!",
        "likeCount": 5,
        "commentCount": 2,
        "postID": 15,
        "activityDate": "2025-01-01T11:00:00.000Z"
      },
      {
        "type": "comment",
        "movieId": 1,
        "userId": 10,
        "username": "janedoe",
        "name": "Jane Doe",
        "movieTitle": "Inception",
        "commentContent": "Great discussion!",
        "originalPost": "What did you think?",
        "postID": 10,
        "commentID": 3,
        "activityDate": "2025-01-01T10:00:00.000Z"
      }
    ],
    "hasMore": true
  }
  ```
- **MySQL Operations:**
  - Complex UNION ALL query combining 3 activity types:
    1. Reviews from friends: JOIN ReviewRatings + User + Movie
    2. Posts from friends: JOIN Post + User + Movie
    3. Comments on user's posts: JOIN Comments + Post + User + Movie
  - Get friend IDs with bidirectional CASE logic
  - ORDER BY activityDate DESC
  - LIMIT/OFFSET pagination

---

## 👤 Profile

Base path: `/api/profile`

### 55. Get Current User Profile

- **Endpoint:** `GET /api/profile/me`
- **Authentication:** Required
- **Response:**
  ```json
  {
    "success": true,
    "profile": {
      "userID": 5,
      "username": "johndoe",
      "name": "John Doe",
      "email": "john@example.com",
      "registrationDate": "2025-01-01T00:00:00.000Z",
      "profilePicture": "/pictures/avatar.jpg",
      "stats": {
        "moviesWatched": 100,
        "reviews": 45,
        "friends": 15,
        "watchlist": 25
      },
      "favoriteGenres": ["Action", "Sci-Fi", "Thriller", "Drama"],
      "reviews": [
        {
          "movieID": 1,
          "rating": 9,
          "review": "Absolutely brilliant!",
          "reviewDate": "2025-01-01T00:00:00.000Z",
          "lastUpdated": "2025-01-01T00:00:00.000Z",
          "movieTitle": "Inception",
          "releaseYear": 2010,
          "posterPath": "27205.jpg"
        }
      ]
    }
  }
  ```
- **MySQL Operations:**
  - User details SELECT
  - Stats: 4 COUNT queries (watchlist completed, reviews, friends, watchlist total)
  - Favorite genres: JOIN WatchList + Movie + MovieGenres + Genres, GROUP BY genre, ORDER BY count DESC, LIMIT 4
  - Recent reviews: JOIN ReviewRatings + Movie, ORDER BY reviewDate DESC, LIMIT 20

### 56. Get User Profile by Username

- **Endpoint:** `GET /api/profile/:username`
- **Authentication:** Not required
- **Response:** Same as Get Current User Profile (without email)
- **MySQL Operations:** Same as above, but WHERE username instead of session userId

### 57. Update Profile Picture

- **Endpoint:** `PATCH /api/profile/picture`
- **Authentication:** Required
- **Request Body:**
  ```json
  {
    "profilePicture": "/pictures/avatars/new-avatar.jpg"
  }
  ```
- **Validation:**
  - URL format check (https:// or /pictures/)
- **Response:**
  ```json
  {
    "success": true,
    "message": "Profile picture updated successfully",
    "profilePicture": "/pictures/avatars/new-avatar.jpg"
  }
  ```
- **MySQL Operations:**
  - UPDATE User SET profilePicture WHERE userID

---

## ⚙️ Settings

Base path: `/api/settings`

### 58. Get Account Settings

- **Endpoint:** `GET /api/settings`
- **Authentication:** Required
- **Response:**
  ```json
  {
    "success": true,
    "user": {
      "userID": 5,
      "username": "johndoe",
      "name": "John Doe",
      "email": "john@example.com",
      "profilePicture": "/pictures/avatar.jpg",
      "registrationDate": "2025-01-01T00:00:00.000Z",
      "role": "user"
    }
  }
  ```
- **MySQL Operations:**
  - SELECT user details WHERE userID AND isDeleted=FALSE

### 59. Update Account Information

- **Endpoint:** `PATCH /api/settings/account`
- **Authentication:** Required
- **Request Body:**
  ```json
  {
    "name": "John Doe",
    "email": "newemail@example.com",
    "username": "johndoe_updated",
    "profilePicture": "/pictures/avatar.jpg"
  }
  ```
- **Validation:**
  - name: required
  - email: valid format
  - username: 3-20 chars, alphanumeric + underscore
- **Response:**
  ```json
  {
    "success": true,
    "message": "Account updated successfully",
    "user": {
      "userID": 5,
      "username": "johndoe_updated",
      "name": "John Doe",
      "email": "newemail@example.com",
      "profilePicture": "/pictures/avatar.jpg",
      "registrationDate": "2025-01-01T00:00:00.000Z",
      "role": "user"
    }
  }
  ```
- **MySQL Operations:**
  - UPDATE User SET name, email, username, profilePicture WHERE userID
  - Trigger validates email/username uniqueness

### 60. Change Password

- **Endpoint:** `PATCH /api/settings/password`
- **Authentication:** Required
- **Request Body:**
  ```json
  {
    "currentPassword": "oldpass123",
    "newPassword": "NewPass123!",
    "confirmPassword": "NewPass123!"
  }
  ```
- **Validation:**
  - newPassword: min 8 chars, uppercase, lowercase, number
  - passwords must match
- **Response:**
  ```json
  {
    "success": true,
    "message": "Password changed successfully"
  }
  ```
- **MySQL Operations:**
  - SELECT current password hash
  - Verify with bcrypt.compare
  - Hash new password with bcrypt (10 rounds)
  - UPDATE User SET password WHERE userID

### 61. Delete Account (Soft Delete)

- **Endpoint:** `DELETE /api/settings/account`
- **Authentication:** Required
- **Request Body:**
  ```json
  {
    "password": "currentpassword"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Account deleted successfully"
  }
  ```
- **MySQL Operations:**
  - Verify password with bcrypt
  - UPDATE User SET isDeleted=TRUE WHERE userID
  - Destroy session

---

## 🔑 Key MySQL Features Used Across Endpoints

### Complex JOINs

- **4-way JOINs:** Movie + MovieGenres + Genres + ReviewRatings
- **Bidirectional Friendships:** CASE statements to handle user1/user2
- **Activity Feeds:** Multiple JOINs with UNION ALL

### Aggregations

- **AVG():** Calculate average ratings
- **COUNT():** Review counts, like counts, mutual friends
- **GROUP BY:** Group movies by ID, genres by name
- **HAVING:** Filter aggregated results
- **GROUP_CONCAT():** Combine genres into comma-separated string

### Pagination

- **LIMIT/OFFSET:** Standard pagination pattern
- **hasMore detection:** Fetch LIMIT + 1 to check for more results

### Cascading

- **ON DELETE CASCADE:** Automatically delete related records (Comments when Post deleted)
- **ON DELETE SET NULL:** Preserve data while removing reference

### Triggers

- **check_restricted_words_in_content:** Auto-flag posts/comments with restricted words
- **update_movie_avg_rating:** Auto-update avgRating when reviews change
- **check_unique_email/username:** Validate uniqueness before INSERT/UPDATE

### Date Operations

- **NOW():** Current timestamp
- **DATE_SUB():** Subtract intervals for trending calculations
- **INTERVAL:** Calculate event overlaps and durations
- **GREATEST():** Compare multiple dates for last activity

### Security

- **Bcrypt:** Password hashing with 10 salt rounds
- **Prepared Statements:** All queries use parameterized queries
- **Session Validation:** Middleware checks on protected routes
- **Soft Deletes:** isDeleted flag instead of hard deletes

### Performance

- **Indexes:** Composite and single-column indexes on frequently queried fields
- **Connection Pooling:** mysql2 pool with 10 connections
- **Query Optimization:** Strategic use of LIMIT to reduce result sets

---

## 📝 Response Patterns

### Success Response

```json
{
  "success": true,
  "data": {
    /* response data */
  }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    /* validation errors if applicable */
  ]
}
```

### Pagination Response

```json
{
  "success": true,
  "data": [
    /* array of items */
  ],
  "hasMore": true,
  "pagination": {
    "limit": 20,
    "offset": 0,
    "nextOffset": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

## 🚀 Testing the API

### Using cURL

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}' \
  -c cookies.txt

# Browse movies
curl http://localhost:3000/api/movies?genre=Action&sort=top-rated \
  -b cookies.txt

# Add to watchlist
curl -X POST http://localhost:3000/api/watchlist \
  -H "Content-Type: application/json" \
  -d '{"movieId":27205}' \
  -b cookies.txt
```

### Using Postman

1. Import the API collection
2. Set base URL: `http://localhost:3000/api`
3. Enable cookie storage for session management
4. Test endpoints sequentially (login first)

---

## 📚 Additional Resources

- **Database Schema:** See `database/schema.sql` and `database/admin_schema.sql`
- **Triggers:** See `database/admin_triggers.sql`
- **Events:** See `database/admin_events.sql`
- **Procedures:** See `database/admin_procedures.sql`

---

**Total User API Endpoints:** 61

**Last Updated:** December 10, 2025
