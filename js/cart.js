const CART_KEY = "shop_cart";
const MAX_QUANTITY_PER_ITEM = 10;
const TAX_RATE = 0.05;
const FREE_SHIPPING_THRESHOLD = 500;
const SHIPPING_COST = 40;

function getCart() {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartBadge();
}

function addToCart(productId, quantity = 1) {
    quantity = Number(quantity) || 1;
    if (quantity < 1) quantity = 1;

    if (typeof getProductById !== "function") {
        return { success: false, message: "Product lookup unavailable" };
    }

    const product = getProductById(productId);
    if (!product) return { success: false, message: "Product not found" };
    if (product.stock < quantity) return { success: false, message: "Not enough stock" };

    const cart = getCart();
    const existing = cart.find(i => i.productId === productId);

    if (existing) {
        const newQty = existing.quantity + quantity;
        if (newQty > MAX_QUANTITY_PER_ITEM) {
            return { success: false, message: "Max quantity reached" };
        }
        if (newQty > product.stock) {
            return { success: false, message: "Not enough stock" };
        }
        existing.quantity = newQty;
    } else {
        cart.push({
            productId,
            name: product.name,
            price: product.price,
            image: product.image,
            vendorName: product.vendorName,
            quantity,
            addedAt: new Date().toISOString()
        });
    }

    saveCart(cart);
    return { success: true, message: "Added to cart" };
}

function updateCartQuantity(productId, quantity) {
    quantity = Number(quantity);
    if (!quantity || quantity < 1) return removeFromCart(productId);

    const product = getProductById(productId);
    if (!product) return { success: false, message: "Product not found" };
    if (quantity > product.stock) return { success: false, message: "Not enough stock" };
    if (quantity > MAX_QUANTITY_PER_ITEM) return { success: false, message: "Max quantity reached" };

    const cart = getCart();
    const item = cart.find(i => i.productId === productId);
    if (!item) return { success: false, message: "Item not in cart" };

    item.quantity = quantity;
    saveCart(cart);
    return { success: true };
}

function removeFromCart(productId) {
    const updated = getCart().filter(i => i.productId !== productId);
    saveCart(updated);
    return { success: true };
}

function clearCart() {
    saveCart([]);
}

function getCartTotal() {
    const cart = getCart();
    const subtotal = cart.reduce((t, i) => t + i.price * i.quantity, 0);
    const tax = subtotal * TAX_RATE;
    const shipping = subtotal > 0 && subtotal < FREE_SHIPPING_THRESHOLD ? SHIPPING_COST : 0;

    return {
        subtotal,
        tax,
        shipping,
        total: subtotal + tax + shipping,
        itemCount: cart.reduce((c, i) => c + i.quantity, 0)
    };
}

function getCartItemCount() {
    return getCart().reduce((c, i) => c + i.quantity, 0);
}

function updateCartBadge() {
    const badge = document.querySelector(".cart-badge");
    if (!badge) return;
    const count = getCartItemCount();
    badge.textContent = count;
    badge.style.display = count > 0 ? "flex" : "none";
}

function renderCartItems() {
    const container = document.getElementById("cartItemsContainer");
    if (!container) return;

    const cart = getCart();

    if (!cart.length) {
        container.innerHTML = `
            <div class="empty-state">
                <h2>Your cart is empty</h2>
                <button onclick="window.location.href='user-home.html'">
                    Continue Shopping
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = cart.map(item => `
        <div class="cart-item">
            <img src="${item.image}">
            <div>
                <h3>${item.name}</h3>
                <p>${item.vendorName}</p>
                <p>${formatPrice(item.price)}</p>
            </div>
            <div>
                <button onclick="changeQuantity('${item.productId}',-1)">-</button>
                <span>${item.quantity}</span>
                <button onclick="changeQuantity('${item.productId}',1)">+</button>
            </div>
            <strong>${formatPrice(item.price * item.quantity)}</strong>
            <button onclick="removeCartItem('${item.productId}')">Remove</button>
        </div>
    `).join("");

    updateCartSummary();
}

function updateCartSummary() {
    const el = document.getElementById("cartSummary");
    if (!el) return;

    const t = getCartTotal();

    el.innerHTML = `
        <div>Subtotal: ${formatPrice(t.subtotal)}</div>
        <div>Tax: ${formatPrice(t.tax)}</div>
        <div>Shipping: ${t.shipping ? formatPrice(t.shipping) : "FREE"}</div>
        <div><strong>Total: ${formatPrice(t.total)}</strong></div>
        <button onclick="proceedToCheckout()">Checkout</button>
    `;
}

function changeQuantity(productId, change) {
    const cart = getCart();
    const item = cart.find(i => i.productId === productId);
    if (!item) return;

    const result = updateCartQuantity(productId, item.quantity + change);
    if (result.success) renderCartItems();
    else alert(result.message);
}

function removeCartItem(productId) {
    if (!confirm("Remove item?")) return;
    removeFromCart(productId);
    renderCartItems();
}

function proceedToCheckout() {
    if (!getCart().length) {
        alert("Cart empty");
        return;
    }
    window.location.href = "checkout.html";
}

function addProductToCart(productId) {
    const r = addToCart(productId, 1);
    alert(r.message);
}
function proceedToCheckout() {
    alert("Checkout clicked");
    window.location.href = "checkout.html";
}

