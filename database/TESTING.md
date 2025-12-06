# Feature 2: Database Schema & Connection - Testing Guide

## What Was Implemented

✅ Complete MySQL database schema with 19 tables
✅ Database setup script with automatic table creation
✅ Sample data insertion (genres, restricted words)
✅ Database verification script
✅ Indexed columns for better query performance
✅ Proper foreign key relationships and constraints

## Database Tables Created

1. **User** - User accounts with roles (user/admin)
2. **Genres** - Movie genres
3. **UserGenres** - User's favorite genres
4. **Movie** - Movie information
5. **MovieCast** - Cast members for movies
6. **MovieGenres** - Genre assignments for movies
7. **WatchList** - User's watchlist with status tracking
8. **FriendRequest** - Friend request management
9. **Friends** - Friendship relationships
10. **ReviewRatings** - Movie reviews and ratings
11. **Post** - User posts about movies
12. **Comments** - Comments on posts
13. **Likes** - Post likes
14. **Notifications** - User notifications
15. **WatchEvent** - Movie watch events/parties
16. **EventParticipants** - Event attendance tracking
17. **Message** - Direct messages between users
18. **RestrictedWords** - Content moderation words
19. **AuditLog** - Admin action logging

## Prerequisites

✓ MySQL server must be running
✓ MySQL root user (or user with CREATE DATABASE privileges)
✓ Node.js dependencies installed (`npm install` from Feature 1)

## Setup Instructions

### Step 1: Configure Database Credentials

Open `.env` file and update your MySQL password:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password_here
DB_NAME=3movieCollectors
DB_PORT=3306
```

**Important:** Replace `your_mysql_password_here` with your actual MySQL root password.

### Step 2: Run Database Setup

Open Command Prompt in the project directory and run:

```cmd
cd "d:\University Semesters\5th Semester\DB Lab\Project\3movieCollectors"
npm run db:setup
```

**Expected Output:**

```
Starting database setup...

Executing XX SQL statements...

✓ Database created
✓ Created table: User
✓ Created table: Genres
✓ Created table: UserGenres
✓ Created table: Movie
... (more tables)

✓ Schema setup completed successfully!

Inserting sample data...

✓ Sample data inserted successfully!

✓ Database ready with 19 tables:

  - User
  - Genres
  - UserGenres
  ... (all tables listed)

✓ Database setup complete!
```

### Step 3: Verify Database

Run the verification script to confirm everything is set up correctly:

```cmd
npm run db:verify
```

**Expected Output:**

```
═══════════════════════════════════════════════════════
🔍  3movieCollectors Database Verification
═══════════════════════════════════════════════════════

✓ Database connected successfully
Current Database: 3movieCollectors

Total Tables: 19

Table Statistics:
─────────────────────────────────────────────────────
  User                      0 rows
  Genres                    10 rows
  UserGenres                0 rows
  Movie                     0 rows
  ... (all tables with row counts)

═══════════════════════════════════════════════════════
✓ Database verification complete!
═══════════════════════════════════════════════════════
```

### Step 4: Test Server Connection to Database

Start the server:

```cmd
npm start
```

**Expected Output:**

```
═══════════════════════════════════════════════════════
🎬  3movieCollectors Server
═══════════════════════════════════════════════════════
   Server running on: http://localhost:3000
   Environment: development
   Database: ✓ Connected    <-- THIS SHOULD NOW SHOW CONNECTED!
═══════════════════════════════════════════════════════
```

## Manual Verification (Optional)

You can also verify the database using MySQL Workbench or command line:

```cmd
mysql -u root -p
```

Then in MySQL:

```sql
USE 3movieCollectors;
SHOW TABLES;
DESCRIBE User;
SELECT * FROM Genres;
```

## Testing Checklist

Please confirm the following:

- [ ] **Setup Script Runs:** `npm run db:setup` completes without errors
- [ ] **19 Tables Created:** Verification shows all 19 tables
- [ ] **Genres Inserted:** Verification shows 10 genres in Genres table
- [ ] **Restricted Words:** Verification shows 7 restricted words
- [ ] **Server Connects:** Server startup shows "Database: ✓ Connected"
- [ ] **API Still Works:** http://localhost:3000/api/test still returns JSON

## Troubleshooting

### Error: "Access denied for user 'root'@'localhost'"

- Check your MySQL password in `.env` file
- Make sure MySQL server is running
- Try connecting with MySQL Workbench using same credentials

### Error: "Can't connect to MySQL server"

- Start MySQL service: `net start MySQL80` (or your MySQL version)
- Check if MySQL is running in Task Manager

### Error: "Database already exists"

- This is OK! The script drops and recreates the database
- If you see this, the setup should still work

### Error: "Unknown database '3movieCollectors'"

- Make sure setup script ran successfully first
- Run `npm run db:setup` before `npm run db:verify`

## What's Next?

Once Feature 2 is confirmed working, we'll move to:

- **Feature 3:** TMDB Data Ingestion Pipeline (importing real movies!)

---

**Please test all the steps above and confirm:**

1. Does `npm run db:setup` complete successfully?
2. Does `npm run db:verify` show all 19 tables?
3. Does the server show "Database: ✓ Connected"?
4. Can you see the genres when you run: `SELECT * FROM Genres;` in MySQL?

Let me know once you've tested! 🚀
