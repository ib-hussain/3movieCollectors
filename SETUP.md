# 3movieCollectors - Setup Guide

A social movie discovery and community platform where users can browse movies, create watchlists, join watch events, and connect with fellow movie enthusiasts.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Database Setup](#database-setup)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Usage Guide](#usage-guide)
- [Features](#features)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have the following installed on your system:

1. **Node.js** (v14.0.0 or higher)
   - Download from: https://nodejs.org/
   - Verify installation: `node --version`

2. **MySQL** (v8.0 or higher)
   - Download from: https://dev.mysql.com/downloads/mysql/
   - Verify installation: `mysql --version`

3. **Git** (optional, for cloning the repository)
   - Download from: https://git-scm.com/

---

## Installation

### 1. Clone or Download the Repository

**Option A: Using Git**
```bash
git clone https://github.com/ib-hussain/3movieCollectors.git
cd 3movieCollectors
```

**Option B: Download ZIP**
- Download the project ZIP file
- Extract it to your desired location
- Open terminal/command prompt in the project folder

### 2. Install Dependencies

```bash
npm install
```

This will install all required Node.js packages including:
- Express.js (web framework)
- MySQL2 (database driver)
- Express-session (session management)
- Bcryptjs (password hashing)
- Dotenv (environment configuration)
- Axios (HTTP client)

---

## Database Setup

### 1. Create the Database

Open MySQL command line or MySQL Workbench and run:

```sql
CREATE DATABASE 3movieCollectors;
```

### 2. Import the Database Schema

Navigate to the `AdvancedERD` folder and execute the schema file:

**Option A: Using MySQL Command Line**
```bash
mysql -u root -p 3movieCollectors < AdvancedERD/schema.sql
```

**Option B: Using MySQL Workbench**
1. Open MySQL Workbench
2. Connect to your MySQL server
3. File → Open SQL Script
4. Select `AdvancedERD/schema.sql`
5. Execute the script

This will create all necessary tables and populate them with sample data including:
- 20 users (3 admins, 17 regular users)
- 18 movies with genres
- Sample friendships, posts, reviews, and events

### 3. Add Movie Data (Optional but Recommended)

To add more movies to the database, run the movie scraper:

```bash
node server/add-more-movies.js
```

This will fetch popular movies from TMDB API and add them to your database.

To download movie posters:

```bash
node server/fetch-posters.js
```

---

## Configuration

### 1. Environment Variables

Create a `.env` file in the root directory (or rename `.env.example` to `.env`):

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=3movieCollectors
DB_PORT=3306

# Session Secret (change this to a random string for security)
SESSION_SECRET=your_random_secret_key_here

# Server Configuration
PORT=3000
NODE_ENV=development

# TMDB API Key (optional - for fetching movie data)
TMDB_API_KEY=your_tmdb_api_key_here
```

**Important:** Replace the following values:
- `DB_PASSWORD`: Your MySQL root password
- `SESSION_SECRET`: A random secure string (e.g., generate using: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
- `TMDB_API_KEY`: (Optional) Get free API key from https://www.themoviedb.org/settings/api

### 2. Verify Database Connection

Test your database connection:

```bash
node -e "const db = require('./server/db'); db.testConnection().then(() => process.exit(0));"
```

You should see: `✓ Database connected successfully`

---

## Running the Application

### 1. Start the Server

```bash
npm start
```

You should see:
```
✓ Database connected successfully

═══════════════════════════════════════════════════════
🎬  3movieCollectors Server
═══════════════════════════════════════════════════════
   Server running on: http://localhost:3000
   Environment: development
   Database: ✓ Connected
═══════════════════════════════════════════════════════
```

### 2. Access the Application

Open your web browser and navigate to:
```
http://localhost:3000/index.html
```

---

## Usage Guide

### Getting Started

1. **Landing Page**
   - Visit `http://localhost:3000/index.html`
   - Click "Get Started" or "Sign Up" to create an account

2. **Sign Up**
   - Fill in your details (username, name, email, password)
   - Optionally add a profile picture URL
   - Click "Sign Up"

3. **Login**
   - Use credentials from the sample data or your new account
   - **Sample User Credentials:**
     - Email: `user1@example.com` | Password: `pass1`
     - Email: `user2@example.com` | Password: `pass2`
   - **Admin Credentials:**
     - Email: `user1@example.com` | Password: `pass1` (User1 is admin)

### Main Features

#### 1. Dashboard
- View your stats (friends, watchlist items, upcoming events)
- See trending movies and personalized recommendations
- Check recent activity from friends

#### 2. Browse Movies
- Search for movies by title
- Filter by genre
- View movie details, ratings, and reviews
- Add movies to your watchlist
- Rate and review movies

#### 3. Watchlist
- View all movies you've saved
- Mark movies as "To Watch" or "Completed"
- Remove movies from watchlist
- Quick access to movie details

#### 4. Watch Events
- **Upcoming Events Tab:** Browse and join upcoming watch events
- **Hosting Tab:** View events you're hosting
- **Past Tab:** See your event history
- **Create Event:** Host a movie watch party with details like:
  - Event title and description
  - Movie selection
  - Date and time
  - Duration
  - Capacity (max participants)

#### 5. Friends
- Send friend requests
- Accept/reject incoming requests
- View your friends list
- Remove friends
- Visit friend profiles

#### 6. Messages
- Real-time messaging with friends
- View conversation history
- Unread message indicators

#### 7. Notifications
- Get notified about:
  - Friend requests
  - Event invitations
  - Post likes and comments
  - Friend activity
- Mark notifications as read

#### 8. Profile
- View your profile information
- Edit profile details
- Upload profile picture
- View your posts
- See your movie statistics

#### 9. Settings
- Update account information
- Change password
- Manage privacy settings
- Update profile picture

#### 10. Help & Support
- Access FAQs
- Contact support
- Report issues

### Navigation

- **Sidebar:** Quick access to all main features
- **Top Navbar:** Search, notifications, messages, profile menu
- **Logout:** Click your profile picture → Logout button (red button at bottom of sidebar)

---

## Features

### Core Features
✅ User Authentication (Sign up, Login, Session management)  
✅ Movie Browsing with Search and Filters  
✅ Personalized Movie Recommendations  
✅ Movie Ratings and Reviews  
✅ Watchlist Management  
✅ Watch Event Creation and Participation  
✅ Event Overlap Detection  
✅ Friend System (Add, Remove, View friends)  
✅ Real-time Messaging  
✅ Notifications System  
✅ User Profiles  
✅ Activity Feed  
✅ Settings Management  
✅ Help & Support  

### Technical Features
- RESTful API architecture
- MySQL database with complex relationships
- Session-based authentication
- Password hashing with bcrypt
- Event scheduling system
- Responsive design
- Real-time updates
- Error handling and validation

---

## Troubleshooting

### Common Issues

#### 1. Database Connection Failed
**Error:** `Access denied for user 'root'@'localhost'`

**Solution:**
- Verify MySQL is running
- Check username and password in `.env` file
- Ensure database `3movieCollectors` exists

#### 2. Port Already in Use
**Error:** `EADDRINUSE: address already in use :::3000`

**Solution:**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

Or change the `PORT` in `.env` file to a different number (e.g., 3001)

#### 3. Module Not Found
**Error:** `Cannot find module 'express'`

**Solution:**
```bash
npm install
```

#### 4. Movies Not Displaying
**Solution:**
- Run the movie scraper: `node server/add-more-movies.js`
- Download posters: `node server/fetch-posters.js`
- Verify `pictures/movie_posters/` directory exists

#### 5. Sessions Not Persisting
**Solution:**
- Clear browser cookies and cache
- Verify `SESSION_SECRET` is set in `.env`
- Restart the server

#### 6. Event Overlap Error
If you see "You have an overlapping event" but shouldn't:
```bash
# Run the cleanup script
node server/cleanup_overlaps.js
```

### Logs and Debugging

The server logs all requests and errors to the console. To enable detailed logging:

1. Set `NODE_ENV=development` in `.env`
2. Check server console for detailed error messages
3. Use browser DevTools (F12) to check network requests

### Need More Help?

- Check existing issues on GitHub
- Contact the development team
- Review the database schema in `AdvancedERD/schema.sql`

---

## Project Structure

```
3movieCollectors/
├── AdvancedERD/           # Database schema and ERD
├── components/            # Reusable HTML components
├── css/                   # Stylesheets
├── html/                  # HTML pages
├── js/                    # Frontend JavaScript
├── pictures/              # Images and assets
│   └── movie_posters/     # Movie poster images
├── server/                # Backend code
│   ├── routes/            # API routes
│   ├── middleware/        # Express middleware
│   ├── db.js              # Database connection
│   └── scheduler.js       # Event scheduling
├── app.js                 # Main server file
├── package.json           # Dependencies
├── .env                   # Environment variables
└── README.md              # Project documentation
```

---

## Credits

- **Movie Data:** The Movie Database (TMDB)
- **Icons:** Custom icons and Font Awesome
- **Framework:** Express.js
- **Database:** MySQL

---

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## Support

For issues, questions, or contributions:
- GitHub: https://github.com/ib-hussain/3movieCollectors
- Email: Support team

---

**Enjoy using 3movieCollectors! 🎬🍿**
