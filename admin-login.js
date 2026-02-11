//admin login authentication

// demo credentials for secure admin only access
const ADMIN_CREDENTIALS = {
    email: 'adminmh@gmail.com',
    password: '12345678'
};

// Storage keys
const ADMIN_SESSION_KEY = 'adminLoggedIn';
const ADMIN_EMAIL_KEY = 'adminEmail';

// DOM refs
let loginForm, emailInput, passwordInput;
let errorAlert, errorMessage;
let loginBtn, loginBtnText, loginSpinner;
let togglePasswordBtn;

//beginning

document.addEventListener('DOMContentLoaded', initLogin);

function initLogin() {
    // Cache elements

    loginForm = document.getElementById('adminLoginForm');
    emailInput = document.getElementById('adminEmail');
    passwordInput = document.getElementById('adminPassword');
    errorAlert = document.getElementById('errorAlert');
    errorMessage = document.getElementById('errorMessage');
    loginBtn = document.getElementById('loginBtn');
    loginBtnText = document.getElementById('loginBtnText');
    loginSpinner = document.getElementById('loginSpinner');
    togglePasswordBtn = document.getElementById('togglePassword');

    // Guard : page mismatch safety
    if (!loginForm || !emailInput || !passwordInput) {
        console.warn('Login page elements missing');
        return;
    }

    // Already logged in then skip login
    if (isAdminLoggedIn()) {
        window.location.href = 'admin-dashboard.html';
        return;
    }

    // Events
    loginForm.addEventListener('submit', handleLogin);

    if (togglePasswordBtn) {
        togglePasswordBtn.addEventListener('click', togglePasswordVisibility);
    }

    emailInput.addEventListener('input', clearError);
    passwordInput.addEventListener('input', clearError);

    // Autofocus 
    emailInput.focus();
}






// Login Flow





function handleLogin(e) {
    e.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
        showError('Enter email and password');
        return;
    }

    if (!isValidEmail(email)) {
        showError('Email format looks wrong');
        return;
    }

    setLoading(true);

    // network delay (in case lag to load)
    const delay = 600 + Math.random() * 500;

    setTimeout(() => {
        authenticateAdmin(email, password);
    }, delay);
}

function authenticateAdmin(email, password) {
    const ok =
        email === ADMIN_CREDENTIALS.email &&
        password === ADMIN_CREDENTIALS.password;

    if (!ok) {
        setLoading(false);
        showError('Invalid credentials');
        passwordInput.value = '';
        passwordInput.focus();
        return;
    }

    // Save session

    localStorage.setItem(ADMIN_SESSION_KEY, 'true');
    localStorage.setItem(ADMIN_EMAIL_KEY, email);

    if (document.getElementById('rememberMe')?.checked) {
        localStorage.setItem('adminRememberMe', 'true');
    }

    showSuccess();

    setTimeout(() => {
        window.location.href = 'admin-dashboard.html';
    }, 900);
}


// Helpers


function isAdminLoggedIn() {
    return localStorage.getItem(ADMIN_SESSION_KEY) === 'true';
}

function showError(msg) {
    if (!errorAlert || !errorMessage) return;

    errorMessage.textContent = msg;
    errorAlert.style.display = 'flex';

    // retrigger animation
    errorAlert.style.animation = 'none';
    errorAlert.offsetHeight;
    errorAlert.style.animation = 'shake 0.5s';
}

function clearError() {
    if (!errorAlert) return;
    errorAlert.style.display = 'none';
    errorMessage.textContent = '';
}

function setLoading(state) {
    if (!loginBtn || !loginBtnText || !loginSpinner) return;

    loginBtn.disabled = state;

    if (state) {
        loginBtnText.style.display = 'none';
        loginSpinner.style.display = 'inline-block';
    } else {
        loginBtnText.style.display = 'inline';
        loginSpinner.style.display = 'none';
    }
}

function showSuccess() {
    clearError();

    loginBtnText.textContent = '✓ Success';
    loginBtnText.style.display = 'inline';
    loginSpinner.style.display = 'none';
    loginBtn.style.background =
        'linear-gradient(135deg,#16a34a,#15803d)';
}


// UX Utilities

function togglePasswordVisibility() {
    if (!passwordInput) return;

    const show = passwordInput.type === 'password';
    passwordInput.type = show ? 'text' : 'password';

    if (togglePasswordBtn) {
        togglePasswordBtn.textContent = show ? '🙈' : '👁️';
    }
}


//validating mail by regex
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}


// Logout (used by dashboard)


function logoutAdmin() {
    localStorage.removeItem(ADMIN_SESSION_KEY);
    localStorage.removeItem(ADMIN_EMAIL_KEY);
    localStorage.removeItem('adminRememberMe');
    window.location.href = 'admin-login.html';
}

window.logoutAdmin = logoutAdmin;
