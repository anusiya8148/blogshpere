const { supabase } = require('../config/supabase');

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please login.',
      });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is missing.',
      });
    }

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired authentication token.',
      });
    }

    // Make the authenticated user available
    // to the route that follows.
    req.user = user;

    next();
  } catch (error) {
    console.error('Authentication error:', error);

    return res.status(500).json({
      success: false,
      message: 'Authentication failed.',
    });
  }
}

module.exports = authenticate;
