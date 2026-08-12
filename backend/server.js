const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import routes
const blogRoutes = require('./routes/blogs');
const commentRoutes = require('./routes/comments');
const likeRoutes = require('./routes/likes');
const bookmarkRoutes = require('./routes/bookmarks');
const userRoutes = require('./routes/users');

const app = express();

const PORT = process.env.PORT || 5000;

/*
====================================================
MIDDLEWARE
====================================================
*/

// Allow frontend requests
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// Read JSON request body
app.use(
  express.json({
    limit: '5mb',
  })
);

// Read form data
app.use(
  express.urlencoded({
    extended: true,
    limit: '5mb',
  })
);

/*
====================================================
API INFORMATION
====================================================
*/

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to BlogSphere API 🚀',
    version: '1.0.0',
  });
});

/*
====================================================
HEALTH CHECK
====================================================
*/

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'online',
    message: 'BlogSphere backend is running successfully.',
    timestamp: new Date().toISOString(),
  });
});

/*
====================================================
API ROUTES
====================================================
*/

// Blogs
app.use('/api/blogs', blogRoutes);

// Comments
app.use('/api/comments', commentRoutes);

// Likes
app.use('/api/likes', likeRoutes);

// Bookmarks
app.use('/api/bookmarks', bookmarkRoutes);

// Users / Profiles
app.use('/api/users', userRoutes);

/*
====================================================
404 HANDLER
====================================================
*/

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found.',
    path: req.originalUrl,
  });
});

/*
====================================================
GLOBAL ERROR HANDLER
====================================================
*/

app.use((error, req, res, next) => {
  console.error('Server Error:', error);

  res.status(500).json({
    success: false,
    message: 'Internal server error.',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined,
  });
});

/*
====================================================
START SERVER
====================================================
*/

app.listen(PORT, () => {
  console.log('');
  console.log('==========================================');
  console.log('       BLOGSPHERE BACKEND SERVER');
  console.log('==========================================');
  console.log(`🚀 Server: http://localhost:${PORT}`);
  console.log(`❤️  Blogs: http://localhost:${PORT}/api/blogs`);
  console.log(`💬 Comments: http://localhost:${PORT}/api/comments`);
  console.log(`👍 Likes: http://localhost:${PORT}/api/likes`);
  console.log(`🔖 Bookmarks: http://localhost:${PORT}/api/bookmarks`);
  console.log(`👤 Users: http://localhost:${PORT}/api/users`);
  console.log(`💚 Health: http://localhost:${PORT}/api/health`);
  console.log('==========================================');
  console.log('');
});
