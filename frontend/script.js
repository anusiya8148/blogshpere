/* =========================================================
   BLOGSPHERE - FRONTEND JAVASCRIPT
   ========================================================= */

'use strict';

/* =========================================================
   CONFIGURATION
   ========================================================= */

const API_BASE_URL = 'https://blogshpere-uhka.onrender.com/api';

/*
   Replace these with your Supabase project values.

   IMPORTANT:
   NEVER put the Supabase Service Role Key here.

   Frontend:
   - Project URL
   - Publishable / Anon Key
*/

const SUPABASE_URL = 'https://gkxhoofmruvxeijrutrn.supabase.co';
const SUPABASE_PUBLISHABLE_KEY =
  'sb_publishable_v7T6Sjnlp-g8Ad8lWiYvZA_XBdlEJ7U';

/* =========================================================
   GLOBAL STATE
   ========================================================= */

let supabaseClient = null;
let currentSession = null;
let currentUser = null;

/* =========================================================
   DOM HELPER
   ========================================================= */

function $(id) {
  return document.getElementById(id);
}

/* =========================================================
   HTML ESCAPE
   ========================================================= */

function escapeHTML(value = '') {
  return String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };

    return entities[character];
  });
}

/* =========================================================
   NOTIFICATION
   ========================================================= */

function showMessage(message) {
  alert(message);
}

/* =========================================================
   QUERY STRING
   ========================================================= */

function getQueryParameter(name) {
  const params = new URLSearchParams(window.location.search);

  return params.get(name);
}

/* =========================================================
   DATE FORMAT
   ========================================================= */

function formatDate(dateValue) {
  if (!dateValue) {
    return '';
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/* =========================================================
   READING TIME
   ========================================================= */

function calculateReadingTime(content = '') {
  const words = String(content).trim().split(/\s+/).filter(Boolean).length;

  return Math.max(1, Math.ceil(words / 200));
}

/* =========================================================
   AUTH TOKEN
   ========================================================= */

function getAccessToken() {
  return currentSession?.access_token || '';
}

/* =========================================================
   LOAD SUPABASE LIBRARY
   ========================================================= */

function loadSupabaseLibrary() {
  return new Promise((resolve, reject) => {
    if (window.supabase) {
      resolve();
      return;
    }

    const existingScript = document.querySelector(
      'script[data-supabase-library="true"]'
    );

    if (existingScript) {
      existingScript.addEventListener('load', resolve);

      existingScript.addEventListener('error', () => {
        reject(new Error('Unable to load Supabase library.'));
      });

      return;
    }

    const script = document.createElement('script');

    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';

    script.async = true;

    script.dataset.supabaseLibrary = 'true';

    script.onload = () => resolve();

    script.onerror = () => {
      reject(new Error('Unable to load Supabase library.'));
    };

    document.head.appendChild(script);
  });
}

/* =========================================================
   INITIALIZE SUPABASE
   ========================================================= */

async function initializeSupabase() {
  if (
    SUPABASE_URL === 'YOUR_SUPABASE_URL' ||
    SUPABASE_PUBLISHABLE_KEY === 'YOUR_SUPABASE_PUBLISHABLE_KEY'
  ) {
    console.warn('Supabase credentials are not configured.');

    return null;
  }

  await loadSupabaseLibrary();

  if (!supabaseClient) {
    supabaseClient = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY
    );
  }

  try {
    const { data, error } = await supabaseClient.auth.getSession();

    if (error) {
      console.error(error);
    }

    currentSession = data?.session || null;

    currentUser = currentSession?.user || null;
  } catch (error) {
    console.error('Session error:', error);
  }

  /*
       Listen for authentication changes.
    */

  if (!window.__blogSphereAuthListener) {
    supabaseClient.auth.onAuthStateChange((_event, session) => {
      currentSession = session || null;

      currentUser = session?.user || null;

      updateNavigation();
    });

    window.__blogSphereAuthListener = true;
  }

  return supabaseClient;
}

/* =========================================================
   API REQUEST HELPER
   ========================================================= */

async function apiRequest(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  /*
       Add authentication token.
    */

  const token = getAccessToken();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;

  try {
    response = await fetch(API_BASE_URL + endpoint, {
      ...options,
      headers,
    });
  } catch (error) {
    throw new Error(
      'Cannot connect to backend. Make sure your Node.js server is running on port 5000.'
    );
  }

  /*
       Read response safely.
    */

  const contentType = response.headers.get('content-type') || '';

  let data = {};

  if (contentType.includes('application/json')) {
    data = await response.json().catch(() => ({}));
  } else {
    const text = await response.text().catch(() => '');

    data = {
      message: text,
    };
  }

  if (!response.ok) {
    throw new Error(
      data.message || data.error || `Request failed (${response.status})`
    );
  }

  return data;
}

/* =========================================================
   UPDATE NAVIGATION
   ========================================================= */

function updateNavigation() {
  const navigation = $('navActions');

  if (!navigation) {
    return;
  }

  if (currentUser) {
    navigation.innerHTML = `

            <a
                class="login-link"
                href="dashboard.html"
            >
                Dashboard
            </a>

            <a
                class="btn primary"
                href="create-blog.html"
            >
                Create Blog
            </a>

        `;
  } else {
    navigation.innerHTML = `

            <a
                class="login-link"
                href="login.html"
            >
                Login
            </a>

            <a
                class="btn primary"
                href="register.html"
            >
                Get Started
            </a>

        `;
  }
}

/* =========================================================
   LOGIN REQUIRED
   ========================================================= */

function requireLogin() {
  if (!currentUser) {
    window.location.href = 'login.html';

    return false;
  }

  return true;
}

/* =========================================================
   LOGIN
   ========================================================= */

function initializeLoginPage() {
  const form = $('loginForm');

  if (!form) {
    return;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = $('loginEmail')?.value.trim();

    const password = $('loginPassword')?.value || '';

    if (!email || !password) {
      showMessage('Please enter your email and password.');

      return;
    }

    try {
      const supabase = await initializeSupabase();

      if (!supabase) {
        showMessage(
          'Please configure your Supabase URL and Publishable Key in script.js.'
        );

        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      currentSession = data.session;

      currentUser = data.user;

      window.location.href = 'dashboard.html';
    } catch (error) {
      console.error('Login error:', error);

      showMessage(error.message || 'Login failed.');
    }
  });
}

/* =========================================================
   REGISTER
   ========================================================= */

function initializeRegisterPage() {
  const form = $('registerForm');

  if (!form) {
    return;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const name = $('registerName')?.value.trim();

    const username = $('registerUsername')?.value.trim();

    const email = $('registerEmail')?.value.trim();

    const password = $('registerPassword')?.value || '';

    const confirmPassword = $('confirmPassword')?.value || '';

    const terms = $('terms');

    /*
               Required validation.
            */

    if (!name || !username || !email || !password || !confirmPassword) {
      showMessage('Please fill all required fields.');

      return;
    }

    /*
               Username validation.
            */

    if (!/^[a-zA-Z0-9_.-]{3,30}$/.test(username)) {
      showMessage(
        'Username must contain 3-30 characters and only letters, numbers, _, . or -.'
      );

      return;
    }

    /*
               Email validation.
            */

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      showMessage('Please enter a valid email address.');

      return;
    }

    /*
               Password validation.
            */

    if (password.length < 6) {
      showMessage('Password must contain at least 6 characters.');

      return;
    }

    if (password !== confirmPassword) {
      showMessage('Passwords do not match.');

      return;
    }

    /*
               Terms validation.
            */

    if (terms && !terms.checked) {
      showMessage('Please accept the terms before creating your account.');

      return;
    }

    try {
      const supabase = await initializeSupabase();

      if (!supabase) {
        showMessage('Please configure Supabase first.');

        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,

        password,

        options: {
          data: {
            name,
            username,
          },
        },
      });

      if (error) {
        throw error;
      }

      /*
                   Email confirmation disabled.
                */

      if (data.session) {
        currentSession = data.session;

        currentUser = data.user;

        await saveUserProfile(name, username);

        showMessage('Account created successfully!');

        window.location.href = 'dashboard.html';

        return;
      }

      /*
                   Email confirmation enabled.
                */

      showMessage(
        'Account created successfully. Please verify your email and then login.'
      );

      window.location.href = 'login.html';
    } catch (error) {
      console.error('Registration error:', error);

      showMessage(error.message || 'Registration failed.');
    }
  });
}

/* =========================================================
   SAVE USER PROFILE
   ========================================================= */

async function saveUserProfile(name, username) {
  try {
    const response = await apiRequest('/users/profile', {
      method: 'POST',

      body: JSON.stringify({
        name,
        username,
        bio: '',
        avatar_url: '',
      }),
    });

    console.log('Profile created successfully:', response);

    return response;
  } catch (error) {
    console.error('Profile creation error:', error);

    // Important: send the real error back
    // to the registration function.
    throw error;
  }
}

/* =========================================================
   HOME PAGE
   ========================================================= */

async function initializeHomePage() {
  const storyCount = $('storyCount');

  if (!storyCount) {
    return;
  }

  try {
    const response = await apiRequest('/blogs');

    const blogs = response.blogs || [];

    storyCount.textContent = blogs.length;
  } catch (error) {
    console.error('Home page error:', error);

    storyCount.textContent = '0';
  }
}

/* =========================================================
   BLOG CARD
   ========================================================= */

function createBlogCard(blog, owner = false) {
  const cover = blog.cover_image
    ? `
                <img
                    src="${escapeHTML(blog.cover_image)}"
                    alt="${escapeHTML(blog.title)}"
                    loading="lazy"
                >
              `
    : `
                <span>✦</span>
              `;

  const author =
    blog.profiles?.name || blog.author_name || 'BlogSphere Creator';

  const likeCount = Number(blog.like_count || 0);

  const commentCount = Number(blog.comment_count || 0);

  const views = Number(blog.views || 0);

  let actions = '';

  if (owner) {
    actions = `

            <div class="card-actions">

                <a
                    class="mini"
                    href="blog.html?id=${encodeURIComponent(blog.id)}"
                >
                    View
                </a>

                <a
                    class="mini"
                    href="edit-blog.html?id=${encodeURIComponent(blog.id)}"
                >
                    Edit
                </a>

                <button
                    type="button"
                    class="mini"
                    onclick="deleteBlog('${escapeHTML(blog.id)}')"
                >
                    Delete
                </button>

            </div>

        `;
  } else {
    actions = `

            <div class="card-actions">

                <button
                    type="button"
                    class="mini ${blog.liked ? 'active' : ''}"
                    onclick="toggleLike('${escapeHTML(blog.id)}')"
                >
                    ❤️ ${likeCount}
                </button>

                <button
                    type="button"
                    class="mini ${blog.bookmarked ? 'active' : ''}"
                    onclick="toggleBookmark('${escapeHTML(blog.id)}')"
                >
                    🔖 Save
                </button>

            </div>

        `;
  }

  const preview = String(blog.content || '')
    .replace(/\s+/g, ' ')
    .trim();

  return `

        <article class="blog-card">

            <a
                class="blog-cover"
                href="blog.html?id=${encodeURIComponent(blog.id)}"
            >
                ${cover}
            </a>


            <div class="blog-body">

                <span class="pill">
                    ${escapeHTML(blog.category || 'General')}
                </span>


                <h3>

                    <a
                        href="blog.html?id=${encodeURIComponent(blog.id)}"
                    >
                        ${escapeHTML(blog.title)}
                    </a>

                </h3>


                <p>
                    ${escapeHTML(
                      preview.length > 180
                        ? preview.substring(0, 180) + '...'
                        : preview
                    )}
                </p>


                <div class="meta">

                    <span>
                        ✍
                        ${escapeHTML(author)}
                    </span>

                    <span>
                        ${calculateReadingTime(blog.content)}
                        min read
                    </span>

                </div>


                <div class="meta">

                    <span>
                        ❤️ ${likeCount}
                        ·
                        💬 ${commentCount}
                    </span>

                    <span>
                        👁 ${views}
                    </span>

                </div>


                ${actions}

            </div>

        </article>

    `;
}

/* =========================================================
   EXPLORE PAGE
   ========================================================= */

async function initializeExplorePage() {
  const container = $('blogsContainer');

  if (!container) {
    return;
  }

  try {
    const response = await apiRequest('/blogs');

    const blogs = response.blogs || [];

    const searchInput = $('searchInput');

    const categoryFilter = $('categoryFilter');

    /*
           Read category from URL.
        */

    const urlCategory = getQueryParameter('category');

    if (urlCategory && categoryFilter) {
      categoryFilter.value = decodeURIComponent(urlCategory);
    }

    function renderBlogs() {
      const search = searchInput?.value.toLowerCase().trim() || '';

      const category = categoryFilter?.value || '';

      const filtered = blogs.filter((blog) => {
        const tags = Array.isArray(blog.tags)
          ? blog.tags.join(' ')
          : String(blog.tags || '');

        const searchableText = `

                            ${blog.title || ''}

                            ${blog.content || ''}

                            ${tags}

                            ${blog.category || ''}

                        `.toLowerCase();

        const matchesSearch = !search || searchableText.includes(search);

        const matchesCategory = !category || blog.category === category;

        return matchesSearch && matchesCategory;
      });

      if (!filtered.length) {
        container.innerHTML = `

                    <div class="empty">

                        No stories found.

                        <br><br>

                        Try another search or category.

                    </div>

                `;

        return;
      }

      container.innerHTML = filtered
        .map((blog) => createBlogCard(blog))
        .join('');
    }

    searchInput?.addEventListener('input', renderBlogs);

    categoryFilter?.addEventListener('change', renderBlogs);

    renderBlogs();
  } catch (error) {
    console.error('Explore error:', error);

    container.innerHTML = `

            <div class="empty">

                ${escapeHTML(error.message)}

            </div>

        `;
  }
}

/* =========================================================
   CREATE BLOG
   ========================================================= */

async function initializeCreateBlogPage() {
  const form = $('blogForm');

  if (!form) {
    return;
  }

  if (!requireLogin()) {
    return;
  }

  loadDraft();

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const title = $('blogTitle')?.value.trim();

    const category = $('blogCategory')?.value;

    const content = $('blogContent')?.value.trim();

    if (!title || !category || !content) {
      showMessage('Please enter title, category and story content.');

      return;
    }

    if (title.length < 3) {
      showMessage('Blog title must contain at least 3 characters.');

      return;
    }

    if (content.length < 20) {
      showMessage('Your story should contain at least 20 characters.');

      return;
    }

    try {
      let coverImage = '';

      /*
                   Upload image.
                */

      const file = $('blogImage')?.files?.[0];

      if (file) {
        coverImage = await uploadBlogImage(file);
      }

      const tags = ($('blogTags')?.value || '')
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);

      const payload = {
        title,

        category,

        tags,

        content,

        cover_image: coverImage,

        status: 'published',
      };

      await apiRequest('/blogs', {
        method: 'POST',

        body: JSON.stringify(payload),
      });

      localStorage.removeItem('blogsphereDraft');

      showMessage('Blog published successfully! 🚀');

      window.location.href = 'dashboard.html';
    } catch (error) {
      console.error('Create blog error:', error);

      showMessage(error.message || 'Unable to publish blog.');
    }
  });
}

/* =========================================================
   SAVE DRAFT
   ========================================================= */

function saveDraft() {
  const draft = {
    title: $('blogTitle')?.value || '',

    category: $('blogCategory')?.value || '',

    tags: $('blogTags')?.value || '',

    content: $('blogContent')?.value || '',
  };

  localStorage.setItem('blogsphereDraft', JSON.stringify(draft));

  showMessage('Draft saved successfully.');
}

/* =========================================================
   LOAD DRAFT
   ========================================================= */

function loadDraft() {
  const saved = localStorage.getItem('blogsphereDraft');

  if (!saved) {
    return;
  }

  try {
    const draft = JSON.parse(saved);

    if ($('blogTitle')) {
      $('blogTitle').value = draft.title || '';
    }

    if ($('blogCategory')) {
      $('blogCategory').value = draft.category || '';
    }

    if ($('blogTags')) {
      $('blogTags').value = draft.tags || '';
    }

    if ($('blogContent')) {
      $('blogContent').value = draft.content || '';
    }

    const counter = $('contentCounter');

    if (counter) {
      counter.textContent = `${(draft.content || '').length} / 30000`;
    }
  } catch (error) {
    console.error('Draft loading error:', error);
  }
}

/* =========================================================
   UPLOAD BLOG IMAGE
   ========================================================= */

async function uploadBlogImage(file) {
  if (!file) {
    return '';
  }

  if (!file.type.startsWith('image/')) {
    throw new Error('Please select a valid image file.');
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Image size must be less than 5 MB.');
  }

  const supabase = await initializeSupabase();

  if (!supabase || !currentUser) {
    throw new Error('You must be logged in and Supabase must be configured.');
  }

  const originalName = file.name || 'image.jpg';

  const extension = originalName.split('.').pop().toLowerCase();

  const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];

  if (!allowedExtensions.includes(extension)) {
    throw new Error('Only JPG, JPEG, PNG and WEBP images are allowed.');
  }

  const filePath =
    `${currentUser.id}/` +
    `${Date.now()}-` +
    `${Math.random().toString(36).slice(2)}.` +
    extension;

  const { error } = await supabase.storage
    .from('blog-images')
    .upload(filePath, file, {
      upsert: false,
      contentType: file.type,
    });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage.from('blog-images').getPublicUrl(filePath);

  if (!data?.publicUrl) {
    throw new Error('Unable to generate image URL.');
  }

  return data.publicUrl;
}

/* =========================================================
   DASHBOARD
   ========================================================= */

async function initializeDashboardPage() {
  const dashboardName = $('dashboardName');

  if (!dashboardName) {
    return;
  }

  if (!requireLogin()) {
    return;
  }

  try {
    const profileResponse = await apiRequest('/users/profile');

    const profile = profileResponse.profile;

    dashboardName.textContent =
      profile?.name || currentUser?.user_metadata?.name || 'Creator';

    const blogsResponse = await apiRequest('/blogs/mine');

    const blogs = blogsResponse.blogs || [];

    let totalViews = 0;
    let totalLikes = 0;
    let totalComments = 0;

    blogs.forEach((blog) => {
      totalViews += Number(blog.views || 0);

      totalLikes += Number(blog.like_count || 0);

      totalComments += Number(blog.comment_count || 0);
    });

    if ($('statBlogs')) {
      $('statBlogs').textContent = blogs.length;
    }

    if ($('statViews')) {
      $('statViews').textContent = totalViews;
    }

    if ($('statLikes')) {
      $('statLikes').textContent = totalLikes;
    }

    if ($('statComments')) {
      $('statComments').textContent = totalComments;
    }

    const container = $('myBlogs');

    if (!container) {
      return;
    }

    if (!blogs.length) {
      container.innerHTML = `

                <div class="empty">

                    You haven't published
                    any blogs yet.

                    <br><br>

                    <a
                        class="btn primary"
                        href="create-blog.html"
                    >
                        Create Your First Blog
                    </a>

                </div>

            `;

      return;
    }

    container.innerHTML = blogs
      .map((blog) => createBlogCard(blog, true))
      .join('');
  } catch (error) {
    console.error('Dashboard error:', error);

    showMessage(error.message || 'Unable to load dashboard.');
  }
}

/* =========================================================
   DELETE BLOG
   ========================================================= */

async function deleteBlog(blogId) {
  if (!blogId) {
    return;
  }

  const confirmed = confirm('Are you sure you want to delete this blog?');

  if (!confirmed) {
    return;
  }

  try {
    await apiRequest(`/blogs/${encodeURIComponent(blogId)}`, {
      method: 'DELETE',
    });

    showMessage('Blog deleted successfully.');

    window.location.reload();
  } catch (error) {
    console.error('Delete blog error:', error);

    showMessage(error.message || 'Unable to delete blog.');
  }
}

/* =========================================================
   EDIT BLOG
   ========================================================= */

async function initializeEditBlogPage() {
  const form = $('editBlogForm');

  if (!form) {
    return;
  }

  if (!requireLogin()) {
    return;
  }

  const blogId = getQueryParameter('id');

  if (!blogId) {
    window.location.href = 'dashboard.html';

    return;
  }

  try {
    const response = await apiRequest(`/blogs/${encodeURIComponent(blogId)}`);

    const blog = response.blog;

    if (!blog) {
      throw new Error('Blog not found.');
    }

    $('editBlogId').value = blog.id;

    $('editTitle').value = blog.title || '';

    $('editCategory').value = blog.category || '';

    $('editTags').value = Array.isArray(blog.tags)
      ? blog.tags.join(', ')
      : blog.tags || '';

    $('editContent').value = blog.content || '';

    /*
           Show current cover image.
        */

    if (blog.cover_image && $('currentImageContainer') && $('currentImage')) {
      $('currentImage').src = blog.cover_image;

      $('currentImageContainer').style.display = 'block';
    }

    const counter = $('editContentCounter');

    if (counter) {
      counter.textContent = `${(blog.content || '').length} / 30000`;
    }

    /*
           Submit update.
        */

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const title = $('editTitle')?.value.trim();

      const category = $('editCategory')?.value;

      const content = $('editContent')?.value.trim();

      if (!title || !category || !content) {
        showMessage('Please fill all required fields.');

        return;
      }

      try {
        /*
                       Keep existing image by default.
                    */

        let coverImage = blog.cover_image || '';

        /*
                       Upload replacement image
                       if user selected one.
                    */

        const file = $('editBlogImage')?.files?.[0];

        if (file) {
          coverImage = await uploadBlogImage(file);
        }

        const tags = ($('editTags')?.value || '')
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean);

        await apiRequest(`/blogs/${encodeURIComponent(blogId)}`, {
          method: 'PUT',

          body: JSON.stringify({
            title,

            category,

            tags,

            content,

            cover_image: coverImage,

            status: 'published',
          }),
        });

        showMessage('Blog updated successfully! 🚀');

        window.location.href = 'dashboard.html';
      } catch (error) {
        console.error('Update blog error:', error);

        showMessage(error.message || 'Unable to update blog.');
      }
    });
  } catch (error) {
    console.error('Load edit blog error:', error);

    showMessage(error.message || 'Unable to load blog.');

    window.location.href = 'dashboard.html';
  }
}

/* =========================================================
   DELETE CURRENT BLOG
   ========================================================= */

async function deleteCurrentBlog() {
  const blogId = $('editBlogId')?.value;

  if (!blogId) {
    return;
  }

  const confirmed = confirm('Delete this blog permanently?');

  if (!confirmed) {
    return;
  }

  try {
    await apiRequest(`/blogs/${encodeURIComponent(blogId)}`, {
      method: 'DELETE',
    });

    showMessage('Blog deleted successfully.');

    window.location.href = 'dashboard.html';
  } catch (error) {
    console.error('Delete current blog error:', error);

    showMessage(error.message || 'Unable to delete blog.');
  }
}

/* =========================================================
   SAVED BLOGS
   ========================================================= */

async function initializeSavedPage() {
  const container = $('savedBlogs');

  if (!container) {
    return;
  }

  if (!requireLogin()) {
    return;
  }

  try {
    const response = await apiRequest('/bookmarks/mine');

    const blogs = response.blogs || [];

    if (!blogs.length) {
      container.innerHTML = `

                <div class="empty">

                    No saved blogs yet.

                    <br><br>

                    Explore stories and save
                    your favorites.

                    <br><br>

                    <a
                        href="explore.html"
                        class="btn primary"
                    >
                        Explore Stories
                    </a>

                </div>

            `;

      return;
    }

    container.innerHTML = blogs.map((blog) => createBlogCard(blog)).join('');
  } catch (error) {
    console.error('Saved blogs error:', error);

    container.innerHTML = `

            <div class="empty">

                ${escapeHTML(error.message)}

            </div>

        `;
  }
}

/* =========================================================
   PROFILE PAGE
   ========================================================= */

async function initializeProfilePage() {
  const profileName = $('profileName');

  if (!profileName) {
    return;
  }

  if (!requireLogin()) {
    return;
  }

  try {
    const profileResponse = await apiRequest('/users/profile');

    const profile = profileResponse.profile || {};

    const blogsResponse = await apiRequest('/blogs/mine');

    const blogs = blogsResponse.blogs || [];

    const totalViews = blogs.reduce(
      (total, blog) => total + Number(blog.views || 0),
      0
    );

    const totalLikes = blogs.reduce(
      (total, blog) => total + Number(blog.like_count || 0),
      0
    );

    const name =
      profile.name || currentUser?.user_metadata?.name || 'BlogSphere User';

    const username =
      profile.username || currentUser?.user_metadata?.username || 'user';

    const email = profile.email || currentUser?.email || '';

    const bio = profile.bio || 'BlogSphere creator';

    $('profileName').textContent = name;

    $('profileUsername').textContent = `@${username}`;

    if ($('profileEmail')) {
      $('profileEmail').textContent = email;
    }

    $('profileBio').textContent = bio;

    if ($('profileAvatar')) {
      $('profileAvatar').textContent = name.charAt(0).toUpperCase();
    }

    if ($('profileBlogs')) {
      $('profileBlogs').textContent = blogs.length;
    }

    if ($('profileViews')) {
      $('profileViews').textContent = totalViews;
    }

    if ($('profileLikes')) {
      $('profileLikes').textContent = totalLikes;
    }
  } catch (error) {
    console.error('Profile error:', error);

    showMessage(error.message || 'Unable to load profile.');
  }
}

/* =========================================================
   BLOG DETAILS
   ========================================================= */

async function initializeBlogPage() {
  const container = $('blogDetails');

  if (!container) {
    return;
  }

  const blogId = getQueryParameter('id');

  if (!blogId) {
    container.innerHTML = `

            <div class="empty">

                Blog ID is missing.

                <br><br>

                <a
                    href="explore.html"
                    class="btn primary"
                >
                    Explore Stories
                </a>

            </div>

        `;

    return;
  }

  try {
    const response = await apiRequest(`/blogs/${encodeURIComponent(blogId)}`);

    const blog = response.blog;

    if (!blog) {
      throw new Error('Blog not found.');
    }

    let comments = [];

    try {
      const commentsResponse = await apiRequest(
        `/comments/blog/${encodeURIComponent(blogId)}`
      );

      comments = commentsResponse.comments || [];
    } catch (commentError) {
      console.warn('Comments could not be loaded:', commentError);
    }

    const cover = blog.cover_image
      ? `
                    <img
                        src="${escapeHTML(blog.cover_image)}"
                        alt="${escapeHTML(blog.title)}"
                    >
                  `
      : `
                    <div class="article-placeholder">
                        ✦
                    </div>
                  `;

    const safeContent = escapeHTML(blog.content || '').replace(/\n/g, '<br>');

    container.innerHTML = `

            <article class="article">

                <div class="article-cover">

                    ${cover}

                </div>


                <div class="article-body">

                    <span class="pill">

                        ${escapeHTML(blog.category || 'General')}

                    </span>


                    <h1>

                        ${escapeHTML(blog.title)}

                    </h1>


                    <div class="meta">

                        <span>

                            By
                            ${escapeHTML(
                              blog.profiles?.name ||
                                blog.author_name ||
                                'BlogSphere Creator'
                            )}

                        </span>


                        <span>

                            ${formatDate(blog.created_at)}

                            ·

                            ${calculateReadingTime(blog.content)}

                            min read

                            ·

                            👁
                            ${Number(blog.views || 0)}

                        </span>

                    </div>


                    <div class="article-actions">

                        <button
                            type="button"
                            id="articleLikeButton"
                            class="mini ${blog.liked ? 'active' : ''}"
                            onclick="toggleLike(
                                '${escapeHTML(blog.id)}',
                                true
                            )"
                        >

                            ❤️
                            ${Number(blog.like_count || 0)}

                        </button>


                        <button
                            type="button"
                            id="articleBookmarkButton"
                            class="mini ${blog.bookmarked ? 'active' : ''}"
                            onclick="toggleBookmark(
                                '${escapeHTML(blog.id)}',
                                true
                            )"
                        >

                            🔖
                            ${blog.bookmarked ? 'Saved' : 'Save'}

                        </button>


                        <button
                            type="button"
                            class="mini"
                            onclick="shareBlog()"
                        >

                            ↗ Share

                        </button>

                    </div>


                    <div class="article-content">

                        ${safeContent}

                    </div>


                    <section class="comments">

                        <h2>
                            Comments
                        </h2>


                        <div
                            id="commentFormContainer"
                        ></div>


                        <div
                            id="commentsList"
                        >

                            ${renderComments(comments)}

                        </div>

                    </section>

                </div>

            </article>

        `;

    initializeCommentForm(blogId);
  } catch (error) {
    console.error('Blog details error:', error);

    container.innerHTML = `

            <div class="empty">

                ${escapeHTML(error.message)}

                <br><br>

                <a
                    href="explore.html"
                    class="btn primary"
                >
                    Back to Explore
                </a>

            </div>

        `;
  }
}

/* =========================================================
   RENDER COMMENTS
   ========================================================= */

function renderComments(comments) {
  if (!Array.isArray(comments) || !comments.length) {
    return `

            <div class="empty">

                No comments yet.

                <br>

                Be the first to share your thoughts!

            </div>

        `;
  }

  return comments
    .map(
      (comment) => `

                <div class="comment">

                    <b>

                        ${escapeHTML(
                          comment.profiles?.name ||
                            comment.author_name ||
                            'BlogSphere User'
                        )}

                    </b>


                    <p>

                        ${escapeHTML(comment.content)}

                    </p>


                    <small>

                        ${formatDate(comment.created_at)}

                    </small>

                </div>

            `
    )
    .join('');
}

/* =========================================================
   COMMENT FORM
   ========================================================= */

function initializeCommentForm(blogId) {
  const container = $('commentFormContainer');

  if (!container) {
    return;
  }

  if (!currentUser) {
    container.innerHTML = `

            <p>

                <a
                    href="login.html"
                    style="
                        color:#635bff;
                        font-weight:800;
                    "
                >
                    Login
                </a>

                to leave a comment.

            </p>

        `;

    return;
  }

  container.innerHTML = `

        <form
            id="commentForm"
            class="comment-form"
        >

            <input
                id="commentText"
                type="text"
                placeholder="Write a comment..."
                maxlength="1000"
                required
            >


            <button
                class="btn primary"
                type="submit"
            >
                Post
            </button>

        </form>

    `;

  const commentForm = $('commentForm');

  commentForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const input = $('commentText');

    const content = input?.value.trim();

    if (!content) {
      return;
    }

    try {
      await apiRequest('/comments', {
        method: 'POST',

        body: JSON.stringify({
          blog_id: blogId,

          content,
        }),
      });

      showMessage('Comment added successfully.');

      window.location.reload();
    } catch (error) {
      console.error('Comment error:', error);

      showMessage(error.message || 'Unable to add comment.');
    }
  });
}

/* =========================================================
   LIKE
   ========================================================= */

async function toggleLike(blogId, reload = false) {
  if (!requireLogin()) {
    return;
  }

  if (!blogId) {
    return;
  }

  try {
    await apiRequest(`/likes/${encodeURIComponent(blogId)}/toggle`, {
      method: 'POST',
    });

    if (reload) {
      window.location.reload();

      return;
    }

    window.location.reload();
  } catch (error) {
    console.error('Like error:', error);

    showMessage(error.message || 'Unable to update like.');
  }
}

/* =========================================================
   BOOKMARK
   ========================================================= */

async function toggleBookmark(blogId, reload = false) {
  if (!requireLogin()) {
    return;
  }

  if (!blogId) {
    return;
  }

  try {
    await apiRequest(`/bookmarks/${encodeURIComponent(blogId)}/toggle`, {
      method: 'POST',
    });

    if (reload) {
      window.location.reload();

      return;
    }

    window.location.reload();
  } catch (error) {
    console.error('Bookmark error:', error);

    showMessage(error.message || 'Unable to update bookmark.');
  }
}

/* =========================================================
   SHARE BLOG
   ========================================================= */

async function shareBlog() {
  try {
    const url = window.location.href;

    if (navigator.share) {
      await navigator.share({
        title: document.title,

        url,
      });

      return;
    }

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);

      showMessage('Blog link copied!');

      return;
    }

    showMessage('Copy this page URL to share the blog.');
  } catch (error) {
    /*
           User may cancel native share.
        */

    if (error?.name !== 'AbortError') {
      console.error('Share error:', error);
    }
  }
}

/* =========================================================
   LOGOUT
   ========================================================= */

async function logout() {
  try {
    const supabase = await initializeSupabase();

    if (supabase) {
      await supabase.auth.signOut();
    }

    currentSession = null;

    currentUser = null;

    window.location.href = 'index.html';
  } catch (error) {
    console.error('Logout error:', error);

    window.location.href = 'index.html';
  }
}

/* =========================================================
   PAGE INITIALIZER
   ========================================================= */

async function initializePage() {
  /*
       Initialize Supabase first.
    */

  try {
    await initializeSupabase();
  } catch (error) {
    console.error('Supabase initialization error:', error);
  }

  /*
       Update navigation.
    */

  updateNavigation();

  /*
       Detect current page.
    */

  const page = window.location.pathname.split('/').pop().toLowerCase();

  /*
       HOME
    */

  if (page === '' || page === 'index.html') {
    await initializeHomePage();
  }

  /*
       EXPLORE
    */

  if (page === 'explore.html') {
    await initializeExplorePage();
  }

  /*
       LOGIN
    */

  if (page === 'login.html') {
    initializeLoginPage();
  }

  /*
       REGISTER
    */

  if (page === 'register.html') {
    initializeRegisterPage();
  }

  /*
       DASHBOARD
    */

  if (page === 'dashboard.html') {
    await initializeDashboardPage();
  }

  /*
       CREATE BLOG
    */

  if (page === 'create-blog.html') {
    await initializeCreateBlogPage();
  }

  /*
       EDIT BLOG
    */

  if (page === 'edit-blog.html') {
    await initializeEditBlogPage();
  }

  /*
       SAVED BLOGS
    */

  if (page === 'saved.html') {
    await initializeSavedPage();
  }

  /*
       PROFILE
    */

  if (page === 'profile.html') {
    await initializeProfilePage();
  }

  /*
       BLOG DETAILS
    */

  if (page === 'blog.html') {
    await initializeBlogPage();
  }

  /*
       CATEGORIES

       No special initialization is needed.
       Category links already contain query parameters.
    */

  if (page === 'categories.html') {
    // Nothing required.
  }
}

/* =========================================================
   START APPLICATION
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
  initializePage().catch((error) => {
    console.error('BlogSphere initialization error:', error);
  });
});
