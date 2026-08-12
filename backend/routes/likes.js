const express = require('express');
const router = express.Router();

const { supabaseAdmin } = require('../config/supabase');
const authenticate = require('../middleware/auth');

/*
====================================================
GET LIKE COUNT FOR A BLOG
GET /api/likes/blog/:blogId
====================================================
*/
router.get('/blog/:blogId', async (req, res) => {
  try {
    const blogId = req.params.blogId;

    const { count, error } = await supabaseAdmin
      .from('likes')
      .select('*', {
        count: 'exact',
        head: true,
      })
      .eq('blog_id', blogId);

    if (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }

    res.json({
      success: true,
      count: count || 0,
    });
  } catch (error) {
    console.error('Like count error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to get like count.',
    });
  }
});

/*
====================================================
CHECK WHETHER CURRENT USER LIKED
GET /api/likes/blog/:blogId/status
====================================================
*/
router.get('/blog/:blogId/status', authenticate, async (req, res) => {
  try {
    const blogId = req.params.blogId;

    const { data, error } = await supabaseAdmin
      .from('likes')
      .select('id')
      .eq('blog_id', blogId)
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }

    res.json({
      success: true,
      liked: !!data,
    });
  } catch (error) {
    console.error('Like status error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to check like status.',
    });
  }
});

/*
====================================================
LIKE BLOG
POST /api/likes/:blogId
====================================================
*/
router.post('/:blogId', authenticate, async (req, res) => {
  try {
    const blogId = req.params.blogId;

    /*
        Check if blog exists
        */
    const { data: blog, error: blogError } = await supabaseAdmin
      .from('blogs')
      .select('id')
      .eq('id', blogId)
      .maybeSingle();

    if (blogError) {
      return res.status(500).json({
        success: false,
        message: blogError.message,
      });
    }

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found.',
      });
    }

    /*
        Check existing like
        */
    const { data: existingLike, error: findError } = await supabaseAdmin
      .from('likes')
      .select('id')
      .eq('blog_id', blogId)
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (findError) {
      return res.status(500).json({
        success: false,
        message: findError.message,
      });
    }

    /*
        Already liked
        */
    if (existingLike) {
      return res.status(409).json({
        success: false,
        message: 'You already liked this blog.',
      });
    }

    /*
        Add like
        */
    const { error } = await supabaseAdmin.from('likes').insert({
      blog_id: blogId,
      user_id: req.user.id,
    });

    if (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Blog liked successfully.',
    });
  } catch (error) {
    console.error('Like error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to like blog.',
    });
  }
});

/*
====================================================
UNLIKE BLOG
DELETE /api/likes/:blogId
====================================================
*/
router.delete('/:blogId', authenticate, async (req, res) => {
  try {
    const blogId = req.params.blogId;

    const { error } = await supabaseAdmin
      .from('likes')
      .delete()
      .eq('blog_id', blogId)
      .eq('user_id', req.user.id);

    if (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }

    res.json({
      success: true,
      message: 'Like removed successfully.',
    });
  } catch (error) {
    console.error('Unlike error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to remove like.',
    });
  }
});

/*
====================================================
TOGGLE LIKE
POST /api/likes/:blogId/toggle
====================================================
*/
router.post('/:blogId/toggle', authenticate, async (req, res) => {
  try {
    const blogId = req.params.blogId;

    /*
        Check current like
        */
    const { data: existingLike, error: findError } = await supabaseAdmin
      .from('likes')
      .select('id')
      .eq('blog_id', blogId)
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (findError) {
      return res.status(500).json({
        success: false,
        message: findError.message,
      });
    }

    /*
        If liked → unlike
        */
    if (existingLike) {
      const { error } = await supabaseAdmin
        .from('likes')
        .delete()
        .eq('id', existingLike.id);

      if (error) {
        return res.status(500).json({
          success: false,
          message: error.message,
        });
      }

      return res.json({
        success: true,
        liked: false,
        message: 'Like removed.',
      });
    }

    /*
        If not liked → like
        */
    const { error } = await supabaseAdmin.from('likes').insert({
      blog_id: blogId,
      user_id: req.user.id,
    });

    if (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }

    res.json({
      success: true,
      liked: true,
      message: 'Blog liked.',
    });
  } catch (error) {
    console.error('Toggle like error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to update like.',
    });
  }
});

module.exports = router;
