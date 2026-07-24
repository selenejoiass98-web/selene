/* ═══════════════════════════════════════════════
   ELENICE COLLECTION — Cart System
   ═══════════════════════════════════════════════ */

const WHATSAPP_NUMBER = '5547997259678'; // fallback — o valor real vem de window.SITE_CONFIG (painel admin)
const FREE_SHIPPING_THRESHOLD = 299;      // fallback — idem

function getWhatsappNumber() { return window.SITE_CONFIG?.geral?.whatsapp || WHATSAPP_NUMBER; }
function getFreeShippingThreshold() { return Number(window.SITE_CONFIG?.geral?.freteGratis) || FREE_SHIPPING_THRESHOLD; }

// ── STATE ──
let cart = JSON.parse(localStorage.getItem('elenice_cart') || '[]');

function saveCart() {
  localStorage.setItem('elenice_cart', JSON.stringify(cart));
}

function getTotal() {
  return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
}

function getCount() {
  return cart.reduce((sum, item) => sum + item.qty, 0);
}

// ── ACTIONS ──
function addToCart(product) {
  const existing = cart.find(i => i.id === product.id && i.variant === product.variant);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ ...product, qty: 1 });
  }
  saveCart();
  updateCartUI();
  renderCartSuggestion(product);
  showToast(`"${product.name}" adicionado ao carrinho`);
  openCart();
}

function removeFromCart(id, variant) {
  cart = cart.filter(i => !(i.id === id && i.variant === variant));
  saveCart();
  updateCartUI();
}

function changeQty(id, variant, delta) {
  const item = cart.find(i => i.id === id && i.variant === variant);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) removeFromCart(id, variant);
  else { saveCart(); updateCartUI(); }
}

// ── UI ──
function updateCartUI() {
  const count = getCount();
  const total = getTotal();

  // Badge
  document.querySelectorAll('.cart-count').forEach(el => {
    el.textContent = count;
    el.style.display = count > 0 ? 'inline-flex' : 'none';
  });

  // Items list
  const listEl = document.getElementById('cart-items');
  const emptyEl = document.getElementById('cart-empty');
  const footerEl = document.getElementById('cart-footer');

  if (!listEl) return;

  if (cart.length === 0) {
    listEl.innerHTML = '';
    if (emptyEl) emptyEl.style.display = 'flex';
    if (footerEl) footerEl.style.display = 'none';
    const suggestionEl = document.getElementById('cart-suggestion');
    if (suggestionEl) suggestionEl.innerHTML = '';
    return;
  }

  if (emptyEl) emptyEl.style.display = 'none';
  if (footerEl) footerEl.style.display = 'block';

  listEl.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div class="cart-item-img">
        ${item.image
          ? `<img src="${item.image}" alt="${item.name}">`
          : `<span>${item.symbol || '◈'}</span>`}
      </div>
      <div class="cart-item-info">
        <h4>${item.name}</h4>
        <div class="item-variant">${item.variant || 'Dourado 18k'}</div>
        <div class="qty-control">
          <button class="qty-btn" onclick="changeQty('${item.id}','${item.variant}',-1)">−</button>
          <span class="qty-num">${item.qty}</span>
          <button class="qty-btn" onclick="changeQty('${item.id}','${item.variant}',1)">+</button>
        </div>
      </div>
      <div>
        <div class="cart-item-price">R$ ${(item.price * item.qty).toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2})}</div>
        <button class="cart-item-remove" onclick="removeFromCart('${item.id}','${item.variant}')">remover</button>
      </div>
    </div>
  `).join('');

  // Totals
  const freeShippingThreshold = getFreeShippingThreshold();
  const remaining = freeShippingThreshold - total;
  const freeShipping = total >= freeShippingThreshold;

  const freeShippingBar = document.getElementById('free-shipping-bar');
  if (freeShippingBar) {
    freeShippingBar.innerHTML = freeShipping
      ? '🎉 Você ganhou <strong>frete grátis!</strong>'
      : `Faltam <strong>R$ ${remaining.toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2})}</strong> para frete grátis`;
  }

  const subtotalEl = document.getElementById('cart-subtotal');
  const freteEl = document.getElementById('cart-frete');
  const totalEl = document.getElementById('cart-total');

  if (subtotalEl) subtotalEl.textContent = `R$ ${total.toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2})}`;
  if (freteEl) freteEl.textContent = freeShipping ? 'Grátis 🎉' : 'Calcular no checkout';
  if (totalEl) totalEl.textContent = `R$ ${total.toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2})}`;
}

// ── SUGESTÃO "TAMBÉM LEVOU" ──
// window.__ELENICE_PRODUCTS é preenchido pelas páginas que carregam o
// catálogo (index, catalogo, produto) no formato {id, nome, preco, foto, slug}.
// Em páginas sem catálogo (checkout, blog, políticas...) a lista fica vazia
// e a sugestão simplesmente não aparece.
function getCatalog() {
  return Array.isArray(window.__ELENICE_PRODUCTS) ? window.__ELENICE_PRODUCTS : [];
}

function pickCheaperSuggestion(product) {
  const price = Number(product.price) || 0;
  const cheaper = getCatalog()
    .filter(p => p.id !== product.id && Number(p.preco) > 0 && Number(p.preco) < price)
    .sort((a, b) => Number(b.preco) - Number(a.preco));
  return cheaper[0] || null;
}

function renderCartSuggestion(product) {
  const el = document.getElementById('cart-suggestion');
  if (!el) return;
  const s = pickCheaperSuggestion(product);
  if (!s) { el.innerHTML = ''; return; }
  const precoFmt = Number(s.preco).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const href = s.slug ? `produto.html?slug=${s.slug}` : `produto.html?id=${s.id}`;
  el.innerHTML = `
    <div class="cart-suggestion-box">
      <div class="cart-suggestion-label">✦ Quem comprou este também levou</div>
      <a href="${href}" class="cart-suggestion-item">
        <div class="cart-suggestion-img">
          ${s.foto ? `<img src="${s.foto}" alt="${s.nome}">` : `<span>◈</span>`}
        </div>
        <div>
          <div class="cart-suggestion-name">${s.nome}</div>
          <div class="cart-suggestion-price">R$ ${precoFmt}</div>
        </div>
      </a>
      <button class="cart-suggestion-add" onclick="addSuggestionToCart('${s.id}')">+ Adicionar</button>
    </div>`;
}

window.addSuggestionToCart = function(id) {
  const p = getCatalog().find(x => x.id === id);
  if (!p) return;
  addToCart({ id: p.id, name: p.nome, variant: 'Semijoia banhada a ouro 18k', price: p.preco, symbol: '◈', image: p.foto });
};

// ── CART DRAWER ──
function openCart() {
  document.getElementById('cart-overlay')?.classList.add('open');
  document.getElementById('cart-drawer')?.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  document.getElementById('cart-overlay')?.classList.remove('open');
  document.getElementById('cart-drawer')?.classList.remove('open');
  document.body.style.overflow = '';
}

// ── WHATSAPP ORDER ──
function whatsappOrder() {
  if (cart.length === 0) return;
  const items = cart.map(i => `• ${i.name} (${i.variant}) x${i.qty} — R$${(i.price*i.qty).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})}`).join('%0A');
  const total = getTotal();
  const msg = `Olá! Gostaria de fazer um pedido:%0A%0A${items}%0A%0ATotal: R$${total.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})}%0A%0APode me ajudar a finalizar?`;
  window.open(`https://wa.me/${getWhatsappNumber()}?text=${msg}`, '_blank');
}

// ── TOAST ──
let toastTimer;
function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  document.getElementById('toast-msg').textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
}

// ── NAV SCROLL ──
window.addEventListener('scroll', () => {
  const nav = document.querySelector('.nav');
  if (nav) nav.classList.toggle('scrolled', window.scrollY > 20);
});

// ── SCROLL REVEAL ──
let revealObserver;
function initReveal() {
  if (!revealObserver) {
    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          revealObserver.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
  }
  observeReveals();
}
// Observa elementos .reveal recem-inseridos no DOM (ex: produtos/depoimentos
// vindos do Firestore depois do load inicial), sem afetar os ja observados.
// Cria o observer sozinho se ainda nao existir, para nao depender da ordem
// de carregamento entre cart.js e os scripts que chamam essa funcao.
function observeReveals() {
  if (!revealObserver) { initReveal(); return; }
  document.querySelectorAll('.reveal:not(.reveal-observed)').forEach(el => {
    el.classList.add('reveal-observed');
    revealObserver.observe(el);
  });
}
window.observeReveals = observeReveals;

// ── INIT ──
document.addEventListener('DOMContentLoaded', () => {
  updateCartUI();
  initReveal();

  // Close cart on overlay click
  document.getElementById('cart-overlay')?.addEventListener('click', closeCart);
});