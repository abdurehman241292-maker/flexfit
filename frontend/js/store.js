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
    <div class="product-card reveal" onclick="location.href='product.html?id=${p._id}'" style="cursor:pointer;">
      <div class="product-image">
       <img src="${p.images[0]}" alt="${p.name}" loading="lazy">
        <button class="fav-btn ${isFav ? "active" : ""}" onclick="event.stopPropagation(); toggleFav('${p._id}', this)">
          <svg viewBox="0 0 24 24" stroke-width="2"><path d="M12 21s-7.5-4.6-10-9.3C.5 8 2.3 4.5 6 4c2-.3 3.7.8 6 3 2.3-2.2 4-3.3 6-3 3.7.5 5.5 4 4 7.7C19.5 16.4 12 21 12 21z"/></svg>
        </button>
        <button class="cart-overlay-btn" onclick="event.stopPropagation(); quickAdd('${p._id}', this)" aria-label="Add to cart">
          <svg viewBox="0 0 24 24" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
        </button>
      </div>
      <div class="product-info">
        <div class="product-cat">${p.category}</div>
        <div class="product-name">${p.name}</div>
        <div class="product-price">Rs. ${Number(p.price).toLocaleString()}</div>
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
  updateFavBadge();
}

function updateFavBadge() {
  const badge = document.getElementById("favBadge");
  if (!badge) return;
  badge.textContent = favorites.length;
  badge.style.display = favorites.length > 0 ? "flex" : "none";
}

function quickAdd(id, btn) {
  const product = allProducts.find((p) => p._id === id);
  if (!product) return;
  const existing = cart.find((i) => i.productId === id && i.size === "L");
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ productId: id, name: product.name, price: product.price,image: product.images[0], size: "L", quantity: 1 });
  }
  saveCart();
  btn.classList.add("added");
  setTimeout(() => btn.classList.remove("added"), 900);
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

// ---------- Favorites Drawer ----------
function renderFavDrawer() {
  const body = document.getElementById("favDrawerBody");
  const favProducts = allProducts.filter((p) => favorites.includes(p._id));

  if (!favProducts.length) {
    body.innerHTML = `<div class="empty-state">No favorites yet — tap the heart on a product to save it here.</div>`;
    return;
  }

  body.innerHTML = favProducts
    .map(
      (p) => `
    <div class="cart-item">
      <img src="${p.images[0]}" alt="${p.name}">
      <div class="cart-item-info">
        <div class="cart-item-name">${p.name}</div>
        <div class="cart-item-meta">Rs. ${Number(p.price).toLocaleString()}</div>
        <div class="cart-item-controls">
          <button class="qty-btn" style="width:auto;border-radius:2px;padding:0 10px;font-size:0.7rem;" onclick="quickAddFromFav('${p._id}')">Add to Cart</button>
          <button class="remove-item" onclick="removeFav('${p._id}')">Remove</button>
        </div>
      </div>
    </div>
  `
    )
    .join("");
}

function quickAddFromFav(id) {
  const product = allProducts.find((p) => p._id === id);
  if (!product) return;
  const existing = cart.find((i) => i.productId === id && i.size === "L");
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ productId: id, name: product.name, price: product.price,image: product.images[0], size: "L", quantity: 1 });
  }
  saveCart();
}

function removeFav(id) {
  favorites = favorites.filter((f) => f !== id);
  saveFavs();
  updateFavBadge();
  renderFavDrawer();
  document.querySelectorAll(`.fav-btn`).forEach((btn) => {
    if (btn.getAttribute("onclick") && btn.getAttribute("onclick").includes(id)) {
      btn.classList.remove("active");
    }
  });
}

function openFav() {
  renderFavDrawer();
  document.getElementById("favDrawerOverlay").classList.add("open");
  document.getElementById("favDrawer").classList.add("open");
}
function closeFav() {
  document.getElementById("favDrawerOverlay").classList.remove("open");
  document.getElementById("favDrawer").classList.remove("open");
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
  updateFavBadge();
  await loadAllProducts();
  CATEGORIES.forEach(loadCategory);

  document.getElementById("cartIconBtn").addEventListener("click", openCart);
  document.getElementById("drawerClose").addEventListener("click", closeCart);
  document.getElementById("drawerOverlay").addEventListener("click", closeCart);

  document.getElementById("favIconBtn").addEventListener("click", openFav);
  document.getElementById("favDrawerClose").addEventListener("click", closeFav);
  document.getElementById("favDrawerOverlay").addEventListener("click", closeFav);

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