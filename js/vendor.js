function initVendorDashboard() {
    if (typeof requireAuth !== 'function') return;
    if (!requireAuth('vendor')) return;
    displayVendorInfo();
    loadVendorStats();
    loadVendorProducts();
    loadVendorOrders();
}

function displayVendorInfo() {
    const user = getCurrentUser();
    if (!user) return;
    document.querySelectorAll('.user-name').forEach(el => el.textContent = user.name);
    document.querySelectorAll('.store-name').forEach(el => el.textContent = user.storeName || user.name);
}

function loadVendorStats() {
    const user = getCurrentUser();
    if (!user) return;
    const vendorProducts = typeof getProductsByVendor === 'function' ? getProductsByVendor(user.id) : [];
    const totalProducts = vendorProducts.length;
    const allOrders = typeof getAllOrders === 'function' ? getAllOrders() : [];
    const vendorOrders = allOrders.filter(o => (o.items || []).some(i => i.vendorId === user.id));
    const totalOrders = vendorOrders.length;
    let totalRevenue = 0;
    vendorOrders.forEach(o => (o.items || []).forEach(i => { if (i.vendorId === user.id) totalRevenue += i.price * i.quantity; }));
    const pendingOrders = vendorOrders.filter(o => ['pending','processing'].includes(o.status)).length;
    updateStatCard('totalProducts', totalProducts);
    updateStatCard('totalOrders', totalOrders);
    updateStatCard('totalRevenue', formatPrice(totalRevenue));
    updateStatCard('pendingOrders', pendingOrders);
}

function updateStatCard(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function loadVendorProducts() {
    const user = getCurrentUser();
    if (!user || typeof getProductsByVendor !== 'function') return;
    const products = getProductsByVendor(user.id);
    const container = document.getElementById('productsTable');
    if (!container) return;
    if (!products.length) {
        container.innerHTML = `<div class="empty-state"><p>No products yet</p><button class="btn-add" onclick="showAddProductForm()">Add Product</button></div>`;
        return;
    }
    container.innerHTML = `<table class="data-table"><thead><tr><th>Image</th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Rating</th><th>Actions</th></tr></thead><tbody>${products.map(p => `<tr><td><img src="${p.image || 'assets/images/placeholder.png'}"></td><td>${p.name}</td><td>${p.category}</td><td>${formatPrice(p.price)}</td><td>${p.stock}</td><td>${getStarRating(p.rating)}</td><td><div class="action-buttons"><button class="btn-icon btn-edit" onclick="editProduct('${p.id}')">✏️</button><button class="btn-icon btn-delete" onclick="deleteProductConfirm('${p.id}')">🗑️</button></div></td></tr>`).join('')}</tbody></table>`;
}

function showAddProductForm() {
    const modal = document.getElementById('productModal');
    const form = document.getElementById('productForm');
    const title = document.getElementById('modalTitle');
    if (!modal || !form) return;
    form.reset();
    form.removeAttribute('data-edit-id');
    if (title) title.textContent = 'Add Product';
    modal.classList.add('active');
}

function closeProductModal() {
    const modal = document.getElementById('productModal');
    if (modal) modal.classList.remove('active');
}

function addProduct(productData) {
    const user = getCurrentUser();
    if (!user) return { success: false, message: 'User not found' };
    const products = window.mockVendorProducts ||= [];
    productData.id = 'p' + Date.now();
    products.push(productData);
    if (typeof window.getProductsByVendor !== 'function') {
        window.getProductsByVendor = id => products.filter(p => p.vendorId === id || true);
    }
    return { success: true, message: 'Product added successfully' };
}

function submitProductForm(event) {
    event.preventDefault();
    const form = event.target;
    const editId = form.getAttribute('data-edit-id');
    const productData = {
        name: form.productName.value.trim(),
        price: Number(form.productPrice.value),
        category: form.productCategory.value,
        description: form.productDescription.value.trim(),
        image: form.productImage.value.trim(),
        stock: Number(form.productStock.value)
    };
    if (!productData.name || !productData.price) return showToast('Name and price required','error');
    const result = editId ? updateProduct(editId, productData) : addProduct(productData);
    if (result.success) {
        showToast(result.message,'success');
        closeProductModal();
        loadVendorProducts();
        loadVendorStats();
    } else showToast(result.message,'error');
}

function editProduct(productId) {
    const product = getProductById(productId);
    if (!product) return;
    const modal = document.getElementById('productModal');
    const form = document.getElementById('productForm');
    if (!modal || !form) return;
    form.productName.value = product.name;
    form.productPrice.value = product.price;
    form.productCategory.value = product.category;
    form.productDescription.value = product.description;
    form.productImage.value = product.image;
    form.productStock.value = product.stock;
    form.setAttribute('data-edit-id', productId);
    document.getElementById('modalTitle').textContent = 'Edit Product';
    modal.classList.add('active');
}

function deleteProductConfirm(productId) {
    const product = getProductById(productId);
    if (!product) return;
    if (!confirm(`Delete "${product.name}"?`)) return;
    const result = deleteProduct(productId);
    showToast(result.message, result.success?'success':'error');
    if (result.success) {
        loadVendorProducts();
        loadVendorStats();
    }
}

function loadVendorOrders() {
    const user = getCurrentUser();
    if (!user || typeof getAllOrders !== 'function') return;
    const allOrders = getAllOrders();
    const vendorOrders = allOrders.filter(o => (o.items || []).some(i => i.vendorId === user.id));
    const container = document.getElementById('ordersTable');
    if (!container) return;
    if (!vendorOrders.length) { container.innerHTML = `<div class="empty-state">No orders yet</div>`; return; }
    container.innerHTML = `<table class="data-table"><thead><tr><th>Order</th><th>Date</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th></tr></thead><tbody>${vendorOrders.map(o => { let total=0,count=0;(o.items||[]).forEach(i=>{if(i.vendorId===user.id){total+=i.price*i.quantity;count+=i.quantity}}); return `<tr><td>#${o.id.slice(-8)}</td><td>${formatDate(o.createdAt)}</td><td>${o.customerName}</td><td>${count}</td><td>${formatPrice(total)}</td><td><span class="badge badge-${getStatusBadgeClass(o.status)}">${o.status}</span></td></tr>`}).join('')}</tbody></table>`;
}

function getStatusBadgeClass(status) {
    if (!status) return 'info';
    status = status.toLowerCase();
    if (status==='delivered') return 'success';
    if (status==='processing'||status==='shipped') return 'info';
    if (status==='pending') return 'warning';
    if (status==='cancelled'||status==='refunded') return 'danger';
    return 'info';
}

function handleLogout() {
    if (!confirm('Logout?')) return;
    logout();
    window.location.href='login.html';
}

if (document.readyState==='loading') document.addEventListener('DOMContentLoaded', initVendorDashboard);
else initVendorDashboard();
