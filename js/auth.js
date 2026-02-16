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
    {
        id: "admin_1",
        email: "adminmh@gmail.com",
        password: "12345678",
        role: "admin",
        name: "Admin"
    }
];

let storedUsers = localStorage.getItem("users");
if (storedUsers) {
    USERS_DB = JSON.parse(storedUsers);
}

function saveUsers() {
    localStorage.setItem("users", JSON.stringify(USERS_DB));
}

function login(email, password, role) {
    if (!email || !password) {
        return { success: false, message: "Please fill all fields" };
    }
    // ---- Fixed Admin Login ----
if (
    role === "admin" &&
    email === "admin@gmail.com" &&
    password === "123456"
) {
    const adminUser = {
        id: "admin_fixed",
        email: email,
        role: "admin",
        name: "Administrator"
    };

    localStorage.setItem("session", JSON.stringify(adminUser));
    return { success: true, message: "Admin login successful", user: adminUser };
}


    let user = null;

    for (let i = 0; i < USERS_DB.length; i++) {
        if (
            USERS_DB[i].role !== "admin" &&
            USERS_DB[i].email === email &&
            USERS_DB[i].password === password &&
            USERS_DB[i].role === role
        ) {
            user = USERS_DB[i];
            break;
        }
    }

    if (!user) {
        return { success: false, message: "Invalid email or password" };
    }

    localStorage.setItem("session", JSON.stringify(user));

    return { success: true, message: "Login successful", user: user };
}

function register(email, password, confirmPassword, role, name, storeName, storeAddress, regNumber){
    if (!email || !password || !confirmPassword || !name) {
        return { success: false, message: "Please fill all fields" };
    }

    if (password !== confirmPassword) {
        return { success: false, message: "Passwords do not match" };
    }

    for (let i = 0; i < USERS_DB.length; i++) {
        if (USERS_DB[i].email === email) {
            return { success: false, message: "Email already exists" };
        }
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
    return JSON.parse(data);
}

function isLoggedIn() {
    return getCurrentUser() !== null;
}

function logout() {
    localStorage.removeItem("session");
    return { success: true };
}

function getAllUsers() {
    let current = getCurrentUser();
    if (!current || current.role !== "admin") {
        return { success: false, message: "Access denied" };
    }
    return { success: true, users: USERS_DB };
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
