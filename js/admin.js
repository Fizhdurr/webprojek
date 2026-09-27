/* =========================================================
   NUTSOY — admin.js
   Panel admin untuk mengatur menu, stok, dan foto website
========================================================= */

const ADMIN_PASSWORD = "nutsoy2026";
const ADMIN_SESSION_KEY = "nutsoy_admin_session";
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

let products = [];

/* =========================================================
   STORAGE PRODUK
========================================================= */

function loadProducts() {
  try {
    const saved = localStorage.getItem(PRODUCTS_STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : null;

    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (err) {
    console.error("Data produk rusak:", err);
  }

  saveProducts(DEFAULT_PRODUCTS);
  return DEFAULT_PRODUCTS;
}

function saveProducts(list) {
  try {
    localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    console.error("Gagal menyimpan produk:", err);
  }
}

/* =========================================================
   STORAGE SETTINGS / FOTO WEBSITE
========================================================= */

function loadSettings() {
  try {
    const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);

    if (!saved) {
      return {};
    }

    const parsed = JSON.parse(saved);

    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (err) {
    console.error("Gagal membaca settings:", err);
    return {};
  }
}

function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));

    console.log("Settings berhasil disimpan.");
  } catch (err) {
    console.error("Gagal menyimpan settings:", err);

    alert("Foto gagal disimpan. Kemungkinan ukuran foto terlalu besar.");
  }
}

/* =========================================================
   FORMAT
========================================================= */

function formatRupiah(num) {
  return "Rp" + Number(num).toLocaleString("id-ID");
}

function slugify(text) {
  return (
    text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "produk"
  );
}

function uniqueId(name) {
  const base = slugify(name);

  let id = base;
  let counter = 2;

  while (products.some((p) => p.id === id)) {
    id = `${base}-${counter}`;
    counter++;
  }

  return id;
}

function escapeAttr(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/* =========================================================
   LOGIN
========================================================= */

function isLoggedIn() {
  return sessionStorage.getItem(ADMIN_SESSION_KEY) === "1";
}

function login(password) {
  if (password === ADMIN_PASSWORD) {
    sessionStorage.setItem(ADMIN_SESSION_KEY, "1");
    return true;
  }

  return false;
}

function logout() {
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
  showLoginGate();
}

function showLoginGate() {
  const loginBox = document.getElementById("admin-login");
  const panel = document.getElementById("admin-panel");

  if (loginBox) {
    loginBox.classList.remove("is-hidden");
  }

  if (panel) {
    panel.classList.add("is-hidden");
  }
}

function showPanel() {
  const loginBox = document.getElementById("admin-login");
  const panel = document.getElementById("admin-panel");

  if (loginBox) {
    loginBox.classList.add("is-hidden");
  }

  if (panel) {
    panel.classList.remove("is-hidden");
  }

  renderProductList();
  renderSettingsPreview();
}

/* =========================================================
   FOTO
========================================================= */

function readImageAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve(null);
      return;
    }

    if (file.size > 1500000) {
      alert("Ukuran foto terlalu besar.\n\nMaksimal 1.5 MB.");

      reject(new Error("File terlalu besar"));
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("File yang dipilih harus berupa gambar.");

      reject(new Error("Bukan gambar"));
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      resolve(reader.result);
    };

    reader.onerror = () => {
      reject(reader.error);
    };

    reader.readAsDataURL(file);
  });
}

/* =========================================================
   RENDER PREVIEW FOTO TENTANG & OWNER
========================================================= */

function renderSettingsPreview() {
  const settings = loadSettings();

  const aboutPreview = document.getElementById("about-thumb-preview");

  const ownerPreview = document.getElementById("owner-thumb-preview");

  if (aboutPreview) {
    if (settings.aboutImage) {
      aboutPreview.innerHTML = `
        <img
          src="${settings.aboutImage}"
          alt="Foto Tentang Nutsoy"
        >
      `;
    } else {
      aboutPreview.innerHTML = "🅰️";
    }
  }

  if (ownerPreview) {
    if (settings.ownerImage) {
      ownerPreview.innerHTML = `
        <img
          src="${settings.ownerImage}"
          alt="Foto Owner"
        >
      `;
    } else {
      ownerPreview.innerHTML = "👨‍💼";
    }
  }
}

/* =========================================================
   SIMPAN FOTO WEBSITE
========================================================= */

async function saveSettingImage(settingName, file) {
  if (!file) {
    return;
  }

  try {
    const dataUrl = await readImageAsDataUrl(file);

    if (!dataUrl) {
      return;
    }

    const settings = loadSettings();

    settings[settingName] = dataUrl;

    saveSettings(settings);

    renderSettingsPreview();

    console.log(`Foto ${settingName} berhasil disimpan.`);

    alert("Foto berhasil disimpan!");
  } catch (err) {
    console.error(`Gagal menyimpan foto ${settingName}:`, err);
  }
}

/* =========================================================
   HAPUS FOTO WEBSITE
========================================================= */

function removeSettingImage(settingName) {
  const settings = loadSettings();

  if (!settings[settingName]) {
    return;
  }

  delete settings[settingName];

  saveSettings(settings);

  renderSettingsPreview();
}

/* =========================================================
   RENDER PRODUK
========================================================= */

function renderProductList() {
  const container = document.getElementById("admin-product-list");

  if (!container) {
    return;
  }

  if (products.length === 0) {
    container.innerHTML = `
      <p class="admin-empty">
        Belum ada produk.
      </p>
    `;

    return;
  }

  container.innerHTML = products
    .map((p) => {
      return `
        <div
          class="admin-product-card ${p.stock <= 0 ? "is-out" : ""}"
          data-id="${p.id}"
        >

          <div class="admin-thumb-wrap">

            <label
              class="admin-thumb-label"
              data-id="${p.id}"
            >

              ${
                p.image
                  ? `
                    <img
                      src="${p.image}"
                      alt="${escapeAttr(p.name)}"
                    >
                  `
                  : p.emoji
              }

              <input
                type="file"
                accept="image/*"
                class="admin-thumb-input"
                data-id="${p.id}"
                hidden
              >

            </label>

            ${
              p.image
                ? `
                  <button
                    type="button"
                    class="admin-remove-image"
                    data-action="remove-image"
                    data-id="${p.id}"
                  >
                    Hapus foto
                  </button>
                `
                : ""
            }

          </div>

          <div class="admin-product-fields">

            <input
              type="text"
              data-field="name"
              value="${escapeAttr(p.name)}"
              aria-label="Nama produk"
            >

            <input
              type="text"
              data-field="description"
              value="${escapeAttr(p.description || "")}"
              aria-label="Deskripsi"
            >

            <div class="admin-product-row">

              <label>
                Harga
                <input
                  type="number"
                  data-field="price"
                  value="${p.price}"
                  min="0"
                  step="500"
                >
              </label>

              <label>
                Stok
                <input
                  type="number"
                  data-field="stock"
                  value="${p.stock}"
                  min="0"
                  step="1"
                >
              </label>

              <label>
                Emoji
                <input
                  type="text"
                  data-field="emoji"
                  value="${escapeAttr(p.emoji)}"
                  maxlength="4"
                >
              </label>

            </div>

          </div>

          <div class="admin-product-actions">

            <span class="admin-stock-status">
              ${p.stock <= 0 ? "Stok habis" : `Stok: ${p.stock}`}
            </span>

            <button
              type="button"
              class="admin-save-btn"
              data-action="save"
              data-id="${p.id}"
            >
              <i data-feather="save"></i>
              Simpan
            </button>

            <button
              type="button"
              class="admin-delete-btn"
              data-action="delete"
              data-id="${p.id}"
            >
              <i data-feather="trash-2"></i>
              Hapus
            </button>

          </div>

        </div>
      `;
    })
    .join("");

  if (window.feather) {
    feather.replace();
  }
}

/* =========================================================
   PRODUK
========================================================= */

function setProductImage(id, dataUrl) {
  const product = products.find((p) => p.id === id);

  if (!product) {
    return;
  }

  product.image = dataUrl;

  saveProducts(products);

  renderProductList();
}

function saveProductFromCard(card) {
  if (!card) {
    return;
  }

  const id = card.dataset.id;

  const product = products.find((p) => p.id === id);

  if (!product) {
    return;
  }

  const nameInput = card.querySelector('[data-field="name"]');

  const descriptionInput = card.querySelector('[data-field="description"]');

  const priceInput = card.querySelector('[data-field="price"]');

  const stockInput = card.querySelector('[data-field="stock"]');

  const emojiInput = card.querySelector('[data-field="emoji"]');

  if (nameInput) {
    product.name = nameInput.value.trim() || product.name;
  }

  if (descriptionInput) {
    product.description = descriptionInput.value.trim();
  }

  if (priceInput) {
    product.price = Math.max(0, Number(priceInput.value) || 0);
  }

  if (stockInput) {
    product.stock = Math.max(0, Math.floor(Number(stockInput.value) || 0));
  }

  if (emojiInput) {
    product.emoji = emojiInput.value.trim() || product.emoji;
  }

  saveProducts(products);

  renderProductList();
}

function deleteProduct(id) {
  const product = products.find((p) => p.id === id);

  if (!product) {
    return;
  }

  if (!confirm(`Hapus "${product.name}" dari menu?`)) {
    return;
  }

  products = products.filter((p) => p.id !== id);

  saveProducts(products);

  renderProductList();
}

function addProduct(data) {
  const newProduct = {
    id: uniqueId(data.name),
    name: data.name,
    description: data.description,
    price: data.price,
    emoji: data.emoji,
    flavor: data.flavor,
    stock: data.stock,
    image: data.image || null,
  };

  products.push(newProduct);

  saveProducts(products);

  renderProductList();
}

/* =========================================================
   INIT
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  products = loadProducts();

  const adminLogin = document.getElementById("admin-login");

  const adminPanel = document.getElementById("admin-panel");

  if (!adminLogin || !adminPanel) {
    return;
  }

  /* =====================================================
     LOGIN
  ===================================================== */

  if (isLoggedIn()) {
    showPanel();
  } else {
    showLoginGate();
  }

  const loginForm = document.getElementById("admin-login-form");

  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const password = document.getElementById("admin-password")?.value || "";

      const errorEl = document.getElementById("admin-login-error");

      if (login(password)) {
        if (errorEl) {
          errorEl.hidden = true;
        }

        showPanel();
      } else {
        if (errorEl) {
          errorEl.hidden = false;
        }
      }
    });
  }

  /* =====================================================
     LOGOUT
  ===================================================== */

  const logoutButton = document.getElementById("admin-logout");

  if (logoutButton) {
    logoutButton.addEventListener("click", logout);
  }

  /* =====================================================
     TAMBAH PRODUK
  ===================================================== */

  const addProductForm = document.getElementById("add-product-form");

  if (addProductForm) {
    addProductForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const name = document.getElementById("new-name")?.value.trim() || "";

      const emoji = document.getElementById("new-emoji")?.value.trim() || "🥤";

      const price = Math.max(
        0,
        Number(document.getElementById("new-price")?.value) || 0,
      );

      const stock = Math.max(
        0,
        Math.floor(Number(document.getElementById("new-stock")?.value) || 0),
      );

      const flavor = document.getElementById("new-flavor")?.value || "original";

      const description =
        document.getElementById("new-description")?.value.trim() || "";

      const imageFile = document.getElementById("new-image")?.files[0];

      if (!name) {
        alert("Nama produk wajib diisi.");

        return;
      }

      let image = null;

      try {
        image = await readImageAsDataUrl(imageFile);
      } catch (err) {
        return;
      }

      addProduct({
        name,
        emoji,
        price,
        stock,
        flavor,
        description,
        image,
      });

      addProductForm.reset();
    });
  }

  /* =====================================================
     PRODUK - SIMPAN / HAPUS / FOTO
  ===================================================== */

  const productList = document.getElementById("admin-product-list");

  if (productList) {
    productList.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-action]");

      if (!btn) {
        return;
      }

      const card = btn.closest(".admin-product-card");

      const action = btn.dataset.action;

      const id = btn.dataset.id;

      if (action === "save") {
        saveProductFromCard(card);
      }

      if (action === "delete") {
        deleteProduct(id);
      }

      if (action === "remove-image") {
        setProductImage(id, null);
      }
    });

    productList.addEventListener("change", async (e) => {
      const input = e.target.closest(".admin-thumb-input");

      if (!input || !input.files || !input.files[0]) {
        return;
      }

      try {
        const dataUrl = await readImageAsDataUrl(input.files[0]);

        setProductImage(input.dataset.id, dataUrl);
      } catch (err) {
        console.error("Gagal upload foto produk:", err);
      }
    });
  }

  /* =====================================================
     FOTO TENTANG NUTSOY & OWNER
  ===================================================== */

  const settingInputs = document.querySelectorAll(".admin-settings-input");

  settingInputs.forEach((input) => {
    input.addEventListener("change", async () => {
      const file = input.files && input.files[0];

      if (!file) {
        return;
      }

      /*
          HTML kamu menggunakan:

          data-target="aboutImage"

          dan

          data-target="ownerImage"
        */

      const settingName = input.dataset.target;

      if (!settingName) {
        console.error("data-target foto tidak ditemukan.");

        return;
      }

      console.log("Upload foto:", settingName);

      await saveSettingImage(settingName, file);

      /*
          Reset supaya file yang sama
          bisa dipilih kembali.
        */

      input.value = "";
    });
  });

  /* =====================================================
     TOMBOL HAPUS FOTO TENTANG & OWNER
  ===================================================== */

  const removeSettingButtons = document.querySelectorAll(
    '[data-action="remove-setting"]',
  );

  removeSettingButtons.forEach((button) => {
    button.addEventListener("click", () => {
      /*
            HTML menggunakan:

            data-target="aboutImage"

            atau

            data-target="ownerImage"
          */

      const settingName = button.dataset.target;

      if (!settingName) {
        console.error("data-target tombol hapus tidak ditemukan.");

        return;
      }

      removeSettingImage(settingName);
    });
  });

  /* =====================================================
     PREVIEW AWAL
  ===================================================== */

  renderSettingsPreview();

  /* =====================================================
     STORAGE EVENT
  ===================================================== */

  window.addEventListener("storage", (e) => {
    if (e.key === PRODUCTS_STORAGE_KEY) {
      products = loadProducts();

      renderProductList();
    }

    if (e.key === SETTINGS_STORAGE_KEY) {
      renderSettingsPreview();
    }
  });
});
