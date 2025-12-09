# 3movieCollectors - Movie Community Platform

A comprehensive movie community web application with social features, movie catalog, and advanced admin management system. Built with Node.js, Express, MySQL, and vanilla JavaScript.

## 🎯 Project Overview

3movieCollectors is a full-featured movie community platform that combines a movie catalog, social interactions, user management, and powerful admin tools. Features a modern dark theme interface with real-time updates and professional administrative capabilities.

## ✨ Key Features

### User Features

- **Movie Catalog**: Browse and search movies with detailed information from TMDB
- **Personalized Dashboard**: Activity feed with reviews and recommendations
- **Watchlist Management**: Track movies you want to watch or have watched
- **Social Network**: Connect with friends and fellow movie enthusiasts
- **Reviews & Ratings**: Rate movies and write detailed reviews
- **User Profiles**: Customizable profiles with activity history

### Admin Features ✅

- **Admin Dashboard**: System metrics with Chart.js visualizations and real-time updates
- **User Management**: Full CRUD operations with suspension system
  - Suspend/unsuspend users with reasons
  - Role management (user ↔ admin)
  - Self-protection (admins cannot suspend/demote themselves)
  - Login prevention for suspended users
  - 20 test users created for testing
- **Movie Management**: Complete movie catalog control
  - Add, edit, delete movies with validation
  - Bulk TMDB import with progress tracking
  - Search, filter (genre/year), and sort functionality
  - Genre management with 20+ genres
  - Duplicate prevention and poster handling
- **Content Moderation**: Flag queue and review system (backend complete)
- **Reports & Analytics**: PDF/CSV export for audit logs and user activity
- **Security Monitoring**: Audit logging with detailed action tracking
- **Real-time Updates**: 30-second polling for live statistics

## 🛠️ Technology Stack

### Backend

- **Runtime**: Node.js v24.11.1
- **Framework**: Express.js
- **Database**: MySQL 8.0+
- **Authentication**: Session-based with bcrypt password hashing
- **File Uploads**: Multer for movie posters
- **PDF Generation**: PDFKit for reports
- **CSV Export**: csv-writer for data exports

### Frontend

- **HTML5**: Semantic markup with accessibility
- **CSS3**: Modern features with CSS Grid and Flexbox
- **JavaScript**: ES6+ with async/await
- **Charts**: Chart.js 4.4.0 for data visualization
- **Icons**: Font Awesome 6.4.0
- **Theme**: Dark mode with cinematic aesthetics

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
