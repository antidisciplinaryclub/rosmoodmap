const images = document.querySelectorAll('.bouncing-image');
const velocities = [];

images.forEach((img, index) => {
  const rect = img.getBoundingClientRect();

  const x = Math.random() * (window.innerWidth - rect.width);
  const y = Math.random() * (window.innerHeight - rect.height);

  img.style.left = `${x}px`;
  img.style.top = `${y}px`;

  velocities[index] = {
    dx: (Math.random() < 0.5 ? -1 : 1) * (1 + Math.random() * 0.5),
    dy: (Math.random() < 0.5 ? -1 : 1) * (1 + Math.random() * 0.5),
    paused: false
  };

  // Pause this one image only
  img.addEventListener('mouseenter', () => {
    velocities.forEach((v, i) => v.paused = i === index);
  });

  // Resume only this image on leave
  img.addEventListener('mouseleave', () => {
    velocities[index].paused = false;
  });
});

function animate() {
  images.forEach((img, index) => {
    const velocity = velocities[index];
    if (velocity.paused) return;

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

animate();
