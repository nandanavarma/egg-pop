// ============================================================
//   THE PASTEL PATCH — game.js  ✨ FINAL VERSION ✨
//   Sections:
//     1. World Pan System (mouse + touch + arrow keys)
//     2. Egg Data
//     3. Loot Data
//     4. Egg Spawning & Clouds
//     5. Hatching State Machine
//     6. Loot Roll (Rarity)
//     7. Inventory / Basket
//     8. Particle Sparkle System
//     9. Sound Setup
// ============================================================



// ============================================================
// 1. WORLD PAN SYSTEM
//    Mouse drag, arrow keys, AND touch/swipe for mobile.
// ============================================================

const worldContainer = document.getElementById('world-container');
const world          = document.getElementById('world');

const WORLD_W = 3200;
const WORLD_H = 2200;

let worldX = -(WORLD_W / 2 - window.innerWidth  / 2);
let worldY = -(WORLD_H / 2 - window.innerHeight / 2);

let isDragging  = false;
let dragStartX, dragStartY;
let worldStartX, worldStartY;

function clampWorld(x, y) {
  const minX = -(WORLD_W - window.innerWidth);
  const minY = -(WORLD_H - window.innerHeight);
  return {
    x: Math.min(0, Math.max(minX, x)),
    y: Math.min(0, Math.max(minY, y)),
  };
}

function setWorldPos(x, y) {
  const c = clampWorld(x, y);
  worldX = c.x;
  worldY = c.y;
  world.style.transform = `translate(${worldX}px, ${worldY}px)`;
}

setWorldPos(worldX, worldY);


// --- Mouse events ---
worldContainer.addEventListener('mousedown', (e) => {
  if (e.target.classList.contains('egg')) return;
  startDrag(e.clientX, e.clientY);
  worldContainer.classList.add('grabbing');
});

window.addEventListener('mousemove', (e) => {
  if (!isDragging) return;
  moveDrag(e.clientX, e.clientY);
});

window.addEventListener('mouseup', () => {
  isDragging = false;
  worldContainer.classList.remove('grabbing');
});


// --- Touch events (mobile) ---
let touchMovedFar = false;
const TAP_THRESHOLD = 10;

worldContainer.addEventListener('touchstart', (e) => {
  if (e.touches.length > 1) return;
  const t = e.touches[0];
  touchMovedFar = false;
  startDrag(t.clientX, t.clientY);
}, { passive: true });

worldContainer.addEventListener('touchmove', (e) => {
  if (e.touches.length > 1) return;
  const t  = e.touches[0];
  const dx = t.clientX - dragStartX;
  const dy = t.clientY - dragStartY;
  if (Math.abs(dx) > TAP_THRESHOLD || Math.abs(dy) > TAP_THRESHOLD) {
    touchMovedFar = true;
  }
  moveDrag(t.clientX, t.clientY);
}, { passive: true });

worldContainer.addEventListener('touchend', (e) => {
  isDragging = false;

  if (!touchMovedFar) {
    const t  = e.changedTouches[0];
    const el = document.elementFromPoint(t.clientX, t.clientY);
    if (el && el.classList.contains('egg')) {
      const typeId = el.dataset.typeId;
      const type   = EGG_TYPES.find(et => et.id === typeId);
      if (type) onEggClick(el, type);
    }
  }
});


function startDrag(x, y) {
  isDragging  = true;
  dragStartX  = x;
  dragStartY  = y;
  worldStartX = worldX;
  worldStartY = worldY;
}

function moveDrag(x, y) {
  if (!isDragging) return;
  setWorldPos(worldStartX + (x - dragStartX), worldStartY + (y - dragStartY));
}


// --- Arrow / WASD keys ---
const PAN_SPEED = 18;
const keys = {};

window.addEventListener('keydown', (e) => { keys[e.key] = true; });
window.addEventListener('keyup',   (e) => { keys[e.key] = false; });

function panWithKeys() {
  let dx = 0, dy = 0;
  if (keys['ArrowLeft']  || keys['a'] || keys['A']) dx =  PAN_SPEED;
  if (keys['ArrowRight'] || keys['d'] || keys['D']) dx = -PAN_SPEED;
  if (keys['ArrowUp']    || keys['w'] || keys['W']) dy =  PAN_SPEED;
  if (keys['ArrowDown']  || keys['s'] || keys['S']) dy = -PAN_SPEED;
  if (dx !== 0 || dy !== 0) setWorldPos(worldX + dx, worldY + dy);
  requestAnimationFrame(panWithKeys);
}
panWithKeys();



// ============================================================
// 2. EGG DATA
// ============================================================

const EGG_TYPES = [
  {
    id:   'heart-egg',
    name: 'Heart Egg',
    src:  'assets/eggs/heart-egg.png',
    top:  'assets/eggs/heart-egg-top.png',
    bot:  'assets/eggs/heart-egg-bottom.png',
  },
  {
    id:   'bow-egg',
    name: 'Bow Egg',
    src:  'assets/eggs/bow-egg.png',
    top:  'assets/eggs/bow-egg-top.png',
    bot:  'assets/eggs/bow-egg-bottom.png',
  },
  {
    id:   'stripe-egg',
    name: 'Stripe Egg',
    src:  'assets/eggs/stripe-egg.png',
    top:  'assets/eggs/stripe-egg-top.png',
    bot:  'assets/eggs/stripe-egg-bottom.png',
  },
  {
    id:   'polka-egg',
    name: 'Polka Egg',
    src:  'assets/eggs/polka-egg.png',
    top:  'assets/eggs/polka-egg-top.png',
    bot:  'assets/eggs/polka-egg-bottom.png',
  },
  {
    id:   'first-egg',
    name: 'Star Egg',
    src:  'assets/eggs/first-egg.png',
    top:  'assets/eggs/first-egg-top.png',
    bot:  'assets/eggs/first-egg-bottom.png',
  },
];



// ============================================================
// 3. LOOT DATA
// ============================================================

const LOOT = [
  { id: 'bunny', name: 'Bunny',  src: 'assets/animals/bunny.png', rare: false },
  { id: 'chick', name: 'Chick',  src: 'assets/animals/chick.png', rare: false },
  { id: 'frog',  name: 'Frog',   src: 'assets/animals/frog.png',  rare: false },

  { id: 'daisy',  name: 'Daisy',  src: 'assets/flowers/daisy.png',  rare: false },
  { id: 'tulip',  name: 'Tulip',  src: 'assets/flowers/tulip.png',  rare: false },
  { id: 'clover', name: 'Clover', src: 'assets/flowers/clover.png', rare: false },

  { id: 'special-turtle', name: '✨ Special Turtle', src: 'assets/animals/special-turtle.png', rare: true },
];


const PUNS = [
  "You are egg-cellent! 🥚",
  "Some-bunny loves you! 🐰",
  "Hoppy you found me! 🌸",
  "Having a good hare day? ✨",
  "Egg-cited to meet you! 🎀",
  "You cracked the code! 💫",
  "Shell yeah! You found me! 🌟",
  "Egg-straordinary find! 🐣",
];



// ============================================================
// 4. SPAWNING EGGS & CLOUDS
// ============================================================

const SPAWN_MARGIN = 200;
let activeEggs = [];

function spawnEgg() {
  const type = EGG_TYPES[Math.floor(Math.random() * EGG_TYPES.length)];
  const x    = SPAWN_MARGIN + Math.random() * (WORLD_W - SPAWN_MARGIN * 2);
  const y    = SPAWN_MARGIN + Math.random() * (WORLD_H - SPAWN_MARGIN * 2);

  const el = document.createElement('img');
  el.src            = type.src;
  el.alt            = type.name;
  el.classList.add('egg');
  el.style.left     = x + 'px';
  el.style.top      = y + 'px';
  el.dataset.typeId = type.id;

  const delay    = (Math.random() * 2).toFixed(2);
  const duration = (2.5 + Math.random()).toFixed(2);
  el.style.animation = `float-egg ${duration}s ${delay}s ease-in-out infinite`;

  el.addEventListener('click', (e) => {
    e.stopPropagation();
    onEggClick(el, type);
  });

  world.appendChild(el);
  activeEggs.push(el);
}

for (let i = 0; i < 14; i++) spawnEgg();


function spawnCloud(x, y, width, driftDuration) {
  const el = document.createElement('img');
  el.src   = 'assets/ui/cloud.png';
  el.alt   = '';
  el.classList.add('cloud');
  el.style.left              = x + 'px';
  el.style.top               = y + 'px';
  el.style.width             = width + 'px';
  el.style.animationDuration = driftDuration + 's';
  el.style.animationDelay    = '-' + (Math.random() * driftDuration).toFixed(1) + 's';
  world.appendChild(el);
}

for (let i = 0; i < 18; i++) {
  spawnCloud(
    Math.random() * WORLD_W,
    Math.random() * (WORLD_H * 0.45),
    64 + Math.random() * 100,
    35 + Math.random() * 55
  );
}



// ============================================================
// 5. HATCHING STATE MACHINE
// ============================================================

let hatchState     = 0;
let currentEggEl   = null;
let currentEggType = null;
let currentLoot    = null;

const hatchOverlay = document.getElementById('hatch-overlay');
const hatchStage   = document.getElementById('hatch-stage');
const punText      = document.getElementById('pun-text');


function onEggClick(eggEl, type) {
  if (hatchState !== 0) return;

  hatchState     = 1;
  currentEggEl   = eggEl;
  currentEggType = type;

  hatchOverlay.classList.remove('hidden');
  hatchStage.innerHTML = '';

  const bigEgg = document.createElement('img');
  bigEgg.src = type.src;
  bigEgg.classList.add('big-egg');
  hatchStage.appendChild(bigEgg);

  gsap.fromTo(bigEgg,
    { scale: 0.2, opacity: 0, rotation: -5 },
    {
      scale: 1, opacity: 1, rotation: 0,
      duration: 0.45,
      ease: 'back.out(1.7)',
      onComplete() {
        gsap.to(bigEgg, {
          rotation: 9, duration: 0.13, repeat: 7, yoyo: true, ease: 'sine.inOut',
          onComplete() { gsap.to(bigEgg, { rotation: 0, duration: 0.1 }); },
        });
      },
    }
  );

  punText.textContent = '🐣  Tap to crack it open!';
  punText.classList.remove('hidden');
  sounds.pop.play();
}


// Both click (desktop) and touchend (mobile) trigger hatching
hatchOverlay.addEventListener('click', handleHatchTap);
hatchOverlay.addEventListener('touchend', (e) => {
  e.preventDefault();   // stop ghost click firing too
  handleHatchTap(e);
});

function handleHatchTap() {
  if (hatchState === 1) doHatch();
  else if (hatchState === 2) finishAndReset();
}


function doHatch() {
  hatchState  = 2;
  const type  = currentEggType;
  currentLoot = rollLoot();

  hatchStage.innerHTML = '';

  const topHalf = document.createElement('img');
  topHalf.src   = type.top;
  Object.assign(topHalf.style, {
    position: 'absolute', bottom: '50%', left: '50%',
    transform: 'translateX(-50%)',
    width: '128px', height: '96px', imageRendering: 'pixelated',
  });

  const botHalf = document.createElement('img');
  botHalf.src   = type.bot;
  Object.assign(botHalf.style, {
    position: 'absolute', top: '50%', left: '50%',
    transform: 'translateX(-50%)',
    width: '128px', height: '96px', imageRendering: 'pixelated',
  });

  hatchStage.appendChild(topHalf);
  hatchStage.appendChild(botHalf);

  gsap.to(topHalf, { y: -110, x: -50, rotation: -35, opacity: 0, duration: 0.55, ease: 'power2.out' });
  gsap.to(botHalf, { y:   65, x:  50, rotation:  25, opacity: 0, duration: 0.55, ease: 'power2.out' });

  spawnParticles(window.innerWidth / 2, window.innerHeight / 2);
  sounds.crack.play();

  setTimeout(() => {
    hatchStage.innerHTML = '';

    const lootImg = document.createElement('img');
    lootImg.src   = currentLoot.src;
    lootImg.alt   = currentLoot.name;
    Object.assign(lootImg.style, {
      width: '128px', height: '128px', imageRendering: 'pixelated',
      animation: 'burst-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
    });
    hatchStage.appendChild(lootImg);

    const pun = PUNS[Math.floor(Math.random() * PUNS.length)];
    punText.textContent = currentLoot.rare ? '✨✨ RARE FIND! ✨✨\n' + pun : pun;
    punText.classList.remove('hidden');

    addToInventory(currentLoot);
    sounds.sparkle.play();
  }, 580);
}


function finishAndReset() {
  hatchState = 0;
  hatchOverlay.classList.add('hidden');
  hatchStage.innerHTML = '';
  punText.classList.add('hidden');
  punText.textContent  = '';

  if (currentEggEl) {
    currentEggEl.remove();
    activeEggs   = activeEggs.filter(e => e !== currentEggEl);
    currentEggEl = null;
  }
  spawnEgg();
}



// ============================================================
// 6. LOOT ROLL
// ============================================================

function rollLoot() {
  const common = LOOT.filter(l => !l.rare);
  const rare   = LOOT.filter(l =>  l.rare);
  if (rare.length > 0 && Math.random() < 0.05) {
    return rare[Math.floor(Math.random() * rare.length)];
  }
  return common[Math.floor(Math.random() * common.length)];
}



// ============================================================
// 7. INVENTORY / BASKET
// ============================================================

let inventory = [];

function addToInventory(loot) {
  inventory.push(loot);
  document.getElementById('basket-count').textContent = inventory.length;
  renderInventory();
}

function renderInventory() {
  const grid     = document.getElementById('inventory-grid');
  const emptyMsg = document.getElementById('empty-msg');
  grid.innerHTML = '';
  emptyMsg.style.display = inventory.length === 0 ? 'block' : 'none';

  // Group by id, count occurrences
  const grouped = {};
  inventory.forEach((item) => {
    if (!grouped[item.id]) grouped[item.id] = { item, count: 0 };
    grouped[item.id].count++;
  });

  // Rare items sort to top
  const unique = Object.values(grouped);
  unique.sort((a, b) => (b.item.rare ? 1 : 0) - (a.item.rare ? 1 : 0));

  unique.forEach(({ item, count }) => {
    const div = document.createElement('div');
    div.classList.add('inv-item');
    if (item.rare) div.classList.add('is-rare');

    const wrap = document.createElement('div');
    wrap.classList.add('inv-img-wrap');

    const img = document.createElement('img');
    img.src = item.src;
    img.alt = item.name;
    wrap.appendChild(img);

    if (count > 1) {
      const badge = document.createElement('span');
      badge.classList.add('item-count');
      badge.textContent = `x${count}`;
      wrap.appendChild(badge);
    }

    const label = document.createElement('span');
    label.classList.add('item-name');
    label.textContent = item.name;

    div.appendChild(wrap);
    div.appendChild(label);
    grid.appendChild(div);
  });
}

document.getElementById('basket-btn').addEventListener('click', () => {
  document.getElementById('inventory-modal').classList.remove('hidden');
});

document.getElementById('close-inventory').addEventListener('click', () => {
  document.getElementById('inventory-modal').classList.add('hidden');
});

document.getElementById('inventory-modal').addEventListener('click', (e) => {
  if (e.target === document.getElementById('inventory-modal')) {
    document.getElementById('inventory-modal').classList.add('hidden');
  }
});



// ============================================================
// 8. PARTICLE SPARKLE SYSTEM
// ============================================================

const canvas = document.getElementById('particle-canvas');
const ctx    = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

let particles = [];

const PARTICLE_COLORS = [
  '#FFC6FF', '#FFD700', '#FFFFD2',
  '#E8E8FF', '#ffffff', '#FF9EC4', '#E2F0CB',
];

function spawnParticles(cx, cy) {
  for (let i = 0; i < 70; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2.5 + Math.random() * 7;
    particles.push({
      x: cx, y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2.5,
      size:    3 + Math.random() * 7,
      color:   PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
      life:    1.0,
      decay:   0.013 + Math.random() * 0.018,
      gravity: 0.13,
    });
  }
  animateParticles();
}

let particleRAF;
function animateParticles() {
  cancelAnimationFrame(particleRAF);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles = particles.filter(p => p.life > 0);
  particles.forEach((p) => {
    ctx.globalAlpha = p.life;
    ctx.fillStyle   = p.color;
    ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
    p.x += p.vx; p.y += p.vy; p.vy += p.gravity; p.life -= p.decay;
  });
  ctx.globalAlpha = 1;
  if (particles.length > 0) {
    particleRAF = requestAnimationFrame(animateParticles);
  } else {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}



// ============================================================
// 9. SOUND SETUP
//    Free sounds: https://freesound.org
//    Search: "pop", "crack egg", "sparkle chime"
// ============================================================

const sounds = {
  pop:     new Howl({ src: ['sounds/pop.mp3'],     volume: 0.5  }),
  crack:   new Howl({ src: ['sounds/crack.mp3'],   volume: 0.6  }),
  sparkle: new Howl({ src: ['sounds/sparkle.mp3'], volume: 0.65 }),
};