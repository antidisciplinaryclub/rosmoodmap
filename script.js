// script.js
// Improved initialization so dimensions are known before we place items.
// This prevents the "stuck at the bottom" problem you observed.

const images = Array.from(document.querySelectorAll('.bouncing-image'));
const velocities = new Array(images.length);

if (images.length === 0) {
  // nothing to do
  console.warn('No bouncing images found.');
}

/**
 * Wait until each image (the <img> inside the anchor) is loaded.
 * Returns a promise that resolves when all are loaded.
 */
function waitForAllImagesLoaded() {
  const imgElements = images.map(a => a.querySelector('img')).filter(Boolean);
  const loadPromises = imgElements.map(img => {
    return new Promise(resolve => {
      if (img.complete && img.naturalWidth !== 0) {
        resolve();
      } else {
        // handle both load and error (image failed but we still want to continue)
        const onDone = () => {
          img.removeEventListener('load', onDone);
          img.removeEventListener('error', onDone);
          resolve();
        };
        img.addEventListener('load', onDone);
        img.addEventListener('error', onDone);
      }
    });
  });
  return Promise.all(loadPromises);
}

/**
 * Safely clamp a number between min and max inclusive.
 */
function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

/**
 * Initialize positions and velocities after images are loaded.
 */
function initializePositionsAndVelocities() {
  images.forEach((img, index) => {
    // compute width/height using offsetWidth/offsetHeight (reliable after load)
    const w = img.offsetWidth || img.getBoundingClientRect().width || 50;
    const h = img.offsetHeight || img.getBoundingClientRect().height || 50;

    // put them fully inside the viewport (leave 1px margin)
    const maxLeft = Math.max(1, window.innerWidth - w - 1);
    const maxTop = Math.max(1, window.innerHeight - h - 1);

    // random start position
    const x = Math.random() * maxLeft;
    const y = Math.random() * maxTop;

    img.style.left = `${x}px`;
    img.style.top = `${y}px`;

    // speed: keep relatively slow and varied
    const baseSpeed = 0.6; // reduce speeds slightly so motion is smoother
    velocities[index] = {
      dx: (Math.random() < 0.5 ? -1 : 1) * (baseSpeed + Math.random() * 0.9),
      dy: (Math.random() < 0.5 ? -1 : 1) * (baseSpeed + Math.random() * 0.9),
      paused: false
    };

    // Pause this one image only on hover (same behavior as your original)
    img.addEventListener('mouseenter', () => {
      velocities.forEach((v, i) => {
        v.paused = (i === index);
      });
    });

    // Resume this one image on leave
    img.addEventListener('mouseleave', () => {
      velocities[index].paused = false;
    });

    // also, make touchstart behave like mouseenter so mobile users can tap & pause
    img.addEventListener('touchstart', (e) => {
      velocities.forEach((v, i) => {
        v.paused = (i === index);
      });
      // don't block click/navigation when they actually tap to follow link
      // we allow event to bubble so anchor still works.
    }, {passive: true});
  });
}

/**
 * Animate loop — uses velocities array and updates each element.
 * Includes robust boundary checks & clamping so items never move off-screen.
 */
function animate() {
  images.forEach((img, index) => {
    const velocity = velocities[index];
    if (!velocity || velocity.paused) return;

    // current rect / sizes
    const rect = img.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    // read numeric left/top (should be set during init)
    let left = parseFloat(img.style.left) || rect.left || 0;
    let top = parseFloat(img.style.top) || rect.top || 0;

    left += velocity.dx;
    top += velocity.dy;

    // boundary limits
    const minLeft = 0;
    const minTop = 0;
    const maxLeft = Math.max(0, window.innerWidth - w);
    const maxTop = Math.max(0, window.innerHeight - h);

    // if beyond bounds, invert velocity and clamp position to boundary.
    if (left <= minLeft) {
      left = minLeft;
      velocity.dx *= -1;
    } else if (left >= maxLeft) {
      left = maxLeft;
      velocity.dx *= -1;
    }

    if (top <= minTop) {
      top = minTop;
      velocity.dy *= -1;
    } else if (top >= maxTop) {
      top = maxTop;
      velocity.dy *= -1;
    }

    img.style.left = `${left}px`;
    img.style.top = `${top}px`;
  });

  requestAnimationFrame(animate);
}

/**
 * If the window is resized, clamp positions so no element becomes partially off-screen.
 */
function clampAllPositionsToViewport() {
  images.forEach((img) => {
    const rect = img.getBoundingClientRect();
    const w = rect.width || img.offsetWidth;
    const h = rect.height || img.offsetHeight;
    let left = parseFloat(img.style.left) || rect.left || 0;
    let top = parseFloat(img.style.top) || rect.top || 0;

    const maxLeft = Math.max(0, window.innerWidth - w);
    const maxTop = Math.max(0, window.innerHeight - h);

    left = clamp(left, 0, maxLeft);
    top = clamp(top, 0, maxTop);

    img.style.left = `${left}px`;
    img.style.top = `${top}px`;
  });
}

// Wait for all images (inside anchors) to be loaded, then initialize and start animation.
waitForAllImagesLoaded().then(() => {
  initializePositionsAndVelocities();
  // small guard: ensure positions are valid right away
  clampAllPositionsToViewport();
  requestAnimationFrame(animate);
});

// also clamp on resize
window.addEventListener('resize', () => {
  clampAllPositionsToViewport();
});
