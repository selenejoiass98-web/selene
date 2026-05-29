/* ═══════════════════════════════════════════════
   ELENICE COLLECTION — Cart System
   ═══════════════════════════════════════════════ */

const WHATSAPP_NUMBER = '5547000000000'; // ← trocar pelo número real
const FREE_SHIPPING_THRESHOLD = 299;

// ── STATE ──
let cart = JSON.parse(localStorage.getItem('selene_cart') || '[]');
let cartCupom = null;   // { id, codigo, tipo, valor }
let cartDesconto = 0;   // valor R$ de desconto

function saveCart() {
  localStorage.setItem('selene_cart', JSON.stringify(cart));
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
        <div class="item-variant">${item.variant || 'Ouro 18k'}</div>
        <div class="qty-control">
          <button class="qty-btn" onclick="changeQty('${item.id}','${item.variant}',-1)">−</button>
          <span class="qty-num">${item.qty}</span>
          <button class="qty-btn" onclick="changeQty('${item.id}','${item.variant}',1)">+</button>
        </div>
      </div>
      <div>
        <div class="cart-item-price">R$ ${(item.price * item.qty).toLocaleString('pt-BR', {minimumFractionDigits:2})}</div>
        <button class="cart-item-remove" onclick="removeFromCart('${item.id}','${item.variant}')">remover</button>
      </div>
    </div>
  `).join('');

  // Totals
  const remaining = FREE_SHIPPING_THRESHOLD - total;
  const freeShipping = total >= FREE_SHIPPING_THRESHOLD;

  const freeShippingBar = document.getElementById('free-shipping-bar');
  if (freeShippingBar) {
    freeShippingBar.innerHTML = freeShipping
      ? '🎉 Você ganhou <strong>frete grátis!</strong>'
      : `Faltam <strong>R$ ${remaining.toLocaleString('pt-BR', {minimumFractionDigits:2})}</strong> para frete grátis`;
  }

  const subtotalEl = document.getElementById('cart-subtotal');
  const freteEl    = document.getElementById('cart-frete');
  const totalEl    = document.getElementById('cart-total');
  const descontoRow = document.getElementById('cart-desconto-row');
  const descontoEl  = document.getElementById('cart-desconto');

  if (subtotalEl) subtotalEl.textContent = `R$ ${total.toLocaleString('pt-BR', {minimumFractionDigits:2})}`;
  if (freteEl)    freteEl.textContent = freeShipping ? 'Grátis 🎉' : 'Calcular no checkout';

  // Desconto cupom
  if (descontoRow) descontoRow.style.display = cartDesconto > 0 ? 'flex' : 'none';
  if (descontoEl)  descontoEl.textContent = `− R$ ${cartDesconto.toFixed(2).replace('.',',')}`;

  const totalFinal = Math.max(0, total - cartDesconto);
  if (totalEl) totalEl.textContent = `R$ ${totalFinal.toLocaleString('pt-BR', {minimumFractionDigits:2})}`;
}

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
  const items = cart.map(i => `• ${i.name} (${i.variant}) x${i.qty} — R$${(i.price*i.qty).toLocaleString('pt-BR',{minimumFractionDigits:2})}`).join('%0A');
  const total = getTotal();
  const totalFinal = Math.max(0, total - cartDesconto);
  const cupomInfo = cartCupom ? `%0ACupom: ${cartCupom.codigo} (desconto R$${cartDesconto.toFixed(2).replace('.',',')})` : '';
  const msg = `Olá! Gostaria de fazer um pedido:%0A%0A${items}${cupomInfo}%0A%0ATotal: R$${totalFinal.toLocaleString('pt-BR',{minimumFractionDigits:2})}%0A%0APode me ajudar a finalizar?`;
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, '_blank');
}


// ── CUPOM NO CARRINHO ──
async function aplicarCupomCarrinho() {
  const input = document.getElementById('cart-cupom-input');
  const msg   = document.getElementById('cart-cupom-msg');
  const btn   = document.getElementById('cart-cupom-btn');
  const code  = input?.value.trim().toUpperCase();

  if (!code) return;
  if (!window._db) { showToast('Erro de conexão. Tente novamente.'); return; }

  btn.textContent = '...';
  btn.disabled = true;

  try {
    const q = window._fbQuery(
      window._fbCollection(window._db, 'cupons'),
      window._fbWhere('codigo', '==', code)
    );
    const snap = await window._fbGetDocs(q);

    if (snap.empty) { mostrarMsgCupom('Cupom não encontrado', 'error'); return; }

    const cupomDoc = snap.docs[0];
    const cupom = { id: cupomDoc.id, ...cupomDoc.data() };

    if (!cupom.ativo) { mostrarMsgCupom('Cupom inativo', 'error'); return; }
    if (cupom.validade) {
      const val = cupom.validade.toDate ? cupom.validade.toDate() : new Date(cupom.validade);
      if (val < new Date()) { mostrarMsgCupom('Cupom vencido', 'error'); return; }
    }
    if (cupom.limite && cupom.usos >= cupom.limite) { mostrarMsgCupom('Cupom esgotado', 'error'); return; }
    const subtotal = getTotal();
    if (cupom.minimo && subtotal < cupom.minimo) {
      mostrarMsgCupom(`Mínimo R$ ${Number(cupom.minimo).toFixed(2).replace('.',',')}`, 'error'); return;
    }

    // Válido!
    cartCupom = cupom;
    cartDesconto = cupom.tipo === 'percentual'
      ? Math.round(subtotal * (cupom.valor / 100) * 100) / 100
      : Math.min(cupom.valor, subtotal);

    mostrarMsgCupom(`✓ ${cupom.codigo} aplicado!`, 'success');
    document.getElementById('cart-cupom-aplicado').style.display = 'flex';
    document.getElementById('cart-cupom-nome').textContent = cupom.codigo;
    document.getElementById('cart-cupom-campo').style.display = 'none';
    updateCartUI();

  } catch(e) {
    console.error(e); mostrarMsgCupom('Erro ao validar cupom', 'error');
  } finally {
    btn.textContent = 'Aplicar';
    btn.disabled = false;
  }
}

function removerCupomCarrinho() {
  cartCupom = null;
  cartDesconto = 0;
  const input = document.getElementById('cart-cupom-input');
  if (input) input.value = '';
  document.getElementById('cart-cupom-campo').style.display = 'flex';
  document.getElementById('cart-cupom-aplicado').style.display = 'none';
  mostrarMsgCupom('', null);
  updateCartUI();
}

function mostrarMsgCupom(msg, tipo) {
  const el = document.getElementById('cart-cupom-msg');
  if (!el) return;
  if (!msg) { el.style.display = 'none'; return; }
  el.style.display = 'block';
  el.style.color = tipo === 'error' ? '#a0392a' : '#2d7a4f';
  el.textContent = msg;
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
function initReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

// ── INIT ──
document.addEventListener('DOMContentLoaded', () => {
  injectCupomHTML();
  injectFirebaseCart();
  updateCartUI();
  initReveal();
  document.getElementById('cart-overlay')?.addEventListener('click', closeCart);
});

function injectCupomHTML() {
  const totals = document.querySelector('.cart-totals');
  if (!totals || document.getElementById('cart-cupom-section')) return;

  // Inserir campo de cupom antes dos totais
  const cupomHTML = `
    <div id="cart-cupom-section" style="margin-bottom:0.75rem;">
      <div id="cart-cupom-campo" style="display:flex;gap:0.5rem;">
        <input id="cart-cupom-input" type="text" placeholder="Cupom de desconto"
          maxlength="20"
          oninput="this.value=this.value.toUpperCase().replace(/[^A-Z0-9]/g,'')"
          onkeydown="if(event.key==='Enter') aplicarCupomCarrinho()"
          style="flex:1;padding:0.6rem 0.8rem;border:1px solid #E0CEBB;border-radius:7px;font-family:inherit;font-size:0.82rem;background:#F5F0EA;outline:none;color:#2A1F14;letter-spacing:0.05em;font-weight:500;" />
        <button id="cart-cupom-btn" onclick="aplicarCupomCarrinho()"
          style="padding:0.6rem 0.9rem;background:#7C5C35;color:white;border:none;border-radius:7px;font-family:inherit;font-size:0.78rem;cursor:pointer;white-space:nowrap;">
          Aplicar
        </button>
      </div>
      <div id="cart-cupom-aplicado" style="display:none;align-items:center;justify-content:space-between;background:#e8f5ee;border:1px solid #a3d4bc;border-radius:7px;padding:0.5rem 0.75rem;margin-top:0.4rem;">
        <span id="cart-cupom-nome" style="font-size:0.8rem;font-weight:600;color:#2d7a4f;letter-spacing:0.06em;"></span>
        <button onclick="removerCupomCarrinho()" style="background:none;border:none;cursor:pointer;color:#2d7a4f;font-size:1.1rem;padding:0;">×</button>
      </div>
      <div id="cart-cupom-msg" style="display:none;font-size:0.75rem;margin-top:0.35rem;"></div>
    </div>`;

  totals.insertAdjacentHTML('beforebegin', cupomHTML);

  // Inserir linha de desconto nos totais
  const freteRow = document.querySelector('#cart-frete')?.closest('.cart-total-row');
  if (freteRow) {
    freteRow.insertAdjacentHTML('afterend', `
      <div class="cart-total-row" id="cart-desconto-row" style="display:none;color:#2d7a4f;">
        <span class="label">Desconto</span>
        <span class="value" id="cart-desconto" style="color:#2d7a4f;">− R$ 0,00</span>
      </div>`);
  }
}

function injectFirebaseCart() {
  // Se Firebase já foi carregado pela página, usar ele
  // Caso contrário, carregar aqui
  if (window._db) return;

  const script = document.createElement('script');
  script.type = 'module';
  script.textContent = `
    import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
    import { getFirestore, collection, query, where, getDocs, doc, updateDoc, increment }
      from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
    const cfg = {
      apiKey:"AIzaSyAsGGXCg0GfbJKsGuGDWDHfVpdeBna-aYI",
      authDomain:"selene-joias.firebaseapp.com",
      projectId:"selene-joias",
      storageBucket:"selene-joias.firebasestorage.app",
      messagingSenderId:"395713731584",
      appId:"1:395713731584:web:c29c4d3f53254e0ed10ce5"
    };
    const app = getApps().length === 0 ? initializeApp(cfg) : getApps()[0];
    const db = getFirestore(app);
    window._db = db;
    window._fbQuery = query;
    window._fbCollection = collection;
    window._fbWhere = where;
    window._fbGetDocs = getDocs;
    window._fbDoc = doc;
    window._fbUpdateDoc = updateDoc;
    window._fbIncrement = increment;
  `;
  document.head.appendChild(script);
}
