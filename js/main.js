const PRODUCTS_KEY = "shop_products";
const SEARCH_HISTORY_KEY = "shop_search";

const DEFAULT_PRODUCTS = [

    

/* ===== Tech Paradise ===== */
{
id:"p1",name:"Wireless Headphones",price:2999,category:"Electronics",stock:25,
rating:4.5,reviews:120,vendorId:"vendor_1",vendorName:"Tech Paradise",
image:"https://images.unsplash.com/photo-1505740420928-5e560c06d30e",
description:"High-quality wireless headphones",
keywords:["audio","music","wireless","headphones"],
status:"approved",createdAt:"2025-01-01T00:00:00"
},
{
id:"p2",name:"Smart Watch",price:4999,category:"Electronics",stock:15,
rating:4.3,reviews:80,vendorId:"vendor_1",vendorName:"Tech Paradise",
image:"https://images.unsplash.com/photo-1523275335684-37898b6baf30",
description:"Fitness smartwatch",
keywords:["watch","smart","fitness"],
status:"approved",createdAt:"2025-01-01T00:00:00"
},
{
id:"p3",name:"Bluetooth Speaker",price:1999,category:"Electronics",stock:40,
rating:4.4,reviews:95,vendorId:"vendor_1",vendorName:"Tech Paradise",
image:"https://images.unsplash.com/photo-1512446733611-9099a758e3c2",
description:"Portable bluetooth speaker",
keywords:["speaker","audio","bluetooth"],
status:"approved",createdAt:"2025-01-01T00:00:00"
},
{
id:"p4",name:"Gaming Mouse",price:1299,category:"Electronics",stock:60,
rating:4.6,reviews:210,vendorId:"vendor_1",vendorName:"Tech Paradise",
image:"https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7",
description:"RGB gaming mouse",
keywords:["mouse","gaming","pc"],
status:"approved",createdAt:"2025-01-01T00:00:00"
},
{
id:"p5",name:"Mechanical Keyboard",price:3499,category:"Electronics",stock:20,
rating:4.7,reviews:150,vendorId:"vendor_1",vendorName:"Tech Paradise",
image:"https://images.unsplash.com/photo-1517336714731-489689fd1ca8",
description:"Mechanical keyboard",
keywords:["keyboard","gaming","typing"],
status:"approved",createdAt:"2025-01-01T00:00:00"
},

/* ===== Style Central ===== */
{
id:"p6",name:"Running Shoes",price:3499,category:"Fashion",stock:30,
rating:4.6,reviews:60,vendorId:"vendor_2",vendorName:"Style Central",
image:"https://images.unsplash.com/photo-1542291026-7eec264c27ff",
description:"Comfort running shoes",
keywords:["shoes","running","sports"],
status:"approved",createdAt:"2025-01-01T00:00:00"
},
{
id:"p7",name:"Leather Jacket",price:5999,category:"Fashion",stock:10,
rating:4.4,reviews:45,vendorId:"vendor_2",vendorName:"Style Central",
image:"https://images.unsplash.com/photo-1520975916090-3105956dac38",
description:"Men leather jacket",
keywords:["jacket","leather","winter"],
status:"approved",createdAt:"2025-01-01T00:00:00"
},
{
id:"p8",name:"Denim Jeans",price:2199,category:"Fashion",stock:50,
rating:4.2,reviews:88,vendorId:"vendor_2",vendorName:"Style Central",
image:"https://images.unsplash.com/photo-1542272604-787c3835535d",
description:"Blue denim jeans",
keywords:["jeans","denim","pants"],
status:"approved",createdAt:"2025-01-01T00:00:00"
},
{
id:"p9",name:"Sports T-Shirt",price:899,category:"Fashion",stock:70,
rating:4.1,reviews:110,vendorId:"vendor_2",vendorName:"Style Central",
image:"https://images.unsplash.com/photo-1521572163474-6864f9cf17ab",
description:"Breathable sports tshirt",
keywords:["tshirt","sports","gym"],
status:"approved",createdAt:"2025-01-01T00:00:00"
},
{
id:"p10",name:"Sneakers",price:2799,category:"Fashion",stock:35,
rating:4.5,reviews:140,vendorId:"vendor_2",vendorName:"Style Central",
image:"https://images.unsplash.com/photo-1491553895911-0055eca6402d",
description:"Casual sneakers",
keywords:["sneakers","casual","shoes"],
status:"approved",createdAt:"2025-01-01T00:00:00"
},

/* ===== Home Hub ===== */
{
id:"p11",name:"Office Chair",price:7499,category:"Home",stock:12,
rating:4.6,reviews:75,vendorId:"vendor_3",vendorName:"Home Hub",
image:"https://images.unsplash.com/photo-1580480055273-228ff5388ef8",
description:"Ergonomic office chair",
keywords:["chair","office","furniture"],
status:"approved",createdAt:"2025-01-01T00:00:00"
},
{
id:"p12",name:"Study Table",price:8999,category:"Home",stock:8,
rating:4.4,reviews:34,vendorId:"vendor_3",vendorName:"Home Hub",
image:"https://images.unsplash.com/photo-1505693416388-ac5ce068fe85",
description:"Wooden study table",
keywords:["table","desk","study"],
status:"approved",createdAt:"2025-01-01T00:00:00"
},
{
id:"p13",name:"LED Lamp",price:1299,category:"Home",stock:55,
rating:4.3,reviews:66,vendorId:"vendor_3",vendorName:"Home Hub",
image:"https://images.unsplash.com/photo-1507473885765-e6ed057f782c",
description:"Adjustable LED lamp",
keywords:["lamp","light","led"],
status:"approved",createdAt:"2025-01-01T00:00:00"
},
{
id:"p14",name:"Wall Clock",price:799,category:"Home",stock:40,
rating:4.0,reviews:29,vendorId:"vendor_3",vendorName:"Home Hub",
image:"https://images.unsplash.com/photo-1509042239860-f550ce710b93",
description:"Modern wall clock",
keywords:["clock","wall","time"],
status:"approved",createdAt:"2025-01-01T00:00:00"
},
{
id:"p15",name:"Bookshelf",price:6499,category:"Home",stock:6,
rating:4.5,reviews:22,vendorId:"vendor_3",vendorName:"Home Hub",
image:"https://images.unsplash.com/photo-1519710164239-da123dc03ef4",
description:"Wooden bookshelf",
keywords:["shelf","books","storage"],
status:"approved",createdAt:"2025-01-01T00:00:00"
},

/* ===== Fit Life ===== */
{
id:"p16",name:"Yoga Mat",price:999,category:"Sports",stock:90,
rating:4.4,reviews:130,vendorId:"vendor_4",vendorName:"Fit Life",
image:"https://images.unsplash.com/photo-1599058917212-d750089bc07e",
description:"Non-slip yoga mat",
keywords:["yoga","fitness","mat"],
status:"approved",createdAt:"2025-01-01T00:00:00"
},
{
id:"p17",name:"Dumbbell Set",price:2599,category:"Sports",stock:20,
rating:4.6,reviews:77,vendorId:"vendor_4",vendorName:"Fit Life",
image:"https://images.unsplash.com/photo-1517838277536-f5f99be501cd",
description:"Adjustable dumbbells",
keywords:["gym","weights","dumbbell"],
status:"approved",createdAt:"2025-01-01T00:00:00"
},
{
id:"p18",name:"Skipping Rope",price:399,category:"Sports",stock:150,
rating:4.2,reviews:200,vendorId:"vendor_4",vendorName:"Fit Life",
image:"https://images.unsplash.com/photo-1605296867304-46d5465a13f1",
description:"Speed skipping rope",
keywords:["rope","cardio","jump"],
status:"approved",createdAt:"2025-01-01T00:00:00"
},

/* ===== Book World ===== */
{
id:"p19",name:"Data Science Handbook",price:1299,category:"Books",stock:25,
rating:4.8,reviews:54,vendorId:"vendor_5",vendorName:"Book World",
image:"https://images.unsplash.com/photo-1512820790803-83ca734da794",
description:"Guide to data science",
keywords:["book","data","science"],
status:"approved",createdAt:"2025-01-01T00:00:00"
},
{
id:"p20",name:"Machine Learning Guide",price:1499,category:"Books",stock:18,
rating:4.7,reviews:41,vendorId:"vendor_5",vendorName:"Book World",
image:"https://images.unsplash.com/photo-1524995997946-a1c2e315a42f",
description:"ML fundamentals",
keywords:["machine","learning","ai"],
status:"approved",createdAt:"2025-01-01T00:00:00"
},
/* ===== Kitchen & Appliances ===== */
{
id:"p21",name:"Mixer Grinder",price:3899,category:"Home",stock:14,
rating:4.3,reviews:58,vendorId:"vendor_3",vendorName:"Home Hub",
image:"https://images.unsplash.com/photo-1586201375761-83865001e31c",
description:"3-jar mixer grinder",
keywords:["mixer","kitchen","grinder"],
status:"approved",createdAt:"2025-01-01T00:00:00"
},
{
id:"p22",name:"Electric Kettle",price:1499,category:"Home",stock:36,
rating:4.4,reviews:102,vendorId:"vendor_3",vendorName:"Home Hub",
image:"https://images.unsplash.com/photo-1511920170033-f8396924c348",
description:"1.5L electric kettle",
keywords:["kettle","electric","boil"],
status:"approved",createdAt:"2025-01-01T00:00:00"
},

/* ===== Mobile Accessories ===== */
{
id:"p23",name:"Fast Charger 65W",price:1299,category:"Electronics",stock:80,
rating:4.5,reviews:210,vendorId:"vendor_1",vendorName:"Tech Paradise",
image:"https://images.unsplash.com/photo-1583863788434-e58a36330cf0",
description:"USB-C fast charger",
keywords:["charger","fast","usb"],
status:"approved",createdAt:"2025-01-01T00:00:00"
},
{
id:"p24",name:"Phone Tripod",price:899,category:"Electronics",stock:44,
rating:4.2,reviews:67,vendorId:"vendor_1",vendorName:"Tech Paradise",
image:"https://images.unsplash.com/photo-1519183071298-a2962be90b8e",
description:"Flexible mobile tripod",
keywords:["tripod","camera","mobile"],
status:"approved",createdAt:"2025-01-01T00:00:00"
},

/* ===== Fashion Add-ons ===== */
{
id:"p25",name:"Sports Cap",price:499,category:"Fashion",stock:120,
rating:4.1,reviews:95,vendorId:"vendor_2",vendorName:"Style Central",
image:"https://images.unsplash.com/photo-1521369909029-2afed882baee",
description:"Adjustable sports cap",
keywords:["cap","hat","sports"],
status:"approved",createdAt:"2025-01-01T00:00:00"
},
{
id:"p26",name:"Travel Backpack",price:2499,category:"Fashion",stock:28,
rating:4.6,reviews:143,vendorId:"vendor_2",vendorName:"Style Central",
image:"https://images.unsplash.com/photo-1509762774605-f07235a08f1f",
description:"Waterproof travel backpack",
keywords:["bag","backpack","travel"],
status:"approved",createdAt:"2025-01-01T00:00:00"
},

/* ===== Fitness Gear ===== */
{
id:"p27",name:"Resistance Bands",price:799,category:"Sports",stock:75,
rating:4.4,reviews:88,vendorId:"vendor_4",vendorName:"Fit Life",
image:"https://images.unsplash.com/photo-1594737625785-c6c5d0a5c3a3",
description:"Workout resistance bands",
keywords:["bands","fitness","exercise"],
status:"approved",createdAt:"2025-01-01T00:00:00"
},
{
id:"p28",name:"Foam Roller",price:1199,category:"Sports",stock:32,
rating:4.3,reviews:51,vendorId:"vendor_4",vendorName:"Fit Life",
image:"https://images.unsplash.com/photo-1599058917765-a780eda07a3e",
description:"Muscle recovery roller",
keywords:["roller","recovery","gym"],
status:"approved",createdAt:"2025-01-01T00:00:00"
},

/* ===== More Books ===== */
{
id:"p29",name:"Quant Finance Basics",price:1599,category:"Books",stock:20,
rating:4.7,reviews:39,vendorId:"vendor_5",vendorName:"Book World",
image:"https://images.unsplash.com/photo-1521587760476-6c12a4b040da",
description:"Intro to quantitative finance",
keywords:["quant","finance","trading"],
status:"approved",createdAt:"2025-01-01T00:00:00"
},
{
id:"p30",name:"Statistics Crash Course",price:999,category:"Books",stock:42,
rating:4.5,reviews:73,vendorId:"vendor_5",vendorName:"Book World",
image:"https://images.unsplash.com/photo-1535909339361-9b0c2e6f9b3b",
description:"Quick statistics guide",
keywords:["statistics","math","data"],
status:"approved",createdAt:"2025-01-01T00:00:00"
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

function getPopularProducts(limit = 4) {
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
function getRecommendedProducts(limit = 5) {

    const products = getAllProducts(false);
    const hist = getSearchHistory();

    if (!hist.length) {
        // no history → show popular
        return getPopularProducts(limit);
    }

    const last = hist[0];

    // score each product
    const scored = products.map(p => {
        let score = 0;

        if (p.name.toLowerCase().includes(last)) score += 5;
        if (p.category.toLowerCase().includes(last)) score += 3;
        if ((p.keywords || []).some(k => k.includes(last))) score += 3;

        // boost by rating
        score += p.rating;

        return { ...p, score };
    });

    return scored
        .sort((a,b)=> b.score - a.score)
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

    if (!q) return getPopularProducts(4);

    const term = q.toLowerCase().trim();
    const products = getAllProducts(false);

    // Stage 1: Direct match 
    let results = products.filter(p =>
        p.name.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term) ||
        (p.keywords || []).some(k => k.toLowerCase().includes(term))
    );
    if (results.length) return results;

    // Stage 2: Token match 
    const tokens = term.split(/\s+/);

    results = products.filter(p => {
        const text = (p.name + " " + p.description).toLowerCase();
        return tokens.some(t => text.includes(t));
    });
    if (results.length) return results;

    // Stage 3: Fuzzy typo match
    results = products.filter(p => {
    const name = p.name.toLowerCase();

    const len = Math.max(name.length, term.length);

    let allowed;
    if (len <= 4) allowed = 1;
    else if (len <= 8) allowed = 2;
    else allowed = 3;

    return editDistance(name, term) <= allowed;
});

if (results.length) return results;


    // Stage 4: Related fallback
    return getPopularProducts(4);
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
//for optimal search
function editDistance(a, b) {
    a = a.toLowerCase();
    b = b.toLowerCase();

    const dp = Array(a.length + 1).fill(null)
        .map(() => Array(b.length + 1).fill(0));

    for (let i = 0; i <= a.length; i++) dp[i][0] = i;
    for (let j = 0; j <= b.length; j++) dp[0][j] = j;

    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            const cost = a[i-1] === b[j-1] ? 0 : 1;
            dp[i][j] = Math.min(
                dp[i-1][j] + 1,
                dp[i][j-1] + 1,
                dp[i-1][j-1] + cost
            );
        }
    }
    return dp[a.length][b.length];
}


