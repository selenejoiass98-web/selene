/*
 * Brinco "pop-out" sobre a foto real do hero (TESTE)
 * O brinco da foto de fundo (configuracoes/loja -> hero.imgFundo) ganha
 * uma camada extra exatamente por cima dele (mesma posição/escala) que
 * cresce e ganha brilho conforme o scroll, dando a sensação de que o
 * brinco real "sai" da foto. O efeito termina quando a seção sai da tela
 * (a próxima seção já assume a rolagem normal).
 *
 * A posição/tamanho do brinco dentro da foto original foi medida à mão
 * (em pixels, na imagem natural). Se a foto de fundo (hero.imgFundo) for
 * trocada, esses números precisam ser remedidos.
 */

const EARRING_BOX = { x: 795, y: 390, w: 300, h: 180, imgW: 1600, imgH: 854 };

const heroPhoto = document.getElementById('hero-photo');
const hpBg = heroPhoto?.querySelector('.hp-bg');
const overlay = document.getElementById('hp-earring-pop');

if (heroPhoto && hpBg && overlay) boot();

function boot() {
  let positioned = false;

  function position() {
    const cw = hpBg.clientWidth, ch = hpBg.clientHeight;
    if (!cw || !ch) return;
    const scale = Math.max(cw / EARRING_BOX.imgW, ch / EARRING_BOX.imgH);
    const renderedW = EARRING_BOX.imgW * scale, renderedH = EARRING_BOX.imgH * scale;
    const offsetX = (cw - renderedW) / 2, offsetY = (ch - renderedH) / 2;

    overlay.style.left = (offsetX + EARRING_BOX.x * scale) + 'px';
    overlay.style.top = (offsetY + EARRING_BOX.y * scale) + 'px';
    overlay.style.width = (EARRING_BOX.w * scale) + 'px';
    overlay.style.height = (EARRING_BOX.h * scale) + 'px';
    positioned = true;
  }

  // Chamado pela página assim que hero.imgFundo é definido no <img> de fundo
  // (a config vem do Firestore, carrega de forma assíncrona).
  window.__brincoPopReady = () => {
    overlay.style.display = 'block';
    position();
  };

  window.addEventListener('resize', debounce(position, 150));
  const bgImg = document.getElementById('hp-bg-img');
  if (bgImg) bgImg.addEventListener('load', position);

  // Se a foto de fundo já estava visível antes deste script carregar.
  if (bgImg && bgImg.style.display !== 'none' && bgImg.src) {
    overlay.style.display = 'block';
    position();
  }

  const forceMotion = new URLSearchParams(location.search).get('force3d') === '1';
  const reducedMotion = !forceMotion && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion || !(window.gsap && window.ScrollTrigger)) return;

  gsap.registerPlugin(ScrollTrigger);
  gsap.fromTo(overlay,
    { scale: 1, y: 0, filter: 'drop-shadow(0px 0px 0px rgba(124,92,53,0))' },
    {
      scale: 1.55, y: -26, rotate: -4,
      filter: 'drop-shadow(0px 22px 30px rgba(124,92,53,0.5))',
      ease: 'none',
      scrollTrigger: { trigger: heroPhoto, start: 'top top', end: 'bottom top', scrub: true },
    });
}

function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}
