/* =========================================================
   NUTSOY — script.js (halaman utama)
   Fitur: render menu dari data produk (localStorage), cart,
   checkout WhatsApp, search, scrollspy navbar, mobile menu.
   Data produk dikelola lewat admin.html (../html/admin.html)
   dan disimpan di localStorage supaya bisa dibaca halaman ini.
========================================================= */

const WHATSAPP_NUMBER = "6285716233796";
const CART_STORAGE_KEY = "nutsoy_cart";
const PRODUCTS_STORAGE_KEY = "nutsoy_products";
const SETTINGS_STORAGE_KEY = "nutsoy_settings";

const DEFAULT_PRODUCTS = [
  {
    id: "original-soy",
    name: "Original Soy",
    description: "Susu kedelai original dengan rasa creamy dan lembut.",
    price: 8000,
    emoji: "🥛",
    flavor: "original",
    stock: 20,
  },
  {
    id: "choco-soy",
    name: "Choco Soy",
    description: "Perpaduan susu kedelai creamy dengan rasa cokelat.",
    price: 10000,
    emoji: "🍫",
    flavor: "choco",
    stock: 20,
  },
  {
    id: "strawberry-soy",
    name: "Strawberry Soy",
    description: "Rasa strawberry yang segar dipadukan dengan susu kedelai.",
    price: 10000,
    emoji: "🍓",
    flavor: "strawberry",
    stock: 20,
  },
  {
    id: "peanut-soy",
    name: "Peanut Soy",
    description: "Kombinasi susu kedelai dengan rasa kacang yang gurih.",
    price: 10000,
    emoji: "🥜",
    flavor: "peanut",
    stock: 20,
  },
];

/* ---------------------------------------------------------
   STATE
--------------------------------------------------------- */
let products = loadProducts();
let cart = loadCart();

/* ---------------------------------------------------------
   PRODUCTS: storage helpers
--------------------------------------------------------- */
function loadProducts() {
  try {
    const saved = localStorage.getItem(PRODUCTS_STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : null;
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch (err) {
    console.error("Data produk rusak, dikembalikan ke default:", err);
  }
  // Belum ada data tersimpan / rusak -> pakai default & simpan
  saveProducts(DEFAULT_PRODUCTS);
  return DEFAULT_PRODUCTS;
}

function saveProducts(list) {
  try {
    localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    console.error("Gagal menyimpan data produk:", err);
  }
}

/* ---------------------------------------------------------
   CART: storage helpers
--------------------------------------------------------- */
function loadCart() {
  try {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("Data keranjang rusak, direset ke kosong:", err);
    return [];
  }
}

function saveCart() {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch (err) {
    console.error("Gagal menyimpan keranjang:", err);
  }
}

function formatRupiah(num) {
  return "Rp" + num.toLocaleString("id-ID");
}

function loadSettings() {
  try {
    const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch (err) {
    console.error("Data pengaturan situs rusak, diabaikan:", err);
    return {};
  }
}

function renderSiteImages() {
  const settings = loadSettings();

  const aboutPhoto = document.getElementById("about-photo");
  if (aboutPhoto) {
    aboutPhoto.innerHTML = settings.aboutImage
      ? `<img src="${settings.aboutImage}" alt="Tentang Nutsoy" />`
      : "NUTSOY";
  }

  const ownerPhoto = document.getElementById("owner-photo");
  if (ownerPhoto) {
    ownerPhoto.innerHTML = settings.ownerImage
      ? `<img src="${settings.ownerImage}" alt="Owner Nutsoy" />`
      : "👨‍💼";
  }
}

/* ---------------------------------------------------------
   MENU: render dari data produk
--------------------------------------------------------- */
function renderMenu() {
  const container = document.getElementById("menu-container");
  if (!container) return;

  container.innerHTML = products
    .map((p) => {
      const soldOut = p.stock <= 0;
      return `
        <div class="product-card${soldOut ? " sold-out" : ""}"
             data-flavor="${p.flavor || "original"}"
             data-id="${p.id}"
             data-name="${p.name}"
             data-price="${p.price}"
             data-emoji="${p.emoji}">
          <div class="product-image">${
            p.image
              ? `<img src="${p.image}" alt="${p.name}" loading="lazy" />`
              : `<span class="emoji-fallback">${p.emoji}</span>`
          }</div>
          <div class="product-info">
            <h3>${p.name}</h3>
            <p>${p.description || ""}</p>
            <div class="product-bottom">
              <span class="price">${formatRupiah(p.price)}</span>
              ${
                soldOut
                  ? `<span class="stock-badge">Stok Habis</span>`
                  : `<button type="button" class="add-cart" aria-label="Tambah ${p.name} ke keranjang">
                       <i data-feather="shopping-cart"></i>
                     </button>`
              }
            </div>
            ${
              !soldOut && p.stock <= 5
                ? `<span class="stock-low">Sisa ${p.stock}</span>`
                : ""
            }
          </div>
        </div>`;
    })
    .join("");

  if (window.feather) feather.replace();
}

/* ---------------------------------------------------------
   CART LOGIC
--------------------------------------------------------- */
function addToCart(product, buttonEl) {
  const existing = cart.find((item) => item.id === product.id);
  const currentQty = existing ? existing.qty : 0;

  if (currentQty >= product.stock) return; // tidak melebihi stok

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...product, qty: 1 });
  }

  saveCart();
  renderCart();
  updateCartCount();

  if (buttonEl) {
    buttonEl.classList.remove("bump");
    void buttonEl.offsetWidth;
    buttonEl.classList.add("bump");
  }
}

function changeQty(id, delta) {
  const item = cart.find((i) => i.id === id);
  if (!item) return;

  const product = products.find((p) => p.id === id);
  const maxQty = product ? product.stock : Infinity;

  item.qty = Math.min(item.qty + delta, maxQty);

  if (item.qty <= 0) {
    cart = cart.filter((i) => i.id !== id);
  }

  saveCart();
  renderCart();
  updateCartCount();
}

function removeFromCart(id) {
  cart = cart.filter((i) => i.id !== id);
  saveCart();
  renderCart();
  updateCartCount();
}

function getCartTotal() {
  return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
}

function updateCartCount() {
  const countEl = document.getElementById("cart-count");
  if (!countEl) return;

  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  countEl.textContent = totalItems;
  countEl.classList.toggle("hidden", totalItems === 0);
}

function renderCart() {
  const container = document.getElementById("cart-items");
  const totalEl = document.getElementById("cart-total");
  const checkoutBtn = document.getElementById("checkout-button");

  if (!container) return;

  if (cart.length === 0) {
    container.innerHTML =
      '<p class="empty-cart">Keranjang kamu masih kosong.</p>';
    if (checkoutBtn) checkoutBtn.disabled = true;
  } else {
    container.innerHTML = cart
      .map(
        (item) => `
        <div class="cart-item" data-id="${item.id}">
          <div class="cart-item-emoji">${
            item.image
              ? `<img src="${item.image}" alt="${item.name}" />`
              : item.emoji
          }</div>
          <div class="cart-item-info">
            <h4>${item.name}</h4>
            <div class="cart-item-price">${formatRupiah(item.price)}</div>
            <div class="cart-item-qty">
              <button class="qty-btn" data-action="decrease" data-id="${item.id}" aria-label="Kurangi ${item.name}">−</button>
              <span>${item.qty}</span>
              <button class="qty-btn" data-action="increase" data-id="${item.id}" aria-label="Tambah ${item.name}">+</button>
            </div>
          </div>
          <button class="remove-item" data-action="remove" data-id="${item.id}" aria-label="Hapus ${item.name}">
            <i data-feather="trash-2"></i>
          </button>
        </div>`,
      )
      .join("");

    if (checkoutBtn) checkoutBtn.disabled = false;
  }

  if (totalEl) totalEl.textContent = formatRupiah(getCartTotal());
  if (window.feather) feather.replace();
}

function buildWhatsAppMessage() {
  if (cart.length === 0) return "";

  let message = "Halo Nutsoy, saya mau pesan:\n\n";

  cart.forEach((item, index) => {
    message += `${index + 1}. ${item.name} x${item.qty} - ${formatRupiah(item.price * item.qty)}\n`;
  });

  message += `\nTotal: ${formatRupiah(getCartTotal())}`;
  message += "\n\nMohon info untuk proses selanjutnya. Terima kasih!";

  return message;
}

function checkout() {
  if (cart.length === 0) return;

  const message = buildWhatsAppMessage();
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

  // Kurangi stok sesuai pesanan (simulasi stok berkurang saat checkout)
  cart.forEach((item) => {
    const product = products.find((p) => p.id === item.id);
    if (product) product.stock = Math.max(0, product.stock - item.qty);
  });
  saveProducts(products);
  renderMenu();

  cart = [];
  saveCart();
  renderCart();
  updateCartCount();

  window.open(url, "_blank");
}

/* ---------------------------------------------------------
   SEARCH MENU
--------------------------------------------------------- */
function filterMenu(query) {
  const cards = document.querySelectorAll(".product-card");
  const normalized = query.trim().toLowerCase();
  let visibleCount = 0;

  cards.forEach((card) => {
    const name = (card.dataset.name || "").toLowerCase();
    const matches = name.includes(normalized);
    card.classList.toggle("is-hidden", !matches);
    if (matches) visibleCount += 1;
  });

  const emptyState = document.getElementById("search-empty-state");
  if (emptyState) {
    emptyState.style.display =
      visibleCount === 0 && normalized !== "" ? "block" : "none";
  }
}

/* ---------------------------------------------------------
   NAVBAR: highlight link aktif saat scroll
--------------------------------------------------------- */
function setupScrollSpy() {
  const sections = document.querySelectorAll("section[id]");
  const navLinks = document.querySelectorAll(".navbar-nav a[href^='#']");

  if (!sections.length || !navLinks.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const id = entry.target.getAttribute("id");
        navLinks.forEach((link) => {
          link.classList.toggle(
            "active",
            link.getAttribute("href") === `#${id}`,
          );
        });
      });
    },
    { rootMargin: "-45% 0px -50% 0px" },
  );

  sections.forEach((section) => observer.observe(section));
}

/* ---------------------------------------------------------
   INIT
--------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  renderMenu();
  renderSiteImages();

  // Delegasi klik "add to cart" pada container menu (aman untuk kartu yang di-render ulang)
  const menuContainer = document.getElementById("menu-container");
  if (menuContainer) {
    menuContainer.addEventListener("click", (e) => {
      const button = e.target.closest(".add-cart");
      if (!button) return;

      const card = button.closest(".product-card");
      const foundProduct = products.find((p) => p.id === card.dataset.id) || {};
      const product = {
        id: card.dataset.id,
        name: card.dataset.name,
        price: Number(card.dataset.price),
        emoji: card.dataset.emoji || "🥛",
        image: foundProduct.image || null,
        stock: foundProduct.stock ?? 0,
      };

      addToCart(product, button);
    });
  }

  // Klik di dalam cart-items: qty +/-, hapus item
  const cartItemsEl = document.getElementById("cart-items");
  if (cartItemsEl) {
    cartItemsEl.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-action]");
      if (!btn) return;

      const { action, id } = btn.dataset;
      if (action === "increase") changeQty(id, 1);
      if (action === "decrease") changeQty(id, -1);
      if (action === "remove") removeFromCart(id);
    });
  }

  // Checkout
  const checkoutBtn = document.getElementById("checkout-button");
  if (checkoutBtn) checkoutBtn.addEventListener("click", checkout);

  // Search
  const searchBox = document.getElementById("search-box");
  if (searchBox) {
    searchBox.addEventListener("input", (e) => filterMenu(e.target.value));
  }

  // Sinkron otomatis kalau data produk diubah dari tab admin lain (event "storage"
  // hanya terpicu di tab LAIN pada origin yang sama, bukan di tab yang mengubahnya sendiri)
  window.addEventListener("storage", (e) => {
    if (e.key === PRODUCTS_STORAGE_KEY) {
      products = loadProducts();
      renderMenu();
    }
    if (e.key === SETTINGS_STORAGE_KEY) {
      renderSiteImages();
    }
  });

  renderCart();
  updateCartCount();
  setupScrollSpy();

  if (window.feather) feather.replace();
});
