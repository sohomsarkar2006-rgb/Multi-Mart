
// admin dashboard
//till javascript(basic) bhaskar


// Session storage key
const ADMIN_SESSION_KEY = 'adminLoggedIn';
const ADMIN_EMAIL_KEY = 'adminEmail';

// Check authentication on page load
document.addEventListener('DOMContentLoaded', function() {
    if (!isAdminAuthenticated()) {
        window.location.href = 'admin-login.html';
        return;
    }
    
    initializeApp();
    displayAdminInfo();
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

// Sample Data for showing(from internet)
const vendorsData = [
    { id: 'VND001', storeName: 'TechWorld', ownerName: 'John Smith', email: 'john@techworld.com', products: 45, revenue: 12580.50, status: 'approved' },
    { id: 'VND002', storeName: 'GadgetHub', ownerName: 'Sarah Johnson', email: 'sarah@gadgethub.com', products: 32, revenue: 9845.25, status: 'approved' },
    { id: 'VND003', storeName: 'SportZone', ownerName: 'Mike Davis', email: 'mike@sportzone.com', products: 28, revenue: 7650.00, status: 'approved' },
    { id: 'VND004', storeName: 'FashionPro', ownerName: 'Emily Chen', email: 'emily@fashionpro.com', products: 0, revenue: 0, status: 'pending' },
    { id: 'VND005', storeName: 'HomeEssentials', ownerName: 'David Wilson', email: 'david@homeessentials.com', products: 18, revenue: 5420.75, status: 'approved' },
    { id: 'VND006', storeName: 'BadVendor', ownerName: 'Spam User', email: 'spam@bad.com', products: 2, revenue: 150.00, status: 'banned' },
];

const productsData = [
    { id: 'PRD001', name: 'Wireless Headphones', vendor: 'TechWorld', category: 'Electronics', price: 79.99, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100', status: 'approved' },
    { id: 'PRD002', name: 'Smart Watch Pro', vendor: 'GadgetHub', category: 'Electronics', price: 299.99, image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100', status: 'pending' },
    { id: 'PRD003', name: 'Running Shoes', vendor: 'SportZone', category: 'Sports', price: 89.99, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100', status: 'approved' },
    { id: 'PRD004', name: 'Designer Handbag', vendor: 'FashionPro', category: 'Fashion', price: 159.99, image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=100', status: 'pending' },
    { id: 'PRD005', name: 'Coffee Maker', vendor: 'HomeEssentials', category: 'Home', price: 129.99, image: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=100', status: 'approved' },
    { id: 'PRD006', name: 'Fake Product', vendor: 'BadVendor', category: 'Other', price: 9.99, image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100', status: 'rejected' },
];

const ordersData = [
    { id: 'ORD12458', customer: 'Alice Brown', vendor: 'TechWorld', product: 'Wireless Headphones', amount: 79.99, date: '2026-02-08', status: 'delivered' },
    { id: 'ORD12459', customer: 'Bob Williams', vendor: 'GadgetHub', product: 'Smart Watch Pro', amount: 299.99, date: '2026-02-08', status: 'processing' },
    { id: 'ORD12460', customer: 'Carol Martinez', vendor: 'SportZone', product: 'Running Shoes', amount: 89.99, date: '2026-02-07', status: 'shipped' },
    { id: 'ORD12461', customer: 'David Lee', vendor: 'HomeEssentials', product: 'Coffee Maker', amount: 129.99, date: '2026-02-07', status: 'pending' },
    { id: 'ORD12462', customer: 'Eva Garcia', vendor: 'TechWorld', product: 'Wireless Headphones', amount: 79.99, date: '2026-02-06', status: 'refunded' },
];

const usersData = [
    { id: 'USR001', name: 'Alice Brown', email: 'alice@email.com', type: 'Customer', joinDate: '2025-12-15', orders: 12, status: 'active' },
    { id: 'USR002', name: 'Bob Williams', email: 'bob@email.com', type: 'Customer', joinDate: '2026-01-05', orders: 5, status: 'active' },
    { id: 'USR003', name: 'John Smith', email: 'john@techworld.com', type: 'Vendor', joinDate: '2025-11-20', orders: 145, status: 'active' },
    { id: 'USR004', name: 'Spam User', email: 'spam@bad.com', type: 'Vendor', joinDate: '2026-02-01', orders: 0, status: 'banned' },
];

const complaintsData = [
    { id: 'CMP001', type: 'Product Issue', customer: 'Alice Brown', vendor: 'TechWorld', orderId: 'ORD12450', priority: 'high', status: 'open', date: '2026-02-09' },
    { id: 'CMP002', type: 'Delivery Delay', customer: 'Bob Williams', vendor: 'GadgetHub', orderId: 'ORD12451', priority: 'medium', status: 'inprogress', date: '2026-02-08' },
    { id: 'CMP003', type: 'Refund Request', customer: 'Carol Martinez', vendor: 'SportZone', orderId: 'ORD12452', priority: 'high', status: 'open', date: '2026-02-08' },
    { id: 'CMP004', type: 'Wrong Item', customer: 'David Lee', vendor: 'HomeEssentials', orderId: 'ORD12453', priority: 'medium', status: 'resolved', date: '2026-02-07' },
];

const payoutsData = [
    { id: 'PAY001', vendor: 'TechWorld', amount: 12580.50, commission: 1887.08, netAmount: 10693.42, date: '2026-02-01', status: 'completed' },
    { id: 'PAY002', vendor: 'GadgetHub', amount: 9845.25, commission: 1476.79, netAmount: 8368.46, date: '2026-02-01', status: 'completed' },
    { id: 'PAY003', vendor: 'SportZone', amount: 7650.00, commission: 1147.50, netAmount: 6502.50, date: '2026-02-01', status: 'pending' },
];


// Navigation & Menu Handling


function initializeApp() {
    setupNavigation();
    setupMenuToggle();
    setupNotifications();
    setupModals();
    setupTabs();
    renderTables();
    initializeCharts();
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
    
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('active');
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
            <td>$${vendor.revenue.toFixed(2)}</td>
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
    
    tbody.innerHTML = productsData.map(product => `
        <tr>
            <td>${product.id}</td>
            <td><img src="${product.image}" alt="${product.name}" class="product-img"></td>
            <td><strong>${product.name}</strong></td>
            <td>${product.vendor}</td>
            <td>${product.category}</td>
            <td>$${product.price.toFixed(2)}</td>
            <td><span class="badge ${product.status}">${product.status}</span></td>
            <td>
                <button class="action-btn view" onclick="viewProduct('${product.id}')">View</button>
                ${product.status === 'pending' ? `
                    <button class="action-btn edit" onclick="approveProduct('${product.id}')">Approve</button>
                    <button class="action-btn delete" onclick="rejectProduct('${product.id}')">Reject</button>
                ` : ''}
                ${product.status === 'approved' ? `<button class="action-btn delete" onclick="deleteProduct('${product.id}')">Delete</button>` : ''}
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
            <td>$${order.amount.toFixed(2)}</td>
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
            <td>$${payout.amount.toFixed(2)}</td>
            <td>$${payout.commission.toFixed(2)}</td>
            <td>$${payout.netAmount.toFixed(2)}</td>
            <td>${payout.date}</td>
            <td><span class="badge ${payout.status === 'completed' ? 'delivered' : 'pending'}">${payout.status}</span></td>
        </tr>
    `).join('');
}


// Action Functions


function viewVendor(id) {
    const vendor = vendorsData.find(v => v.id === id);
    if (vendor) {
        const content = `
            <div style="padding: 10px;">
                <p><strong>Store Name:</strong> ${vendor.storeName}</p>
                <p><strong>Owner:</strong> ${vendor.ownerName}</p>
                <p><strong>Email:</strong> ${vendor.email}</p>
                <p><strong>Products:</strong> ${vendor.products}</p>
                <p><strong>Revenue:</strong> $${vendor.revenue.toFixed(2)}</p>
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
    const product = productsData.find(p => p.id === id);
    if (product) {
        const content = `
            <div style="padding: 10px;">
                <img src="${product.image}" alt="${product.name}" style="width: 200px; height: 200px; object-fit: cover; border-radius: 8px; margin-bottom: 16px;">
                <p><strong>Product Name:</strong> ${product.name}</p>
                <p><strong>Vendor:</strong> ${product.vendor}</p>
                <p><strong>Category:</strong> ${product.category}</p>
                <p><strong>Price:</strong> $${product.price.toFixed(2)}</p>
                <p><strong>Status:</strong> <span class="badge ${product.status}">${product.status}</span></p>
            </div>
        `;
        openModal('Product Details', content);
    }
}

function approveProduct(id) {
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
    const order = ordersData.find(o => o.id === id);
    if (order) {
        const content = `
            <div style="padding: 10px;">
                <p><strong>Order ID:</strong> ${order.id}</p>
                <p><strong>Customer:</strong> ${order.customer}</p>
                <p><strong>Vendor:</strong> ${order.vendor}</p>
                <p><strong>Product:</strong> ${order.product}</p>
                <p><strong>Amount:</strong> $${order.amount.toFixed(2)}</p>
                <p><strong>Date:</strong> ${order.date}</p>
                <p><strong>Status:</strong> <span class="badge ${order.status}">${order.status}</span></p>
            </div>
        `;
        openModal('Order Details', content);
    }
}

function processOrder(id) {
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

// ===============================
// Charts (Placeholder - can be replaced with Chart.js)
// ===============================

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
    
    // Simple bar chart
    ctx.fillStyle = '#3b82f6';
    const data = [65, 78, 82, 90, 75, 88, 95, 105, 98, 112, 120, 124];
    const barWidth = canvas.width / data.length - 10;
    const maxValue = Math.max(...data);
    
    data.forEach((value, index) => {
        const barHeight = (value / maxValue) * (canvas.height - 40);
        const x = index * (barWidth + 10) + 20;
        const y = canvas.height - barHeight - 20;
        
        ctx.fillRect(x, y, barWidth, barHeight);
    });
    
    // Add labels
    ctx.fillStyle = '#6b7280';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    months.forEach((month, index) => {
        const x = index * (barWidth + 10) + barWidth / 2 + 20;
        ctx.fillText(month, x, canvas.height - 5);
    });
}

function drawOrderChart() {
    const canvas = document.getElementById('orderCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.parentElement.offsetWidth;
    canvas.height = 280;
    
    // Simple donut chart
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 40;
    
    const data = [
        { label: 'Delivered', value: 1245, color: '#10b981' },
        { label: 'Processing', value: 324, color: '#3b82f6' },
        { label: 'Pending', value: 187, color: '#f59e0b' },
        { label: 'Refunded', value: 89, color: '#ef4444' }
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
    
    // Inner circle for donut effect
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.6, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    
    // Add legend
    ctx.font = '12px Arial';
    let legendY = 20;
    data.forEach(item => {
        ctx.fillStyle = item.color;
        ctx.fillRect(20, legendY, 12, 12);
        ctx.fillStyle = '#111827';
        ctx.textAlign = 'left';
        ctx.fillText(`${item.label}: ${item.value}`, 38, legendY + 10);
        legendY += 20;
    });
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