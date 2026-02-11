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

function saveOrdersToStorage() { try { localStorage.setItem(APP_CONFIG.ORDERS_KEY, JSON.stringify(ORDERS_DB)); } catch {} }
function getAllOrders() { return Array.isArray(ORDERS_DB) ? [...ORDERS_DB] : []; }

function initAdminDashboard() {
    if (typeof requireAuth !== 'function') return;
    if (!requireAuth('admin')) return;
    displayAdminInfo();
    switchAdminView(window.location.hash || '#overview');
}

function displayAdminInfo() {
    if (typeof getCurrentUser !== 'function') return;
    const user = getCurrentUser();
    if (!user) return;
    document.querySelectorAll('.user-name').forEach(el => el.textContent = user.name || 'Admin');
}

function switchAdminView(view) {
    if (!view || view === '#') return;
    const viewName = view.replace('#', '');
    window.location.hash = view;

    document.querySelectorAll('.sidebar-link').forEach(link => link.classList.remove('active'));
    const activeLink = document.querySelector(`a[href="${view}"]`);
    if (activeLink) activeLink.classList.add('active');

    document.querySelectorAll('.admin-content-section').forEach(section => section.style.display = 'none');
    const selectedSection = document.getElementById(viewName);
    if (selectedSection) selectedSection.style.display = 'block';

    const loaders = {
        overview: () => { loadOverviewStats(); loadRecentActivity(); },
        vendors: loadVendorsTable,
        products: loadAllProductsTable,
        orders: loadOrdersTable,
        users: loadUsersTable,
        analytics: loadAnalytics
    };
    if (loaders[viewName]) loaders[viewName]();
}

function loadOverviewStats() {
    if (typeof getAllProducts !== 'function' || typeof getAllUsers !== 'function') return;
    const allProducts = getAllProducts() || [];
    const allOrders = getAllOrders();
    const allUsers = (getAllUsers().success ? getAllUsers().users : []);
    const totalRevenue = allOrders.reduce((s,o)=> s + (o.total||0),0);
    updateStatCardSafe('adminTotalProducts', allProducts.length);
    updateStatCardSafe('adminTotalOrders', allOrders.length);
    updateStatCardSafe('adminTotalRevenue', formatPriceSafe(totalRevenue));
}

function updateStatCardSafe(id,value){const el=document.getElementById(id);if(el)el.textContent=value;}
function formatPriceSafe(val){if(typeof formatPrice==='function')return formatPrice(val);return '$'+Number(val||0).toFixed(2);}

function loadRecentActivity(){
    const container=document.getElementById('recentActivity');
    if(!container)return;
    const recentOrders=getAllOrders().slice().sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).slice(0,5);
    if(!recentOrders.length){container.innerHTML='<p>No recent orders</p>';return;}
    container.innerHTML=recentOrders.map(o=>`<div style="padding:10px;border-bottom:1px solid var(--border-color)"><strong>#${o.id?.slice(-8)}</strong> — ${o.customerName||'Unknown'}<br><small>${o.createdAt||''} — ${formatPriceSafe(o.total)}</small></div>`).join('');
}

function filterProducts(searchTerm){
    const rows=document.querySelectorAll('#productsDataTable tbody tr');
    const search=(searchTerm||'').toLowerCase();
    rows.forEach(row=>{const name=row.getAttribute('data-name')||'';row.style.display=name.includes(search)?'':'none';});
}

function filterProductsByCategory(category){
    const rows=document.querySelectorAll('#productsDataTable tbody tr');
    rows.forEach(row=>{const rowCategory=row.getAttribute('data-category');row.style.display=!category||rowCategory===category?'':'none';});
}

function adminDeleteProduct(productId){
    if(typeof getProductById!=='function'||typeof deleteProduct!=='function')return;
    const product=getProductById(productId);
    if(!product)return;
    if(!confirm(`Delete "${product.name}"?`))return;
    const result=deleteProduct(productId);
    if(result?.success){showToastSafe(result.message,'success');loadAllProductsTable();}else showToastSafe(result?.message||'Delete failed','error');
}

function showToastSafe(msg,type){if(typeof showToast==='function')showToast(msg,type);else alert(msg);}
function handleLogout(){if(!confirm('Logout?'))return;if(typeof logout==='function')logout();window.location.href='login.html';}

if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',initAdminDashboard);}else{initAdminDashboard();}

window.addEventListener('hashchange',()=>{switchAdminView(window.location.hash||'#overview');});

document.querySelectorAll('.sidebar-link').forEach(link=>{
    link.addEventListener('click',function(e){
        const target=this.getAttribute('href');
        if(!target||!target.startsWith('#')||target==='#')return;
        e.preventDefault();
        document.querySelectorAll('.sidebar-link').forEach(l=>l.classList.remove('active'));
        document.querySelectorAll('.admin-content-section').forEach(sec=>sec.classList.remove('active'));
        this.classList.add('active');
        const section=document.querySelector(target);
        if(section)section.classList.add('active');
    });
});

const firstSection=document.querySelector('#overview');
if(firstSection)firstSection.classList.add('active');
