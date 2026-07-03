import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const FB_CFG = {
  apiKey: "AIzaSyAsGGXCg0GfbJKsGuGDWDHfVpdeBna-aYI",
  authDomain: "selene-joias.firebaseapp.com",
  projectId: "selene-joias",
  storageBucket: "selene-joias.firebasestorage.app",
  messagingSenderId: "395713731584",
  appId: "1:395713731584:web:c29c4d3f53254e0ed10ce5"
};
const app = getApps().length ? getApps()[0] : initializeApp(FB_CFG);
const db  = getFirestore(app);

const DEFAULT_FAIXA = ['Peças Exclusivas', 'Envio para Todo Brasil', 'Garantia de 1 Ano', 'Até 6x Sem Juros ou 5% de Desconto no Pix'];

function formatPhone(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  const local = digits.startsWith('55') ? digits.slice(2) : digits;
  if (local.length === 11) return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
  if (local.length === 10) return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`;
  return raw;
}

/* Aplica os dados de configuração em qualquer elemento marcado com data-cfg="..." */
window.applySiteConfig = function applySiteConfig(d) {
  window.SITE_CONFIG = d;
  const g = d.geral || {};
  const r = d.rodape || {};
  const wa = g.whatsapp || '5547997259678';

  document.querySelectorAll('[data-cfg="whatsapp-float"]').forEach(el => {
    const msg = el.getAttribute('data-cfg-msg') || 'Olá! Gostaria de mais informações.';
    el.href = `https://wa.me/${wa}?text=${encodeURIComponent(msg)}`;
  });
  document.querySelectorAll('[data-cfg="whatsapp-link"]').forEach(el => { el.href = `https://wa.me/${wa}`; });

  if (g.instagramUrl) document.querySelectorAll('[data-cfg="social-ig"]').forEach(el => { el.href = g.instagramUrl; });
  if (g.facebookUrl)  document.querySelectorAll('[data-cfg="social-fb"]').forEach(el => { el.href = g.facebookUrl; });
  if (g.tiktokUrl)    document.querySelectorAll('[data-cfg="social-tt"]').forEach(el => { el.href = g.tiktokUrl; });

  if (g.whatsapp) {
    const phoneFmt = formatPhone(g.whatsapp);
    document.querySelectorAll('[data-cfg="footer-phone"]').forEach(el => { el.textContent = phoneFmt; });
  }
  if (g.email)   document.querySelectorAll('[data-cfg="footer-email"]').forEach(el => { el.textContent = g.email; });
  if (g.horario) document.querySelectorAll('[data-cfg="footer-hours"]').forEach(el => { el.innerHTML = g.horario.replace(/\n/g, '<br>'); });
  if (r.blurb)     document.querySelectorAll('[data-cfg="footer-blurb"]').forEach(el => { el.textContent = r.blurb; });
  if (r.copyright) document.querySelectorAll('[data-cfg="footer-copyright"]').forEach(el => { el.textContent = r.copyright; });

  /* Faixa de avisos (ticker) — páginas que já têm sua própria lógica (ex: index.html)
     controlam window.__SITE_CONFIG_MANUAL e cuidam disso sozinhas. */
  if (!window.__SITE_CONFIG_MANUAL) {
    const track = document.getElementById('faixa-track');
    const bar   = document.getElementById('faixa-bar');
    if (track && bar) {
      const base = d.faixa?.length ? d.faixa : DEFAULT_FAIXA;
      const itens = g.aviso ? [g.aviso, ...base] : base;
      const dup = [...itens, ...itens];
      track.innerHTML = dup.map(txt => `<span class="faixa-item">${txt}</span>`).join('');
      bar.style.display = 'block';
      track.style.animationDuration = Math.max(18, itens.length * 4) + 's';
    }
  }
};

window.loadSiteConfig = async function loadSiteConfig() {
  try {
    const snap = await getDoc(doc(db, 'configuracoes', 'loja'));
    const d = snap.exists() ? snap.data() : {};
    window.applySiteConfig(d);
    return d;
  } catch (e) {
    console.warn('site-config:', e);
    return {};
  }
};

if (!window.__SITE_CONFIG_MANUAL) {
  window.loadSiteConfig();
}
