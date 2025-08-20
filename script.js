// script.js
// Minimal change to avoid "flash at top-left" while preserving your original sizing/behaviour.
// Strategy:
// 1. Immediately move anchors visually offscreen using transform (doesn't affect element sizing).
// 2. Once sizes are available (images loaded or next tick), compute positions inside viewport,
//    set left/top, remove the offscreen transform, and start the animation loop.
// 3. Preserve your original velocities and hover pause behavior.

const images = Array.from(document.querySelectorAll('.bouncing-image'));
const velocities = [];

// If nothing found, exit gracefully
if (images.length === 0) {
  console.warn('No .bouncing-image elements found.');
}

// 1) Prevent flash: move each anchor visually offscreen via transform (keeps width/height intact)
images.forEach(el => {
  // keep any existing inline transform intact? We'll store and restore if necessary.
  el.__savedTransform = el.style.transform || '';
  // move visually offscreen; using translate keeps layout/size unchanged
  el.style.transform = `translate(-9999px, -9999px)`;
});

// Helper: wait until all inner <img> elements either load or error.
// This helps ensure offsetWidth/offsetHeight are accurate. If there are no imgs, resolves immediately.
function waitForInnerImages() {
  const imgElems = images.map(a => a.querySelector('img')).filter(Boolean);
  if (imgElems.length === 0) return Promise.resolve();
  const promises = imgElems.map(img => new Promise(resolve => {
    if (img.complete && img.naturalWidth !== 0) {
      resolve();
    } else {
      const done = () => {
        img.removeEventListener('load', done);
        img.removeEventListener('error', done);
        resolve();
      };
      img.addEventListener('load', done);
      img.addEventListener('error', done);
    }
  }));
  return Promise.all(promises);
}

// Utility clamp
function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function initializePositionsAndVelocities() {
  images.forEach((img, index) => {
    // use offsetWidth/offsetHeight which are reliable after image load
    const w = img.offsetWidth || img.getBoundingClientRect().width || 50;
    const h = img.offsetHeight || img.getBoundingClientRect().height || 50;

    // ensure the entire element starts inside viewport
    const maxLeft = Math.max(1, window.innerWidth - w - 1);
    const maxTop  = Math.max(1, window.innerHeight - h - 1);

    const x = Math.random() * maxLeft;
    const y = Math.random() * maxTop;

    img.style.left = `${x}px`;
    img.style.top = `${y}px`;

    // restore any prior transform (we moved it offscreen earlier)
    img.style.transform = img.__savedTransform || '';

    velocities[index] = {
      dx: (Math.random() < 0.5 ? -1 : 1) * (1 + Math.random() * 0.5),
      dy: (Math.random() < 0.5 ? -1 : 1) * (1 + Math.random() * 0.5),
      paused: false
    };

    // Pause only this image on hover (same as your original)
    img.addEventListener('mouseenter', () => {
      velocities.forEach((v, i) => v.paused = i === index);
    });

    img.addEventListener('mouseleave', () => {
      velocities[index].paused = false;
    });

    // also support touch (acts like hover)
    img.addEventListener('touchstart', () => {
      velocities.forEach((v, i) => v.paused = i === index);
    }, { passive: true });
  });
}

function clampAllPositionsToViewport() {
  images.forEach(img => {
    const rect = img.getBoundingClientRect();
    const w = rect.width || img.offsetWidth;
    const h = rect.height || img.offsetHeight;
    let left = parseFloat(img.style.left) || rect.left || 0;
    let top = parseFloat(img.style.top) || rect.top || 0;

    const maxLeft = Math.max(0, window.innerWidth - w);
    const maxTop = Math.max(0, window.innerHeight - h);

    left = clamp(left, 0, maxLeft);
    top  = clamp(top, 0, maxTop);

    img.style.left = `${left}px`;
    img.style.top  = `${top}px`;
  });
}

// original animate loop (kept intact)
function animate() {
  images.forEach((img, index) => {
    const velocity = velocities[index];
    if (!velocity || velocity.paused) return;

    const rect = img.getBoundingClientRect();
    let left = parseFloat(img.style.left);
    let top = parseFloat(img.style.top);

    left += velocity.dx;
    top += velocity.dy;

    if (left <= 0 || left + rect.width >= window.innerWidth) {
      velocity.dx *= -1;
    }
    if (top <= 0 || top + rect.height >= window.innerHeight) {
      velocity.dy *= -1;
    }

    img.style.left = `${left}px`;
    img.style.top = `${top}px`;
  });

  requestAnimationFrame(animate);
}

// Boot sequence:
// Wait for inner images to load (so widths/heights are accurate), then init and start.
waitForInnerImages().then(() => {
  initializePositionsAndVelocities();
  clampAllPositionsToViewport();
  requestAnimationFrame(animate);
});

// Also clamp on resize so elements cannot end up offscreen
window.addEventListener('resize', () => {
  clampAllPositionsToViewport();
});
