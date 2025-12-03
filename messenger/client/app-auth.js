/**
 * Messenger Client Application - Authentication Module
 *
 * Handles user authentication (login/register)
 */

// ===== Authentication State =====
const authState = {
  user: null,
  sessionToken: null
};

// ===== DOM Elements =====
const authElements = {
  authScreen: document.getElementById('auth-screen'),
  roomScreen: document.getElementById('room-screen'),
  loginForm: document.getElementById('login-form'),
  registerForm: document.getElementById('register-form'),
  authTitle: document.getElementById('auth-title'),
  authSubtitle: document.getElementById('auth-subtitle'),
  authToggleText: document.getElementById('auth-toggle-text'),
  authToggleLink: document.getElementById('auth-toggle-link'),
  authError: document.getElementById('auth-error'),
  welcomeUsername: document.getElementById('welcome-username'),
  logoutBtn: document.getElementById('logout-btn')
};

// ===== Initialization =====
export function initAuth() {
  setupAuthEventListeners();
  checkExistingSession();
}

// ===== Event Listeners =====
function setupAuthEventListeners() {
  // Login form
  authElements.loginForm.addEventListener('submit', handleLogin);

  // Register form
  authElements.registerForm.addEventListener('submit', handleRegister);

  // Toggle between login and register
  authElements.authToggleLink.addEventListener('click', (e) => {
    e.preventDefault();
    toggleAuthMode();
  });

  // Logout button
  authElements.logoutBtn.addEventListener('click', handleLogout);
}

// ===== Authentication Functions =====

/**
 * Check if user has existing session in localStorage
 */
async function checkExistingSession() {
  const sessionToken = localStorage.getItem('sessionToken');
  const username = localStorage.getItem('username');

  if (sessionToken && username) {
    // Validate session with server
    try {
      const response = await fetch('/api/validate-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sessionToken })
      });

      const data = await response.json();

      if (data.success) {
        authState.user = data.user;
        authState.sessionToken = sessionToken;
        showRoomScreen();
      } else {
        // Invalid session, clear storage
        localStorage.removeItem('sessionToken');
        localStorage.removeItem('username');
      }
    } catch (error) {
      console.error('Session validation error:', error);
    }
  }
}

/**
 * Handle login form submission
 */
async function handleLogin(e) {
  e.preventDefault();

  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;

  if (!username || !password) {
    showAuthError('Please enter username and password');
    return;
  }

  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (data.success) {
      // Save session
      authState.user = data.user;
      authState.sessionToken = data.sessionToken;
      localStorage.setItem('sessionToken', data.sessionToken);
      localStorage.setItem('username', data.user.username);

      hideAuthError();
      showRoomScreen();
    } else {
      showAuthError(data.error || 'Login failed');
    }
  } catch (error) {
    console.error('Login error:', error);
    showAuthError('Network error. Please try again.');
  }
}

/**
 * Handle register form submission
 */
async function handleRegister(e) {
  e.preventDefault();

  const username = document.getElementById('register-username').value.trim();
  const password = document.getElementById('register-password').value;
  const passwordConfirm = document.getElementById('register-password-confirm').value;

  // Validation
  if (!username || !password || !passwordConfirm) {
    showAuthError('Please fill in all fields');
    return;
  }

  if (username.length < 3) {
    showAuthError('Username must be at least 3 characters');
    return;
  }

  if (password.length < 6) {
    showAuthError('Password must be at least 6 characters');
    return;
  }

  if (password !== passwordConfirm) {
    showAuthError('Passwords do not match');
    return;
  }

  try {
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (data.success) {
      // Auto-login after registration
      await autoLogin(username, password);
    } else {
      showAuthError(data.error || 'Registration failed');
    }
  } catch (error) {
    console.error('Registration error:', error);
    showAuthError('Network error. Please try again.');
  }
}

/**
 * Auto-login after successful registration
 */
async function autoLogin(username, password) {
  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (data.success) {
      authState.user = data.user;
      authState.sessionToken = data.sessionToken;
      localStorage.setItem('sessionToken', data.sessionToken);
      localStorage.setItem('username', data.user.username);

      hideAuthError();
      showRoomScreen();
    }
  } catch (error) {
    console.error('Auto-login error:', error);
    // Show login form
    toggleAuthMode();
  }
}

/**
 * Handle logout
 */
function handleLogout() {
  // Clear local storage
  localStorage.removeItem('sessionToken');
  localStorage.removeItem('username');

  // Clear state
  authState.user = null;
  authState.sessionToken = null;

  // Show auth screen
  authElements.roomScreen.classList.remove('active');
  authElements.authScreen.classList.add('active');

  // Reset forms
  authElements.loginForm.reset();
  authElements.registerForm.reset();
  hideAuthError();
}

/**
 * Toggle between login and register modes
 */
function toggleAuthMode() {
  const isLoginMode = !authElements.loginForm.classList.contains('hidden');

  if (isLoginMode) {
    // Switch to register mode
    authElements.loginForm.classList.add('hidden');
    authElements.registerForm.classList.remove('hidden');
    authElements.authTitle.textContent = 'Register';
    authElements.authSubtitle.textContent = 'Create a new account';
    authElements.authToggleText.innerHTML = 'Already have an account? <a href="#" id="auth-toggle-link">Login here</a>';
  } else {
    // Switch to login mode
    authElements.registerForm.classList.add('hidden');
    authElements.loginForm.classList.remove('hidden');
    authElements.authTitle.textContent = 'Login';
    authElements.authSubtitle.textContent = 'Login to your account to start messaging';
    authElements.authToggleText.innerHTML = 'Don\'t have an account? <a href="#" id="auth-toggle-link">Register here</a>';
  }

  // Re-attach event listener to new link
  const newLink = document.getElementById('auth-toggle-link');
  newLink.addEventListener('click', (e) => {
    e.preventDefault();
    toggleAuthMode();
  });

  hideAuthError();
}

/**
 * Show room selection screen
 */
function showRoomScreen() {
  authElements.authScreen.classList.remove('active');
  authElements.roomScreen.classList.add('active');
  authElements.welcomeUsername.textContent = authState.user.username;
}

/**
 * Show authentication error
 */
function showAuthError(message) {
  authElements.authError.textContent = message;
  authElements.authError.classList.remove('hidden');
}

/**
 * Hide authentication error
 */
function hideAuthError() {
  authElements.authError.classList.add('hidden');
  authElements.authError.textContent = '';
}

/**
 * Get current auth state
 */
export function getAuthState() {
  return authState;
}

/**
 * Get session token
 */
export function getSessionToken() {
  return authState.sessionToken;
}

/**
 * Get current user
 */
export function getCurrentUser() {
  return authState.user;
}
