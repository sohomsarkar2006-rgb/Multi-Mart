
//  CONFIGURATION 
const RECOMMEND_CONFIG = {
    MAX_RECOMMENDATIONS: 8,
    MIN_SCORE: 0.1,
    RECENT_SEARCHES_WEIGHT: 0.4,
    CLICKED_PRODUCTS_WEIGHT: 0.6,
    STORAGE_KEY: 'shopHub_clickedProducts'
};


// SAFE PARSE HELPER (Enhancement)
function safeParseRec(raw, fallback) {
    try { return JSON.parse(raw); }
    catch { return fallback; }
}


// SAVE CLICKED PRODUCT 
function saveClickedProduct(productId) {

    const product = getProductById(productId);
    if (!product) return;

    const raw = localStorage.getItem(RECOMMEND_CONFIG.STORAGE_KEY);
    let clickedProducts = safeParseRec(raw, []);

    clickedProducts.unshift({
        productId: productId,
        keywords: Array.isArray(product.keywords) ? product.keywords : [],
        category: product.category || '',
        timestamp: new Date().toISOString()
    });

    // keep last 30
    clickedProducts = clickedProducts.slice(0, 30);

    localStorage.setItem(
        RECOMMEND_CONFIG.STORAGE_KEY,
        JSON.stringify(clickedProducts)
    );
}


// GET CLICKED
function getClickedProducts() {
    return safeParseRec(
        localStorage.getItem(RECOMMEND_CONFIG.STORAGE_KEY),
        []
    );
}


// SEARCH KEYWORD EXTRACTION
function extractKeywordsFromSearches() {

    const searchHistory = getSearchHistory() || [];
    const keywords = new Map();

    searchHistory.slice(0, 10).forEach(search => {

        if (!search.term) return;

        search.term
            .toLowerCase()
            .split(/\s+/)
            .forEach(word => {

                if (word.length <= 2) return;

                keywords.set(
                    word,
                    (keywords.get(word) || 0) + 1
                );
            });
    });

    return keywords;
}


// CLICK KEYWORD EXTRACTION 
function extractKeywordsFromClicks() {

    const clicked = getClickedProducts() || [];

    const keywords = new Map();
    const categories = new Map();

    clicked.slice(0, 20).forEach(click => {

        (click.keywords || []).forEach(k => {
            const key = k.toLowerCase();
            keywords.set(key, (keywords.get(key) || 0) + 1);
        });

        if (click.category) {
            categories.set(
                click.category,
                (categories.get(click.category) || 0) + 1
            );
        }
    });

    return { keywords, categories };
}


//MERGE KEYWORD MAPS
function mergeKeywordMaps(mapA, mapB) {

    const merged = new Map(mapA);

    mapB.forEach((count, key) => {
        merged.set(key, (merged.get(key) || 0) + count);
    });

    return merged;
}


// SCORE
function calculateProductScore(product, userKeywords, userCategories) {

    if (!product || !Array.isArray(product.keywords)) return 0;

    let score = 0;

    const clickedProducts = getClickedProducts();
    const alreadyClicked =
        clickedProducts.some(c => c.productId === product.id);

    // keyword score
    product.keywords.forEach(pk => {
        const key = pk.toLowerCase();
        if (userKeywords.has(key)) {
            score += userKeywords.get(key) *
                     RECOMMEND_CONFIG.RECENT_SEARCHES_WEIGHT;
        }
    });

    // category score
    if (userCategories.has(product.category)) {
        score += userCategories.get(product.category) *
                 RECOMMEND_CONFIG.CLICKED_PRODUCTS_WEIGHT;
    }

    // diversity penalty
    if (alreadyClicked) score *= 0.35;

    // quality boosts 
    if (product.rating >= 4.5) score *= 1.15;
    if (product.reviews > 100) score *= 1.10;

    return score;
}


// MAIN RECOMMENDER
function getRecommendedProducts(maxResults = RECOMMEND_CONFIG.MAX_RECOMMENDATIONS) {

    const allProducts = getAllProducts();
    if (!allProducts.length) return [];

    const searchKeywords = extractKeywordsFromSearches();
    const { keywords: clickKeywords, categories } =
        extractKeywordsFromClicks();

    const userKeywords =
        mergeKeywordMaps(searchKeywords, clickKeywords);

    if (userKeywords.size === 0 && categories.size === 0) {
        return getPopularProducts(maxResults);
    }

    const scored = allProducts.map(p => ({
        product: p,
        score: calculateProductScore(p, userKeywords, categories)
    }));

    const filtered = scored
        .filter(x => x.score >= RECOMMEND_CONFIG.MIN_SCORE)
        .sort((a,b)=> b.score - a.score);

    const recommendations = [];

    filtered.forEach(item => {
        if (recommendations.length < maxResults &&
            !recommendations.find(p => p.id === item.product.id)) {
            recommendations.push(item.product);
        }
    });

    // fill with popular if short
    if (recommendations.length < maxResults) {
        getPopularProducts(maxResults).forEach(p => {
            if (!recommendations.find(r => r.id === p.id)) {
                recommendations.push(p);
            }
        });
    }

    return recommendations.slice(0, maxResults);
}


// POPULAR
function getPopularProducts(maxResults = 8) {

    return [...getAllProducts()]
        .sort((a,b)=>
            b.rating - a.rating ||
            b.reviews - a.reviews
        )
        .slice(0, maxResults);
}


//SIMILAR 
function getSimilarProducts(productId, maxResults = 4) {

    const product = getProductById(productId);
    if (!product) return [];

    return getAllProducts()
        .filter(p => p.id !== productId)
        .map(p => {

            let score = 0;

            if (p.category === product.category) score += 10;

            const overlap =
                (p.keywords || [])
                .filter(k => (product.keywords||[]).includes(k))
                .length;

            score += overlap * 2;

            if (p.vendorId === product.vendorId) score += 3;

            const priceDiff =
                Math.abs(p.price-product.price)/product.price;

            if (priceDiff < 0.3) score += 2;

            return { product:p, score };
        })
        .sort((a,b)=> b.score-a.score)
        .slice(0, maxResults)
        .map(x=>x.product);
}


// TRENDING
function getTrendingProducts(maxResults = 8) {

    const clicked = getClickedProducts();
    const counts = new Map();

    const oneWeekAgo = Date.now() - 7*24*60*60*1000;

    clicked.forEach(c => {
        if (new Date(c.timestamp).getTime() >= oneWeekAgo) {
            counts.set(
                c.productId,
                (counts.get(c.productId)||0)+1
            );
        }
    });

    return Array.from(counts.entries())
        .map(([id,count]) => ({
            product: getProductById(id),
            count
        }))
        .filter(x => x.product)
        .sort((a,b)=> b.count-a.count)
        .slice(0,maxResults)
        .map(x=>x.product);
}


// RENDER
function renderRecommendedProducts() {

    const container = document.getElementById('recommendedProducts');
    if (!container) return;

    const recs = getRecommendedProducts();

    if (!recs.length) {
        container.innerHTML =
            '<p>No recommendations yet — browse products.</p>';
        return;
    }

    container.innerHTML =
        recs.map(createProductCard).join('');
}


// PRODUCT CARD
function createProductCard(product) {

    const img = product.image || 'assets/images/placeholder.png';

    return `
    <div class="product-card"
         onclick="viewProduct('${product.id}')">

        <img src="${img}" class="product-image">

        <p class="product-vendor">${product.vendorName}</p>
        <h3 class="product-name">${product.name}</h3>

        <p class="product-price">
            ${formatPrice(product.price)}
        </p>

        <div class="product-rating">
            ${getStarRating(product.rating)}
            (${product.reviews})
        </div>

        <button class="btn-add-cart"
          onclick="event.stopPropagation();
                   addProductToCart('${product.id}')">
          Add to Cart
        </button>
    </div>`;
}


// VIEW PRODUCT 
function viewProduct(productId) {
    saveClickedProduct(productId);
    window.location.href =
        `product-details.html?id=${productId}`;
}


// CLEAR DATA
function clearRecommendationData() {
    localStorage.removeItem(RECOMMEND_CONFIG.STORAGE_KEY);
    localStorage.removeItem(APP_CONFIG.SEARCH_HISTORY_KEY);
    console.log('Recommendation data cleared');
}
