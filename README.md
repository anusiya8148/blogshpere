# ✨ BlogSphere

> A modern full-stack blogging platform where users can create, publish, explore, like, comment on, and bookmark blogs.

---

## 🚀 Project Overview

**BlogSphere** is a full-stack blogging platform designed to provide a simple and modern environment for creating and discovering blog content.

Users can create accounts, manage their profiles, publish blogs, explore posts from different categories, interact with other users through likes and comments, and save interesting blogs using bookmarks.

The application uses a **Node.js + Express backend**, **HTML/CSS/JavaScript frontend**, and **Supabase** for authentication, database management, and image storage.

---

## ✨ Features

### 👤 User Authentication

- User registration
- User login
- Email confirmation
- Secure authentication using Supabase
- User profile management
- Username management
- Logout functionality

### 📝 Blog Management

- Create new blogs
- Edit existing blogs
- Publish blogs
- Save blogs as drafts
- Delete blogs
- Blog cover image support
- Categories and tags
- Blog view counter

### 📚 Blog Categories

BlogSphere currently supports:

- 💻 Technology
- 🤖 AI & ML
- 🎓 Education
- 💼 Career
- 🏫 College Life
- 🚀 Projects
- 🌱 Self Growth

### ❤️ Blog Interaction

- Like blogs
- Comment on blogs
- Bookmark blogs
- View saved blogs
- Explore published blogs

### 🔎 Explore

- Browse all published blogs
- Search blogs
- Filter by category
- View blog details
- View author information

### 👤 Profiles

- User profile
- Username
- Bio
- Profile information
- Published blogs
- Blog statistics

### 🖼️ Images

- Blog cover images
- Image upload support
- Supabase Storage integration
- Online image URL support

---

## 🛠️ Technology Stack

### Frontend

- HTML5
- CSS3
- JavaScript
- Responsive UI
- Font Awesome / Icons

### Backend

- Node.js
- Express.js
- REST API
- CORS
- dotenv

### Database & Authentication

- Supabase
- PostgreSQL
- Supabase Authentication
- Supabase Storage

---

## 📂 Project Structure

```text
BlogSphere/
│
├── frontend/
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   ├── explore.html
│   ├── categories.html
│   ├── blog.html
│   ├── dashboard.html
│   ├── create-blog.html
│   ├── edit-blog.html
│   ├── profile.html
│   ├── saved.html
│   ├── style.css
│   └── script.js
│
├── backend/
│   ├── config/
│   │   └── supabase.js
│   │
│   ├── middleware/
│   │   └── auth.js
│   │
│   ├── routes/
│   │   ├── blogs.js
│   │   ├── users.js
│   │   ├── comments.js
│   │   ├── likes.js
│   │   └── bookmarks.js
│   │
│   ├── package.json
│   ├── package-lock.json
│   └── server.js
│
├── .gitignore
└── README.md


Author
Anusiya R
III year cse
Full Stack Developer
