const express = require('express');
const router = express.Router();

const { supabaseAdmin } = require('../config/supabase');
const authenticate = require('../middleware/auth');

/*
====================================================
GET COMMENTS FOR A BLOG
GET /api/comments/blog/:blogId
====================================================
*/
router.get('/blog/:blogId', async (req, res) => {
  try {
    const blogId = req.params.blogId;

    const { data, error } = await supabaseAdmin
      .from('comments')
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
      .eq('blog_id', blogId)
      .order('created_at', {
        ascending: false,
      });

    if (error) {
      console.error('Get comments error:', error);

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }

    res.json({
      success: true,
      comments: data || [],
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch comments.',
    });
  }
});

/*
====================================================
ADD COMMENT
POST /api/comments
====================================================
*/
router.post('/', authenticate, async (req, res) => {
  try {
    const { blog_id, content } = req.body;

    /*
        Validate
        */
    if (!blog_id) {
      return res.status(400).json({
        success: false,
        message: 'Blog ID is required.',
      });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Comment cannot be empty.',
      });
    }

    /*
        Check whether blog exists
        */
    const { data: blog, error: blogError } = await supabaseAdmin
      .from('blogs')
      .select('id')
      .eq('id', blog_id)
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
        Create comment
        */
    const { data, error } = await supabaseAdmin
      .from('comments')
      .insert({
        blog_id: blog_id,
        user_id: req.user.id,
        content: content.trim(),
      })
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
      .single();

    if (error) {
      console.error('Create comment error:', error);

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Comment added successfully.',
      comment: data,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Failed to add comment.',
    });
  }
});

/*
====================================================
UPDATE COMMENT
PUT /api/comments/:id
====================================================
*/
router.put('/:id', authenticate, async (req, res) => {
  try {
    const commentId = req.params.id;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Comment cannot be empty.',
      });
    }

    /*
        Find comment
        */
    const { data: existingComment, error: findError } = await supabaseAdmin
      .from('comments')
      .select('user_id')
      .eq('id', commentId)
      .maybeSingle();

    if (findError) {
      return res.status(500).json({
        success: false,
        message: findError.message,
      });
    }

    if (!existingComment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found.',
      });
    }

    /*
        Check ownership
        */
    if (existingComment.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can edit only your own comment.',
      });
    }

    /*
        Update comment
        */
    const { data, error } = await supabaseAdmin
      .from('comments')
      .update({
        content: content.trim(),
      })
      .eq('id', commentId)
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
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }

    res.json({
      success: true,
      message: 'Comment updated successfully.',
      comment: data,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Failed to update comment.',
    });
  }
});

/*
====================================================
DELETE COMMENT
DELETE /api/comments/:id
====================================================
*/
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const commentId = req.params.id;

    /*
        Find comment
        */
    const { data: existingComment, error: findError } = await supabaseAdmin
      .from('comments')
      .select('user_id')
      .eq('id', commentId)
      .maybeSingle();

    if (findError) {
      return res.status(500).json({
        success: false,
        message: findError.message,
      });
    }

    if (!existingComment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found.',
      });
    }

    /*
        Check ownership
        */
    if (existingComment.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can delete only your own comment.',
      });
    }

    /*
        Delete
        */
    const { error } = await supabaseAdmin
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }

    res.json({
      success: true,
      message: 'Comment deleted successfully.',
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Failed to delete comment.',
    });
  }
});

module.exports = router;
