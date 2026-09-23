// ============================================
// FAWZY CLOTHING — Content Loader
// ============================================

function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  const data = {};
  match[1].split(/\r?\n/).forEach(line => {
    const idx = line.indexOf(':');
    if (idx === -1) return;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
    if (value === 'true') value = true;
    else if (value === 'false') value = false;
    else if (value !== '' && !isNaN(value)) value = Number(value);
    data[key] = value;
  });
  return data;
}

async function fetchOne(path) {
  try {
    const res = await fetch(path, { cache: 'no-store' });
    if (!res.ok) return null;
    return parseFrontmatter(await res.text());
  } catch { return null; }
}

async function fetchCollection(folder) {
  try {
    const res = await fetch(`/${folder}/index.json`, { cache: 'no-store' });
    if (!res.ok) return [];
    const files = await res.json();
    const items = await Promise.all(files.map(f => fetchOne(`/${folder}/${f}`)));
    return items.filter(Boolean);
  } catch { return []; }
}

function formatNaira(n) {
  return '₦' + Number(n).toLocaleString('en-NG');
}

function whatsappLink(phone, message) {
  const clean = phone.replace(/\D/g, '').replace(/^0/, '234');
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}

// --- Load settings ---
async function loadSettings() {
  const s = await fetchOne('/content/settings.md');
  if (!s) return;
  if (s.brand) {
    document.getElementById('brandName').textContent = s.brand;
    document.getElementById('brandHero').textContent = s.brand;
    document.getElementById('footerBrand').textContent = s.brand;
  }
  if (s.tagline) document.getElementById('tagline').textContent = s.tagline;
  if (s.hero_text) document.getElementById('heroText').textContent = s.hero_text;
  if (s.contact_text) document.getElementById('contactText').textContent = s.contact_text;
  if (s.whatsapp) {
    document.getElementById('whatsappMain').href = whatsappLink(s.whatsapp, 'Hi, I would like to place an order.');
    window.__whatsapp = s.whatsapp;
  }
  document.getElementById('year').textContent = new Date().getFullYear();
}

// --- Gallery ---
async function renderGallery() {
  const grid = document.getElementById('galleryGrid');
  const items = await fetchCollection('content/gallery');
  if (!items.length) return;
  const phone = window.__whatsapp || '07041169276';

  grid.innerHTML = items.map(item => {
    const msg = `Hi, I'm interested in ${item.title}${item.price ? ' — ' + formatNaira(item.price) : ''}`;
    return `
      <div class="gallery-item">
        <img src="${item.image || ''}" alt="${item.title || ''}">
        <div class="gallery-info">
          <h3>${item.title || ''}</h3>
          ${item.description ? `<p>${item.description}</p>` : ''}
          ${item.price ? `<div class="gallery-price">${formatNaira(item.price)}</div>` : ''}
          <a href="${whatsappLink(phone, msg)}" target="_blank" class="order-btn">
            <i class="fab fa-whatsapp"></i> Order
          </a>
        </div>
      </div>`;
  }).join('');
}

// --- Services ---
async function renderServices() {
  const grid = document.getElementById('servicesGrid');
  const items = await fetchCollection('content/services');
  if (!items.length) return;

  grid.innerHTML = items.map(s => `
    <div class="service-card">
      <h3>${s.title || ''}</h3>
      <p>${s.description || ''}</p>
    </div>
  `).join('');
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  await renderGallery();
  await renderServices();
});