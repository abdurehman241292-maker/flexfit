const API_BASE = "";
const CATEGORIES = ["shirts", "caps", "trousers", "jackets"];

let allProducts = [];
let cart = JSON.parse(localStorage.getItem("flexfit_cart") || "[]");
let favorites = JSON.parse(localStorage.getItem("flexfit_favs") || "[]");

function saveCart() {
  localStorage.setItem("flexfit_cart", JSON.stringify(cart));
  updateCartBadge();
}
function saveFavs() {
  localStorage.setItem("flexfit_favs", JSON.stringify(favorites));
}

function updateCartBadge() {
  const count = cart.reduce((sum, i) => sum + i.quantity, 0);
  const badge = document.getElementById("cartBadge");
  if (!badge) return;
  badge.textContent = count;
  badge.style.display = count > 0 ? "flex" : "none";
}

async function loadAllProducts() {
  try {
    const res = await fetch(`${API_BASE}/api/products`);
    allProducts = await res.json();
  } catch (err) {
    console.error("Failed to load products", err);
  }
}

async function loadCategory(category) {
  const grid = document.getElementById(`grid-${category}`);
  const products = allProducts.filter((p) => p.category === category);

  if (!products.length) {
    grid.innerHTML = `<div class="empty-state">No ${category} listed yet — check back soon.</div>`;
    return;
  }
  grid.innerHTML = products.map(renderCard).join("");
  observeReveal();
}

function renderCard(p) {
  const isFav = favorites.includes(p._id);
  return `
    <div class="product-card reveal">
      <div class="product-image">
        <img src="${p.image}" alt="${p.name}" loading="lazy">
        <button class="fav-btn ${isFav ? "active" : ""}" onclick="toggleFav('${p._id}', this)">
          <svg viewBox="0 0 24 24" stroke-width="2"><path d="M12 21s-7.5-4.6-10-9.3C.5 8 2.3 4.5 6 4c2-.3 3.7.8 6 3 2.3-2.2 4-3.3 6-3 3.7.5 5.5 4 4 7.7C19.5 16.4 12 21 12 21z"/></svg>
        </button>
      </div>
      <div class="product-info">
        <div class="product-cat">${p.category}</div>
        <div class="product-name">${p.name}</div>
        <div class="product-footer">
          <div class="product-price">Rs. ${Number(p.price).toLocaleString()}</div>
          <button class="order-btn" onclick="quickAdd('${p._id}', this)">Add</button>
        </div>
      </div>
    </div>
  `;
}

function toggleFav(id, btn) {
  if (favorites.includes(id)) {
    favorites = favorites.filter((f) => f !== id);
    btn.classList.remove("active");
  } else {
    favorites.push(id);
    btn.classList.add("active");
  }
  saveFavs();
}

function quickAdd(id, btn) {
  const product = allProducts.find((p) => p._id === id);
  if (!product) return;
  const existing = cart.find((i) => i.productId === id && i.size === "L");
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ productId: id, name: product.name, price: product.price, image: product.image, size: "L", quantity: 1 });
  }
  saveCart();
  btn.textContent = "Added";
  btn.classList.add("added");
  setTimeout(() => {
    btn.textContent = "Add";
    btn.classList.remove("added");
  }, 1200);
}

// ---------- Reveal-on-scroll animation ----------
function observeReveal() {
  const els = document.querySelectorAll(".reveal:not(.in-view)");
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  els.forEach((el) => io.observe(el));
}

// ---------- Cart Drawer ----------
function renderCartDrawer() {
  const body = document.getElementById("drawerBody");
  const foot = document.getElementById("drawerFoot");
  if (!cart.length) {
    body.innerHTML = `<div class="empty-state">Your cart is empty.</div>`;
    foot.innerHTML = "";
    return;
  }
  body.innerHTML = cart
    .map(
      (item, idx) => `
    <div class="cart-item">
      <img src="${item.image}" alt="${item.name}">
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-meta">Size: ${item.size} · Rs. ${Number(item.price).toLocaleString()}</div>
        <div class="cart-item-controls">
          <button class="qty-btn" onclick="changeQty(${idx}, -1)">−</button>
          <span>${item.quantity}</span>
          <button class="qty-btn" onclick="changeQty(${idx}, 1)">+</button>
          <button class="remove-item" onclick="removeItem(${idx})">Remove</button>
        </div>
      </div>
    </div>
  `
    )
    .join("");

  const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  foot.innerHTML = `
    <div class="cart-subtotal"><span>Subtotal</span><span>Rs. ${subtotal.toLocaleString()}</span></div>
    <a href="checkout.html" class="btn btn-solid btn-block">Checkout</a>
  `;
}

function changeQty(idx, delta) {
  cart[idx].quantity += delta;
  if (cart[idx].quantity <= 0) cart.splice(idx, 1);
  saveCart();
  renderCartDrawer();
}
function removeItem(idx) {
  cart.splice(idx, 1);
  saveCart();
  renderCartDrawer();
}

function openCart() {
  renderCartDrawer();
  document.getElementById("drawerOverlay").classList.add("open");
  document.getElementById("cartDrawer").classList.add("open");
}
function closeCart() {
  document.getElementById("drawerOverlay").classList.remove("open");
  document.getElementById("cartDrawer").classList.remove("open");
}

// ---------- Search ----------
function openSearch() {
  document.getElementById("searchOverlay").classList.add("open");
  document.getElementById("searchInput").focus();
}
function closeSearch() {
  document.getElementById("searchOverlay").classList.remove("open");
  document.getElementById("searchInput").value = "";
  document.getElementById("searchResults").innerHTML = "";
}
function runSearch(query) {
  const results = document.getElementById("searchResults");
  if (!query.trim()) {
    results.innerHTML = "";
    return;
  }
  const matches = allProducts.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));
  results.innerHTML = matches.length
    ? matches.map(renderCard).join("")
    : `<div class="empty-state" style="grid-column:1/-1;">No products match "${query}"</div>`;
}

// ---------- Init ----------
document.addEventListener("DOMContentLoaded", async () => {
  updateCartBadge();
  await loadAllProducts();
  CATEGORIES.forEach(loadCategory);

  document.getElementById("cartIconBtn").addEventListener("click", openCart);
  document.getElementById("drawerClose").addEventListener("click", closeCart);
  document.getElementById("drawerOverlay").addEventListener("click", closeCart);

  document.getElementById("searchIconBtn").addEventListener("click", openSearch);
  document.getElementById("searchClose").addEventListener("click", closeSearch);
  document.getElementById("searchInput").addEventListener("input", (e) => runSearch(e.target.value));

  document.querySelectorAll(".category-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.getElementById(tab.dataset.target).scrollIntoView({ behavior: "smooth" });
    });
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          document.querySelectorAll(".category-tab").forEach((t) => t.classList.remove("active"));
          const activeTab = document.querySelector(`.category-tab[data-target="${entry.target.id}"]`);
          if (activeTab) activeTab.classList.add("active");
        }
      });
    },
    { threshold: 0.4 }
  );
  CATEGORIES.forEach((c) => {
    const section = document.getElementById(c);
    if (section) observer.observe(section);
  });

  observeReveal();
});