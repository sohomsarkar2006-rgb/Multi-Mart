// ========== ADMIN DASHBOARD - COMPREHENSIVE INTEGRATION ==========
if (typeof APP_CONFIG === 'undefined') window.APP_CONFIG = { ORDERS_KEY: 'orders_db' };

let ORDERS_DB = [{
    id: 'order_1',
    customerId: 'user_1',
    customerName: 'John Doe',
    customerEmail: 'customer@test.com',
    items: [{ productId: 'prod_1', name: 'Wireless Bluetooth Headphones', price: 79.99, quantity: 1, vendorId: 'vendor_1', vendorName: 'Tech Paradise' }],
    subtotal: 79.99,
    tax: 4.00,
    shipping: 5.99,
    total: 89.98,
    status: 'delivered',
    paymentMethod: 'Credit Card',
    shippingAddress: '123 Main St, City, State 12345',
    createdAt: '2024-02-01T10:30:00',
    updatedAt: '2024-02-05T14:20:00'
}];

const storedOrdersRaw = localStorage.getItem(APP_CONFIG.ORDERS_KEY);
if (storedOrdersRaw) {
    try {
        const parsed = JSON.parse(storedOrdersRaw);
        if (Array.isArray(parsed)) ORDERS_DB = parsed;
    } catch {}
}

// ========== CORE UTILITIES ==========
function saveOrdersToStorage() { try { localStorage.setItem(APP_CONFIG.ORDERS_KEY, JSON.stringify(ORDERS_DB)); } catch {} }
function getAllOrders() { return Array.isArray(ORDERS_DB) ? [...ORDERS_DB] : []; }
function formatPriceSafe(val) { if (typeof formatPrice === 'function') return formatPrice(val); return '₹' + Number(val || 0).toFixed(2); }
function showToastSafe(msg, type) { if (typeof showToast === 'function') showToast(msg, type); else console.log(msg); }

// ========== INITIALIZATION ==========
function initAdminDashboard() {
    if (typeof requireAuth !== 'function') return;
    if (!requireAuth('admin')) return;
    displayAdminInfo();
    setupNavigation();
    loadAdminDashboard();
}

function displayAdminInfo() {
    if (typeof getCurrentUser !== 'function') return;
    const user = getCurrentUser();
    if (!user) return;
    document.querySelectorAll('.user-name, .admin-user-name').forEach(el => 
        el.textContent = user.name || 'Admin'
    );
}

// ========== NAVIGATION & VIEW SWITCHING ==========
function setupNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            switchSection(section);
        });
    });
}

function switchSection(section) {
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    
    const sectionEl = document.getElementById(section);
    const navItem = document.querySelector(`[data-section="${section}"]`);
    
    if (sectionEl) {
        sectionEl.classList.add('active');
        navItem?.classList.add('active');
    }
    
    loadSectionData(section);
}

function loadSectionData(section) {
    const loaders = {
        dashboard: loadAdminDashboard,
        vendors: loadVendorsManagement,
        products: loadProductApproval,
        orders: loadOrdersManagement,
        payments: loadPaymentsAndCommission,
        users: loadUserManagement,
        analytics: loadAnalyticsSection,
        complaints: loadComplaints,
        settings: loadSettings
    };
    
    if (loaders[section]) loaders[section]();
}

// ========== DASHBOARD OVERVIEW ==========
function loadAdminDashboard() {
    if (typeof getAllProducts !== 'function' || typeof getAllUsers !== 'function') return;
    
    const allProducts = getAllProducts() || [];
    const allOrders = getAllOrders();
    const allUsers = (getAllUsers().success ? getAllUsers().users : []);
    const allVendors = typeof getAllVendorsData === 'function' ? getAllVendorsData() : [];
    
    const totalRevenue = allOrders.reduce((s, o) => s + (o.total || 0), 0);
    const totalOrders = allOrders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const pendingOrders = allOrders.filter(o => o.status === 'pending').length;
    
    updateStatCard('totalRevenue', formatPriceSafe(totalRevenue));
    updateStatCard('totalOrders', totalOrders);
    updateStatCard('activeVendors', allVendors.length);
    updateStatCard('totalUsers', allUsers.length);
    
    loadRevenueChart();
    loadOrderDistributionChart();
    loadRecentActivity();
}

function updateStatCard(id, value) {
    const el = document.querySelector(`[data-stat="${id}"] .stat-value`) || document.getElementById(id);
    if (el) el.textContent = value;
}

function loadRecentActivity() {
    const container = document.getElementById('recentActivityList');
    if (!container) return;
    
    const allOrders = getAllOrders().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10);
    const allProducts = getAllProducts() || [];
    const pendingProducts = allProducts.filter(p => p.status === 'pending');
    
    let html = '';
    
    pendingProducts.slice(0, 2).forEach(p => {
        html += `<div class="activity-item"><span class="activity-icon">📦</span><div class="activity-details"><p><strong>Product pending:</strong> ${p.name}</p><span class="activity-time">Pending approval</span></div></div>`;
    });
    
    allOrders.forEach(o => {
        const icon = o.status === 'delivered' ? '✅' : '📦';
        html += `<div class="activity-item"><span class="activity-icon">${icon}</span><div class="activity-details"><p><strong>Order #${o.id?.slice(-8)}:</strong> ${o.customerName || 'Unknown'}</p><span class="activity-time">${new Date(o.createdAt).toLocaleDateString()} — ${formatPriceSafe(o.total)}</span></div></div>`;
    });
    
    container.innerHTML = html || '<p>No recent activity</p>';
}

function loadRevenueChart() {
    const canvas = document.getElementById('revenueCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const allOrders = getAllOrders();
    const days = 30;
    const data = {};
    
    for (let i = 0; i < days; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        data[key] = (data[key] || 0) + allOrders
            .filter(o => o.createdAt.startsWith(key))
            .reduce((s, o) => s + (o.total || 0), 0);
    }
    
    const labels = Object.keys(data).reverse();
    const revenues = labels.map(k => data[k]);
    
    drawLineChart(ctx, labels, revenues, 'Revenue (₹)', '#ff9900');
}

function loadOrderDistributionChart() {
    const canvas = document.getElementById('orderCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const allOrders = getAllOrders();
    const statuses = { pending: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0 };
    
    allOrders.forEach(o => {
        if (statuses.hasOwnProperty(o.status)) statuses[o.status]++;
    });
    
    drawPieChart(ctx, Object.keys(statuses), Object.values(statuses));
}

// ========== VENDORS MANAGEMENT ==========
function loadVendorsManagement() {
    const container = document.getElementById('vendorsTableBody');
    if (!container) return;
    
    const allVendors = typeof getAllVendorsData === 'function' ? getAllVendorsData() : [];
    
    if (!allVendors.length) {
        container.innerHTML = '<tr><td colspan="8">No vendors found</td></tr>';
        return;
    }
    
    container.innerHTML = allVendors.map(v => {
        const vendorProducts = typeof getProductsByVendor === 'function' ? getProductsByVendor(v.id) : [];
        const vendorOrders = getAllOrders().filter(o => o.items?.some(item => item.vendorId === v.id));
        const revenue = vendorOrders.reduce((s, o) => s + (o.total || 0), 0);
        
        return `
        <tr>
            <td>${v.id}</td>
            <td><strong>${v.storeName || v.name}</strong></td>
            <td>${v.ownerName || v.contactPerson || 'N/A'}</td>
            <td>${v.email}</td>
            <td>${vendorProducts.length}</td>
            <td>${formatPriceSafe(revenue)}</td>
            <td><span class="badge ${v.status === 'approved' ? 'approved' : 'pending'}">${v.status}</span></td>
            <td>
                ${v.status === 'pending' ? `<button class="action-btn" onclick="approveVendor('${v.id}')">Approve</button>` : ''}
                <button class="action-btn delete" onclick="rejectVendor('${v.id}')">Ban</button>
                <button class="action-btn" onclick="viewVendorDetails('${v.id}')">Details</button>
            </td>
        </tr>
        `;
    }).join('');
}

function approveVendor(vendorId) {
    if (typeof getAllVendorsData !== 'function') return;
    const vendors = getAllVendorsData();
    const vendor = vendors.find(v => v.id === vendorId);
    if (!vendor) return;
    
    vendor.status = 'approved';
    vendor.approvedAt = new Date().toISOString();
    localStorage.setItem('vendors_db', JSON.stringify(vendors));
    
    showToastSafe('Vendor approved successfully', 'success');
    loadVendorsManagement();
}

function rejectVendor(vendorId) {
    if (!confirm('Ban this vendor?')) return;
    if (typeof getAllVendorsData !== 'function') return;
    
    const vendors = getAllVendorsData();
    const vendor = vendors.find(v => v.id === vendorId);
    if (!vendor) return;
    
    vendor.status = 'banned';
    vendor.bannedAt = new Date().toISOString();
    localStorage.setItem('vendors_db', JSON.stringify(vendors));
    
    showToastSafe('Vendor banned successfully', 'success');
    loadVendorsManagement();
}

// ========== PRODUCT APPROVAL ==========
function loadProductApproval() {
    const container = document.getElementById('productsTableBody');
    if (!container || typeof getAllProducts !== 'function') return;
    
    const allProducts = getAllProducts();
    const pendingProducts = allProducts.filter(p => p.status === 'pending');
    
    if (!pendingProducts.length) {
        container.innerHTML = '<tr><td colspan="8">No pending products</td></tr>';
        return;
    }
    
    container.innerHTML = pendingProducts.map(p => `
    <tr>
        <td>${p.id}</td>
        <td><img src="${p.image || 'placeholder.jpg'}" alt="${p.name}" style="width:40px;height:40px;border-radius:4px;"></td>
        <td><strong>${p.name}</strong></td>
        <td>${p.vendorName || 'Unknown'}</td>
        <td>${p.category}</td>
        <td>${formatPriceSafe(p.price)}</td>
        <td><span class="badge pending">${p.status}</span></td>
        <td>
            <button class="action-btn" onclick="approveProduct('${p.id}')">Approve</button>
            <button class="action-btn delete" onclick="rejectProduct('${p.id}')">Reject</button>
            <button class="action-btn" onclick="viewProductDetails('${p.id}')">View</button>
        </td>
    </tr>
    `).join('');
}

function approveProduct(productId) {
    if (typeof getAllProducts !== 'function' || typeof saveProductsToStorage !== 'function') return;
    
    const products = getAllProducts();
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    product.status = 'approved';
    product.approvedAt = new Date().toISOString();
    saveProductsToStorage(products);
    
    showToastSafe('Product approved successfully', 'success');
    loadProductApproval();
}

function rejectProduct(productId) {
    if (!confirm('Reject this product?')) return;
    if (typeof deleteProduct !== 'function') return;
    
    const result = deleteProduct(productId);
    if (result?.success) {
        showToastSafe('Product rejected successfully', 'success');
        loadProductApproval();
    }
}

// ========== ORDERS & REFUNDS MANAGEMENT ==========
function loadOrdersManagement() {
    const container = document.getElementById('ordersTableBody');
    if (!container) return;
    
    const allOrders = getAllOrders();
    
    if (!allOrders.length) {
        container.innerHTML = '<tr><td colspan="8">No orders found</td></tr>';
        return;
    }
    
    container.innerHTML = allOrders.map(o => {
        const product = o.items?.[0] || {};
        return `
        <tr>
            <td><strong>#${o.id?.slice(-8)}</strong></td>
            <td>${o.customerName || 'Unknown'}</td>
            <td>${o.items?.[0]?.vendorName || 'N/A'}</td>
            <td>${product.name || 'N/A'}</td>
            <td>${formatPriceSafe(o.total)}</td>
            <td>${new Date(o.createdAt).toLocaleDateString()}</td>
            <td><span class="badge ${getStatusClass(o.status)}">${o.status}</span></td>
            <td>
                <button class="action-btn" onclick="viewOrder('${o.id}')">View</button>
                ${o.status !== 'delivered' ? `<button class="action-btn" onclick="updateOrderStatus('${o.id}', 'delivered')">Mark Delivered</button>` : ''}
            </td>
        </tr>
        `;
    }).join('');
}

function getStatusClass(status) {
    const classes = {
        pending: 'pending',
        processing: 'processing',
        shipped: 'shipped',
        delivered: 'delivered',
        cancelled: 'cancelled',
        refund: 'pending'
    };
    return classes[status] || 'default';
}

function updateOrderStatus(orderId, newStatus) {
    const order = getAllOrders().find(o => o.id === orderId);
    if (!order) return;
    
    order.status = newStatus;
    order.updatedAt = new Date().toISOString();
    saveOrdersToStorage();
    
    showToastSafe('Order status updated', 'success');
    loadOrdersManagement();
}


// ========== PAYMENTS & COMMISSION ==========
function loadPaymentsAndCommission() {
    loadCommissionStats();
    loadVendorPayoutTable();
}

function loadCommissionStats() {
    const allOrders = getAllOrders();
    const totalRevenue = allOrders.reduce((s, o) => s + (o.total || 0), 0);
    const commission = totalRevenue * 0.15;
    const vendorEarnings = totalRevenue - commission;
    
    const stats = document.querySelectorAll('.mini-stat');
    if (stats[0]) stats[0].innerHTML = `<p>Platform Revenue</p><h3>${formatPriceSafe(commission)}</h3>`;
    if (stats[1]) stats[1].innerHTML = `<p>Vendor Earnings</p><h3>${formatPriceSafe(vendorEarnings)}</h3>`;
    if (stats[2]) stats[2].innerHTML = `<p>Pending Payouts</p><h3>${formatPriceSafe(vendorEarnings * 0.2)}</h3>`;
}

function loadVendorPayoutTable() {
    const allVendors = typeof getAllVendorsData === 'function' ? getAllVendorsData() : [];
    
    allVendors.forEach(vendor => {
        const vendorOrders = getAllOrders().filter(o => o.items?.some(item => item.vendorId === vendor.id));
        vendor.totalEarnings = vendorOrders.reduce((s, o) => s + (o.total || 0), 0) * 0.85;
        vendor.pendingPayout = vendor.totalEarnings * 0.4;
    });
}

// ========== USER MANAGEMENT ==========
function loadUserManagement() {
    const container = document.getElementById('usersTableBody');
    if (!container || typeof getAllUsers !== 'function') return;
    
    const result = getAllUsers();
    const users = result.success ? result.users : [];
    
    if (!users.length) {
        container.innerHTML = '<tr><td colspan="6">No users found</td></tr>';
        return;
    }
    
    container.innerHTML = users.map(u => `
    <tr>
        <td>${u.id}</td>
        <td><strong>${u.name}</strong></td>
        <td>${u.email}</td>
        <td>${u.phone || 'N/A'}</td>
        <td><span class="badge ${u.banned ? 'cancelled' : 'delivered'}">
            ${u.banned ? 'Banned' : 'Active'}
        </span></td>
        <td>
            <button class="action-btn" onclick="viewUserDetails('${u.id}')">View</button>
            <button class="action-btn delete" onclick="banUser('${u.id}')">Ban</button>
        </td>
    </tr>
    `).join('');
}

function banUser(userId) {
    if (!confirm('Ban this user?')) return;
    if (typeof getAllUsers !== 'function') return;
    
    const result = getAllUsers();
    const users = result.users || [];
    const user = users.find(u => u.id === userId);
    
    if (user) {
        user.banned = true;
        localStorage.setItem('users_db', JSON.stringify(users));
        showToastSafe('User banned successfully', 'success');
        loadUserManagement();
    }
}

// ========== ANALYTICS SECTION ==========
function loadAnalyticsSection() {
    loadAnalyticsCharts();
    loadTopMetrics();
}

function loadAnalyticsCharts() {
    loadVendorPerformanceChart();
    loadCategoryPerformanceChart();
    loadMonthlyTrendsChart();
}

function loadVendorPerformanceChart() {
    const allVendors = typeof getAllVendorsData === 'function' ? getAllVendorsData() : [];
    const allOrders = getAllOrders();
    
    const vendorData = allVendors.slice(0, 5).map(v => {
        const revenue = allOrders
            .filter(o => o.items?.some(item => item.vendorId === v.id))
            .reduce((s, o) => s + (o.total || 0), 0);
        return { name: v.storeName || v.name, revenue };
    });
    
    const canvas = document.getElementById('vendorPerformanceCanvas');
    if (canvas && vendorData.length) {
        const ctx = canvas.getContext('2d');
        drawBarChart(ctx, 
            vendorData.map(v => v.name),
            vendorData.map(v => v.revenue),
            'Vendor Revenue (₹)'
        );
    }
}

function loadCategoryPerformanceChart() {
    const allProducts = getAllProducts() || [];
    const allOrders = getAllOrders();
    
    const categories = {};
    allProducts.forEach(p => {
        if (!categories[p.category]) categories[p.category] = 0;
        const productOrders = allOrders.filter(o => o.items?.some(item => item.productId === p.id));
        categories[p.category] += productOrders.reduce((s, o) => s + (o.total || 0), 0);
    });
    
    const canvas = document.getElementById('categoryPerformanceCanvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        drawBarChart(ctx,
            Object.keys(categories),
            Object.values(categories),
            'Category Revenue (₹)'
        );
    }
}

function loadMonthlyTrendsChart() {
    const allOrders = getAllOrders();
    const months = {};
    
    for (let i = 0; i < 12; i++) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const monthKey = d.toISOString().slice(0, 7);
        months[monthKey] = (months[monthKey] || 0) + allOrders
            .filter(o => o.createdAt.startsWith(monthKey))
            .reduce((s, o) => s + (o.total || 0), 0);
    }
    
    const canvas = document.getElementById('monthlyTrendsCanvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        const labels = Object.keys(months).reverse();
        drawLineChart(ctx, labels, labels.map(k => months[k]), 'Monthly Revenue (₹)', '#ff9900');
    }
}

function loadTopMetrics() {
    const allProducts = getAllProducts() || [];
    const allOrders = getAllOrders();
    const allUsers = (typeof getAllUsers === 'function' && getAllUsers().success) ? getAllUsers().users : [];
    
    const topProducts = allProducts.slice(0, 5).map(p => ({
        name: p.name,
        orders: allOrders.filter(o => o.items?.some(item => item.productId === p.id)).length
    }));
    
    const html = `
    <h3>Platform Metrics</h3>
    <div class="metrics-grid">
        <div class="metric-card">
            <h4>Total Revenue</h4>
            <p class="metric-value">${formatPriceSafe(allOrders.reduce((s, o) => s + (o.total || 0), 0))}</p>
        </div>
        <div class="metric-card">
            <h4>Total Orders</h4>
            <p class="metric-value">${allOrders.length}</p>
        </div>
        <div class="metric-card">
            <h4>Total Products</h4>
            <p class="metric-value">${allProducts.length}</p>
        </div>
        <div class="metric-card">
            <h4>Active Users</h4>
            <p class="metric-value">${allUsers.filter(u => !u.banned).length}</p>
        </div>
        <div class="metric-card">
            <h4>Avg Order Value</h4>
            <p class="metric-value">${formatPriceSafe(allOrders.length > 0 ? allOrders.reduce((s, o) => s + (o.total || 0), 0) / allOrders.length : 0)}</p>
        </div>
        <div class="metric-card">
            <h4>Top Product</h4>
            <p class="metric-value">${topProducts[0]?.name || 'N/A'}</p>
        </div>
    </div>
    `;
    
    const container = document.querySelector('[data-section="analytics"]') || document.getElementById('analytics');
    const metricsContainer = container?.querySelector('.metrics-container');
    if (metricsContainer) metricsContainer.innerHTML = html;
}

// ========== COMPLAINTS & DISPUTES ==========
function loadComplaints() {
    const allOrders = getAllOrders();
    const complaints = allOrders.filter(o => o.complaint || o.dispute);
    
    const container = document.getElementById('complaintsTableBody');
    if (!container) return;
    
    if (!complaints.length) {
        container.innerHTML = '<tr><td colspan="6">No complaints</td></tr>';
        return;
    }
    
    container.innerHTML = complaints.map(c => `
    <tr>
        <td>#${c.id?.slice(-8)}</td>
        <td>${c.customerName}</td>
        <td>${c.complaint || c.dispute || 'N/A'}</td>
        <td>${new Date(c.createdAt).toLocaleDateString()}</td>
        <td><span class="badge pending">Open</span></td>
        <td>
            <button class="action-btn" onclick="resolveComplaint('${c.id}')">Resolve</button>
            <button class="action-btn delete" onclick="rejectComplaint('${c.id}')">Close</button>
        </td>
    </tr>
    `).join('') || '<tr><td colspan="6">No complaints</td></tr>';
}

function resolveComplaint(orderId) {
    const order = getAllOrders().find(o => o.id === orderId);
    if (!order) return;
    
    order.complaintStatus = 'resolved';
    saveOrdersToStorage();
    
    showToastSafe('Complaint resolved', 'success');
    loadComplaints();
}

function rejectComplaint(orderId) {
    if (!confirm('Close this complaint?')) return;
    
    const order = getAllOrders().find(o => o.id === orderId);
    if (!order) return;
    
    order.complaintStatus = 'closed';
    saveOrdersToStorage();
    
    showToastSafe('Complaint closed', 'success');
    loadComplaints();
}

// ========== SETTINGS ==========
function loadSettings() {
    const settings = JSON.parse(localStorage.getItem('admin_settings') || '{}');
    
    const container = document.getElementById('settingsContainer');
    if (container) {
        container.innerHTML = `
        <h3>Platform Settings</h3>
        <div class="settings-form">
            <div class="setting-item">
                <label>Commission Rate (%):</label>
                <input type="number" id="commissionRate" value="${settings.commissionRate || 15}" min="0" max="100">
            </div>
            <div class="setting-item">
                <label>Tax Rate (%):</label>
                <input type="number" id="taxRate" value="${settings.taxRate || 5}" min="0" max="100">
            </div>
            <div class="setting-item">
                <label>Min Payout (₹):</label>
                <input type="number" id="minPayout" value="${settings.minPayout || 100}" min="0">
            </div>
            <button class="btn-primary" onclick="saveAdminSettings()">Save Settings</button>
        </div>
        `;
    }
}

function saveAdminSettings() {
    const settings = {
        commissionRate: parseInt(document.getElementById('commissionRate')?.value || 15),
        taxRate: parseInt(document.getElementById('taxRate')?.value || 5),
        minPayout: parseInt(document.getElementById('minPayout')?.value || 100)
    };
    
    localStorage.setItem('admin_settings', JSON.stringify(settings));
    showToastSafe('Settings saved successfully', 'success');
}

// ========== CHART UTILITIES ==========
function drawLineChart(ctx, labels, data, label, color = '#ff9900') {
    if (!ctx || !data.length) return;
    
    const padding = 50;
    const width = ctx.canvas.width - 2 * padding;
    const height = ctx.canvas.height - 2 * padding;
    
    const maxValue = Math.max(...data) || 100;
    const xStep = width / (data.length - 1 || 1);
    const yScale = height / maxValue;
    
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 5; i++) {
        const y = padding + (height / 5) * i;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(ctx.canvas.width - padding, y);
        ctx.stroke();
    }
    
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    data.forEach((point, i) => {
        const x = padding + i * xStep;
        const y = ctx.canvas.height - padding - point * yScale;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.stroke();
    
    ctx.fillStyle = color;
    data.forEach((point, i) => {
        const x = padding + i * xStep;
        const y = ctx.canvas.height - padding - point * yScale;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
    });
}

function drawBarChart(ctx, labels, data, label) {
    if (!ctx || !data.length) return;
    
    const padding = 50;
    const width = ctx.canvas.width - 2 * padding;
    const height = ctx.canvas.height - 2 * padding;
    const barWidth = width / data.length * 0.7;
    const spacing = width / data.length;
    
    const maxValue = Math.max(...data) || 100;
    const yScale = height / maxValue;
    
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    ctx.fillStyle = '#ff9900';
    data.forEach((value, i) => {
        const x = padding + i * spacing + (spacing - barWidth) / 2;
        const barHeight = value * yScale;
        const y = ctx.canvas.height - padding - barHeight;
        
        ctx.fillRect(x, y, barWidth, barHeight);
        
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(labels[i], x + barWidth / 2, ctx.canvas.height - padding + 20);
        ctx.fillStyle = '#ff9900';
    });
}

function drawPieChart(ctx, labels, data) {
    if (!ctx || !data.length) return;
    
    const centerX = ctx.canvas.width / 2;
    const centerY = ctx.canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 20;
    const colors = ['#ff9900', '#067d62', '#c7511f', '#f7ca00', '#0f172a'];
    
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    let currentAngle = -Math.PI / 2;
    const total = data.reduce((s, v) => s + v, 0);
    
    data.forEach((value, i) => {
        const sliceAngle = (value / total) * Math.PI * 2;
        
        ctx.fillStyle = colors[i % colors.length];
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
        ctx.lineTo(centerX, centerY);
        ctx.fill();
        
        const labelAngle = currentAngle + sliceAngle / 2;
        const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);
        const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${Math.round(value / total * 100)}%`, labelX, labelY);
        
        currentAngle += sliceAngle;
    });
}

// ========== HELPER FUNCTIONS ==========
function viewOrder(orderId) {
    const order = getAllOrders().find(o => o.id === orderId);
    if (order) {
        alert(`Order #${order.id}\nCustomer: ${order.customerName}\nTotal: ${formatPriceSafe(order.total)}\nStatus: ${order.status}`);
    }
}

function viewUserDetails(userId) {
    if (typeof getAllUsers !== 'function') return;
    const result = getAllUsers();
    const user = result.users?.find(u => u.id === userId);
    if (user) {
        alert(`User: ${user.name}\nEmail: ${user.email}\nPhone: ${user.phone || 'N/A'}\nStatus: ${user.banned ? 'Banned' : 'Active'}`);
    }
}

function viewProductDetails(productId) {
    if (typeof getProductById !== 'function') return;
    const product = getProductById(productId);
    if (product) {
        alert(`Product: ${product.name}\nPrice: ${formatPriceSafe(product.price)}\nVendor: ${product.vendorName}\nCategory: ${product.category}`);
    }
}

function viewVendorDetails(vendorId) {
    if (typeof getAllVendorsData !== 'function') return;
    const vendors = getAllVendorsData();
    const vendor = vendors.find(v => v.id === vendorId);
    if (vendor) {
        alert(`Vendor: ${vendor.storeName}\nOwner: ${vendor.ownerName}\nEmail: ${vendor.email}\nStatus: ${vendor.status}`);
    }
}

function handleLogout() {
    if (!confirm('Logout?')) return;
    if (typeof logout === 'function') logout();
    window.location.href = 'login.html';
}
