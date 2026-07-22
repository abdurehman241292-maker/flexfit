const API_BASE = ""; // same origin. Change to "https://your-backend-url.com" if frontend is hosted separately.

const CATEGORIES = ["shirts", "caps", "trousers", "jackets"];

async function loadCategory(category) {
  const grid = document.getElementById(`grid-${category}`);
  try {
    const res = await fetch(`${API_BASE}/api/products?category=${category}`);
    const products = await res.json();

    if (!products.length) {
      grid.innerHTML = `<div class="empty-state">No ${category} listed yet — check back soon.</div>`;
      return;
    }

    grid.innerHTML = products.map(renderCard).join("");
  } catch (err) {
    grid.innerHTML = `<div class="empty-state">Couldn't load products. Is the server running?</div>`;
    console.error(err);
  }
}

function renderCard(p) {
  return `
    <div class="product-card">
      <div class="product-image"><img src="${p.image}" alt="${p.name}" loading="lazy"></div>
      <div class="product-info">
        <div class="product-cat">${p.category}</div>
        <div class="product-name">${p.name}</div>
        <div class="product-footer">
          <div class="product-price">Rs. ${Number(p.price).toLocaleString()}</div>
          <button class="order-btn" onclick="openOrderModal('${p._id}', '${escapeQuotes(p.name)}', ${p.price})">Order</button>
        </div>
      </div>
    </div>
  `;
}

function escapeQuotes(str) {
  return String(str).replace(/'/g, "\\'");
}

function openOrderModal(id, name, price) {
  document.getElementById("orderProductId").value = id;
  document.getElementById("modalProductName").textContent = name;
  document.getElementById("modalProductPrice").textContent = `Rs. ${Number(price).toLocaleString()}`;
  document.getElementById("orderMsg").textContent = "";
  document.getElementById("orderForm").reset();
  document.getElementById("orderQty").value = 1;
  document.getElementById("orderOverlay").classList.add("open");
}

function closeOrderModal() {
  document.getElementById("orderOverlay").classList.remove("open");
}

document.getElementById("closeModal").addEventListener("click", closeOrderModal);
document.getElementById("orderOverlay").addEventListener("click", (e) => {
  if (e.target.id === "orderOverlay") closeOrderModal();
});

document.getElementById("orderForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const msg = document.getElementById("orderMsg");
  msg.textContent = "Placing order…";
  msg.className = "form-msg";

  const payload = {
    productId: document.getElementById("orderProductId").value,
    size: document.getElementById("orderSize").value,
    quantity: Number(document.getElementById("orderQty").value),
    customerName: document.getElementById("orderName").value,
    phone: document.getElementById("orderPhone").value,
    address: document.getElementById("orderAddress").value,
    notes: document.getElementById("orderNotes").value,
  };

  try {
    const res = await fetch(`${API_BASE}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || "Order failed");

    msg.textContent = "Order placed! We'll contact you shortly to confirm.";
    msg.className = "form-msg success";
    setTimeout(closeOrderModal, 2200);
  } catch (err) {
    msg.textContent = err.message;
    msg.className = "form-msg error";
  }
});

// category tab scroll + active state
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

CATEGORIES.forEach(loadCategory);