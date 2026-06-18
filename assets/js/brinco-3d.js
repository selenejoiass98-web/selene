/*
 * Brinco 3D — showcase scroll-driven (TESTE)
 * Three.js + GSAP ScrollTrigger, com fallback CSS-3D para devices fracos /
 * sem WebGL / prefers-reduced-motion. Pensado para ser plugado em qualquer
 * página estática (sem build step) — basta a section #brinco3d existir.
 *
 * Para usar um modelo 3D real do brinco (em vez da foto plana):
 *  1. Modele/escaneie o brinco em Blender, low-poly (<5k tris), com
 *     materiais PBR (metalness/roughness) já aplicados.
 *  2. Exporte como .glb (glTF binário), com Draco compression ligado.
 *  3. Salve em assets/models/brinco.glb — este script detecta o arquivo
 *     automaticamente e usa o modelo real no lugar do plano com a foto.
 */

const SECTION_ID = 'brinco3d';
const IMG_SRC = 'assets/img/brinco-3d.png';
const GLB_SRC = 'assets/models/brinco.glb';

const section = document.getElementById(SECTION_ID);
if (section) boot();

function boot() {
  const cap = detectCapability();
  const fallbackEl = document.getElementById('brinco3d-fallback');
  const scrollHint = document.getElementById('brinco3d-scrollhint');
  const copyEl = section.querySelector('.brinco3d-copy');

  if (!cap.useThree) {
    initFallback(fallbackEl, copyEl, scrollHint, cap);
    return;
  }

  initThree(fallbackEl, copyEl, scrollHint, cap).catch((err) => {
    console.warn('[brinco3d] Three.js falhou, usando fallback CSS-3D:', err);
    initFallback(fallbackEl, copyEl, scrollHint, cap);
  });
}

function detectCapability() {
  const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasWebGL = (() => {
    try {
      const c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')));
    } catch (e) { return false; }
  })();
  const lowEndDevice = (navigator.hardwareConcurrency || 4) <= 2;
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const hasGsap = !!(window.gsap && window.ScrollTrigger);

  const intensity = parseFloat(section.dataset['3dIntensity'] || section.getAttribute('data-3d-intensity') || '1');
  const particlesOn = (section.getAttribute('data-3d-particles') || 'true') === 'true';

  return {
    useThree: hasWebGL && hasGsap && !reducedMotion && !(isMobile && lowEndDevice),
    reducedMotion, hasGsap, isMobile, lowEndDevice,
    intensity: isNaN(intensity) ? 1 : intensity,
    particlesOn: particlesOn && !(isMobile && lowEndDevice),
    pixelRatioCap: isMobile ? 1.5 : 2,
  };
}

/* ───────────────────── Fallback CSS-3D ───────────────────── */

function initFallback(fallbackEl, copyEl, scrollHint, cap) {
  if (!fallbackEl) return;
  fallbackEl.classList.add('is-active');

  const img = document.getElementById('b3d-fallback-img');
  if (img) {
    img.addEventListener('error', () => {
      fallbackEl.querySelector('.b3d-stage')?.classList.add('b3d-img-missing');
    }, { once: true });
  }

  if (cap.reducedMotion || !cap.hasGsap) {
    if (img) img.style.transform = 'scale(1)';
    if (copyEl) copyEl.style.opacity = '1';
    return;
  }

  const gsap = window.gsap, ScrollTrigger = window.ScrollTrigger;
  gsap.registerPlugin(ScrollTrigger);
  const amp = cap.intensity;

  gsap.timeline({
    scrollTrigger: { trigger: section, start: 'top top', end: 'bottom bottom', scrub: true,
      onUpdate(self) { if (scrollHint) scrollHint.classList.toggle('is-hidden', self.progress > 0.04); } },
  })
    .fromTo(img, { scale: 0.78, rotateY: -18 * amp, z: -120 }, { scale: 1.08, rotateY: 14 * amp, z: 80, ease: 'none' }, 0)
    .fromTo(copyEl, { opacity: 0, y: 24 }, { opacity: 1, y: 0, ease: 'none' }, 0.05)
    .to(copyEl, { opacity: 0, y: -16, ease: 'none' }, 0.85);
}

/* ───────────────────── Three.js ───────────────────── */

async function initThree(fallbackEl, copyEl, scrollHint, cap) {
  const THREE = await import('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js');
  const { GLTFLoader } = await import('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js');
  const { RoomEnvironment } = await import('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/environments/RoomEnvironment.js');

  const canvas = document.getElementById('brinco3d-canvas');
  const viewport = section.querySelector('.brinco3d-viewport');
  if (!canvas || !viewport) throw new Error('markup ausente');

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !cap.lowEndDevice });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, cap.pixelRatioCap));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0, 8);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  scene.add(new THREE.AmbientLight(0xfff1de, 0.5));
  const key = new THREE.DirectionalLight(0xffe9c7, 1.4);
  key.position.set(3, 4, 5);
  scene.add(key);
  const rim = new THREE.PointLight(0xc4a47a, 1.2, 20);
  rim.position.set(-4, -2, 3);
  scene.add(rim);

  const group = new THREE.Group();
  scene.add(group);

  try {
    const gltf = await loadGLTF(GLTFLoader, GLB_SRC);
    group.add(gltf.scene);
    normalizeScale(THREE, group, 3.2);
  } catch (e) {
    group.add(await buildEarringPlane(THREE));
  }

  let particles = null;
  if (cap.particlesOn) {
    particles = buildParticles(THREE);
    scene.add(particles);
  }

  function resize() {
    const w = viewport.clientWidth, h = viewport.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', debounce(resize, 150));

  /* Pausa o loop de render quando a seção não está visível (performance) */
  let inView = true;
  new IntersectionObserver((entries) => { inView = entries[0].isIntersecting; }, { threshold: 0.01 }).observe(section);

  /* Parallax de mouse (desktop) */
  const mouse = { x: 0, y: 0 };
  if (!cap.isMobile) {
    window.addEventListener('mousemove', (e) => {
      mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
    });
  }

  const gsap = window.gsap, ScrollTrigger = window.ScrollTrigger;
  gsap.registerPlugin(ScrollTrigger);
  const amp = cap.intensity;
  const progressState = { v: 0 };

  gsap.timeline({
    scrollTrigger: {
      trigger: section, start: 'top top', end: 'bottom bottom', scrub: true,
      onUpdate(self) {
        progressState.v = self.progress;
        if (scrollHint) scrollHint.classList.toggle('is-hidden', self.progress > 0.04);
      },
    },
  })
    .to(progressState, { v: 1, ease: 'none' }, 0)
    .fromTo(copyEl, { opacity: 0, y: 24 }, { opacity: 1, y: 0, ease: 'none' }, 0.05)
    .to(copyEl, { opacity: 0, y: -16, ease: 'none' }, 0.85);

  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    if (!inView) return;

    const t = clock.getElapsedTime();
    const p = progressState.v;

    const baseScale = group.userData.baseScale || 1;
    group.position.z = THREE.MathUtils.lerp(-2.2, 1.4, p) * (amp);
    group.scale.setScalar(baseScale * THREE.MathUtils.lerp(0.55, 1.15, p));
    group.rotation.y = THREE.MathUtils.lerp(-0.3, Math.PI * 1.15, p) * amp + Math.sin(t * 0.6) * 0.04;
    group.position.y = Math.sin(t * 1.4) * 0.06 * amp;
    group.rotation.z = Math.sin(t * 0.9) * 0.02 * amp;

    camera.position.x = THREE.MathUtils.lerp(camera.position.x, mouse.x * 0.6 * amp, 0.05);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, -mouse.y * 0.4 * amp, 0.05);
    camera.lookAt(0, 0, 0);

    if (particles) {
      particles.rotation.y = t * 0.05;
      particles.material.opacity = 0.15 + p * 0.35;
    }

    renderer.render(scene, camera);
  }
  animate();
}

function loadGLTF(GLTFLoader, url) {
  return new Promise((resolve, reject) => {
    new GLTFLoader().load(url, resolve, undefined, reject);
  });
}

function normalizeScale(THREE, group, targetSize) {
  const box = new THREE.Box3().setFromObject(group);
  const size = new THREE.Vector3();
  box.getSize(size);
  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  const factor = targetSize / maxDim;
  group.scale.setScalar(factor);
  group.userData.baseScale = factor;
  const center = new THREE.Vector3();
  box.getCenter(center);
  group.children.forEach((child) => child.position.sub(center));
}

async function buildEarringPlane(THREE) {
  const group = new THREE.Group();
  const texture = await loadTexture(THREE, IMG_SRC).catch(() => null);

  if (texture) {
    texture.colorSpace = THREE.SRGBColorSpace;
    const aspect = texture.image.width / texture.image.height;
    const height = 3.4, width = height * aspect;
    const geo = new THREE.PlaneGeometry(width, height, 32, 32);
    const mat = new THREE.MeshPhysicalMaterial({
      map: texture, transparent: true, roughness: 0.28, metalness: 0.65,
      clearcoat: 0.6, clearcoatRoughness: 0.2, envMapIntensity: 1.3,
    });
    group.add(new THREE.Mesh(geo, mat));
  } else {
    group.add(buildProceduralGem(THREE));
  }
  return group;
}

function buildProceduralGem(THREE) {
  const group = new THREE.Group();
  const goldMat = new THREE.MeshPhysicalMaterial({ color: 0xc4a47a, metalness: 1, roughness: 0.22, clearcoat: 0.4 });
  const gemMat = new THREE.MeshPhysicalMaterial({
    color: 0x9b7fd4, metalness: 0, roughness: 0.05, transmission: 0.85,
    thickness: 0.5, ior: 1.9, clearcoat: 1,
  });

  [-0.9, 0.9].forEach((x) => {
    const hoop = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.035, 16, 32), goldMat);
    hoop.position.set(x, 0.55, 0);
    group.add(hoop);
    const gem = new THREE.Mesh(new THREE.IcosahedronGeometry(0.38, 1), gemMat);
    gem.position.set(x, 0, 0);
    group.add(gem);
  });
  return group;
}

function loadTexture(THREE, url) {
  return new Promise((resolve, reject) => {
    new THREE.TextureLoader().load(url, resolve, undefined, reject);
  });
}

function buildParticles(THREE) {
  const count = 140;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 10;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 6;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 6;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({ color: 0xe0cebb, size: 0.035, transparent: true, opacity: 0.2, depthWrite: false });
  return new THREE.Points(geo, mat);
}

function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}
