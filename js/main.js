const PRODUCTS_KEY = "shop_products";
const SEARCH_HISTORY_KEY = "shop_search";

const DEFAULT_PRODUCTS = [
{
    id: "p1",
    name: "Wireless Headphones",
    price: 2999,
    category: "Electronics",
    stock: 25,
    rating: 4.5,
    reviews: 120,
    vendorId: "vendor_1",
    vendorName: "Tech Paradise",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e",
    description: "High-quality wireless headphones",
    keywords: ["audio","music","wireless","headphones"],
    status: "approved",
createdAt: "2025-01-01T00:00:00"

},
{
    id: "p2",
    name: "Smart Watch",
    price: 4999,
    category: "Electronics",
    stock: 15,
    rating: 4.3,
    reviews: 80,
    vendorId: "vendor_1",
    vendorName: "Tech Paradise",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30",
    description: "Fitness smartwatch",
    keywords: ["watch","smart","fitness"],status: "approved",
createdAt: "2025-01-01T00:00:00"

},
{
    id: "p3",
    name: "Running Shoes",
    price: 3499,
    category: "Fashion",
    stock: 30,
    rating: 4.6,
    reviews: 60,
    vendorId: "vendor_2",
    vendorName: "Style Central",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff",
    description: "Comfort running shoes",
    keywords: ["shoes","running","sports"],status: "approved",
createdAt: "2025-01-01T00:00:00"

}
];

if (!localStorage.getItem(PRODUCTS_KEY)) {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(DEFAULT_PRODUCTS));
}

function getAllProducts(includePending = true) {
    const list = JSON.parse(localStorage.getItem(PRODUCTS_KEY)) || [];
    if (includePending) return list;
    return list.filter(p => p.status === "approved");
}


function saveProductsToStorage(products) {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
}


function getProductById(id) {
    return getAllProducts().find(p => p.id === id);
}

function getProductsByCategory(cat) {
    if (!cat) return getAllProducts(false);
    return getAllProducts(false).filter(
        p => p.category.toLowerCase() === cat.toLowerCase()
    );
}

function getPopularProducts(limit = 8) {
    return [...getAllProducts(false)]
        .sort((a,b)=>
            b.rating - a.rating ||
            b.reviews - a.reviews
        )
        .slice(0, limit);
}

function getSimilarProducts(productId, limit = 4) {
    const base = getProductById(productId);
    if (!base) return [];

    return getAllProducts(false)
        .filter(p => p.id !== productId)
        .sort((a,b)=>{
            let sA = 0, sB = 0;

            if (a.category === base.category) sA += 5;
            if (b.category === base.category) sB += 5;

            if (a.vendorId === base.vendorId) sA += 2;
            if (b.vendorId === base.vendorId) sB += 2;

            return sB - sA;
        })
        .slice(0, limit);
}

function saveSearchToHistory(term) {
    if (!term) return;
    let hist = JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY)) || [];
    hist.unshift(term);
    hist = hist.slice(0,20);
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(hist));
}

function getSearchHistory() {
    return JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY)) || [];
}

function searchProducts(q) {
    if (!q) return [];
    const term = q.toLowerCase();
    saveSearchToHistory(term);

    return getAllProducts(false).filter(p =>
        p.name.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term) ||
        (p.keywords || []).some(k => k.includes(term))
    );
}

function createProductCard(p) {
    return `
    <div class="product-card" onclick="viewProduct('${p.id}')">
        <img src="${p.image}" alt="${p.name}">
        <h3>${p.name}</h3>
        <p class="price">${formatPrice(p.price)}</p>
        <p class="rating">${getStarRating(p.rating)} (${p.reviews})</p>
        <button onclick="event.stopPropagation(); addProductToCart('${p.id}')">
            Add to Cart
        </button>
    </div>`;
}

function viewProduct(id) {
    window.location.href = `product-details.html?id=${id}`;
}

function formatPrice(n) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
    }).format(n);
}

function formatDate(d) {
    return new Date(d).toLocaleDateString("en-IN");
}

function getStarRating(r) {
    let s = "";
    for (let i=0;i<Math.floor(r);i++) s+="⭐";
    for (let i=s.length;i<5;i++) s+="☆";
    return s;
}
/* ========= Vendor Product Extensions ========= */

function getProductsByVendor(vendorId) {
    if (!vendorId) return [];
    return getAllProducts().filter(p => p.vendorId === vendorId);
}

function addNewProductByVendor(productData, vendor) {
    if (!vendor || !vendor.id) {
        return { success: false, message: "Vendor not logged in" };
    }

    const products = getAllProducts();

    const newProduct = {
        id: "p" + Date.now(),
        name: productData.name,
        price: Number(productData.price),
        category: productData.category,
        stock: Number(productData.stock || 0),
        rating: 0,
        reviews: 0,
        vendorId: vendor.id,
        vendorName: vendor.name,
        image: productData.image || "",
        description: productData.description || "",
        keywords: productData.keywords || [],
        status: "pending",
createdAt: new Date().toISOString(),

    };

    products.push(newProduct);
    saveProductsToStorage(products);

    return { success: true, product: newProduct };
}


/* ========= Product Update/Delete with Ownership Guard ========= */

function updateProduct(productId, newData) {
    const user = typeof getCurrentUser === "function" ? getCurrentUser() : null;
    if (!user) return { success:false, message:"Not logged in" };

    const products = getAllProducts();
    const index = products.findIndex(p => p.id === productId);
    if (index === -1) return { success:false, message:"Product not found" };

    const product = products[index];

    // permission check
    if (user.role !== "admin" && product.vendorId !== user.id) {
        return { success:false, message:"Not allowed" };
    }

    products[index] = {
        ...product,
        ...newData,
        price: Number(newData.price ?? product.price),
        stock: Number(newData.stock ?? product.stock),
        updatedAt: new Date().toISOString()
    };

    saveProductsToStorage(products);
    return { success:true, message:"Product updated" };
}


function deleteProduct(productId) {
    const user = typeof getCurrentUser === "function" ? getCurrentUser() : null;
    if (!user) return { success:false, message:"Not logged in" };

    const products = getAllProducts();
    const product = products.find(p => p.id === productId);
    if (!product) return { success:false, message:"Product not found" };

    // permission check
    if (user.role !== "admin" && product.vendorId !== user.id) {
        return { success:false, message:"Not allowed" };
    }

    const newList = products.filter(p => p.id !== productId);
    saveProductsToStorage(newList);

    return { success:true, message:"Product deleted" };
}

