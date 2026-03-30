// Admin credentials - single admin account for system administration
const ADMIN_CREDENTIALS = {
    id: "admin_1",
    email: "admin@gmail.com",
    password: "123456",
    role: "admin",
    name: "Admin"
};

let USERS_DB = [
    {
        id: "user_1",
        email: "customer@test.com",
        password: "password123",
        role: "customer",
        name: "John Doe"
    },
    {
        id: "vendor_1",
        email: "vendor1@test.com",
        password: "vendor123",
        role: "vendor",
        name: "Tech Store",
        storeName: "Tech Paradise"
    },
    ADMIN_CREDENTIALS
];

let storedUsers = localStorage.getItem("users");
if (storedUsers) {
    try {
        const parsed = JSON.parse(storedUsers);
        if (Array.isArray(parsed)) USERS_DB = parsed;
    } catch (error) {
        console.warn("Invalid users data in localStorage, resetting to default.", error);
        saveUsers();
    }
}

function toApiErrorMessage(error, fallbackMessage) {
    const rawMessage = String(error?.message || '').trim();
    if (!rawMessage || rawMessage === 'Failed to fetch') {
        return 'Cannot reach the backend server. Start the backend with "cd backend" and "npm run dev".';
    }
    return rawMessage || fallbackMessage;
}

function authStatusMessage(message, backendAvailable) {
    return backendAvailable ? message : `${message} (offline mode)`;
}

function saveUsers() {
    localStorage.setItem("users", JSON.stringify(USERS_DB));
}

async function login(email, password, role) {
    if (!email || !password || !role) {
        return { success: false, message: "Please fill all fields" };
    }

    let backendAvailable = false;

    if (window.MultiMartAPI) {
        try {
            const response = await window.MultiMartAPI.login({ email, password, role });
            backendAvailable = true;

            if (response.token) {
                window.MultiMartAPI.setToken(response.token);
            }
            if (response.user) {
                localStorage.setItem("session", JSON.stringify(response.user));
                localStorage.setItem("userLoggedIn", "true");
                localStorage.setItem("userEmail", response.user.email);

                if (response.user.role === "admin") {
                    localStorage.setItem("adminLoggedIn", "true");
                    localStorage.setItem("adminEmail", response.user.email);
                } else if (response.user.role === "vendor") {
                    localStorage.setItem("vendorLoggedIn", "true");
                    localStorage.setItem("vendorEmail", response.user.email);
                }
            }

            if (response.success === false) {
                return { success: false, message: response.message || "Invalid email or password" };
            }

            if (response.user) {
                return {
                    success: true,
                    message: response.message || "Login successful",
                    user: response.user
                };
            }

            console.warn("API login returned no user, applying local fallback.");
        } catch (error) {
            backendAvailable = false;
            console.warn("API login failed, falling back to local auth:", error.message || error);
        }
    }

    // Local fallback mode - admin uses single credential
    if (role === "admin") {
        if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
            const adminUser = { ...ADMIN_CREDENTIALS };
            localStorage.setItem("session", JSON.stringify(adminUser));
            localStorage.setItem("adminLoggedIn", "true");
            localStorage.setItem("adminEmail", email);
            localStorage.setItem("userLoggedIn", "true");
            localStorage.setItem("userEmail", email);
            return {
                success: true,
                message: authStatusMessage("Admin login successful", backendAvailable),
                user: adminUser
            };
        }
        return { success: false, message: "Invalid email or password" };
    }

    if (role === "vendor" || role === "customer") {
        const user = USERS_DB.find(u => u.role === role && u.email === email && u.password === password);
        if (!user) {
            return { success: false, message: "Invalid email or password" };
        }

        localStorage.setItem("session", JSON.stringify(user));
        localStorage.setItem("userLoggedIn", "true");
        localStorage.setItem("userEmail", email);

        if (role === "vendor") {
            localStorage.setItem("vendorLoggedIn", "true");
            localStorage.setItem("vendorEmail", email);
        }

        return {
            success: true,
            message: authStatusMessage("Login successful", backendAvailable),
            user: user
        };
    }

    return { success: false, message: "Invalid role selected" };
}

async function register(email, password, confirmPassword, role, name, storeName, storeAddress, regNumber){
    if (!email || !password || !confirmPassword || !name) {
        return { success: false, message: "Please fill all fields" };
    }

    if (password !== confirmPassword) {
        return { success: false, message: "Passwords do not match" };
    }

    if (window.MultiMartAPI) {
        try {
            const response = await window.MultiMartAPI.register({
                email,
                password,
                role,
                name,
                storeName,
                storeAddress,
                regNumber
            });

            return {
                success: true,
                message: response.message || "Registration successful",
                user: response.user
            };
        } catch (error) {
            console.warn("API registration failed, falling back to local registration:", error.message || error);
            // do not return; execute local fallback registration
        }
    }

    for (let i = 0; i < USERS_DB.length; i++) {
        if (USERS_DB[i].email === email) {
            return { success: false, message: "Email already exists" };
        }
    }

    if (role === "admin") {
        return { success: false, message: "Admin registration is not allowed. Please use the admin login form." };
    }

    if (role === "vendor" && (!storeName || !storeAddress)) {
        return { success: false, message: "Store name and address required" };
    }

    let newUser = {
        id: role + "_" + Date.now(),
        email: email,
        password: password,
        role: role,
        name: name,

    storeName: storeName || null,
    storeAddress: storeAddress || null,
    regNumber: regNumber || null,

    createdAt: new Date().toISOString()
};


    USERS_DB.push(newUser);
    saveUsers();

    return { success: true, message: "Registration successful" };
}

function getCurrentUser() {
    let data = localStorage.getItem("session");
    if (!data) return null;
    try {
        return JSON.parse(data);
    } catch (error) {
        console.warn('Invalid session data, clearing session', error);
        clearAuthSession();
        return null;
    }
}

function isLoggedIn() {
    return getCurrentUser() !== null;
}

function hasBackendSession() {
    return Boolean(window.MultiMartAPI && window.MultiMartAPI.getToken && window.MultiMartAPI.getToken());
}

function requireBackendSession(message) {
    if (!window.MultiMartAPI) return true;
    if (hasBackendSession()) return true;

    alert(message || 'Please log in again so the backend can verify your session.');
    clearAuthSession();
    window.location.href = 'login.html';
    return false;
}

function requireAuth(expectedRole) {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
        return false;
    }

    if (expectedRole && user.role !== expectedRole) {
        alert('Access denied');
        clearAuthSession();
        window.location.href = 'login.html';
        return false;
    }

    return true;
}

function clearAuthSession() {
    localStorage.removeItem("session");
    localStorage.removeItem("adminLoggedIn");
    localStorage.removeItem("adminEmail");
    localStorage.removeItem("vendorLoggedIn");
    localStorage.removeItem("vendorEmail");
    localStorage.removeItem("userLoggedIn");
    localStorage.removeItem("userEmail");
    if (window.MultiMartAPI) {
        window.MultiMartAPI.clearToken();
    }
}

function logout() {
    clearAuthSession();
    window.location.href = 'login.html';
    return { success: true };
}

function getAllUsers() {
    let current = getCurrentUser();
    if (!current || current.role !== "admin") {
        return { success: false, message: "Access denied" };
    }
    return { success: true, users: USERS_DB };
}

function getAllVendorsData() {
    let current = getCurrentUser();
    if (!current || current.role !== "admin") {
        return [];
    }
    return USERS_DB.filter(u => u.role === "vendor");
}

function deleteUser(userId) {
    let current = getCurrentUser();
    if (!current || current.role !== "admin") {
        return { success: false, message: "Access denied" };
    }

    for (let i = 0; i < USERS_DB.length; i++) {
        if (USERS_DB[i].id === userId) {
            USERS_DB.splice(i, 1);
            saveUsers();
            return { success: true, message: "User deleted" };
        }
    }

    return { success: false, message: "User not found" };
}
