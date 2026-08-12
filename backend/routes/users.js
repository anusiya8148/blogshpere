const express = require('express');
const router = express.Router();

const { supabaseAdmin } = require('../config/supabase');
const authenticate = require('../middleware/auth');

/* =========================================================
   GET MY PROFILE
   GET /api/users/profile
   ========================================================= */

router.get('/profile', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .maybeSingle();

    if (error) {
      console.error('Get profile error:', error);

      return res.status(500).json({
        success: false,

        message: error.message,
      });
    }

    /*
     * Profile does not exist yet.
     *
     * Return Auth information so the
     * frontend can still work.
     */

    if (!data) {
      return res.json({
        success: true,

        profile: {
          id: req.user.id,

          name: req.user.user_metadata?.name || 'BlogSphere User',

          username:
            req.user.user_metadata?.username ||
            req.user.email?.split('@')[0] ||
            'user',

          bio: '',

          avatar_url: '',
        },
      });
    }

    res.json({
      success: true,

      profile: {
        ...data,

        /*
         * Email comes from Supabase Auth,
         * not the profiles table.
         */

        email: req.user.email || '',
      },
    });
  } catch (error) {
    console.error('Profile error:', error);

    res.status(500).json({
      success: false,

      message: 'Failed to fetch profile.',
    });
  }
});

/* =========================================================
   CREATE / SAVE PROFILE
   POST /api/users/profile
   ========================================================= */

router.post('/profile', authenticate, async (req, res) => {
  try {
    const {
      name,

      username,

      bio = '',

      avatar_url = '',
    } = req.body;

    /* ---------------------------------------------
               VALIDATION
               --------------------------------------------- */

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,

        message: 'Name is required.',
      });
    }

    if (!username || !username.trim()) {
      return res.status(400).json({
        success: false,

        message: 'Username is required.',
      });
    }

    /*
     * Clean username
     */

    const cleanUsername = username.trim().toLowerCase().replace(/\s+/g, '');

    /*
     * Validate username format
     */

    if (!/^[a-z0-9_.-]{3,30}$/.test(cleanUsername)) {
      return res.status(400).json({
        success: false,

        message:
          'Username must contain 3-30 letters, numbers, dots, underscores or hyphens.',
      });
    }

    /* ---------------------------------------------
               CHECK USERNAME
               --------------------------------------------- */

    const {
      data: existingUsername,

      error: usernameError,
    } = await supabaseAdmin

      .from('profiles')

      .select('id')

      .eq('username', cleanUsername)

      .neq('id', req.user.id)

      .maybeSingle();

    if (usernameError) {
      console.error('Username check error:', usernameError);

      return res.status(500).json({
        success: false,

        message: usernameError.message,
      });
    }

    if (existingUsername) {
      return res.status(409).json({
        success: false,

        message: 'Username is already taken.',
      });
    }

    /* ---------------------------------------------
               UPSERT PROFILE
               --------------------------------------------- */

    /*
     * IMPORTANT:
     *
     * We intentionally DO NOT insert:
     *
     * email
     *
     * because email belongs to
     * Supabase Auth.
     */

    const {
      data,

      error,
    } = await supabaseAdmin

      .from('profiles')

      .upsert(
        {
          id: req.user.id,

          name: name.trim(),

          username: cleanUsername,

          bio: String(bio || '').trim(),

          avatar_url: String(avatar_url || '').trim(),
        },

        {
          onConflict: 'id',
        }
      )

      .select()

      .single();

    if (error) {
      console.error('Save profile error:', error);

      return res.status(500).json({
        success: false,

        message: error.message,
      });
    }

    /* ---------------------------------------------
               SUCCESS
               --------------------------------------------- */

    res.status(201).json({
      success: true,

      message: 'Profile saved successfully.',

      profile: {
        ...data,

        email: req.user.email || '',
      },
    });
  } catch (error) {
    console.error('Create profile error:', error);

    res.status(500).json({
      success: false,

      message: 'Failed to save profile.',
    });
  }
});

/* =========================================================
   UPDATE MY PROFILE
   PUT /api/users/profile
   ========================================================= */

router.put('/profile', authenticate, async (req, res) => {
  try {
    const {
      name,

      username,

      bio = '',

      avatar_url = '',
    } = req.body;

    /* ---------------------------------------------
               VALIDATION
               --------------------------------------------- */

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,

        message: 'Name is required.',
      });
    }

    if (!username || !username.trim()) {
      return res.status(400).json({
        success: false,

        message: 'Username is required.',
      });
    }

    const cleanUsername = username.trim().toLowerCase().replace(/\s+/g, '');

    if (!/^[a-z0-9_.-]{3,30}$/.test(cleanUsername)) {
      return res.status(400).json({
        success: false,

        message: 'Invalid username format.',
      });
    }

    /* ---------------------------------------------
               CHECK USERNAME AVAILABILITY
               --------------------------------------------- */

    const {
      data: existingUsername,

      error: usernameError,
    } = await supabaseAdmin

      .from('profiles')

      .select('id')

      .eq('username', cleanUsername)

      .neq('id', req.user.id)

      .maybeSingle();

    if (usernameError) {
      return res.status(500).json({
        success: false,

        message: usernameError.message,
      });
    }

    if (existingUsername) {
      return res.status(409).json({
        success: false,

        message: 'Username is already taken.',
      });
    }

    /* ---------------------------------------------
               UPDATE
               --------------------------------------------- */

    const {
      data,

      error,
    } = await supabaseAdmin

      .from('profiles')

      .update({
        name: name.trim(),

        username: cleanUsername,

        bio: String(bio || '').trim(),

        avatar_url: String(avatar_url || '').trim(),
      })

      .eq('id', req.user.id)

      .select()

      .single();

    if (error) {
      console.error('Update profile error:', error);

      return res.status(500).json({
        success: false,

        message: error.message,
      });
    }

    res.json({
      success: true,

      message: 'Profile updated successfully.',

      profile: {
        ...data,

        email: req.user.email || '',
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);

    res.status(500).json({
      success: false,

      message: 'Failed to update profile.',
    });
  }
});

/* =========================================================
   GET PUBLIC PROFILE
   GET /api/users/:username
   ========================================================= */

router.get('/:username', async (req, res) => {
  try {
    const username = req.params.username.trim().toLowerCase();

    /* ---------------------------------------------
               GET PROFILE
               --------------------------------------------- */

    const {
      data: profile,

      error,
    } = await supabaseAdmin

      .from('profiles')

      .select(
        `
                    id,
                    name,
                    username,
                    bio,
                    avatar_url,
                    created_at
                    `
      )

      .eq('username', username)

      .maybeSingle();

    if (error) {
      console.error('Public profile error:', error);

      return res.status(500).json({
        success: false,

        message: error.message,
      });
    }

    if (!profile) {
      return res.status(404).json({
        success: false,

        message: 'User profile not found.',
      });
    }

    /* ---------------------------------------------
               GET PUBLISHED BLOGS
               --------------------------------------------- */

    const {
      data: blogs,

      error: blogsError,
    } = await supabaseAdmin

      .from('blogs')

      .select('*')

      .eq('user_id', profile.id)

      .eq('status', 'published')

      .order('created_at', {
        ascending: false,
      });

    if (blogsError) {
      return res.status(500).json({
        success: false,

        message: blogsError.message,
      });
    }

    /* ---------------------------------------------
               TOTAL VIEWS
               --------------------------------------------- */

    const totalViews = (blogs || []).reduce(
      (total, blog) => total + Number(blog.views || 0),

      0
    );

    /* ---------------------------------------------
               TOTAL LIKES
               --------------------------------------------- */

    let totalLikes = 0;

    for (const blog of blogs || []) {
      const { count } = await supabaseAdmin

        .from('likes')

        .select('*', {
          count: 'exact',
          head: true,
        })

        .eq('blog_id', blog.id);

      totalLikes += count || 0;
    }

    /* ---------------------------------------------
               RESPONSE
               --------------------------------------------- */

    res.json({
      success: true,

      profile,

      blogs: blogs || [],

      statistics: {
        blogs: blogs?.length || 0,

        views: totalViews,

        likes: totalLikes,
      },
    });
  } catch (error) {
    console.error('Public profile error:', error);

    res.status(500).json({
      success: false,

      message: 'Failed to fetch public profile.',
    });
  }
});

/* =========================================================
   EXPORT
   ========================================================= */

module.exports = router;
