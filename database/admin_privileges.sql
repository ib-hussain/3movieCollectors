-- ============================================================
-- ADMIN FEATURE - DATABASE PRIVILEGES & USER MANAGEMENT
-- ============================================================
-- Purpose: Configure MySQL users with appropriate permissions
-- Created: December 9, 2025
-- Security: Single admin role with full privileges
-- ============================================================

USE 3movieCollectors;

-- ============================================================
-- SECTION 1: CREATE MYSQL USERS
-- ============================================================

-- Drop existing users if they exist (for re-execution)
DROP USER IF EXISTS 'admin_user'@'localhost';
DROP USER IF EXISTS 'app_user'@'localhost';

-- Create admin user (full privileges)
CREATE USER 'admin_user'@'localhost' IDENTIFIED BY 'AdminPass123!@#';

-- Create application user (limited privileges)
CREATE USER 'app_user'@'localhost' IDENTIFIED BY 'AppPass123!@#';

-- ============================================================
-- SECTION 2: ADMIN USER PRIVILEGES
-- Purpose: Grant full control to admin users
-- ============================================================

-- Grant all privileges on 3movieCollectors database
GRANT ALL PRIVILEGES ON 3movieCollectors.* TO 'admin_user'@'localhost';

-- Grant specific global privileges for backup operations
GRANT RELOAD ON *.* TO 'admin_user'@'localhost';
GRANT LOCK TABLES ON *.* TO 'admin_user'@'localhost';
GRANT PROCESS ON *.* TO 'admin_user'@'localhost';

-- Allow admin to execute all stored procedures and functions
GRANT EXECUTE ON 3movieCollectors.* TO 'admin_user'@'localhost';

-- Allow admin to manage events (for backup scheduling)
GRANT EVENT ON 3movieCollectors.* TO 'admin_user'@'localhost';

-- Allow admin to create triggers
GRANT TRIGGER ON 3movieCollectors.* TO 'admin_user'@'localhost';

-- ============================================================
-- SECTION 3: APPLICATION USER PRIVILEGES
-- Purpose: Limited privileges for regular application operations
-- Note: DELETE-only on content, per user decision Q9
-- ============================================================

-- Grant SELECT privileges on all tables
GRANT SELECT ON 3movieCollectors.* TO 'app_user'@'localhost';

-- Grant INSERT privileges for user-generated content
GRANT INSERT ON 3movieCollectors.User TO 'app_user'@'localhost';
GRANT INSERT ON 3movieCollectors.Post TO 'app_user'@'localhost';
GRANT INSERT ON 3movieCollectors.Comments TO 'app_user'@'localhost';
GRANT INSERT ON 3movieCollectors.ReviewRatings TO 'app_user'@'localhost';
GRANT INSERT ON 3movieCollectors.WatchList TO 'app_user'@'localhost';
GRANT INSERT ON 3movieCollectors.Notifications TO 'app_user'@'localhost';
GRANT INSERT ON 3movieCollectors.Message TO 'app_user'@'localhost';
GRANT INSERT ON 3movieCollectors.Friends TO 'app_user'@'localhost';
GRANT INSERT ON 3movieCollectors.WatchEvent TO 'app_user'@'localhost';

-- Grant UPDATE privileges for user profile and interactions
GRANT UPDATE ON 3movieCollectors.User TO 'app_user'@'localhost';
GRANT UPDATE ON 3movieCollectors.Post TO 'app_user'@'localhost';
GRANT UPDATE ON 3movieCollectors.Comments TO 'app_user'@'localhost';
GRANT UPDATE ON 3movieCollectors.ReviewRatings TO 'app_user'@'localhost';
GRANT UPDATE ON 3movieCollectors.WatchList TO 'app_user'@'localhost';
GRANT UPDATE ON 3movieCollectors.Friends TO 'app_user'@'localhost';
GRANT UPDATE ON 3movieCollectors.Message TO 'app_user'@'localhost';
GRANT UPDATE ON 3movieCollectors.Notifications TO 'app_user'@'localhost';
GRANT UPDATE ON 3movieCollectors.WatchEvent TO 'app_user'@'localhost';

-- Grant DELETE privileges for user-owned content
-- Users can delete their own posts, comments, reviews, watchlist items
GRANT DELETE ON 3movieCollectors.Post TO 'app_user'@'localhost';
GRANT DELETE ON 3movieCollectors.Comments TO 'app_user'@'localhost';
GRANT DELETE ON 3movieCollectors.ReviewRatings TO 'app_user'@'localhost';
GRANT DELETE ON 3movieCollectors.WatchList TO 'app_user'@'localhost';
GRANT DELETE ON 3movieCollectors.Friends TO 'app_user'@'localhost';
GRANT DELETE ON 3movieCollectors.WatchEvent TO 'app_user'@'localhost';

-- NO DELETE on Movie, Genres tables (admin-only)
-- Enforced by not granting DELETE privilege

-- Grant EXECUTE on specific functions for app operations
GRANT EXECUTE ON FUNCTION 3movieCollectors.fn_is_admin TO 'app_user'@'localhost';
GRANT EXECUTE ON FUNCTION 3movieCollectors.fn_user_activity_score TO 'app_user'@'localhost';
GRANT EXECUTE ON FUNCTION 3movieCollectors.fn_contains_restricted_word TO 'app_user'@'localhost';
GRANT EXECUTE ON FUNCTION 3movieCollectors.fn_movie_discussion_score TO 'app_user'@'localhost';
GRANT EXECUTE ON FUNCTION 3movieCollectors.fn_user_violation_count TO 'app_user'@'localhost';

-- NO EXECUTE on admin procedures (admin-only operations)
-- Procedures like sp_delete_flagged_content, sp_suspend_user, etc. require admin access

-- ============================================================
-- SECTION 4: SECURITY BEST PRACTICES
-- ============================================================

-- Flush privileges to apply changes
FLUSH PRIVILEGES;

-- Display granted privileges for verification
SELECT 
    'Admin User Privileges' as UserType,
    'admin_user@localhost' as User,
    'ALL PRIVILEGES on 3movieCollectors.*' as Grants
UNION ALL
SELECT 
    'Application User Privileges' as UserType,
    'app_user@localhost' as User,
    'SELECT, INSERT, UPDATE, DELETE (limited) on 3movieCollectors.*' as Grants;

-- ============================================================
-- SECTION 5: USAGE INSTRUCTIONS
-- ============================================================

/*
CONNECTION GUIDELINES:
----------------------

1. ADMIN USER (admin_user@localhost):
   - Use for admin panel backend connections
   - Use for executing admin procedures and operations
   - Use for database maintenance and backups
   - Password: AdminPass123!@# (CHANGE IN PRODUCTION!)
   
   Connection string example (Node.js):
   {
     host: 'localhost',
     user: 'admin_user',
     password: 'AdminPass123!@#',
     database: '3movieCollectors'
   }

2. APPLICATION USER (app_user@localhost):
   - Use for regular user-facing application
   - Limited to user content operations
   - Cannot delete movies or modify admin data
   - Password: AppPass123!@# (CHANGE IN PRODUCTION!)
   
   Connection string example (Node.js):
   {
     host: 'localhost',
     user: 'app_user',
     password: 'AppPass123!@#',
     database: '3movieCollectors'
   }

SECURITY NOTES:
---------------
1. Change default passwords immediately in production
2. Use environment variables for credentials (never hardcode)
3. Enable SSL/TLS for database connections
4. Regularly audit user privileges
5. Implement connection pooling with limited pool size
6. Use prepared statements to prevent SQL injection

PASSWORD ROTATION (Production):
-------------------------------
-- To change admin password:
ALTER USER 'admin_user'@'localhost' IDENTIFIED BY 'NewSecurePassword123!';

-- To change app password:
ALTER USER 'app_user'@'localhost' IDENTIFIED BY 'NewSecurePassword123!';

PRIVILEGE AUDITING:
------------------
-- View admin_user privileges:
SHOW GRANTS FOR 'admin_user'@'localhost';

-- View app_user privileges:
SHOW GRANTS FOR 'app_user'@'localhost';
*/

-- ============================================================
-- VERIFICATION
-- ============================================================
SELECT 'Database users and privileges configured successfully!' as Status;
SELECT 'WARNING: Change default passwords in production!' as SecurityReminder;

-- Show all MySQL users
SELECT User, Host FROM mysql.user WHERE User IN ('admin_user', 'app_user');
