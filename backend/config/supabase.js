const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

/* =========================================================
   ENVIRONMENT VARIABLES
   ========================================================= */

const supabaseUrl = process.env.SUPABASE_URL?.trim();

const supabasePublishableKey = process.env.SUPABASE_PUBLISHABLE_KEY?.trim();

const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

/* =========================================================
   VALIDATION
   ========================================================= */

if (!supabaseUrl) {
  throw new Error('SUPABASE_URL is missing in .env');
}

if (!supabasePublishableKey) {
  throw new Error('SUPABASE_PUBLISHABLE_KEY is missing in .env');
}

if (!supabaseServiceRoleKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is missing in .env');
}

/* =========================================================
   URL VALIDATION
   ========================================================= */

if (!supabaseUrl.startsWith('https://')) {
  throw new Error('SUPABASE_URL must start with https://');
}

/*
   SUPABASE_URL must be only the project URL.

   Correct:
   https://xxxxxxxx.supabase.co

   Incorrect:
   https://xxxxxxxx.supabase.co/rest/v1/
*/

if (supabaseUrl.includes('/rest/v1')) {
  throw new Error(
    'SUPABASE_URL must not contain /rest/v1/. Use only the Supabase Project URL.'
  );
}

/* =========================================================
   NORMAL SUPABASE CLIENT
   ========================================================= */

const supabase = createClient(supabaseUrl, supabasePublishableKey);

/* =========================================================
   SERVER ADMIN CLIENT
   ========================================================= */

/*
   This client uses the server-only secret key.

   NEVER send this key to frontend JavaScript.
*/

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/* =========================================================
   EXPORT
   ========================================================= */

module.exports = {
  supabase,
  supabaseAdmin,
};
