const express = require('express');
const router = express.Router();

const { supabaseAdmin } = require('../config/supabase');
const authenticate = require('../middleware/auth');

/*
====================================================
GET ALL PUBLISHED BLOGS
GET /api/blogs
====================================================
*/
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('blogs')
      .select(
        `
                *,
                profiles (
                    name,
                    username,
                    avatar_url
                )
            `
      )
      .eq('status', 'published')
      .order('created_at', {
        ascending: false,
      });

    if (error) {
      console.error('Get blogs error:', error);

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }

    const blogs = await addBlogStatistics(data || []);

    res.json({
      success: true,
      blogs,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch blogs.',
    });
  }
});

/*
====================================================
GET MY BLOGS
GET /api/blogs/mine
====================================================
*/
router.get('/mine', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('blogs')
      .select(
        `
                *,
                profiles (
                    name,
                    username,
                    avatar_url
                )
            `
      )
      .eq('user_id', req.user.id)
      .order('created_at', {
        ascending: false,
      });

    if (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }

    const blogs = await addBlogStatistics(data || [], req.user.id);

    res.json({
      success: true,
      blogs,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch your blogs.',
    });
  }
});

/*
====================================================
GET SINGLE BLOG
GET /api/blogs/:id
====================================================
*/
router.get('/:id', async (req, res) => {
  try {
    const blogId = req.params.id;

    const { data: blog, error } = await supabaseAdmin
      .from('blogs')
      .select(
        `
                *,
                profiles (
                    name,
                    username,
                    avatar_url
                )
            `
      )
      .eq('id', blogId)
      .single();

    if (error || !blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found.',
      });
    }

    /*
        Increase view count
        */
    const newViews = (blog.views || 0) + 1;

    await supabaseAdmin
      .from('blogs')
      .update({
        views: newViews,
      })
      .eq('id', blogId);

    /*
        Get likes count
        */
    const { count: likeCount } = await supabaseAdmin
      .from('likes')
      .select('*', {
        count: 'exact',
        head: true,
      })
      .eq('blog_id', blogId);

    /*
        Get comments count
        */
    const { count: commentCount } = await supabaseAdmin
      .from('comments')
      .select('*', {
        count: 'exact',
        head: true,
      })
      .eq('blog_id', blogId);

    res.json({
      success: true,
      blog: {
        ...blog,
        views: newViews,
        like_count: likeCount || 0,
        comment_count: commentCount || 0,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch blog.',
    });
  }
});

/*
====================================================
CREATE BLOG
POST /api/blogs
====================================================
*/
router.post('/', authenticate, async (req, res) => {
  try {
    const { title, content, category, tags, cover_image, status } = req.body;

    /*
        Validate required fields
        */
    if (
      !title ||
      !title.trim() ||
      !content ||
      !content.trim() ||
      !category ||
      !category.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: 'Title, content and category are required.',
      });
    }

    /*
        Convert tags into array
        */
    let tagArray = [];

    if (Array.isArray(tags)) {
      tagArray = tags;
    } else if (typeof tags === 'string') {
      tagArray = tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);
    }

    /*
        Create blog
        */
    const { data, error } = await supabaseAdmin
      .from('blogs')
      .insert({
        user_id: req.user.id,
        title: title.trim(),
        content: content.trim(),
        category: category.trim(),
        tags: tagArray,
        cover_image: cover_image || '',
        status: status === 'draft' ? 'draft' : 'published',
      })
      .select()
      .single();

    if (error) {
      console.error('Create blog error:', error);

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Blog created successfully.',
      blog: data,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Failed to create blog.',
    });
  }
});

/*
====================================================
UPDATE BLOG
PUT /api/blogs/:id
====================================================
*/
router.put('/:id', authenticate, async (req, res) => {
  try {
    const blogId = req.params.id;

    /*
        Check blog ownership
        */
    const { data: existingBlog, error: findError } = await supabaseAdmin
      .from('blogs')
      .select('user_id')
      .eq('id', blogId)
      .single();

    if (findError || !existingBlog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found.',
      });
    }

    if (existingBlog.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can edit only your own blog.',
      });
    }

    const { title, content, category, tags, cover_image, status } = req.body;

    /*
        Convert tags
        */
    let tagArray = [];

    if (Array.isArray(tags)) {
      tagArray = tags;
    } else if (typeof tags === 'string') {
      tagArray = tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);
    }

    /*
        Update
        */
    const { data, error } = await supabaseAdmin
      .from('blogs')
      .update({
        title: title?.trim(),
        content: content?.trim(),
        category: category?.trim(),
        tags: tagArray,
        cover_image: cover_image || '',
        status: status === 'draft' ? 'draft' : 'published',
        updated_at: new Date().toISOString(),
      })
      .eq('id', blogId)
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }

    res.json({
      success: true,
      message: 'Blog updated successfully.',
      blog: data,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Failed to update blog.',
    });
  }
});

/*
====================================================
DELETE BLOG
DELETE /api/blogs/:id
====================================================
*/
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const blogId = req.params.id;

    /*
        Check ownership
        */
    const { data: existingBlog, error: findError } = await supabaseAdmin
      .from('blogs')
      .select('user_id')
      .eq('id', blogId)
      .single();

    if (findError || !existingBlog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found.',
      });
    }

    if (existingBlog.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can delete only your own blog.',
      });
    }

    /*
        Delete blog
        */
    const { error } = await supabaseAdmin
      .from('blogs')
      .delete()
      .eq('id', blogId);

    if (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }

    res.json({
      success: true,
      message: 'Blog deleted successfully.',
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Failed to delete blog.',
    });
  }
});

/*
====================================================
HELPER FUNCTION
Add likes/comments statistics
====================================================
*/
async function addBlogStatistics(blogs, userId = null) {
  const result = [];

  for (const blog of blogs) {
    /*
        Like count
        */
    const { count: likeCount } = await supabaseAdmin
      .from('likes')
      .select('*', {
        count: 'exact',
        head: true,
      })
      .eq('blog_id', blog.id);

    /*
        Comment count
        */
    const { count: commentCount } = await supabaseAdmin
      .from('comments')
      .select('*', {
        count: 'exact',
        head: true,
      })
      .eq('blog_id', blog.id);

    /*
        Check whether current user liked/bookmarked
        */
    let liked = false;
    let bookmarked = false;

    if (userId) {
      const { data: like } = await supabaseAdmin
        .from('likes')
        .select('id')
        .eq('blog_id', blog.id)
        .eq('user_id', userId)
        .maybeSingle();

      const { data: bookmark } = await supabaseAdmin
        .from('bookmarks')
        .select('id')
        .eq('blog_id', blog.id)
        .eq('user_id', userId)
        .maybeSingle();

      liked = !!like;
      bookmarked = !!bookmark;
    }

    result.push({
      ...blog,
      like_count: likeCount || 0,
      comment_count: commentCount || 0,
      liked,
      bookmarked,
    });
  }

  return result;
}

module.exports = router;
