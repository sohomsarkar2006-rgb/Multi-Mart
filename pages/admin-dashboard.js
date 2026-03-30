
// admin dashboard
//till javascript(basic) bhaskar


// Session storage key
const ADMIN_SESSION_KEY = 'adminLoggedIn';
const ADMIN_EMAIL_KEY = 'adminEmail';
const LIVE_ADMIN_STATE = {
    vendors: [],
    products: [],
    orders: [],
    users: []
};
let LIVE_COMPLAINTS = [];
let LIVE_ANALYTICS = null;
let LIVE_SETTINGS = null;

// Check authentication on page load
document.addEventListener('DOMContentLoaded', function() {
    if (!isAdminAuthenticated()) {
        window.location.href = 'admin-login.html';
        return;
    }

    if (typeof requireBackendSession === 'function' &&
        !requireBackendSession('Please log in again as admin so the dashboard can load live backend data.')) {
        return;
    }
    
    initializeApp();
    displayAdminInfo();
    setupAdminLiveRefresh();
});

function isAdminAuthenticated() {
    return localStorage.getItem(ADMIN_SESSION_KEY) === 'true';
}

function displayAdminInfo() {
    const adminEmail = localStorage.getItem(ADMIN_EMAIL_KEY);
    if (adminEmail) {
        // Updates admin profile display
        const adminProfile = document.getElementById('adminProfile');
        if (adminProfile) {
            const nameSpan = adminProfile.querySelector('span:first-of-type');
            if (nameSpan) {
                nameSpan.textContent = 'Admin MH';
            }
        }
    }
}

function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem(ADMIN_SESSION_KEY);
        localStorage.removeItem(ADMIN_EMAIL_KEY);
        localStorage.removeItem('adminRememberMe');
        window.location.href = 'admin-login.html';
    }
}

async function hydrateAdminTablesFromApi() {
    if (!window.MultiMartAPI) return;

    try {
        const [vendorsRes, productsRes, ordersRes, usersRes] = await Promise.all([
            window.MultiMartAPI.getAdminVendors().catch(() => ({ vendors: [] })),
            window.MultiMartAPI.getAdminProducts().catch(() => ({ products: [] })),
            window.MultiMartAPI.getAdminOrders().catch(() => ({ orders: [] })),
            window.MultiMartAPI.getAdminUsers().catch(() => ({ users: [] }))
        ]);

        LIVE_ADMIN_STATE.vendors = vendorsRes.vendors || [];
        LIVE_ADMIN_STATE.products = productsRes.products || [];
        LIVE_ADMIN_STATE.orders = ordersRes.orders || [];
        LIVE_ADMIN_STATE.users = usersRes.users || [];

        updateOrderSectionStats(LIVE_ADMIN_STATE.orders);
        updateUserSectionStats(LIVE_ADMIN_STATE.users);

        renderVendorsTable = createVendorRenderer(LIVE_ADMIN_STATE.vendors);
        renderVendorsTable();

        updatePendingApprovalCount(LIVE_ADMIN_STATE.products);
        renderProductsTable = createProductRenderer(LIVE_ADMIN_STATE.products);
        renderProductsTable();

        renderOrdersTable = createOrderRenderer(LIVE_ADMIN_STATE.orders);
        renderOrdersTable();

        renderUsersTable = createUserRenderer(LIVE_ADMIN_STATE.users);
        renderUsersTable();

        drawLiveOrderDashboardChart(LIVE_ADMIN_STATE.orders);
    } catch (error) {
        console.warn('Admin API tables failed:', error.message);
        renderAdminApiErrorState();
        renderAdminTableApiErrorState();
    }
}

function updatePendingApprovalCount(products) {
    const badge = document.getElementById('pendingApprovalCount');
    if (!badge) return;
    const pendingCount = (products || []).filter(product => (product.status || '').toLowerCase() === 'pending').length;
    badge.textContent = `${pendingCount} Pending Approvals`;
}

function updateMiniStat(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

function updateOrderSectionStats(orders) {
    const list = Array.isArray(orders) ? orders : [];
    const pending = list.filter(order => (order.order_status || '').toLowerCase() === 'pending').length;
    const processing = list.filter(order => ['processing', 'shipped'].includes((order.order_status || '').toLowerCase())).length;
    const refundRequests = list.filter(order => (order.payment_status || '').toLowerCase() === 'refunded').length;

    updateMiniStat('ordersTotalStat', list.length);
    updateMiniStat('ordersPendingStat', pending);
    updateMiniStat('ordersProcessingStat', processing);
    updateMiniStat('ordersRefundStat', refundRequests);
}

function updateUserSectionStats(users) {
    const list = Array.isArray(users) ? users : [];
    updateMiniStat('usersTotalStat', list.length);
    updateMiniStat('usersCustomerStat', list.filter(user => (user.role || '').toLowerCase() === 'customer').length);
    updateMiniStat('usersVendorStat', list.filter(user => (user.role || '').toLowerCase() === 'vendor').length);
    updateMiniStat('usersAdminStat', list.filter(user => (user.role || '').toLowerCase() === 'admin').length);
}

function setTextByLabel(label, value) {
    const labels = Array.from(document.querySelectorAll('.stat-label'));
    const target = labels.find(node => node.textContent.trim() === label);
    const valueEl = target?.parentElement?.querySelector('.stat-value');
    const changeEl = target?.parentElement?.querySelector('.stat-change');
    if (valueEl) valueEl.textContent = value;
    if (changeEl) changeEl.textContent = 'Live';
}

function getLiveAdminEntity(collectionKey, fallbackArray, id) {
    return LIVE_ADMIN_STATE[collectionKey].find(item => String(item.id) === String(id))
        || fallbackArray.find(item => String(item.id) === String(id));
}

function createVendorRenderer(vendors) {
    return function renderVendorsTableLive() {
        const tbody = document.getElementById('vendorsTableBody');
        if (!tbody) return;

        tbody.innerHTML = vendors.map(vendor => `
            <tr>
                <td>${vendor.id}</td>
                <td><strong>${vendor.store_name || vendor.storeName}</strong></td>
                <td>${vendor.owner_name || vendor.ownerName || '-'}</td>
                <td>${vendor.email}</td>
                <td>${vendor.products_count || vendor.products || 0}</td>
                <td>${vendor.revenue ? formatCurrencyINR(vendor.revenue) : '—'}</td>
                <td><span class="badge ${vendor.status}">${vendor.status}</span></td>
                <td>
                    <button class="action-btn view" onclick="viewVendor('${vendor.id}')">View</button>
                    <button class="action-btn edit" onclick="editVendor('${vendor.id}')">Edit</button>
                    ${(vendor.status || '').toLowerCase() === 'pending'
                        ? `<button class="action-btn edit" onclick="approveVendor('${vendor.id}')">Approve</button>`
                        : ''}
                    ${(vendor.status || '').toLowerCase() === 'approved'
                        ? `<button class="action-btn delete" onclick="banVendor('${vendor.id}')">Ban</button>`
                        : ''}
                </td>
            </tr>
        `).join('') || '<tr><td colspan="8">No vendors found</td></tr>';
    };
}

function createProductRenderer(products) {
    return function renderProductsTableLive() {
        const tbody = document.getElementById('productsTableBody');
        if (!tbody) return;

        tbody.innerHTML = products.map(product => `
            <tr>
                <td>${product.id}</td>
                <td><img src="${product.image || product.image_url || ''}" class="product-img"></td>
                <td><strong>${product.name}</strong></td>
                <td>${product.vendor_name || product.vendorName || '-'}</td>
                <td>${product.category}</td>
                <td>${formatPrice(product.price)}</td>
                <td><span class="badge ${product.status || 'approved'}">${product.status || 'approved'}</span></td>
                <td>
                    <button class="action-btn view" onclick="viewProduct('${product.id}')">View</button>
                    ${(product.status || '').toLowerCase() === 'pending'
                        ? `<button class="action-btn edit" onclick="approveProduct('${product.id}')">Approve</button>
                           <button class="action-btn delete" onclick="rejectProduct('${product.id}')">Reject</button>`
                        : `<button class="action-btn delete" onclick="deleteProduct('${product.id}')">Delete</button>`}
                </td>
            </tr>
        `).join('') || '<tr><td colspan="8">No products found</td></tr>';
    };
}

function createUserRenderer(users) {
    return function renderUsersTableLive() {
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;

        tbody.innerHTML = users.map(user => `
            <tr>
                <td>${user.id}</td>
                <td><strong>${user.name}</strong></td>
                <td>${user.email}</td>
                <td>${user.role}</td>
                <td>${user.created_at ? new Date(user.created_at).toLocaleDateString('en-IN') : '-'}</td>
                <td>${Number(user.orders_count || 0)}</td>
                <td><span class="badge ${(user.vendor_status || user.status || 'active')}">${user.vendor_status || user.status || 'active'}</span></td>
                <td>
                    <button class="action-btn view" onclick="viewUser('${user.id}')">View</button>
                    <button class="action-btn edit" onclick="editUser('${user.id}')">Edit</button>
                </td>
            </tr>
        `).join('') || '<tr><td colspan="8">No users found</td></tr>';
    };
}

function createOrderRenderer(orders) {
    return function renderOrdersTableLive() {
        const tbody = document.getElementById('ordersTableBody');
        if (!tbody) return;

        tbody.innerHTML = orders.map(order => `
            <tr>
                <td><strong>${order.id}</strong></td>
                <td>${order.customer_name || '-'}</td>
                <td>${order.vendor || '-'}</td>
                <td>${order.product || '-'}</td>
                <td>${formatCurrencyINR(order.total_amount || 0)}</td>
                <td>${order.created_at ? new Date(order.created_at).toLocaleDateString('en-IN') : '-'}</td>
                <td><span class="badge ${order.order_status || 'pending'}">${order.order_status || 'pending'}</span></td>
                <td>
                    <button class="action-btn view" onclick="viewOrder('${order.id}')">View</button>
                    ${(order.order_status || 'pending') === 'pending'
                        ? `<button class="action-btn edit" onclick="processOrder('${order.id}')">Process</button>`
                        : ''}
                    ${['processing', 'shipped'].includes((order.order_status || '').toLowerCase())
                        ? `<button class="action-btn edit" onclick="markOrderDelivered('${order.id}')">Mark Delivered</button>`
                        : ''}
                </td>
            </tr>
        `).join('') || '<tr><td colspan="8">No orders found</td></tr>';
    };
}

// Sample Data for showing(from internet)
const vendorsData = [
    { id: 'VND001', storeName: 'TECH WORLD', ownerName: 'RAJU', email: 'raju@gmail.com', products: 45, revenue: 12580.50, status: 'approved' },
    
];

const productsData = [
    { id: 'PRD001', name: 'Wireless Headphones', vendor: 'TECH WORLD', category: 'Electronics', price: 79.99, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100', status: 'approved' },
    { id: 'PRD002', name: 'Smart Watch Pro', vendor: 'GadgetHub', category: 'Electronics', price: 299.99, image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100', status: 'pending' },
    { id: 'PRD003', name: 'Running Shoes', vendor: 'SportZone', category: 'Sports', price: 89.99, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100', status: 'approved' },
    { id: 'PRD004', name: 'Designer Handbag', vendor: 'FashionPro', category: 'Fashion', price: 159.99, image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=100', status: 'pending' },
    { id: 'PRD005', name: 'Coffee Maker', vendor: 'HomeEssentials', category: 'Home', price: 129.99, image: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=100', status: 'approved' },
    { id: 'PRD006', name: 'Fake Product', vendor: 'BadVendor', category: 'Other', price: 9.99, image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100', status: 'rejected' },
];

const ordersData = [
    { id: 'ORD12458', customer: 'Vikram', vendor: 'TECH WORLD', product: 'Wireless Headphones', amount: 1779.99, date: '2026-02-08', status: 'delivered' },
    
];

const usersData = [
    { id: 'USR001', name: 'Vikram', email: 'vikram@email.com', type: 'Customer', joinDate: '2025-12-15', orders: 12, status: 'active' },
    { id: 'USR002', name: 'Bhaskar', email: 'bhaskar@email.com', type: 'Customer', joinDate: '2026-01-05', orders: 5, status: 'active' },
    { id: 'USR003', name: 'Raju', email: 'raju@gmail.com', type: 'Vendor', joinDate: '2025-11-20', orders: 145, status: 'active' },
    
];

const complaintsData = [
    { id: 'CMP001', type: 'Product Issue', customer: 'vikram', vendor: 'TECH WORLD', orderId: 'ORD12450', priority: 'high', status: 'open', date: '2026-02-09' },
    
];

const payoutsData = [
    { id: 'PAY001', vendor: 'TECH WORLD', amount: 12580.50, commission: 1887.08, netAmount: 10693.42, date: '2026-02-01', status: 'completed' },
    { id: 'PAY002', vendor: 'GadgetHub', amount: 9845.25, commission: 1476.79, netAmount: 8368.46, date: '2026-02-01', status: 'completed' },
    { id: 'PAY003', vendor: 'SportZone', amount: 7650.00, commission: 1147.50, netAmount: 6502.50, date: '2026-02-01', status: 'pending' },
];


// Navigation & Menu Handling


function initializeApp() {
    primeDashboardLoadingState();
    primeAdminTableLoadingState();
    setupNavigation();
    setupMenuToggle();
    setupNotifications();
    setupModals();
    setupTabs();
    renderTables();
    initializeCharts();
    loadLiveAdminOverview();
    hydrateAdminTablesFromApi();
    loadLiveAdminPayouts();
    loadLiveAdminComplaints();
    loadLiveAdminAnalytics();
    loadLivePlatformSettings();
}

function refreshAdminLiveData() {
    loadLiveAdminOverview();
    hydrateAdminTablesFromApi();
    loadLiveAdminPayouts();
    loadLiveAdminComplaints();
    loadLiveAdminAnalytics();
}

function setupAdminLiveRefresh() {
    window.addEventListener('focus', refreshAdminLiveData);
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            refreshAdminLiveData();
        }
    });
}

function primeDashboardLoadingState() {
    updateDashboardStat('totalRevenue', '--');
    updateDashboardStat('totalOrders', '--');
    updateDashboardStat('activeVendors', '--');
    updateDashboardStat('totalUsers', '--');

    const recentActivityList = document.getElementById('recentActivityList');
    if (recentActivityList) {
        recentActivityList.innerHTML = `
            <div class="activity-item">
                <span class="activity-icon">...</span>
                <div class="activity-details">
                    <p><strong>Loading live admin activity...</strong></p>
                    <span class="activity-time">Waiting for backend response</span>
                </div>
            </div>
        `;
    }
}

function renderTableMessage(tableBodyId, colspan, message) {
    const tbody = document.getElementById(tableBodyId);
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="${colspan}">${message}</td></tr>`;
}

function primeAdminTableLoadingState() {
    updateMiniStat('ordersTotalStat', '--');
    updateMiniStat('ordersPendingStat', '--');
    updateMiniStat('ordersProcessingStat', '--');
    updateMiniStat('ordersRefundStat', '--');
    updateMiniStat('usersTotalStat', '--');
    updateMiniStat('usersCustomerStat', '--');
    updateMiniStat('usersVendorStat', '--');
    updateMiniStat('usersAdminStat', '--');

    renderTableMessage('vendorsTableBody', 8, 'Loading live vendors...');
    renderTableMessage('productsTableBody', 8, 'Loading live products...');
    renderTableMessage('ordersTableBody', 8, 'Loading live orders...');
    renderTableMessage('usersTableBody', 8, 'Loading live users...');
}

function renderAdminTableApiErrorState() {
    updateMiniStat('ordersTotalStat', '--');
    updateMiniStat('ordersPendingStat', '--');
    updateMiniStat('ordersProcessingStat', '--');
    updateMiniStat('ordersRefundStat', '--');
    updateMiniStat('usersTotalStat', '--');
    updateMiniStat('usersCustomerStat', '--');
    updateMiniStat('usersVendorStat', '--');
    updateMiniStat('usersAdminStat', '--');

    renderTableMessage('vendorsTableBody', 8, 'Live vendor data unavailable');
    renderTableMessage('productsTableBody', 8, 'Live product data unavailable');
    renderTableMessage('ordersTableBody', 8, 'Live order data unavailable');
    renderTableMessage('usersTableBody', 8, 'Live user data unavailable');
}

async function loadLiveAdminOverview() {
    if (!window.MultiMartAPI) return;

    try {
        const [overviewResponse, pendingResponse] = await Promise.all([
            window.MultiMartAPI.getAdminDashboard(),
            window.MultiMartAPI.getPendingProducts().catch(() => ({ products: [] }))
        ]);

        const overview = overviewResponse.overview || {};
        updateDashboardStat('totalRevenue', formatCurrencyINR(overview.totalRevenue || 0));
        updateDashboardStat('totalOrders', overview.totalOrders || 0);
        updateDashboardStat('activeVendors', overview.activeVendors || 0);
        updateDashboardStat('totalUsers', overview.totalUsers || 0);

        const pendingProducts = pendingResponse.products || [];
        const recentActivityList = document.getElementById('recentActivityList');
        if (recentActivityList) {
            const items = [
                `<div class="activity-item"><span class="activity-icon">📊</span><div class="activity-details"><p><strong>Platform commission:</strong> ${formatCurrencyINR(overview.totalCommission || 0)}</p><span class="activity-time">Live from database</span></div></div>`,
                `<div class="activity-item"><span class="activity-icon">📦</span><div class="activity-details"><p><strong>Pending products:</strong> ${overview.pendingProducts || pendingProducts.length}</p><span class="activity-time">Awaiting admin review</span></div></div>`
            ];

            pendingProducts.slice(0, 3).forEach(product => {
                items.push(`<div class="activity-item"><span class="activity-icon">📝</span><div class="activity-details"><p><strong>${product.name}</strong> by ${product.vendor_name}</p><span class="activity-time">Pending approval</span></div></div>`);
            });

            recentActivityList.innerHTML = items.join('');
        }
    } catch (error) {
        console.warn('Admin API overview failed:', error.message);
        renderAdminApiErrorState();
    }
}

function renderAdminApiErrorState() {
    updateDashboardStat('totalRevenue', '--');
    updateDashboardStat('totalOrders', '--');
    updateDashboardStat('activeVendors', '--');
    updateDashboardStat('totalUsers', '--');

    const revenueCanvas = document.getElementById('revenueCanvas');
    const orderCanvas = document.getElementById('orderCanvas');
    [revenueCanvas, orderCanvas].forEach(canvas => {
        if (!canvas || !canvas.getContext) return;
        const ctx = canvas.getContext('2d');
        canvas.width = canvas.parentElement.offsetWidth;
        canvas.height = 280;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#9ca3af';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Live backend data unavailable', canvas.width / 2, canvas.height / 2);
    });
}

function updateDashboardStat(key, value) {
    const element = document.querySelector(`[data-stat="${key}"]`);
    if (element) {
        element.textContent = value;
        const change = element.parentElement?.querySelector('.stat-change');
        if (change) {
            change.textContent = 'Live';
        }
    }
}

function formatCurrencyINR(value) {
    return `₹${Number(value || 0).toLocaleString('en-IN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    })}`;
}

function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.content-section');
    
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all items and sections
            navItems.forEach(nav => nav.classList.remove('active'));
            sections.forEach(section => section.classList.remove('active'));
            
            // Add active class to clicked item
            this.classList.add('active');
            
            // Show corresponding section
            const sectionId = this.getAttribute('data-section');
            const targetSection = document.getElementById(sectionId);
            if (targetSection) {
                targetSection.classList.add('active');
            }
        });
    });
}

function setupMenuToggle() {
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const body = document.body;
    
    if (menuToggle && sidebar && body) {
        menuToggle.addEventListener('click', function() {
            body.classList.toggle('sidebar-collapsed');

            if (window.innerWidth <= 768) {
                sidebar.classList.toggle('active');
            }
        });
    }
}

function setupNotifications() {
    const notificationIcon = document.getElementById('notificationIcon');
    const notificationDropdown = document.getElementById('notificationDropdown');
    
    if (notificationIcon && notificationDropdown) {
        notificationIcon.addEventListener('click', function(e) {
            e.stopPropagation();
            notificationDropdown.classList.toggle('active');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!notificationDropdown.contains(e.target) && e.target !== notificationIcon) {
                notificationDropdown.classList.remove('active');
            }
        });
    }
}

// Modal Handling

function setupModals() {
    const modal = document.getElementById('approvalModal');
    const modalClose = document.getElementById('modalClose');
    const modalCancel = document.getElementById('modalCancel');
    
    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }
    
    if (modalCancel) {
        modalCancel.addEventListener('click', closeModal);
    }
    
    // Close modal when clicking outside
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal();
            }
        });
    }
}

function openModal(title, content) {
    const modal = document.getElementById('approvalModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    
    if (modal && modalTitle && modalBody) {
        modalTitle.textContent = title;
        modalBody.innerHTML = content;
        modal.classList.add('active');
    }
}

function closeModal() {
    const modal = document.getElementById('approvalModal');
    if (modal) {
        modal.classList.remove('active');
    }
}


// Tabs Handling


function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            
            // Remove active class from all
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active to clicked
            this.classList.add('active');
            const targetTab = document.getElementById(tabName);
            if (targetTab) {
                targetTab.classList.add('active');
            }
        });
    });
}

// ===============================
// Table Rendering
// ===============================

function renderTables() {
    renderVendorsTable();
    renderProductsTable();
    renderOrdersTable();
    renderUsersTable();
    renderComplaintsTable();
    renderPayoutsTable();
}

function renderVendorsTable() {
    const tbody = document.getElementById('vendorsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = vendorsData.map(vendor => `
        <tr>
            <td>${vendor.id}</td>
            <td><strong>${vendor.storeName}</strong></td>
            <td>${vendor.ownerName}</td>
            <td>${vendor.email}</td>
            <td>${vendor.products}</td>
            <td>₹${vendor.revenue.toFixed(2)}</td>
            <td><span class="badge ${vendor.status}">${vendor.status}</span></td>
            <td>
                <button class="action-btn view" onclick="viewVendor('${vendor.id}')">View</button>
                <button class="action-btn edit" onclick="editVendor('${vendor.id}')">Edit</button>
                ${vendor.status === 'pending' ? `<button class="action-btn delete" onclick="approveVendor('${vendor.id}')">Approve</button>` : ''}
                ${vendor.status === 'approved' ? `<button class="action-btn delete" onclick="banVendor('${vendor.id}')">Ban</button>` : ''}
            </td>
        </tr>
    `).join('');
}

function renderProductsTable() {
    const tbody = document.getElementById('productsTableBody');
    if (!tbody) return;

    const products = getAllProducts();   // main js database

    tbody.innerHTML = products.map(product => `
        <tr>
            <td>${product.id}</td>
            <td><img src="${product.image}" class="product-img"></td>
            <td><strong>${product.name}</strong></td>
            <td>${product.vendorName || '-'}</td>
            <td>${product.category}</td>
            <td>${formatPrice(product.price)}</td>
            <td><span class="badge approved">approved</span></td>
            <td>
                <button class="action-btn view"
                    onclick="viewProduct('${product.id}')">View</button>
                <button class="action-btn delete"
                    onclick="deleteProduct('${product.id}')">Delete</button>
            </td>
        </tr>
    `).join('');
}


function renderOrdersTable() {
    const tbody = document.getElementById('ordersTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = ordersData.map(order => `
        <tr>
            <td><strong>${order.id}</strong></td>
            <td>${order.customer}</td>
            <td>${order.vendor}</td>
            <td>${order.product}</td>
            <td>₹${order.amount.toFixed(2)}</td>
            <td>${order.date}</td>
            <td><span class="badge ${order.status}">${order.status}</span></td>
            <td>
                <button class="action-btn view" onclick="viewOrder('${order.id}')">View</button>
                ${order.status === 'pending' ? `<button class="action-btn edit" onclick="processOrder('${order.id}')">Process</button>` : ''}
            </td>
        </tr>
    `).join('');
}

function renderUsersTable() {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = usersData.map(user => `
        <tr>
            <td>${user.id}</td>
            <td><strong>${user.name}</strong></td>
            <td>${user.email}</td>
            <td>${user.type}</td>
            <td>${user.joinDate}</td>
            <td>${user.orders}</td>
            <td><span class="badge ${user.status}">${user.status}</span></td>
            <td>
                <button class="action-btn view" onclick="viewUser('${user.id}')">View</button>
                <button class="action-btn edit" onclick="editUser('${user.id}')">Edit</button>
                ${user.status === 'active' ? `<button class="action-btn delete" onclick="banUser('${user.id}')">Ban</button>` : ''}
            </td>
        </tr>
    `).join('');
}

function renderComplaintsTable() {
    const tbody = document.getElementById('complaintsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = complaintsData.map(complaint => `
        <tr>
            <td><strong>${complaint.id}</strong></td>
            <td>${complaint.type}</td>
            <td>${complaint.customer}</td>
            <td>${complaint.vendor}</td>
            <td>${complaint.orderId}</td>
            <td><span class="badge ${complaint.priority}">${complaint.priority}</span></td>
            <td><span class="badge ${complaint.status === 'inprogress' ? 'processing' : complaint.status}">${complaint.status}</span></td>
            <td>${complaint.date}</td>
            <td>
                <button class="action-btn view" onclick="viewComplaint('${complaint.id}')">Review</button>
                ${complaint.status === 'open' ? `<button class="action-btn edit" onclick="resolveComplaint('${complaint.id}')">Resolve</button>` : ''}
            </td>
        </tr>
    `).join('');
}

function renderPayoutsTable() {
    const tbody = document.getElementById('payoutsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = payoutsData.map(payout => `
        <tr>
            <td>${payout.id}</td>
            <td>${payout.vendor}</td>
            <td>₹${payout.amount.toFixed(2)}</td>
            <td>₹${payout.commission.toFixed(2)}</td>
            <td>₹${payout.netAmount.toFixed(2)}</td>
            <td>${payout.date}</td>
            <td><span class="badge ${payout.status === 'completed' ? 'delivered' : 'pending'}">${payout.status}</span></td>
        </tr>
    `).join('');
}


// Action Functions


function viewVendor(id) {
    return legacyViewVendor(id);
    const vendor = vendorsData.find(v => v.id === id);
    if (vendor) {
        const content = `
            <div style="padding: 10px;">
                <p><strong>Store Name:</strong> ${vendor.storeName}</p>
                <p><strong>Owner:</strong> ${vendor.ownerName}</p>
                <p><strong>Email:</strong> ${vendor.email}</p>
                <p><strong>Products:</strong> ${vendor.products}</p>
                <p><strong>Revenue:</strong> ₹${vendor.revenue.toFixed(2)}</p>
                <p><strong>Status:</strong> <span class="badge ${vendor.status}">${vendor.status}</span></p>
            </div>
        `;
        openModal('Vendor Details', content);
    }
}

function editVendor(id) {
    alert('Edit vendor: ' + id);
}

function approveVendor(id) {
    if (window.MultiMartAPI) {
        if (confirm('Are you sure you want to approve this vendor?')) {
            window.MultiMartAPI.updateAdminVendorStatus(id, 'approved')
                .then(() => {
                    alert('Vendor approved successfully!');
                    hydrateAdminTablesFromApi();
                    loadLiveAdminOverview();
                })
                .catch(error => {
                    alert(error.message || 'Unable to approve vendor');
                });
        }
        return;
    }

    if (confirm('Are you sure you want to approve this vendor?')) {
        const vendor = vendorsData.find(v => v.id === id);
        if (vendor) {
            vendor.status = 'approved';
            renderVendorsTable();
            alert('Vendor approved successfully!');
        }
    }
}

function banVendor(id) {
    if (window.MultiMartAPI) {
        if (confirm('Are you sure you want to ban this vendor?')) {
            window.MultiMartAPI.updateAdminVendorStatus(id, 'banned')
                .then(() => {
                    alert('Vendor banned!');
                    hydrateAdminTablesFromApi();
                    loadLiveAdminOverview();
                })
                .catch(error => {
                    alert(error.message || 'Unable to ban vendor');
                });
        }
        return;
    }

    if (confirm('Are you sure you want to ban this vendor?')) {
        const vendor = vendorsData.find(v => v.id === id);
        if (vendor) {
            vendor.status = 'banned';
            renderVendorsTable();
            alert('Vendor banned!');
        }
    }
}

function viewProduct(id) {
    return legacyViewProduct(id);
    const product = productsData.find(p => p.id === id);
    if (product) {
        const content = `
            <div style="padding: 10px;">
                <img src="${product.image}" alt="${product.name}" style="width: 200px; height: 200px; object-fit: cover; border-radius: 8px; margin-bottom: 16px;">
                <p><strong>Product Name:</strong> ${product.name}</p>
                <p><strong>Vendor:</strong> ${product.vendor}</p>
                <p><strong>Category:</strong> ${product.category}</p>
                <p><strong>Price:</strong> ₹${product.price.toFixed(2)}</p>
                <p><strong>Status:</strong> <span class="badge ${product.status}">${product.status}</span></p>
            </div>
        `;
        openModal('Product Details', content);
    }
}

function approveProduct(id) {
    if (window.MultiMartAPI) {
        if (confirm('Are you sure you want to approve this product?')) {
            window.MultiMartAPI.updateAdminProductStatus(id, 'approved')
                .then(() => {
                    alert('Product approved successfully!');
                    hydrateAdminTablesFromApi();
                    loadLiveAdminOverview();
                })
                .catch(error => {
                    alert(error.message || 'Unable to approve product');
                });
        }
        return;
    }

    if (confirm('Are you sure you want to approve this product?')) {
        const product = productsData.find(p => p.id === id);
        if (product) {
            product.status = 'approved';
            renderProductsTable();
            alert('Product approved successfully!');
        }
    }
}

function rejectProduct(id) {
    if (window.MultiMartAPI) {
        const reason = prompt('Enter reason for rejection:');
        if (!reason) return;
        window.MultiMartAPI.updateAdminProductStatus(id, 'rejected')
            .then(() => {
                alert('Product rejected.');
                hydrateAdminTablesFromApi();
                loadLiveAdminOverview();
            })
            .catch(error => {
                alert(error.message || 'Unable to reject product');
            });
        return;
    }

    const reason = prompt('Enter reason for rejection:');
    if (reason) {
        const product = productsData.find(p => p.id === id);
        if (product) {
            product.status = 'rejected';
            renderProductsTable();
            alert('Product rejected with reason: ' + reason);
        }
    }
}

function deleteProduct(id) {
    if (confirm('Are you sure you want to delete this product?')) {
        const index = productsData.findIndex(p => p.id === id);
        if (index > -1) {
            productsData.splice(index, 1);
            renderProductsTable();
            alert('Product deleted!');
        }
    }
}

function viewOrder(id) {
    return legacyViewOrder(id);
    const order = ordersData.find(o => o.id === id);
    if (order) {
        const content = `
            <div style="padding: 10px;">
                <p><strong>Order ID:</strong> ${order.id}</p>
                <p><strong>Customer:</strong> ${order.customer}</p>
                <p><strong>Vendor:</strong> ${order.vendor}</p>
                <p><strong>Product:</strong> ${order.product}</p>
                <p><strong>Amount:</strong> ₹${order.amount.toFixed(2)}</p>
                <p><strong>Date:</strong> ${order.date}</p>
                <p><strong>Status:</strong> <span class="badge ${order.status}">${order.status}</span></p>
            </div>
        `;
        openModal('Order Details', content);
    }
}

function processOrder(id) {
    if (window.MultiMartAPI) {
        if (confirm('Mark this order as processing?')) {
            window.MultiMartAPI.updateOrderStatus(id, 'processing')
                .then(() => {
                    alert('Order status updated!');
                    hydrateAdminTablesFromApi();
                    loadLiveAdminOverview();
                })
                .catch(error => {
                    alert(error.message || 'Unable to update order');
                });
        }
        return;
    }

    if (confirm('Mark this order as processing?')) {
        const order = ordersData.find(o => o.id === id);
        if (order) {
            order.status = 'processing';
            renderOrdersTable();
            alert('Order status updated!');
        }
    }
}

function viewUser(id) {
    return legacyViewUser(id);
    const user = usersData.find(u => u.id === id);
    if (user) {
        const content = `
            <div style="padding: 10px;">
                <p><strong>User ID:</strong> ${user.id}</p>
                <p><strong>Name:</strong> ${user.name}</p>
                <p><strong>Email:</strong> ${user.email}</p>
                <p><strong>Type:</strong> ${user.type}</p>
                <p><strong>Join Date:</strong> ${user.joinDate}</p>
                <p><strong>Total Orders:</strong> ${user.orders}</p>
                <p><strong>Status:</strong> <span class="badge ${user.status}">${user.status}</span></p>
            </div>
        `;
        openModal('User Details', content);
    }
}

function editUser(id) {
    alert('Edit user: ' + id);
}

function banUser(id) {
    if (confirm('Are you sure you want to ban this user?')) {
        const user = usersData.find(u => u.id === id);
        if (user) {
            user.status = 'banned';
            renderUsersTable();
            alert('User banned!');
        }
    }
}

function viewComplaint(id) {
    const complaint = complaintsData.find(c => c.id === id);
    if (complaint) {
        const content = `
            <div style="padding: 10px;">
                <p><strong>Case ID:</strong> ${complaint.id}</p>
                <p><strong>Type:</strong> ${complaint.type}</p>
                <p><strong>Customer:</strong> ${complaint.customer}</p>
                <p><strong>Vendor:</strong> ${complaint.vendor}</p>
                <p><strong>Order ID:</strong> ${complaint.orderId}</p>
                <p><strong>Priority:</strong> <span class="badge ${complaint.priority}">${complaint.priority}</span></p>
                <p><strong>Status:</strong> <span class="badge ${complaint.status === 'inprogress' ? 'processing' : complaint.status}">${complaint.status}</span></p>
                <p><strong>Date:</strong> ${complaint.date}</p>
                <div style="margin-top: 16px;">
                    <strong>Action Required:</strong>
                    <p style="margin-top: 8px;">Please review the case and take appropriate action.</p>
                </div>
            </div>
        `;
        openModal('Complaint Details', content);
    }
}

function resolveComplaint(id) {
    const resolution = prompt('Enter resolution notes:');
    if (resolution) {
        const complaint = complaintsData.find(c => c.id === id);
        if (complaint) {
            complaint.status = 'resolved';
            renderComplaintsTable();
            alert('Complaint resolved with notes: ' + resolution);
        }
    }
}


// Charts sample dummy charts ,can be used later by real ones


function initializeCharts() {
    drawRevenueChart();
    drawOrderChart();
    drawSalesTrendChart();
    drawCategoryChart();
    drawTrafficChart();
}

function drawRevenueChart() {
    const canvas = document.getElementById('revenueCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.parentElement.offsetWidth;
    canvas.height = 280;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#9ca3af';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Waiting for live revenue data', canvas.width / 2, canvas.height / 2);
}

function drawOrderChart() {
    const canvas = document.getElementById('orderCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.parentElement.offsetWidth;
    canvas.height = 280;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#9ca3af';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Waiting for live order status data', canvas.width / 2, canvas.height / 2);
}

function drawSalesTrendChart() {
    const canvas = document.getElementById('salesTrendCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.parentElement.offsetWidth;
    canvas.height = 280;
    
    // Simple line chart
    const data = [45, 52, 48, 65, 72, 68, 75, 82, 78, 88, 95, 92];
    const padding = 40;
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding * 2;
    const maxValue = Math.max(...data);
    const stepX = chartWidth / (data.length - 1);
    
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 3;
    ctx.beginPath();
    
    data.forEach((value, index) => {
        const x = padding + index * stepX;
        const y = canvas.height - padding - (value / maxValue) * chartHeight;
        
        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
        
        // Draw points
        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();
        ctx.beginPath();
    });
    
    ctx.stroke();
}

function drawCategoryChart() {
    const canvas = document.getElementById('categoryCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.parentElement.offsetWidth;
    canvas.height = 280;
    
    // Horizontal bar chart
    const data = [
        { label: 'Electronics', value: 450 },
        { label: 'Fashion', value: 320 },
        { label: 'Home', value: 280 },
        { label: 'Sports', value: 190 },
        { label: 'Books', value: 150 }
    ];
    
    const maxValue = Math.max(...data.map(d => d.value));
    const barHeight = 30;
    const spacing = 20;
    
    data.forEach((item, index) => {
        const y = index * (barHeight + spacing) + 30;
        const barWidth = (item.value / maxValue) * (canvas.width - 180);
        
        ctx.fillStyle = '#3b82f6';
        ctx.fillRect(120, y, barWidth, barHeight);
        
        ctx.fillStyle = '#111827';
        ctx.font = '13px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(item.label, 110, y + barHeight / 2 + 5);
        ctx.textAlign = 'left';
        ctx.fillText(item.value.toString(), 130 + barWidth, y + barHeight / 2 + 5);
    });
}

function drawTrafficChart() {
    const canvas = document.getElementById('trafficCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.parentElement.offsetWidth;
    canvas.height = 280;
    
    // Pie chart
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 40;
    
    const data = [
        { label: 'Direct', value: 45, color: '#3b82f6' },
        { label: 'Social', value: 30, color: '#8b5cf6' },
        { label: 'Search', value: 15, color: '#10b981' },
        { label: 'Email', value: 10, color: '#f59e0b' }
    ];
    
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let currentAngle = -Math.PI / 2;
    
    data.forEach(item => {
        const sliceAngle = (item.value / total) * 2 * Math.PI;
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
        ctx.lineTo(centerX, centerY);
        ctx.fillStyle = item.color;
        ctx.fill();
        
        currentAngle += sliceAngle;
    });
}

function legacyCreateOrderRenderer(orders) {
    return function renderOrdersTableLive() {
        const tbody = document.getElementById('ordersTableBody');
        if (!tbody) return;

        tbody.innerHTML = orders.map(order => `
            <tr>
                <td><strong>${order.id}</strong></td>
                <td>${order.customer_name || '-'}</td>
                <td>${order.vendor || '-'}</td>
                <td>${order.product || '-'}</td>
                <td>${formatCurrencyINR(order.total_amount || 0)}</td>
                <td>${order.created_at ? new Date(order.created_at).toLocaleDateString('en-IN') : '-'}</td>
                <td><span class="badge ${order.order_status || 'pending'}">${order.order_status || 'pending'}</span></td>
                <td>
                    <button class="action-btn view" onclick="viewOrder('${order.id}')">View</button>
                    ${(order.order_status || 'pending') === 'pending'
                        ? `<button class="action-btn edit" onclick="processOrder('${order.id}')">Process</button>`
                        : ''}
                    ${['processing', 'shipped'].includes((order.order_status || '').toLowerCase())
                        ? `<button class="action-btn edit" onclick="markOrderDelivered('${order.id}')">Mark Delivered</button>`
                        : ''}
                </td>
            </tr>
        `).join('') || '<tr><td colspan="8">No orders found</td></tr>';
    };
}

function legacyViewVendor(id) {
    const vendor = LIVE_ADMIN_STATE.vendors.find(v => String(v.id) === String(id)) || vendorsData.find(v => v.id === id);
    if (!vendor) return;

    const content = `
        <div style="padding: 10px;">
            <p><strong>Store Name:</strong> ${vendor.store_name || vendor.storeName}</p>
            <p><strong>Owner:</strong> ${vendor.owner_name || vendor.ownerName || '-'}</p>
            <p><strong>Email:</strong> ${vendor.email}</p>
            <p><strong>Products:</strong> ${vendor.products_count || vendor.products || 0}</p>
            <p><strong>Revenue:</strong> ${vendor.revenue ? formatCurrencyINR(vendor.revenue) : '—'}</p>
            <p><strong>Status:</strong> <span class="badge ${vendor.status}">${vendor.status}</span></p>
        </div>
    `;
    openModal('Vendor Details', content);
}

function legacyViewProduct(id) {
    const product = LIVE_ADMIN_STATE.products.find(p => String(p.id) === String(id)) || productsData.find(p => p.id === id);
    if (!product) return;

    const content = `
        <div style="padding: 10px;">
            <img src="${product.image || product.image_url || ''}" alt="${product.name}" style="width: 200px; height: 200px; object-fit: cover; border-radius: 8px; margin-bottom: 16px;">
            <p><strong>Product Name:</strong> ${product.name}</p>
            <p><strong>Vendor:</strong> ${product.vendor_name || product.vendor || '-'}</p>
            <p><strong>Category:</strong> ${product.category}</p>
            <p><strong>Price:</strong> ${formatPrice(product.price)}</p>
            <p><strong>Status:</strong> <span class="badge ${product.status || 'approved'}">${product.status || 'approved'}</span></p>
        </div>
    `;
    openModal('Product Details', content);
}

function legacyViewOrder(id) {
    const order = LIVE_ADMIN_STATE.orders.find(o => String(o.id) === String(id)) || ordersData.find(o => o.id === id);
    if (!order) return;

    const content = `
        <div style="padding: 10px;">
            <p><strong>Order ID:</strong> ${order.id}</p>
            <p><strong>Customer:</strong> ${order.customer_name || order.customer || '-'}</p>
            <p><strong>Vendor:</strong> ${order.vendor || '-'}</p>
            <p><strong>Product:</strong> ${order.product || '-'}</p>
            <p><strong>Amount:</strong> ${formatCurrencyINR(order.total_amount || order.amount || 0)}</p>
            <p><strong>Date:</strong> ${order.created_at ? new Date(order.created_at).toLocaleDateString('en-IN') : order.date}</p>
            <p><strong>Status:</strong> <span class="badge ${order.order_status || order.status}">${order.order_status || order.status}</span></p>
        </div>
    `;
    openModal('Order Details', content);
}

function markOrderDelivered(id) {
    if (!window.MultiMartAPI) return;

    if (confirm('Mark this order as delivered?')) {
        window.MultiMartAPI.updateOrderStatus(id, 'delivered')
            .then(() => {
                alert('Order marked delivered!');
                hydrateAdminTablesFromApi();
                loadLiveAdminOverview();
            })
            .catch(error => {
                alert(error.message || 'Unable to mark delivered');
            });
    }
}

function legacyViewUser(id) {
    const user = LIVE_ADMIN_STATE.users.find(u => String(u.id) === String(id)) || usersData.find(u => u.id === id);
    if (!user) return;

    const content = `
        <div style="padding: 10px;">
            <p><strong>User ID:</strong> ${user.id}</p>
            <p><strong>Name:</strong> ${user.name}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Type:</strong> ${user.type || user.role}</p>
            <p><strong>Join Date:</strong> ${user.created_at ? new Date(user.created_at).toLocaleDateString('en-IN') : user.joinDate}</p>
            <p><strong>Total Orders:</strong> ${user.orders || 0}</p>
            <p><strong>Status:</strong> <span class="badge ${user.status || 'active'}">${user.status || 'active'}</span></p>
        </div>
    `;
    openModal('User Details', content);
}

async function loadLiveAdminPayouts() {
    if (!window.MultiMartAPI) return;

    try {
        const response = await window.MultiMartAPI.getAdminPayouts();
        const payouts = response.payouts || [];
        const summary = response.summary || {};
        const tbody = document.getElementById('payoutsTableBody');
        const miniStats = document.querySelectorAll('.payment-stats .mini-stat h3');

        if (miniStats[0]) miniStats[0].textContent = formatCurrencyINR(summary.totalPaidThisMonth || 0);
        if (miniStats[1]) miniStats[1].textContent = formatCurrencyINR(summary.pendingPayouts || 0);
        if (miniStats[2]) miniStats[2].textContent = formatCurrencyINR(summary.commissionEarned || 0);
        if (!tbody) return;

        tbody.innerHTML = payouts.map(payout => {
            const canMarkPaid = (payout.status || '').toLowerCase() === 'pending';
            const commissionRate = Number(payout.commission_rate || 0) / 100;
            const estimatedGross = commissionRate >= 1 ? Number(payout.amount || 0) : Number(payout.amount || 0) / (1 - commissionRate || 1);
            const estimatedCommission = Math.max(0, estimatedGross - Number(payout.amount || 0));

            return `
                <tr>
                    <td>${payout.id}</td>
                    <td>${payout.store_name || '-'}</td>
                    <td>${formatCurrencyINR(payout.amount)}</td>
                    <td>${formatCurrencyINR(estimatedCommission)}</td>
                    <td>${formatCurrencyINR(payout.amount || 0)}</td>
                    <td>${payout.created_at ? new Date(payout.created_at).toLocaleDateString('en-IN') : '-'}</td>
                    <td>
                        <span class="badge ${(payout.status || '').toLowerCase() === 'paid' ? 'delivered' : 'pending'}">${payout.status}</span>
                        ${canMarkPaid ? `<button class="action-btn edit" onclick="processPayout('${payout.id}')">Mark Paid</button>` : ''}
                    </td>
                </tr>
            `;
        }).join('') || '<tr><td colspan="7">No payout requests yet</td></tr>';
    } catch (error) {
        console.warn('Admin API payouts failed, using static payout table:', error.message);
    }
}

function processPayout(id) {
    if (!window.MultiMartAPI) return;

    if (confirm('Mark this payout as paid?')) {
        window.MultiMartAPI.updateAdminPayoutStatus(id, 'paid')
            .then(() => {
                alert('Payout marked paid!');
                loadLiveAdminPayouts();
                hydrateAdminTablesFromApi();
                loadLiveAdminOverview();
            })
            .catch(error => {
                alert(error.message || 'Unable to update payout');
            });
    }
}

async function loadLiveAdminComplaints() {
    if (!window.MultiMartAPI) return;

    try {
        const response = await window.MultiMartAPI.getAdminComplaints();
        LIVE_COMPLAINTS = response.complaints || [];
        const openCases = LIVE_COMPLAINTS.filter(item => (item.status || '').toLowerCase() === 'open').length;
        const badge = document.getElementById('complaintsOpenCount');
        if (badge) {
            badge.textContent = `${openCases} Open Cases`;
        }

        const tbody = document.getElementById('complaintsTableBody');
        if (!tbody) return;

        tbody.innerHTML = LIVE_COMPLAINTS.map(complaint => `
            <tr>
                <td><strong>${complaint.id}</strong></td>
                <td>${complaint.type}</td>
                <td>${complaint.customer_name || '-'}</td>
                <td>${complaint.vendor_name || '-'}</td>
                <td>${complaint.order_id || '-'}</td>
                <td><span class="badge ${complaint.priority}">${complaint.priority}</span></td>
                <td><span class="badge ${(complaint.status || '') === 'inprogress' ? 'processing' : complaint.status}">${complaint.status}</span></td>
                <td>${complaint.created_at ? new Date(complaint.created_at).toLocaleDateString('en-IN') : '-'}</td>
                <td>
                    <button class="action-btn view" onclick="viewComplaint('${complaint.id}')">Review</button>
                    ${['open', 'inprogress'].includes((complaint.status || '').toLowerCase())
                        ? `<button class="action-btn edit" onclick="resolveComplaint('${complaint.id}')">Resolve</button>`
                        : ''}
                </td>
            </tr>
        `).join('') || '<tr><td colspan="9">No complaints found</td></tr>';
    } catch (error) {
        console.warn('Admin API complaints failed, using static complaints table:', error.message);
    }
}

async function loadLiveAdminAnalytics() {
    if (!window.MultiMartAPI) return;

    try {
        const response = await window.MultiMartAPI.getAdminAnalytics();
        LIVE_ANALYTICS = response.analytics || {};

        setTextByLabel('Gross Revenue', formatCurrencyINR(LIVE_ANALYTICS.grossRevenue || 0));
        setTextByLabel('Net Profit', formatCurrencyINR(LIVE_ANALYTICS.netProfit || 0));
        setTextByLabel('Conversion Rate', `${Number(LIVE_ANALYTICS.conversionRate || 0).toFixed(1)}%`);
        setTextByLabel('Avg. Order Value', formatCurrencyINR(LIVE_ANALYTICS.averageOrderValue || 0));

        drawLiveSalesTrendChart(LIVE_ANALYTICS.salesTrend || []);
        drawLiveRevenueDashboardChart(LIVE_ANALYTICS.salesTrend || []);
        drawLiveCategoryChart(LIVE_ANALYTICS.topCategories || []);
        drawLiveTrafficChart(LIVE_ANALYTICS.paymentSources || []);
    } catch (error) {
        console.warn('Admin API analytics failed, using static charts:', error.message);
    }
}

async function loadLivePlatformSettings() {
    if (!window.MultiMartAPI) return;

    try {
        const response = await window.MultiMartAPI.getAdminSettings();
        LIVE_SETTINGS = response.settings || {};

        setFieldValue('settingsPlatformName', LIVE_SETTINGS.platform_name || 'MultiMart');
        setFieldValue('settingsSupportEmail', LIVE_SETTINGS.support_email || 'support@multimart.com');
        setSelectValue('settingsCurrencyCode', LIVE_SETTINGS.currency_code || 'INR');
        setSelectValue('settingsTimezoneName', LIVE_SETTINGS.timezone_name || 'IST');
        setCheckboxValue('settingsMaintenanceMode', LIVE_SETTINGS.maintenance_mode);
        setFieldValue('settingsSmtpHost', LIVE_SETTINGS.smtp_host || '');
        setFieldValue('settingsSmtpPort', LIVE_SETTINGS.smtp_port || 587);
        setCheckboxValue('settingsEmailNotifications', LIVE_SETTINGS.email_notifications);
        setCheckboxValue('settingsTwoFactorEnabled', LIVE_SETTINGS.two_factor_enabled);
        setCheckboxValue('settingsLoginNotifications', LIVE_SETTINGS.login_notifications);
        setFieldValue('settingsSessionTimeoutMinutes', LIVE_SETTINGS.session_timeout_minutes || 30);
        setFieldValue('settingsDefaultCommissionRate', LIVE_SETTINGS.default_commission_rate || 10);
        setSelectValue('settingsPayoutFrequency', LIVE_SETTINGS.payout_frequency || 'monthly');
        setFieldValue('settingsMinPayoutAmount', LIVE_SETTINGS.min_payout_amount || 100);
    } catch (error) {
        console.warn('Admin API settings failed, using static settings form:', error.message);
    }
}

function setFieldValue(id, value) {
    const element = document.getElementById(id);
    if (element) element.value = value;
}

function setCheckboxValue(id, value) {
    const element = document.getElementById(id);
    if (element) element.checked = Boolean(value);
}

function setSelectValue(id, value) {
    const element = document.getElementById(id);
    if (!element) return;

    const targetValue = String(value).toLowerCase();
    const option = Array.from(element.options).find(item => {
        const optionValue = String(item.value || item.textContent).toLowerCase();
        const optionText = String(item.textContent || '').toLowerCase();
        return optionValue === targetValue || optionText === targetValue || optionText.startsWith(targetValue);
    });
    if (option) {
        element.value = option.value || option.textContent;
    }
}

async function savePlatformSettings() {
    if (!window.MultiMartAPI) return;

    try {
        const response = await window.MultiMartAPI.updateAdminSettings({
            platformName: document.getElementById('settingsPlatformName')?.value,
            supportEmail: document.getElementById('settingsSupportEmail')?.value,
            currencyCode: document.getElementById('settingsCurrencyCode')?.value || 'INR',
            timezoneName: document.getElementById('settingsTimezoneName')?.value || 'IST',
            maintenanceMode: document.getElementById('settingsMaintenanceMode')?.checked,
            smtpHost: document.getElementById('settingsSmtpHost')?.value,
            smtpPort: document.getElementById('settingsSmtpPort')?.value,
            emailNotifications: document.getElementById('settingsEmailNotifications')?.checked,
            twoFactorEnabled: document.getElementById('settingsTwoFactorEnabled')?.checked,
            loginNotifications: document.getElementById('settingsLoginNotifications')?.checked,
            sessionTimeoutMinutes: document.getElementById('settingsSessionTimeoutMinutes')?.value,
            defaultCommissionRate: document.getElementById('settingsDefaultCommissionRate')?.value,
            minPayoutAmount: document.getElementById('settingsMinPayoutAmount')?.value,
            payoutFrequency: document.getElementById('settingsPayoutFrequency')?.value || 'monthly'
        });

        LIVE_SETTINGS = response.settings || LIVE_SETTINGS;
        alert(response.message || 'Platform settings updated successfully');
    } catch (error) {
        alert(error.message || 'Unable to save platform settings');
    }
}

function drawLiveSalesTrendChart(data) {
    const canvas = document.getElementById('salesTrendCanvas');
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.parentElement.offsetWidth;
    canvas.height = 280;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const values = data.map(item => Number(item.revenue || 0));
    if (!values.length) return;
    const maxValue = Math.max(...values, 1);
    ctx.strokeStyle = '#ff9900';
    ctx.lineWidth = 3;
    ctx.beginPath();
    values.forEach((value, index) => {
        const x = (canvas.width / Math.max(values.length - 1, 1)) * index;
        const y = canvas.height - ((value / maxValue) * (canvas.height - 30)) - 15;
        if (index === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();
}

function drawLiveRevenueDashboardChart(data) {
    const canvas = document.getElementById('revenueCanvas');
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.parentElement.offsetWidth;
    canvas.height = 280;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const values = data.map(item => Number(item.revenue || 0));
    const labels = data.map(item => {
        const date = new Date(item.day);
        return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-IN', { month: 'short' });
    });
    if (!values.length) return;

    const maxValue = Math.max(...values, 1);
    const barWidth = Math.max(18, (canvas.width / values.length) - 12);

    values.forEach((value, index) => {
        const barHeight = (value / maxValue) * (canvas.height - 42);
        const x = index * (barWidth + 8) + 20;
        const y = canvas.height - barHeight - 20;

        ctx.fillStyle = '#3b82f6';
        ctx.fillRect(x, y, barWidth, barHeight);

        ctx.fillStyle = '#9ca3af';
        ctx.font = '11px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(labels[index] || '', x + barWidth / 2, canvas.height - 5);
    });
}

function drawLiveOrderDashboardChart(orders) {
    const canvas = document.getElementById('orderCanvas');
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.parentElement.offsetWidth;
    canvas.height = 280;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const groups = [
        { label: 'Delivered', value: 0, color: '#10b981' },
        { label: 'Processing', value: 0, color: '#3b82f6' },
        { label: 'Pending', value: 0, color: '#f59e0b' },
        { label: 'Refunded', value: 0, color: '#ef4444' }
    ];

    (orders || []).forEach(order => {
        const status = String(order.order_status || '').toLowerCase();
        const payment = String(order.payment_status || '').toLowerCase();
        if (payment === 'refunded') groups[3].value += 1;
        else if (status === 'delivered') groups[0].value += 1;
        else if (['processing', 'shipped'].includes(status)) groups[1].value += 1;
        else groups[2].value += 1;
    });

    const total = groups.reduce((sum, item) => sum + item.value, 0) || 1;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 40;
    let currentAngle = -Math.PI / 2;

    groups.forEach(item => {
        const sliceAngle = (item.value / total) * 2 * Math.PI;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
        ctx.lineTo(centerX, centerY);
        ctx.fillStyle = item.color;
        ctx.fill();
        currentAngle += sliceAngle;
    });

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.6, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    ctx.font = '12px Arial';
    let legendY = 20;
    groups.forEach(item => {
        ctx.fillStyle = item.color;
        ctx.fillRect(20, legendY, 12, 12);
        ctx.fillStyle = '#111827';
        ctx.textAlign = 'left';
        ctx.fillText(`${item.label}: ${item.value}`, 38, legendY + 10);
        legendY += 20;
    });
}

function drawLiveCategoryChart(data) {
    const canvas = document.getElementById('categoryCanvas');
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.parentElement.offsetWidth;
    canvas.height = 280;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const maxValue = Math.max(...data.map(item => Number(item.value || 0)), 1);
    data.forEach((item, index) => {
        const width = ((Number(item.value || 0) / maxValue) * (canvas.width - 140));
        const y = 24 + index * 42;
        ctx.fillStyle = '#ff9900';
        ctx.fillRect(120, y, width, 18);
        ctx.fillStyle = '#d1d5db';
        ctx.font = '12px Arial';
        ctx.fillText(item.label, 10, y + 14);
    });
}

function drawLiveTrafficChart(data) {
    const canvas = document.getElementById('trafficCanvas');
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.parentElement.offsetWidth;
    canvas.height = 280;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 40;
    const total = data.reduce((sum, item) => sum + Number(item.value || 0), 0) || 1;
    const colors = ['#ff9900', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
    let startAngle = -Math.PI / 2;

    data.forEach((item, index) => {
        const slice = (Number(item.value || 0) / total) * 2 * Math.PI;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, startAngle + slice);
        ctx.closePath();
        ctx.fillStyle = colors[index % colors.length];
        ctx.fill();
        startAngle += slice;
    });
}

function viewComplaint(id) {
    const complaint = LIVE_COMPLAINTS.find(item => String(item.id) === String(id)) || complaintsData.find(c => c.id === id);
    if (!complaint) return;

    const content = `
        <div style="padding: 10px;">
            <p><strong>Case ID:</strong> ${complaint.id}</p>
            <p><strong>Type:</strong> ${complaint.type}</p>
            <p><strong>Customer:</strong> ${complaint.customer_name || complaint.customer || '-'}</p>
            <p><strong>Vendor:</strong> ${complaint.vendor_name || complaint.vendor || '-'}</p>
            <p><strong>Order ID:</strong> ${complaint.order_id || complaint.orderId || '-'}</p>
            <p><strong>Priority:</strong> <span class="badge ${complaint.priority}">${complaint.priority}</span></p>
            <p><strong>Status:</strong> <span class="badge ${(complaint.status || '') === 'inprogress' ? 'processing' : complaint.status}">${complaint.status}</span></p>
            <p><strong>Date:</strong> ${complaint.created_at ? new Date(complaint.created_at).toLocaleDateString('en-IN') : complaint.date}</p>
            <div style="margin-top: 16px;">
                <strong>Message:</strong>
                <p style="margin-top: 8px;">${complaint.message || 'Please review the case and take appropriate action.'}</p>
            </div>
        </div>
    `;
    openModal('Complaint Details', content);
}

function resolveComplaint(id) {
    if (window.MultiMartAPI) {
        window.MultiMartAPI.updateAdminComplaintStatus(id, 'resolved')
            .then(() => {
                alert('Complaint resolved successfully');
                loadLiveAdminComplaints();
            })
            .catch(error => {
                alert(error.message || 'Unable to resolve complaint');
            });
        return;
    }
}
