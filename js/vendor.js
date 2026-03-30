async function initVendorDashboard() {
    if (typeof requireAuth !== 'function') return;
    if (!requireAuth('vendor')) return;
    displayVendorInfo();
    await refreshVendorLiveData();
    setupVendorLiveRefresh();
}

async function refreshVendorLiveData() {
    await loadVendorStats();
    await loadVendorProducts();
    await loadVendorOrders();
    await updateEarningsAndNotifications();
}

function setupVendorLiveRefresh() {
    window.addEventListener('focus', () => {
        refreshVendorLiveData().catch(error => {
            console.warn('Vendor live refresh failed:', error.message || error);
        });
    });

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            refreshVendorLiveData().catch(error => {
                console.warn('Vendor live refresh failed:', error.message || error);
            });
        }
    });

    window.addEventListener('orderPlaced', () => {
        refreshVendorLiveData().catch(error => {
            console.warn('Vendor refresh after order placed failed:', error.message || error);
        });
    });

    setInterval(() => {
        refreshVendorLiveData().catch(error => {
            console.warn('Scheduled vendor refresh failed:', error.message || error);
        });
    }, 30 * 1000);
}

function displayVendorInfo() {
    const user = getCurrentUser();
    if (!user) return;
    document.querySelectorAll('.user-name').forEach(el => el.textContent = user.name);
    document.querySelectorAll('.store-name').forEach(el => el.textContent = user.storeName || user.name);
}

async function loadVendorStats() {
    const user = getCurrentUser();
    if (!user) return;

    if (window.MultiMartAPI) {
        try {
            const response = await window.MultiMartAPI.getVendorDashboard();
            const overview = response.overview || {};
            const trend = Array.isArray(overview.trend) ? overview.trend : [];
            const revenueByDay = trend.map(item => ({ day: item.day, value: Number(item.earnings || 0) }));
            const ordersByDay = trend.map(item => ({ day: item.day, value: Number(item.orders || 0) }));
            const totalProducts = Number(overview.totalProducts || 0);
            const totalOrders = Number(overview.totalOrders || 0);
            const totalEarnings = Number(overview.totalEarnings || 0);
            const pendingOrders = Number(overview.pendingItems || 0);
            const pendingPayouts = Number(overview.pendingPayouts || 0);
            const todayRevenue = revenueByDay.slice(-1)[0]?.value || 0;

            updateStatCard('totalProducts', totalProducts);
            updateStatCard('totalOrders', totalOrders);
            updateStatCard('totalRevenue', formatPrice(todayRevenue));
            updateStatCard('pendingOrders', pendingOrders);
            updateStatCard('totalEarnings', formatPrice(totalEarnings));
            updateStatCard('pendingPayouts', formatPrice(pendingPayouts));

            updateGrowth('totalProductsGrowth', totalProducts, Math.max(totalProducts - 1, 0));
            updateGrowth('totalOrdersGrowth', totalOrders, getValueForDay(ordersByDay, -2));
            updateGrowth('totalRevenueGrowth', todayRevenue, getValueForDay(revenueByDay, -2));
            updateGrowth('pendingOrdersGrowth', pendingOrders, Math.max(pendingOrders - 1, 0));

            drawSparkline('sparkTotalProducts', createSequence(totalProducts));
            drawSparkline('sparkTotalOrders', ordersByDay.map(d => d.value));
            drawSparkline('sparkRevenue', revenueByDay.map(d => d.value));
            drawSparkline('sparkPending', createSequence(pendingOrders));
            renderSalesChart(revenueByDay.length ? revenueByDay : [{ day: new Date().toISOString().slice(0, 10), value: 0 }], ordersByDay.length ? ordersByDay : [{ day: new Date().toISOString().slice(0, 10), value: 0 }]);
            renderOrdersRevenueChart(ordersByDay.length ? ordersByDay : [{ day: new Date().toISOString().slice(0, 10), value: 0 }], revenueByDay.length ? revenueByDay : [{ day: new Date().toISOString().slice(0, 10), value: 0 }]);
            return;
        } catch (error) {
            console.warn('Vendor API stats failed, using local data:', error.message);
        }
    }

    const vendorProducts = typeof getProductsByVendor === 'function' ? getProductsByVendor(user.id) : [];
    const allOrders = typeof getAllOrders === 'function' ? getAllOrders() : [];
    const vendorOrders = allOrders.filter(o => (o.items || []).some(i => i.vendorId === user.id));

    const totalProducts = vendorProducts.length;
    const totalOrders = vendorOrders.length;

    const revenueByDay = getRevenueByDay(vendorOrders, 30);
    const ordersByDay = getOrdersByDay(vendorOrders, 30);
    const pendingOrders = vendorOrders.filter(o => ['pending','processing'].includes(o.status?.toLowerCase())).length;

    const todayRevenue = revenueByDay.slice(-1)[0]?.value || 0;
    const monthRevenue = revenueByDay.reduce((s, d) => s + d.value, 0);

    updateStatCard('totalProducts', totalProducts);
    updateStatCard('totalOrders', totalOrders);
    updateStatCard('totalRevenue', formatPrice(todayRevenue));
    updateStatCard('pendingOrders', pendingOrders);

    updateGrowth('totalProductsGrowth', totalProducts, vendorProducts.length > 1 ? totalProducts - 1 : 0);
    updateGrowth('totalOrdersGrowth', totalOrders, getValueForDay(ordersByDay, -2));
    updateGrowth('totalRevenueGrowth', todayRevenue, getValueForDay(revenueByDay, -2));
    updateGrowth('pendingOrdersGrowth', pendingOrders, getPastPendingCount(vendorOrders, 1));

    drawSparkline('sparkTotalProducts', createSequence(totalProducts));
    drawSparkline('sparkTotalOrders', ordersByDay.map(d => d.value));
    drawSparkline('sparkRevenue', revenueByDay.map(d => d.value));
    drawSparkline('sparkPending', buildPendingTrend(vendorOrders));

    renderSalesChart(revenueByDay, ordersByDay);
    renderOrdersRevenueChart(ordersByDay, revenueByDay);
    renderTopSelling(vendorProducts, vendorOrders);
}

function updateGrowth(id, value, yesterdayValue) {
    const el = document.getElementById(id);
    if (!el) return;

    const diff = value - (yesterdayValue || 0);
    const pct = yesterdayValue ? ((diff / yesterdayValue) * 100).toFixed(1) : '0.0';
    const arrow = diff > 0 ? '↑' : (diff < 0 ? '↓' : '→');
    const text = diff > 0 ? `${arrow} +${pct}%` : (diff < 0 ? `${arrow} ${pct}%` : `${arrow} No change`);
    
    el.textContent = text;
    el.className = 'stat-meta';
    
    if (diff > 0) {
        el.classList.add('positive');
    } else if (diff < 0) {
        el.classList.add('negative');
    } else {
        el.classList.add('neutral');
    }
}

function getPastPendingCount(vendorOrders, daysAgo) {
    const boundary = new Date();
    boundary.setDate(boundary.getDate() - daysAgo);
    return vendorOrders.filter(o => new Date(o.createdAt) <= boundary && ['pending','processing'].includes(o.status?.toLowerCase())).length;
}

function createSequence(value, length = 10) {
    const list = [];
    for (let i = 0; i < length; i++) list.push(Math.max(0, value - (length - i - 1) * (value / length/2)));
    return list;
}

function getRevenueByDay(orders, days = 30) {
    const now = new Date();
    const map = {};
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const key = d.toISOString().slice(0,10);
        map[key] = 0;
    }

    orders.forEach(order => {
        const dateKey = new Date(order.createdAt).toISOString().slice(0,10);
        if (map.hasOwnProperty(dateKey)) {
            order.items.forEach(i => {
                if (i.vendorId === getCurrentUser()?.id) {
                    map[dateKey] += (i.price * i.quantity);
                }
            });
        }
    });

    return Object.entries(map).map(([day, value]) => ({ day, value }));
}

function getOrdersByDay(orders, days = 30) {
    const now = new Date();
    const map = {};
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const key = d.toISOString().slice(0,10);
        map[key] = 0;
    }

    orders.forEach(order => {
        const dateKey = new Date(order.createdAt).toISOString().slice(0,10);
        if (map.hasOwnProperty(dateKey)) {
            map[dateKey] += 1;
        }
    });

    return Object.entries(map).map(([day, value]) => ({ day, value }));
}

function getValueForDay(arr, offsetFromEnd = -1) {
    if (!arr || !arr.length) return 0;
    const idx = arr.length + offsetFromEnd;
    if (idx < 0 || idx >= arr.length) return 0;
    return arr[idx].value;
}

function buildPendingTrend(orders, days = 30) {
    const pendingByDay = getOrdersByDay(orders.filter(o => ['pending','processing'].includes(o.status?.toLowerCase())), days);
    return pendingByDay.map(d => d.value);
}

function drawSparkline(canvasId, values) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !canvas.getContext) return;

    const ctx = canvas.getContext('2d');
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w*2;
    canvas.height = h*2;
    ctx.scale(2,2);

    ctx.clearRect(0,0,w,h);
    if (!values || values.length < 2) return;

    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const len = values.length;
    const xStep = w / (len - 1);

    ctx.strokeStyle = '#1E88E5';
    ctx.lineWidth = 2;
    ctx.beginPath();

    values.forEach((v, index) => {
        const x = index * xStep;
        const y = h - ((v - min) / (max - min || 1) * h);
        if (index === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });

    ctx.stroke();
}

function renderSalesChart(revenueByDay, ordersByDay) {
    const canvas = document.getElementById('salesTimelineChart');
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0,0,canvas.width,canvas.height);
    const labels = revenueByDay.map(d => d.day.slice(5));
    const sales = revenueByDay.map(d => d.value);
    const avg = movingAverage(sales, 7);

    const maxValue = Math.max(...sales, ...avg, 1);

    const drawLine = (array, color) => {
        ctx.beginPath();
        array.forEach((val, i) => {
            const x = (canvas.width / (array.length - 1)) * i;
            const y = canvas.height - ((val / maxValue) * canvas.height);
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        });
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
    };

    drawLine(sales, '#1E88E5');
    drawLine(avg, '#43A047');

    const trend = detectTrend(sales);
    const trendText = document.getElementById('trendText');
    if (trendText) trendText.textContent = `Trend: ${trend} (MA 7)`;
}

function renderOrdersRevenueChart(ordersByDay, revenueByDay) {
    const c = document.getElementById('ordersRevenueChart');
    if (!c || !c.getContext) return;
    const ctx = c.getContext('2d');
    ctx.clearRect(0,0,c.width,c.height);

    const orders = ordersByDay.map(d => d.value);
    const revenue = revenueByDay.map(d => d.value / 50); // scale
    const maxValue = Math.max(...orders, ...revenue, 1);

    const drawLine = (data, color) => {
        ctx.beginPath();
        data.forEach((val, i) => {
            const x = (c.width / (data.length - 1)) * i;
            const y = c.height - ((val / maxValue) * c.height);
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        });
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
    };

    drawLine(orders, '#f0ad4e');
    drawLine(revenue, '#6f42c1');
}

function renderTopSelling(products, orders) {
    const map = {};
    orders.forEach(o => o.items?.forEach(i => { if (!map[i.productId]) map[i.productId] = 0; map[i.productId] += (i.vendorId===getCurrentUser()?.id ? i.quantity : 0); }));
    const top = Object.entries(map)
        .map(([id, qty]) => ({ product: products.find(p => p.id===id), sold: qty }))
        .filter(x => x.product)
        .sort((a,b)=> b.sold - a.sold)
        .slice(0,5);

    const container = document.getElementById('topProductsList');
    if (!container) return;
    if (!top.length) { container.innerHTML = '<p>No sales history yet.</p>'; return; }

    container.innerHTML = top.map((item, idx) => `<div class="top-product-row"><span>${idx+1}. ${item.product.name}</span><strong>${item.sold} sold</strong></div>`).join('');
}

function movingAverage(data, windowSize = 7) {
    if (!data || !data.length) return [];
    const avg = [];
    for (let i = 0; i < data.length; i++) {
        const start = Math.max(0, i - windowSize + 1);
        const segment = data.slice(start, i + 1);
        avg.push(segment.reduce((a,b)=>a+b,0)/segment.length);
    }
    return avg;
}

function detectTrend(values) {
    if (!values || values.length < 2) return 'stable';
    const last = values.slice(-7);
    const first = last.slice(0,3).reduce((a,b)=>a+b,0)/3;
    const lastAvg = last.slice(-3).reduce((a,b)=>a+b,0)/3;
    return lastAvg > first ? 'up' : (lastAvg < first ? 'down' : 'stable');
}

async function updateEarningsAndNotifications() {
    const orders = typeof getAllOrders === 'function' ? getAllOrders() : [];
    const user = getCurrentUser();
    if (!user) return;

    if (window.MultiMartAPI) {
        try {
            const [dashboardResponse, payoutResponse] = await Promise.all([
                window.MultiMartAPI.getVendorDashboard(),
                window.MultiMartAPI.getVendorPayouts().catch(() => ({ payouts: [], summary: {} }))
            ]);
            const overview = dashboardResponse.overview || {};
            const payoutSummary = payoutResponse.summary || {};
            document.getElementById('totalEarnings').textContent = formatPrice(Number(overview.totalEarnings || 0));
            document.getElementById('pendingPayouts').textContent = formatPrice(Number(payoutSummary.pendingPayouts || overview.pendingPayouts || 0));

            const notifBadge = document.getElementById('notificationCount');
            if (notifBadge) notifBadge.textContent = Number(overview.pendingItems || 0);

            const notifContainer = document.getElementById('notificationsList');
            if (notifContainer) {
                notifContainer.innerHTML = `
                    <div class="top-product-row">Pending order items: ${Number(overview.pendingItems || 0)}</div>
                    <div class="top-product-row">Products live on store: ${Number(overview.totalProducts || 0)}</div>
                    <div class="top-product-row">Withdrawable balance: ${formatPrice(Number(payoutSummary.availableBalance || overview.availableBalance || 0))}</div>
                    <div class="top-product-row">Total earnings so far: ${formatPrice(Number(overview.totalEarnings || 0))}</div>
                `;
            }

            renderVendorPayoutHistory(payoutResponse.payouts || [], payoutSummary);
            return;
        } catch (error) {
            console.warn('Vendor API earnings failed, using local data:', error.message);
        }
    }

    const vendorOrders = orders.filter(o => (o.items||[]).some(i=>i.vendorId===user.id));
    const totalEarnings = vendorOrders.reduce((sum,o)=>sum + (o.items||[]).reduce((s,i)=>i.vendorId===user.id ? s+i.price*i.quantity : s,0),0);
    const pendingPayouts = vendorOrders.filter(o => ['delivered'].includes(o.status?.toLowerCase())===false).reduce((sum,o)=>sum + (o.items||[]).reduce((s,i)=>i.vendorId===user.id ? s+i.price*i.quantity : s,0),0);

    document.getElementById('totalEarnings').textContent = formatPrice(totalEarnings);
    document.getElementById('pendingPayouts').textContent = formatPrice(pendingPayouts);

    const history = vendorOrders.slice().sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).slice(0,8);
    const container = document.getElementById('payoutHistory');
    if (container) {
        if (!history.length) {
            container.innerHTML = '<p>No transactions yet</p>';
        } else {
            container.innerHTML = `<table class="data-table"><thead><tr><th>Date</th><th>Order</th><th>Amount</th><th>Status</th></tr></thead><tbody>${history.map(o=>`<tr><td>${formatDate(o.createdAt)}</td><td>#${o.id.slice(-8)}</td><td>${formatPrice((o.items||[]).filter(i=>i.vendorId===user.id).reduce((s,i)=>s+i.price*i.quantity,0))}</td><td>${o.status}</td></tr>`).join('')}</tbody></table>`;
        }
    }

    const pendingCount = vendorOrders.filter(o => ['pending','processing'].includes(o.status?.toLowerCase())).length;
    const lowStockCount = (typeof getProductsByVendor === 'function' ? getProductsByVendor(user.id) : []).filter(p => p.stock <= 5).length;
    const notificationTotal = pendingCount + Math.min(lowStockCount, 1) + 0; // add review count if available
    
    const notifBadge = document.getElementById('notificationCount');
    if (notifBadge) notifBadge.textContent = Math.max(0, notificationTotal);

    const notifications = [
        pendingCount > 0 ? {text:`${pendingCount} pending order${pendingCount>1?'s':''}`, type:'danger'} : null,
        lowStockCount > 0 ? {text:`${lowStockCount} product${lowStockCount>1?'s':''} low on stock 🔥`, type:'warning'} : null,
        {text:'New reviews waiting for response', type:'info'}
    ].filter(n => n);
    
    const notifContainer = document.getElementById('notificationsList');
    if (notifContainer) notifContainer.innerHTML = notifications.map(n=>`<div class="top-product-row">${n.text}</div>`).join('');
}

function renderVendorPayoutHistory(payouts, summary = {}) {
    const container = document.getElementById('payoutHistory');
    if (!container) return;

    const summaryHtml = `
        <div class="top-product-row"><span>Withdrawable Balance</span><strong>${formatPrice(Number(summary.availableBalance || 0))}</strong></div>
        <div class="top-product-row"><span>Already Paid Out</span><strong>${formatPrice(Number(summary.paidOut || 0))}</strong></div>
    `;

    if (!payouts.length) {
        container.innerHTML = `${summaryHtml}<p style="margin-top: 12px;">No payout requests yet</p>`;
        return;
    }

    container.innerHTML = `
        ${summaryHtml}
        <table class="data-table" style="margin-top: 16px;">
            <thead>
                <tr><th>Date</th><th>Payout ID</th><th>Amount</th><th>Status</th><th>Paid At</th></tr>
            </thead>
            <tbody>
                ${payouts.map(payout => `
                    <tr>
                        <td>${formatDate(payout.created_at)}</td>
                        <td>#${String(payout.id)}</td>
                        <td>${formatPrice(Number(payout.amount || 0))}</td>
                        <td><span class="badge badge-${getStatusBadgeClass(payout.status)}">${payout.status}</span></td>
                        <td>${payout.paid_at ? formatDate(payout.paid_at) : '-'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

async function withdrawPayout(){
    if (window.MultiMartAPI) {
        try {
            const response = await window.MultiMartAPI.requestVendorPayout();
            showToastSafe(response.message || 'Withdraw request created', 'success');
            await loadVendorStats();
            await updateEarningsAndNotifications();
            return;
        } catch (error) {
            showToastSafe(error.message || 'Unable to create withdraw request', 'error');
            return;
        }
    }

    alert('Withdraw request created. It will process within 2 business days.');
}



function updateStatCard(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

async function loadVendorProducts() {
    const user = getCurrentUser();
    if (!user) return;
    let products = [];
    if (window.MultiMartAPI) {
        try {
            const response = await window.MultiMartAPI.getVendorProducts();
            products = response.products || [];
        } catch (error) {
            console.warn('Vendor API products failed, using local data:', error.message);
        }
    }

    if (!products.length && typeof getProductsByVendor === 'function') {
        products = getProductsByVendor(user.id);
    }
    const orders = typeof getAllOrders === 'function' ? getAllOrders() : [];

    const vendorOrders = orders.filter(o => (o.items || []).some(i => i.vendorId === user.id));
    const salesMap = {};

    vendorOrders.forEach(order => {
        (order.items || []).forEach(i => {
            if (i.vendorId === user.id) {
                salesMap[i.productId] = salesMap[i.productId] || { sold: 0, revenue: 0 };
                salesMap[i.productId].sold += i.quantity;
                salesMap[i.productId].revenue += i.price * i.quantity;
            }
        });
    });

    const container = document.getElementById('productsTable');
    if (!container) return;
    if (!products.length) {
        container.innerHTML = `<div class="empty-state"><p>No products yet</p><button class="btn-add" onclick="showAddProductForm()">Add Product</button></div>`;
        return;
    }

    const rows = products.map(p => {
        const sold = salesMap[p.id]?.sold || 0;
        const revenue = salesMap[p.id]?.revenue || 0;
        const conversion = p.views ? ((sold / p.views) * 100).toFixed(1) : '0.0';
        const stockBadge = p.stock <= 5 ? '<span class="badge danger">Low stock 🔥</span>' : '';
        return `<tr>
            <td><img src="${p.image || 'assets/images/placeholder.png'}" alt="${p.name}" class="small-img"></td>
            <td>${p.name}</td>
            <td>${p.category}</td>
            <td>${formatPrice(p.price)}</td>
            <td>${p.stock} ${stockBadge}</td>
            <td>${sold}</td>
            <td>${formatPrice(revenue)}</td>
            <td>${conversion}%</td>
            <td><div class="action-buttons"><button class="btn-icon btn-edit" onclick="editProduct('${p.id}')">✏️</button><button class="btn-icon btn-delete" onclick="deleteProductConfirm('${p.id}')">🗑️</button></div></td>
        </tr>`;
    }).join('');

    container.innerHTML = `
    <div class="table-wrapper">
    <table class="data-table">
        <thead>
            <tr>
                <th>Image</th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Units Sold</th><th>Revenue</th><th>Conversion</th><th>Actions</th>
            </tr>
        </thead>
        <tbody>
            ${rows}
        </tbody>
    </table>
    </div>`;
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

async function addProduct(productData) {
    const user = getCurrentUser();
    if (!user) return { success:false, message:'User not found' };

    if (window.MultiMartAPI) {
        try {
            const response = await window.MultiMartAPI.createVendorProduct({
                name: productData.name,
                category: productData.category,
                description: productData.description,
                imageUrl: productData.image,
                price: productData.price,
                stock: productData.stock
            });
            return { success:true, message: response.message || 'Product submitted for approval' };
        } catch (error) {
            console.warn('Vendor API product create failed, using local data:', error.message);
        }
    }

    const products = getAllProducts();   // our DB in main.js

    productData.id = 'p' + Date.now();
    productData.vendorId = user.id;
    productData.vendorName = getVendorDisplayName(user);

    productData.rating = 0;
    productData.reviews = 0;
    productData.createdAt = new Date().toISOString();

    products.push(productData);

    saveProductsToStorage(products);     // saving there

    return { success:true, message:'Product added successfully' };
}



async function submitProductForm(event) {
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
    if (!productData.name || !productData.price) return showToastSafe
('Name and price required','error');
    const result = editId ? updateProduct(editId, productData) : await addProduct(productData);
    if (result.success) {
        showToastSafe
(result.message,'success');
        closeProductModal();
        await loadVendorProducts();
        await loadVendorStats();
    } else showToastSafe
(result.message,'error');
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
    showToastSafe
(result.message, result.success?'success':'error');
    if (result.success) {
        loadVendorProducts();
        loadVendorStats();
    }
}

let vendorOrderFilter = 'all';

async function loadVendorOrders() {
    const user = getCurrentUser();
    if (!user) return;

    if (window.MultiMartAPI) {
        try {
            const response = await window.MultiMartAPI.getVendorOrders();
            const vendorOrders = (response.orders || []).map(row => ({
                id: String(row.id),
                createdAt: row.created_at,
                customerName: row.customer_name || 'Customer',
                status: row.order_status,
                items: [{
                    productId: row.product_id,
                    vendorId: user.id,
                    quantity: Number(row.quantity || 0),
                    price: Number(row.unit_price || 0)
                }]
            }));
            renderVendorOrders(vendorOrders.filter(order => vendorOrderFilter === 'all' || order.status === vendorOrderFilter));
            return;
        } catch (error) {
            console.warn('Vendor API orders failed, using local data:', error.message);
        }
    }

    if (typeof getAllOrders !== 'function') return;
    const allOrders = getAllOrders();
    const vendorOrders = allOrders.filter(o => (o.items || []).some(i => i.vendorId === user.id));

    renderVendorOrders(vendorOrders.filter(order => vendorOrderFilter === 'all' || order.status === vendorOrderFilter));
}

function renderVendorOrders(vendorOrders) {
    const container = document.getElementById('ordersTable');
    if (!container) return;
    if (!vendorOrders.length) {
        container.innerHTML = `<div class="empty-state">No orders for this filter</div>`;
        return;
    }

    const rows = vendorOrders.map(o => {
        let total = 0, count = 0;
        (o.items || []).forEach(i => { if (i.vendorId === getCurrentUser()?.id) { total += i.price * i.quantity; count += i.quantity; } });

        const canShip = ['pending', 'processing'].includes(o.status?.toLowerCase());
        const statusBadge = `<span class="badge badge-${getStatusBadgeClass(o.status)}">${o.status}</span>`;

        return `<tr>
            <td>#${o.id?.slice(-8)}</td>
            <td>${formatDate(o.createdAt)}</td>
            <td>${o.customerName}</td>
            <td>${count}</td>
            <td>${formatPrice(total)}</td>
            <td>${statusBadge}</td>
            <td>
                ${canShip ? `<button class="btn-secondary" onclick="markOrderShipped('${o.id}')">Mark as shipped</button>` : ''}
                <button class="btn-secondary" onclick="trackOrder('${o.id}')">Track</button>
                <button class="btn-secondary" onclick="downloadInvoice('${o.id}')">Invoice</button>
            </td>
        </tr>`;
    }).join('');

    container.innerHTML = `
        <div class="table-wrapper">
            <table class="data-table">
                <thead>
                    <tr><th>Order</th><th>Date</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        </div>
    `;
}

function filterVendorOrders(status) {
    vendorOrderFilter = status || 'all';
    loadVendorOrders();
}

function markOrderShipped(orderId) {
    if (window.MultiMartAPI) {
        window.MultiMartAPI.updateOrderStatus(orderId, 'shipped')
            .then(() => {
                loadVendorOrders();
                loadVendorStats();
                updateEarningsAndNotifications();
                showToastSafe(`Order #${String(orderId).slice(-8)} marked shipped`, 'success');
            })
            .catch(error => {
                alert(error.message || 'Unable to mark order as shipped');
            });
        return;
    }

    const order = getAllOrders().find(o => o.id === orderId);
    if (!order) return;
    order.status = 'shipped';
    order.updatedAt = new Date().toISOString();
    saveOrdersToStorage();
    loadVendorOrders();
    loadVendorStats();
    showToastSafe(`Order #${order.id.slice(-8)} marked shipped`, 'success');
}

function trackOrder(orderId) {
    const order = getAllOrders().find(o => o.id === orderId);
    if (!order) return;
    alert(`Tracking for ${order.id}: ${order.status}. Customer: ${order.customerName}`);
}

function downloadInvoice(orderId) {
    const order = getAllOrders().find(o => o.id === orderId);
    if (!order) return;
    const invoice = `Invoice\nOrder: ${order.id}\nCustomer: ${order.customerName}\nTotal: ${formatPrice(order.total)}\nStatus: ${order.status}`;
    alert(invoice);
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
/* ===== Vendor Safe Name Helper ===== */

function getVendorDisplayName(user) {
    return user.storeName || user.name || "Vendor";
}
