# 3movieCollectors - Setup & Testing Guide

## Phase 1 - Feature 1: Backend Infrastructure ✓

### What Was Implemented

✅ Express.js server with proper configuration
✅ Database connection pool (MySQL2)
✅ Session management
✅ Middleware structure (auth, error handling)
✅ Static file serving for HTML/CSS/JS
✅ Environment configuration (.env)
✅ API route structure
✅ Test endpoints

### Prerequisites

Before testing, make sure you have:

- Node.js (v14 or higher) installed
- MySQL server running
- Access to create databases

### Setup Instructions

1. **Navigate to the project directory:**

   ```cmd
   cd "d:\University Semesters\5th Semester\DB Lab\Project\3movieCollectors"
   ```

2. **Install dependencies:**

   ```cmd
   npm install
   ```

3. **Configure environment variables:**

   - Open `.env` file
   - Update `DB_PASSWORD` with your MySQL root password
   - Save the file

4. **Start the server:**

   ```cmd
   npm start
   ```

   Or for development with auto-restart:

   ```cmd
   npm run dev
   ```

### Testing Feature 1

Once the server starts, you should see:

```
═══════════════════════════════════════════════════════
🎬  3movieCollectors Server
═══════════════════════════════════════════════════════
   Server running on: http://localhost:3000
   Environment: development
   Database: ✓ Connected  (or ✗ Not Connected - that's OK for now)
═══════════════════════════════════════════════════════
```

**Test the following:**

1. **Test API endpoint:**

   - Open browser: http://localhost:3000/api/test
   - Expected: JSON response with `success: true`

2. **Test health endpoint:**

   - Open browser: http://localhost:3000/api/health
   - Expected: JSON with uptime info

3. **Test static file serving:**

   - Open browser: http://localhost:3000/index.html
   - Expected: Your landing page loads with CSS/JS

4. **Test routing:**
   - Open browser: http://localhost:3000/
   - Expected: Redirects to index.html (since no login yet)

### Expected Results

✓ Server starts without errors
✓ API endpoints return JSON
✓ Static files (HTML/CSS/JS) load properly
✓ Database connection message appears (warning is OK if DB not created yet)

### Common Issues

**If npm install fails:**

- Make sure you have internet connection
- Try: `npm cache clean --force` then `npm install` again

**If server won't start:**

- Check if port 3000 is already in use
- Change PORT in .env file to something else (e.g., 3001)

**If database warning appears:**

- This is expected! We'll create the database in Feature 2
- The server will still work for testing static files

---

## Next Steps

Once you confirm Feature 1 is working, we'll move to:

- **Feature 2:** Database Schema & Connection (creating the actual MySQL database)

**Please test the above and let me know if everything is working!**
