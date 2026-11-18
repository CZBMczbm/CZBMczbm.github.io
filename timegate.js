(() => {
  const overlay = document.getElementById('timegate');
  if (!overlay) return;

  const pendulum = document.getElementById('timegatePendulum');
  const clock = document.getElementById('timegateClock');
  const hourHand = document.getElementById('tgHour');
  const minuteHand = document.getElementById('tgMinute');
  const secondHand = document.getElementById('tgSecond');
  const status = overlay.querySelector('.timegate__status');
  const closeButton = document.getElementById('timegateClose');
  const skipButton = document.getElementById('timegateSkip');
  const leftPanel = document.getElementById('timegateLeft');
  const rightPanel = document.getElementById('timegateRight');

  const leftLayers = leftPanel ? Array.from(leftPanel.querySelectorAll('.gate-image')) : [];
  const rightLayers = rightPanel ? Array.from(rightPanel.querySelectorAll('.gate-image')) : [];
  const panelImages = [
    'assets/timegate/fair.webp',
    'assets/timegate/pop.webp',
    'assets/timegate/lying.webp',
    'assets/timegate/sitting.webp',
  ];

  const DROP = 1.15;
  const SWING = 4.6;
  const CLOSE = 1.05;

  let startTime = 0;
  let closeStart = 0;
  let closing = false;
  let raf = 0;
  let imageIndex = 0;
  let imageTimer = 0;
  let leftActive = 0;
  let rightActive = 0;
  let hourAngle = 305;
  let minuteAngle = 60;
  let secondAngle = 180;

  const setHands = () => {
    hourHand.setAttribute('transform', `rotate(${hourAngle % 360} 300 300)`);
    minuteHand.setAttribute('transform', `rotate(${minuteAngle % 360} 300 300)`);
    secondHand.setAttribute('transform', `rotate(${secondAngle % 360} 300 300)`);
  };

  setHands();

  const applyBackground = (layer, src) => {
    layer.style.backgroundImage = `url("${src}")`;
    layer.style.backgroundSize = src.includes('lying') ? '36% auto' : 'cover';
    layer.style.backgroundRepeat = 'no-repeat';
    layer.style.backgroundPosition = 'center';
  };

  const setLayer = (layers, activeIndex, src) => {
    const next = layers[1 - activeIndex];
    const current = layers[activeIndex];
    if (!next || !current) return activeIndex;
    applyBackground(next, src);
    next.style.opacity = '1';
    current.style.opacity = '0';
    return 1 - activeIndex;
  };

  const setPanelPair = (leftSrc, rightSrc) => {
    leftActive = setLayer(leftLayers, leftActive, leftSrc);
    rightActive = setLayer(rightLayers, rightActive, rightSrc);
  };

  const swapImages = () => {
    imageIndex = (imageIndex + 1) % panelImages.length;
    setPanelPair(panelImages[imageIndex], panelImages[(imageIndex + 1) % panelImages.length]);
  };

  const startImages = () => {
    window.clearInterval(imageTimer);
    imageIndex = 0;
    if (leftLayers[0] && leftLayers[1] && rightLayers[0] && rightLayers[1]) {
      applyBackground(leftLayers[0], panelImages[0]);
      leftLayers[0].style.opacity = '1';
      leftLayers[1].style.opacity = '0';
      applyBackground(rightLayers[0], panelImages[1]);
      rightLayers[0].style.opacity = '1';
      rightLayers[1].style.opacity = '0';
      leftActive = 0;
      rightActive = 0;
    }
    imageTimer = window.setInterval(swapImages, 1900);
  };

  const setCut = (angle) => {
    const h = window.innerHeight || 1;
    const w = window.innerWidth || 1;
    const rad = (angle * Math.PI) / 180;
    const shift = (-Math.tan(rad) * h * 100) / w;
    const top = 50;
    const bottom = Math.max(12, Math.min(88, 50 + shift));
    overlay.style.setProperty('--cut-top', `${top}%`);
    overlay.style.setProperty('--cut-bottom', `${bottom}%`);
    if (leftPanel && rightPanel) {
      leftPanel.style.clipPath = `polygon(0 0, ${top}% 0, ${bottom}% 100%, 0 100%)`;
      rightPanel.style.clipPath = `polygon(${top}% 0, 100% 0, 100% 100%, ${bottom}% 100%)`;
    }
  };

  const finishToQuestion = () => {
    window.cancelAnimationFrame(raf);
    window.clearInterval(imageTimer);
    window.location.href = 'clock.html';
  };

  const closeOverlay = () => {
    window.cancelAnimationFrame(raf);
    window.clearInterval(imageTimer);
    closing = false;
    overlay.hidden = true;
    overlay.setAttribute('aria-hidden', 'true');
    overlay.classList.remove('is-closing');
    document.body.classList.remove('timegate-open');
    pendulum.style.transform = 'translateX(-50%)';
    clock.style.transform = '';
  };

  const beginClose = () => {
    if (closing) return;
    closing = true;
    closeStart = performance.now();
    overlay.classList.add('is-closing');
    if (status) status.textContent = '时间合上 / CLOSING';
  };

  const frame = (now) => {
    const t = Math.max(0, (now - startTime) / 1000);
    const dropProgress = Math.min(1, t / DROP);
    const dropEase = 1 - Math.pow(1 - dropProgress, 3);
    let y = (1 - dropEase) * -112;
    let angle = dropProgress < 1 ? 0 : Math.sin((t - DROP) * 2.1) * 14;
    let clockScale = 1;
    let clockRise = 0;

    if (closing) {
      const c = Math.min(1, (now - closeStart) / (CLOSE * 1000));
      const ease = c * c;
      angle *= 1 - ease * 0.45;
      clockScale = 1 + 4.2 * ease;
      clockRise = -44 * ease;
      if (c >= 1) {
        finishToQuestion();
        return;
      }
    }

    pendulum.style.transform = `translateX(-50%) translateY(${y}vh) rotate(${angle.toFixed(2)}deg)`;
    clock.style.transform = closing ? `translateY(${clockRise.toFixed(2)}vh) scale(${clockScale.toFixed(3)})` : '';
    setCut(angle);

    secondAngle += 18 + Math.min(18, t * 5);
    minuteAngle += 0.4 + Math.min(1.2, t * 0.15);
    hourAngle += 0.035 + Math.min(0.08, t * 0.01);
    setHands();

    if (status && !closing) {
      status.textContent = angle >= 0 ? '钟摆向右 / RIGHT' : '钟摆向左 / LEFT';
    }

    if (!closing && t >= DROP + SWING) {
      beginClose();
    }

    raf = window.requestAnimationFrame(frame);
  };

  const openOverlay = () => {
    if (!overlay.hidden && !closing) return;
    window.cancelAnimationFrame(raf);
    window.clearInterval(imageTimer);
    closing = false;
    overlay.hidden = false;
    overlay.setAttribute('aria-hidden', 'false');
    overlay.classList.remove('is-closing');
    document.body.classList.add('timegate-open');
    if (status) status.textContent = '钟摆切割中 / LEFT · RIGHT';
    hourAngle = 305;
    minuteAngle = 60;
    secondAngle = 180;
    setHands();
    setCut(0);
    pendulum.style.transform = 'translateX(-50%) translateY(-112vh)';
    clock.style.transform = '';
    startImages();
    startTime = performance.now();
    raf = window.requestAnimationFrame(frame);
    window.setTimeout(() => closeButton?.focus({ preventScroll: true }), 300);
  };

  document.querySelectorAll('[data-timegate]').forEach((trigger) => {
    trigger.addEventListener('click', (event) => {
      event.preventDefault();
      openOverlay();
    });
  });

  closeButton?.addEventListener('click', closeOverlay);
  skipButton?.addEventListener('click', () => {
    window.cancelAnimationFrame(raf);
    window.clearInterval(imageTimer);
    window.location.href = 'clock.html';
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !overlay.hidden && !closing) closeOverlay();
  });
})();
