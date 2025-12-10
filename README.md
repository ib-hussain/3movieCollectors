# 3movieCollectors - Movie Community Platform

A comprehensive movie community web application with social features, movie catalog, and advanced admin management system. Built with Node.js, Express, MySQL, and vanilla JavaScript.

---

## 📑 Table of Contents

1. [Project Overview](#-project-overview)
2. [Features](#-features)
3. [Technology Stack](#-technology-stack)
4. [Prerequisites](#-prerequisites)
5. [Installation & Setup](#-installation--setup)
6. [Database Setup](#-database-setup)
7. [Running the Application](#-running-the-application)
8. [Default Credentials](#-default-credentials)
9. [Project Structure](#-project-structure)
10. [API Documentation](#-api-documentation)
11. [Troubleshooting](#-troubleshooting)

---

## 🎯 Project Overview

3movieCollectors is a full-stack movie community platform that combines:

- **Movie Catalog**: Browse 1000+ movies with TMDB integration
- **Social Features**: Friends, messaging, events, discussions
- **User Management**: Profiles, watchlists, reviews, ratings
- **Admin Panel**: Complete administrative control with security monitoring
- **Real-time Updates**: Live notifications and activity feeds

**Status**: ✅ Production Ready | **Version**: 1.0.0 | **Last Updated**: December 10, 2025

---

## ✨ Features

### 🎬 User Features

- **Movie Browsing**: Search, filter by genre/year, sort by rating/date
- **Personalized Dashboard**: Activity feed with friend reviews and trending movies
- **Smart Recommendations**: Genre-based suggestions from your ratings
- **Watchlist Management**: Track movies to watch with status updates
- **Social Network**: Add friends, see their activity, send messages
- **Reviews & Ratings**: 5-star ratings with detailed text reviews
- **Discussion Posts**: Create posts on movie pages, like and comment
- **Watch Events**: Schedule movie watch parties with friends
- **User Profiles**: View activity history, reviews, and friend lists
- **Real-time Notifications**: Instant updates for likes, comments, friend requests
- **Responsive Search**: Dropdown search with instant results

### 🔐 Admin Features

- **Admin Dashboard**:
  - Real-time statistics with Chart.js visualizations
  - User growth, activity trends, content moderation metrics
  - 30-second auto-refresh for live data
- **User Management**:
  - Complete CRUD operations (create, edit, suspend, delete)
  - Role management (promote/demote admin status)
  - Account suspension with reasons and duration
  - Search and filter by role, status, registration date
  - Self-protection (admins cannot suspend themselves)
- **Movie Management**:
  - Add, edit, delete movies with validation
  - Bulk TMDB import with progress tracking
  - Genre management (20+ genres)
  - Poster upload and management
  - Search and filter capabilities
- **Content Moderation**:
  - Automated restricted word detection
  - Spam detection (5+ posts in 5 minutes)
  - XSS and SQL injection prevention
  - Flag queue for reported content
  - Hide/approve flagged posts and comments
- **Security Monitoring**:
  - Comprehensive audit logging
  - Failed login tracking with brute-force detection
  - Security event notifications (medium/high/critical severity)
  - Suspicious activity alerts
- **Reports & Analytics**:
  - PDF export for audit logs and user activity
  - CSV export for data analysis
  - Filterable date ranges and event types
  - User activity summaries

---

## 🛠️ Technology Stack

### Backend

- **Node.js** v16+ - JavaScript runtime
- **Express.js** 4.18 - Web framework
- **MySQL** 8.0+ - Relational database
- **express-session** - Session management with MySQL store
- **bcrypt** - Password hashing
- **express-validator** - Input validation
- **pdfkit** - PDF report generation
- **node-cron** - Scheduled tasks

### Frontend

- **HTML5** - Semantic markup
- **CSS3** - Modern styling (Grid, Flexbox, Variables)
- **Vanilla JavaScript** - ES6+ with async/await
- **Chart.js** 4.4.0 - Data visualizations
- **Font Awesome** 6.4.0 - Icons

### Database

- **MySQL 8.0+** with stored procedures, triggers, events
- **Session Storage** - MySQL-based session persistence
- **Transaction Support** - ACID compliance for data integrity

---

## 📋 Prerequisites

Before installation, ensure you have:

### Required Software

1. **Node.js** (v16 or higher)

   - Download from [nodejs.org](https://nodejs.org/)
   - Verify: `node --version`

2. **MySQL Server** (v8.0 or higher)

   - Download from [mysql.com](https://dev.mysql.com/downloads/)
   - Verify: `mysql --version`

3. **Git** (for cloning repository)
   - Download from [git-scm.com](https://git-scm.com/)

### Optional (for development)

- **Python 3.8+** (for TMDB scraper utility)
- **Postman** or **Thunder Client** (for API testing)
- **MySQL Workbench** (for database management)

---

## 🚀 Installation & Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/ib-hussain/3movieCollectors.git
cd 3movieCollectors
```

### Step 2: Install Dependencies

```bash
npm install
```

This installs all required packages:

- express, express-session, express-mysql-session
- mysql2, bcrypt, express-validator
- cors, dotenv, pdfkit, node-cron
- axios, csv-parser

### Step 3: Configure Environment Variables

1. Copy the example environment file:

```bash
cp .env.example .env
```

2. Edit `.env` with your settings:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password_here
DB_NAME=3movieCollectors
DB_PORT=3306

# Session Secret (CHANGE THIS!)
SESSION_SECRET=your_random_secret_string_here_make_it_long_and_complex

# Server Configuration
PORT=3000
NODE_ENV=development

# TMDB API Key (optional, for movie scraper)
TMDB_API_KEY=your_tmdb_api_key_here
```

**Important**: Change the `SESSION_SECRET` to a random, secure string!

---

## 💾 Database Setup

### Method 1: Automated Setup (Recommended)

Run the setup script which creates database, tables, and sample data:

```bash
node database/setup.js
```

This will:

1. Create the `3movieCollectors` database
2. Create all tables (Movie, User, ReviewRatings, etc.)
3. Create admin-specific tables (AuditLog, SecurityEvents, etc.)
4. Install stored procedures and functions
5. Install triggers for security and automation
6. Import sample movie data from CSV

### Method 2: Manual Setup

If automated setup fails, run SQL files manually:

```bash
# Create database
mysql -u root -p -e "CREATE DATABASE 3movieCollectors;"

# Import main schema
mysql -u root -p 3movieCollectors < database/schema.sql

# Import admin schema
mysql -u root -p 3movieCollectors < database/admin_schema.sql

# Import settings schema
mysql -u root -p 3movieCollectors < database/settings_schema.sql

# Install security procedures
mysql -u root -p 3movieCollectors < database/security_procedures.sql
mysql -u root -p 3movieCollectors < database/admin_procedures.sql
mysql -u root -p 3movieCollectors < database/admin_functions.sql

# Install triggers
mysql -u root -p 3movieCollectors < database/admin_triggers.sql
mysql -u root -p 3movieCollectors < database/advanced_security_triggers.sql
mysql -u root -p 3movieCollectors < database/notification_triggers.sql
mysql -u root -p 3movieCollectors < database/movie-stats-triggers.sql

# Install scheduled events
mysql -u root -p 3movieCollectors < database/admin_events.sql

# Install admin privileges
mysql -u root -p 3movieCollectors < database/admin_privileges.sql
```

### Step 3: Import Movie Data

```bash
node database/import.js
```

This imports movies from `data/movies.csv` (1000+ movies with metadata).

### Step 4: Verify Installation

```bash
# Check database structure
mysql -u root -p 3movieCollectors -e "SHOW TABLES;"

# Check movie count
mysql -u root -p 3movieCollectors -e "SELECT COUNT(*) FROM Movie;"
```

You should see 30+ tables and 1000+ movies.

---

## ▶️ Running the Application

### Start the Server

```bash
npm start
```

Or for development with auto-restart:

```bash
npm run dev
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

### Access the Application

**User Side:**

- Landing Page: `http://localhost:3000/index.html`
- Login: `http://localhost:3000/login.html`
- Signup: `http://localhost:3000/signup.html`
- Dashboard: `http://localhost:3000/dashboard.html` (after login)

**Admin Panel:**

- Admin Dashboard: `http://localhost:3000/html/admin/admin-dashboard.html`
- User Management: `http://localhost:3000/html/admin/admin-users.html`
- Movie Management: `http://localhost:3000/html/admin/admin-movies.html`
- Moderation: `http://localhost:3000/html/admin/admin-moderation.html`
- Audit Logs: `http://localhost:3000/html/admin/admin-audit.html`
- Reports: `http://localhost:3000/html/admin/admin-reports.html`

---

## 🔑 Default Credentials

### Create Your First Admin Account

1. Go to `http://localhost:3000/signup.html`
2. Register with:

   - Username: `admin`
   - Name: `Admin User`
   - Email: `admin@3moviecollectors.com`
   - Password: `Admin@123` (or your secure password)

3. **Promote to Admin** (via MySQL):

```sql
UPDATE User SET role = 'admin' WHERE username = 'admin';
```

### Test User Accounts

For testing, you can create additional users via signup or use the sample data.

**Sample Login** (if using provided sample data):

- Username: `john_doe`
- Password: `password123`

---

## 📁 Project Structure

```
3movieCollectors/
│
├── app.js                      # Main application entry point
├── package.json                # Node.js dependencies and scripts
├── .env                        # Environment configuration (create from .env.example)
│
├── server/                     # Backend code
│   ├── routes/                 # API route handlers
│   │   ├── auth.js            # Authentication (login, signup, logout)
│   │   ├── dashboard.js       # User dashboard data
│   │   ├── movies.js          # Movie browsing and search
│   │   ├── watchlist.js       # Watchlist management
│   │   ├── posts.js           # Discussion posts and comments
│   │   ├── friends.js         # Friend system
│   │   ├── events.js          # Watch party events
│   │   ├── messages.js        # Direct messaging
│   │   ├── notifications.js   # Notification system
│   │   ├── profile.js         # User profiles
│   │   ├── settings.js        # Account settings
│   │   └── admin/             # Admin routes
│   │       ├── dashboard.js   # Admin dashboard
│   │       ├── users.js       # User management
│   │       ├── movies.js      # Movie management
│   │       ├── moderation.js  # Content moderation
│   │       ├── audit.js       # Audit logs
│   │       └── reports.js     # Report generation
│   │
│   ├── middleware/            # Express middleware
│   │   ├── errorHandler.js   # Global error handling
│   │   ├── requireAuth.js    # Authentication middleware
│   │   ├── requireAdmin.js   # Admin authorization
│   │   └── securityLogger.js # Security event logging
│   │
│   ├── utils/                 # Utility functions
│   │   └── pdfExport.js      # PDF generation
│   │
│   ├── db.js                  # Database connection pool
│   ├── scheduler.js           # Cron jobs for scheduled tasks
│   └── serverInstance.js      # Server instance tracking
│
├── database/                   # Database scripts
│   ├── schema.sql             # Main database schema
│   ├── admin_schema.sql       # Admin tables
│   ├── settings_schema.sql    # User settings tables
│   ├── security_procedures.sql # Security stored procedures
│   ├── admin_procedures.sql   # Admin stored procedures
│   ├── admin_functions.sql    # SQL functions
│   ├── admin_triggers.sql     # Automated triggers
│   ├── advanced_security_triggers.sql
│   ├── notification_triggers.sql
│   ├── movie-stats-triggers.sql
│   ├── admin_events.sql       # Scheduled database events
│   ├── admin_privileges.sql   # Database permissions
│   ├── setup.js               # Automated database setup
│   ├── import.js              # Import movies from CSV
│   ├── install-advanced-security.js
│   ├── install-security-procedures.js
│   └── sample-data.sql        # Sample data for testing
│
├── html/                       # Frontend HTML pages
│   ├── index.html             # Landing page
│   ├── login.html             # Login page
│   ├── signup.html            # Registration page
│   ├── dashboard.html         # User dashboard
│   ├── browse-movies.html     # Movie catalog
│   ├── movie.html             # Movie detail page
│   ├── watchlist.html         # User watchlist
│   ├── friends.html           # Friends management
│   ├── events.html            # Watch party events
│   ├── messages.html          # Direct messaging
│   ├── notifications.html     # Notifications page
│   ├── profile.html           # User profile
│   ├── settings.html          # Account settings
│   ├── help.html              # Help page
│   └── admin/                 # Admin panel pages
│       ├── admin-dashboard.html
│       ├── admin-users.html
│       ├── admin-movies.html
│       ├── admin-moderation.html
│       ├── admin-audit.html
│       └── admin-reports.html
│
├── js/                         # Frontend JavaScript
│   ├── app.js                 # Global utilities (API calls, auth)
│   ├── dashboard.js           # Dashboard functionality
│   ├── browse-movies.js       # Movie browsing logic
│   ├── movie.js               # Movie detail page logic
│   ├── watchlist.js           # Watchlist management
│   ├── friends.js             # Friends functionality
│   ├── events.js              # Events management
│   ├── messages.js            # Messaging logic
│   ├── notifications.js       # Notifications handling
│   ├── profile.js             # Profile page logic
│   ├── settings.js            # Settings management
│   ├── login.js               # Login functionality
│   ├── signup.js              # Registration logic
│   ├── include-main-navbar.js # Navbar component loader
│   ├── include-side-panel.js  # Sidebar component loader
│   ├── include-footer.js      # Footer component loader
│   └── admin/                 # Admin panel JavaScript
│       ├── admin-dashboard.js
│       ├── admin-users.js
│       ├── admin-movies.js
│       ├── admin-moderation.js
│       ├── admin-audit.js
│       └── admin-reports.js
│
├── css/                        # Stylesheets
│   ├── main-navbar.css        # Navigation bar styles
│   ├── side-panel.css         # Sidebar styles
│   ├── main-footer.css        # Footer styles
│   ├── dashboard.css          # Dashboard page styles
│   ├── browse-movies.css      # Movie browsing styles
│   ├── movie.css              # Movie detail styles
│   ├── watchlist.css          # Watchlist styles
│   ├── friends.css            # Friends page styles
│   ├── events.css             # Events page styles
│   ├── messages.css           # Messaging styles
│   ├── notifications.css      # Notifications styles
│   ├── profile.css            # Profile page styles
│   ├── settings.css           # Settings page styles
│   ├── login.css              # Login page styles
│   ├── signup.css             # Signup page styles
│   ├── index.css              # Landing page styles
│   └── admin-panel.css        # Admin panel styles
│
├── components/                 # Reusable HTML components
│   ├── main-navbar.html       # Top navigation bar
│   ├── side-panel.html        # Sidebar navigation
│   ├── side-panel-collapsed.html
│   ├── main-footer.html       # Footer
│   └── navbar-front.html      # Landing page navbar
│
├── pictures/                   # Static assets
│   ├── movie_posters/         # Movie poster images
│   ├── M.png                  # Logo
│   └── *.png                  # UI icons
│
├── data/                       # Data files
│   └── movies.csv             # Movie database (1000+ movies)
│
└── AdvancedERD/               # Database diagrams
    ├── ERD.drawio             # Entity Relationship Diagram
    └── schema.sql             # Schema documentation
```

---

## 📡 API Documentation

### Base URL

```
http://localhost:3000/api
```

### Authentication Endpoints

**POST** `/api/auth/signup`

- Register new user
- Body: `{ username, name, email, password }`
- Returns: User object + session

**POST** `/api/auth/login`

- Login existing user
- Body: `{ username, password }`
- Returns: User object + session

**POST** `/api/auth/logout`

- Logout current user
- Clears session

**GET** `/api/auth/me`

- Get current user info
- Requires: Active session

### Movie Endpoints

**GET** `/api/movies`

- Browse movies with filters
- Query params: `genre, year, search, sort, page, limit`
- Returns: Paginated movie list

**GET** `/api/movies/:id`

- Get movie details
- Returns: Movie with cast, genres, ratings

**GET** `/api/movies/:id/similar`

- Get similar movies
- Returns: Movies with matching genres

### Dashboard Endpoints

**GET** `/api/dashboard/stats`

- User statistics
- Returns: Watchlist count, friends count, etc.

**GET** `/api/dashboard/recommended`

- Personalized recommendations
- Returns: Movies based on user's genre preferences

**GET** `/api/dashboard/trending`

- Trending movies
- Query params: `limit, days`
- Returns: Most active movies

**GET** `/api/dashboard/recent-activity`

- Friend activity feed
- Returns: Recent reviews and posts from friends

### Watchlist Endpoints

**GET** `/api/watchlist`

- Get user's watchlist
- Returns: All watchlist items with movie details

**POST** `/api/watchlist`

- Add movie to watchlist
- Body: `{ movieId, status }`
- Status: `want-to-watch`, `watching`, `watched`

**PATCH** `/api/watchlist/:id`

- Update watchlist item status
- Body: `{ status }`

**DELETE** `/api/watchlist/:id`

- Remove from watchlist

### Social Endpoints

**GET** `/api/friends`

- Get friends list

**GET** `/api/friends/suggestions`

- Get friend suggestions

**POST** `/api/friends/request`

- Send friend request
- Body: `{ friendId }`

**POST** `/api/friends/accept/:requestId`

- Accept friend request

**DELETE** `/api/friends/:friendId`

- Remove friend

### Admin Endpoints

All admin endpoints require admin authentication:

**GET** `/api/admin/dashboard/stats`

- Admin dashboard statistics

**GET** `/api/admin/users`

- List all users with filters

**GET** `/api/admin/users/:id`

- Get user details

**PATCH** `/api/admin/users/:id`

- Update user (role, suspension)

**DELETE** `/api/admin/users/:id`

- Delete user account

**GET** `/api/admin/audit`

- Get audit logs
- Query params: `startDate, endDate, eventType, page, limit`

**GET** `/api/admin/reports/audit-logs`

- Generate audit report (PDF/CSV)

For complete API documentation, see `API_ENDPOINTS_DOCUMENTATION.md` (if available).

---

## 🐛 Troubleshooting

### Common Issues

#### 1. Database Connection Errors

**Error**: `ECONNREFUSED 127.0.0.1:3306`

**Solution**:

- Ensure MySQL server is running: `mysql --version`
- Check credentials in `.env` file
- Verify database exists: `SHOW DATABASES;`

```bash
# Start MySQL (Windows)
net start MySQL80

# Start MySQL (Mac/Linux)
sudo systemctl start mysql
```

#### 2. Port Already in Use

**Error**: `EADDRINUSE: Port 3000 already in use`

**Solution**:

- Change `PORT` in `.env` to another value (e.g., 3001)
- Or kill the process using port 3000:

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti :3000 | xargs kill
```

#### 3. Session Errors

**Error**: `Unknown database handler: mysql`

**Solution**:

- Ensure `express-mysql-session` is installed:

```bash
npm install express-mysql-session
```

- Check that MySQL connection pool is working

#### 4. Missing Tables

**Error**: `Table 'Movie' doesn't exist`

**Solution**:

- Run database setup again:

```bash
node database/setup.js
```

- Or manually import schema:

```bash
mysql -u root -p 3movieCollectors < database/schema.sql
```

#### 5. Permission Denied Errors

**Error**: `Access denied for user 'root'@'localhost'`

**Solution**:

- Verify MySQL credentials in `.env`
- Reset MySQL root password if needed
- Grant necessary privileges:

```sql
GRANT ALL PRIVILEGES ON 3movieCollectors.* TO 'root'@'localhost';
FLUSH PRIVILEGES;
```

#### 6. Frontend Not Loading

**Error**: Blank page or 404 errors

**Solution**:

- Check console for JavaScript errors
- Verify server is running on correct port
- Clear browser cache (Ctrl+Shift+Delete)
- Check Network tab in DevTools for failed requests

#### 7. Admin Panel Not Accessible

**Error**: Unauthorized or redirect to login

**Solution**:

- Ensure you're logged in as admin
- Check user role in database:

```sql
SELECT * FROM User WHERE username = 'your_username';
```

- If role is not 'admin', update it:

```sql
UPDATE User SET role = 'admin' WHERE username = 'your_username';
```

### Debug Mode

Enable detailed logging:

1. Set in `.env`:

```env
NODE_ENV=development
```

2. Check server console for detailed error messages

3. Check browser console (F12) for client-side errors

### Database Debugging

View database state:

```sql
-- Check tables
SHOW TABLES;

-- Check triggers
SHOW TRIGGERS;

-- Check procedures
SHOW PROCEDURE STATUS WHERE Db = '3movieCollectors';

-- Check events
SHOW EVENTS;

-- View user data
SELECT * FROM User LIMIT 10;

-- View movies
SELECT COUNT(*) FROM Movie;
```

---

## 📝 Additional Notes

### Security Features

- **Password Hashing**: bcrypt with salt rounds
- **Session Management**: MySQL-backed sessions with auto-expiry
- **SQL Injection Prevention**: Prepared statements throughout
- **XSS Protection**: Input sanitization and output encoding
- **CSRF Protection**: Session-based authentication
- **Content Filtering**: Automated restricted word detection
- **Brute Force Protection**: Failed login tracking and account lockout

### Performance Optimization

- **Database Indexing**: Optimized queries with proper indexes
- **Connection Pooling**: MySQL connection pool for efficiency
- **Session Optimization**: MySQL session store for scalability
- **Lazy Loading**: Images load on demand
- **Caching**: Static asset caching headers

### Database Features

- **Stored Procedures**: Complex operations encapsulated
- **Triggers**: Automated actions (audit logging, notifications)
- **Events**: Scheduled cleanup and maintenance
- **Transactions**: Data integrity with ACID compliance
- **Foreign Keys**: Referential integrity enforcement

---

## 🤝 Contributing

This is a completed academic project. For issues or suggestions:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 👥 Authors

- **Ibrahim Hussain** - [ib-hussain](https://github.com/ib-hussain)
- **Izhan Nasir**
- **Saneed Khan**

**Institution**: University Project  
**Course**: Database Systems Lab  
**Semester**: 5th Semester  
**Year**: 2025

---

## 🙏 Acknowledgments

- **TMDB** - The Movie Database for movie data and posters
- **Font Awesome** - Icon library
- **Chart.js** - Data visualization library
- **MySQL** - Robust database system
- **Express.js** - Minimalist web framework

---

**For additional help, open an issue on GitHub or contact the development team.**

## 🏗️ Architecture

### Component Structure

```
/components
├── MovieCard.tsx          # Reusable movie display card
├── UserAvatar.tsx         # Text-based avatar generator
├── ReviewCard.tsx         # Review display with actions
├── PostCard.tsx           # Discussion post card
├── EventCard.tsx          # Watch party event card
├── Topbar.tsx             # Main navigation bar
├── AppSidebar.tsx         # Collapsible sidebar navigation
├── StatCard.tsx           # Statistics display
├── TrendingWidget.tsx     # Trending content sidebar
├── RatingBreakdown.tsx    # Visual rating distribution
└── ui/                    # Shadcn UI components
```

### Pages

```
/pages
├── Landing.tsx            # Public landing page
├── Dashboard.tsx          # User dashboard with feed
├── BrowseMovies.tsx       # Movie catalog with filters
├── MovieDetail.tsx        # Detailed movie page with tabs
├── Events.tsx             # Watch parties management
├── Messages.tsx           # Real-time chat interface
└── AdminDashboard.tsx     # Admin control panel
```

## ♿ Accessibility Features

### WCAG AA Compliance

- **Color Contrast**: All text meets 4.5:1 minimum ratio
- **Keyboard Navigation**: Full keyboard support with visible focus states
- **Screen Readers**: Proper ARIA labels and semantic HTML
- **Focus Management**: Logical tab order and focus trapping in modals
- **Alternative Text**: All images have descriptive alt text
- **Live Regions**: ARIA-live for dynamic content updates

### Semantic HTML

- Proper heading hierarchy (h1 → h6)
- `<main>`, `<nav>`, `<aside>`, `<article>`, `<section>` elements
- Form labels and fieldsets
- Button vs link semantics

### Interactive States

- Hover, focus, active, and disabled states
- Loading skeletons and empty states
- Error handling with clear messaging
- Success confirmations

## 🎯 Engineering Best Practices

### Code Quality

- **TypeScript**: Fully typed with interfaces
- **Component Reusability**: DRY principles throughout
- **Separation of Concerns**: Clear component responsibilities
- **Clean Code**: Readable, maintainable, well-structured

### Layout

- **No Absolute Positioning**: Flexbox and Grid layouts
- **Responsive Structure**: Flexible component design
- **Semantic Markup**: Proper HTML5 elements
- **CSS Variables**: Design tokens for consistency

### Performance

- **Lazy Loading**: Images load on demand
- **Optimized Renders**: Efficient state management
- **Smooth Animations**: GPU-accelerated transitions
- **Code Splitting**: Component-based architecture

## 🚀 Getting Started

### Prerequisites

- Node.js 16+
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation

## 🚀 Quick Start

### Prerequisites

- Node.js v16+
- MySQL 8.0+
- Python 3.8+ (for TMDB scraper)

### Setup

1. **Install dependencies**

```bash
npm install
pip install requests
```

2. **Configure database**

```bash
mysql -u root -p -e "CREATE DATABASE 3movieCollectors;"
mysql -u root -p 3movieCollectors < database/schema.sql
mysql -u root -p 3movieCollectors < database/admin_schema.sql
```

3. **Create test data**

```bash
node create-dummy-users.js
```

4. **Start server**

```bash
node app.js
```

5. **Access application**

- Main: `http://localhost:3000`
- Admin: `http://localhost:3000/html/admin/admin-dashboard.html`

## 📊 Testing & Documentation

### Test Coverage

- ✅ 120+ tests passing (100%)
- Backend: 83 API endpoint tests
- Frontend: 37 integration tests
- Database: 48 schema tests

### Documentation Files

- `PROGRESS_SUMMARY.md` - Implementation progress (92% complete)
- `USER_MANAGEMENT_TESTING_GUIDE.md` - 21 test cases for user management
- `TEST1_QUICK_REFERENCE.md` - Quick test reference
- `ADMIN_IMPLEMENTATION_ROADMAP.md` - Detailed roadmap
- `database/SCHEMA_REFERENCE.md` - Complete database schema

## 📈 Current Status

**Completed Features:**

- ✅ Admin Dashboard with Chart.js visualizations
- ✅ User Management (suspend, role change, search, filter)
- ✅ Movie Management (CRUD, TMDB import, search, filter)
- ✅ Authentication (session-based with bcrypt)
- ✅ Audit Logging (all admin actions tracked)
- ✅ Report Generation (PDF/CSV export)
- ✅ Suspension System (login prevention)

**In Progress:**

- 🔄 Content Moderation UI
- 🔄 Message Moderation Interface

**Overall Progress: 92%**

## 🔐 Admin Credentials

Default admin account (create via signup):

- Username: `admin`
- Email: `admin@3moviecollectors.com`
- Role: Administrator

Test users created by `create-dummy-users.js`:

- 20 total users (18 active + 2 suspended)
- Password for all: `password123`

## 📝 License

See LICENSE file for details.

---

**Last Updated:** December 9, 2025  
**Version:** 1.0.0  
**Status:** Production Ready (Admin Module)

This frontend application is ready for backend integration:

- **Supabase**: Real-time chat, authentication, database
- **API Integration**: Movie data from TMDB or similar
- **WebSockets**: Live notifications and chat
- **File Upload**: User avatars and custom content
- **Search**: Full-text movie and user search

## 📄 License

This is a demonstration project built with Figma Make.

## 🙏 Credits

- Design system based on modern streaming platforms
- Icons from Lucide React
- UI components from Shadcn/ui
- Charts from Recharts
