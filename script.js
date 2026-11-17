(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isDemo = new URLSearchParams(window.location.search).has('stay');

  const masthead = document.querySelector('.masthead');
  const menuToggle = document.querySelector('.menu-toggle');
  const mobileMenu = document.getElementById('mobileMenu');
  const toast = document.getElementById('toast');
  const jumpOverlay = document.getElementById('jumpOverlay');
  const jumpStatus = document.getElementById('jumpStatus');
  const jumpFallback = document.getElementById('jumpFallback');
  const jumpProgress = jumpOverlay ? jumpOverlay.querySelector('.jump-progress span') : null;

  let jumping = false;
  let toastTimer = 0;

  if (isDemo) document.documentElement.dataset.demo = 'true';

  /* ---------------- menu ---------------- */

  const closeMenu = () => {
    if (!masthead) return;
    masthead.classList.remove('menu-open');
    if (menuToggle) {
      menuToggle.setAttribute('aria-expanded', 'false');
      const label = menuToggle.querySelector('.sr-only');
      if (label) label.textContent = '打开菜单';
    }
  };

  if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      const open = masthead.classList.toggle('menu-open');
      menuToggle.setAttribute('aria-expanded', String(open));
      const label = menuToggle.querySelector('.sr-only');
      if (label) label.textContent = open ? '关闭菜单' : '打开菜单';
    });
  }

  if (mobileMenu) {
    mobileMenu.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
  }

  document.addEventListener('click', (event) => {
    if (!masthead || !masthead.classList.contains('menu-open')) return;
    if (!masthead.contains(event.target)) closeMenu();
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 1080) closeMenu();
  });

  /* ---------------- toast ---------------- */

  const showToast = (message, duration = 3600) => {
    if (!toast) return;
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add('is-visible');
    toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), duration);
  };

  /* ---------------- jump overlay ---------------- */

  const replayJumpProgress = () => {
    if (!jumpProgress) return;
    jumpProgress.style.animation = 'none';
    void jumpProgress.offsetWidth;
    jumpProgress.style.animation = '';
  };

  const resetJump = () => {
    if (!jumpOverlay) return;
    jumpOverlay.classList.remove('is-active');
    jumpOverlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('is-departing');
    jumping = false;
  };

  const showJump = () => {
    if (!jumpOverlay) return;
    replayJumpProgress();
    jumpOverlay.classList.add('is-active');
    jumpOverlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('is-departing');
  };

  const playDemoJump = () => {
    if (!jumpOverlay) return;
    if (jumpStatus) jumpStatus.textContent = '演示模式：不进入跳转界面。';
    if (jumpFallback) jumpFallback.hidden = true;
    showJump();
    window.setTimeout(() => {
      resetJump();
      if (jumpStatus) jumpStatus.textContent = '正在打开跳转界面…';
      if (jumpFallback) jumpFallback.hidden = false;
      showToast('演示模式：已取消跳转。去掉网址里的 ?stay 就会真的进入。', 4200);
    }, reduceMotion ? 900 : 1500);
  };

  const goJump = (event) => {
    const link = event.currentTarget;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (typeof event.button === 'number' && event.button !== 0) return;
    if (jumping) {
      event.preventDefault();
      return;
    }

    event.preventDefault();
    closeMenu();

    if (isDemo) {
      playDemoJump();
      return;
    }

    jumping = true;
    if (jumpStatus) jumpStatus.textContent = '正在打开跳转界面…';
    if (jumpFallback) jumpFallback.hidden = false;
    showJump();

    const target = link && link.getAttribute('href') ? link.getAttribute('href') : 'exit.html';
    window.setTimeout(() => {
      window.location.assign(target);
    }, reduceMotion ? 420 : 1400);
  };

  document.querySelectorAll('[data-go]').forEach((link) => {
    link.addEventListener('click', goJump);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    closeMenu();
    if (isDemo && jumpOverlay && jumpOverlay.classList.contains('is-active')) resetJump();
  });

  /* ---------------- lab tabs ---------------- */

  const tabs = Array.from(document.querySelectorAll('.lab-tab'));
  const panels = Array.from(document.querySelectorAll('.lab-panel'));

  const activateLab = (lab, focusTab = false) => {
    tabs.forEach((tab) => {
      const active = tab.dataset.lab === lab;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      if (active && focusTab) tab.focus();
    });
    panels.forEach((panel) => {
      const active = panel.dataset.panel === lab;
      panel.classList.toggle('is-active', active);
      panel.hidden = !active;
    });
  };

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activateLab(tab.dataset.lab));
    tab.addEventListener('keydown', (event) => {
      let next = -1;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next < 0) return;
      event.preventDefault();
      activateLab(tabs[next].dataset.lab, true);
    });
  });

  /* ---------------- scroll state / nav ---------------- */

  const navLinks = Array.from(document.querySelectorAll('.nav a[href^="#"]'));
  const sections = ['research', 'facts', 'go', 'game', 'about']
    .map((id) => document.getElementById(id))
    .filter(Boolean);
  let ticking = false;

  const updateScroll = () => {
    ticking = false;
    if (masthead) masthead.classList.toggle('is-scrolled', window.scrollY > 6);
    if (!sections.length) return;
    const line = window.scrollY + 180;
    let current = '';
    sections.forEach((section) => {
      if (section.offsetTop <= line) current = section.id;
    });
    navLinks.forEach((link) => {
      link.classList.toggle('is-active', link.getAttribute('href') === `#${current}`);
    });
  };

  const requestScroll = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(updateScroll);
  };

  window.addEventListener('scroll', requestScroll, { passive: true });
  updateScroll();

  /* ---------------- mini game ---------------- */

  const canvas = document.getElementById('gameCanvas');
  const wrap = document.getElementById('gameWrap');
  const startEl = document.getElementById('gameStart');
  const overEl = document.getElementById('gameOver');
  const scoreEl = document.getElementById('gameScore');
  const bestEl = document.getElementById('gameBest');

  if (canvas && wrap) {
    const ctx = canvas.getContext('2d');
    let W = canvas.width;
    let H = canvas.height;
    let GROUND = H - 40;
    const sprite = new Image();
    sprite.src = 'assets/naiwa-nurse-2.webp';

    const state = {
      mode: 'idle',
      score: 0,
      best: 0,
      speed: 4.3,
      frame: 0,
      spawnIn: 95,
      obstacles: [],
      player: { x: 92, y: 0, w: 74, h: 94, vy: 0, onGround: true },
    };

    const sizeCanvas = () => {
      const mobile = window.innerWidth < 700;
      canvas.width = mobile ? 700 : 1000;
      canvas.height = mobile ? 440 : 300;
      W = canvas.width;
      H = canvas.height;
      GROUND = H - 40;
      state.player.w = mobile ? 92 : 74;
      state.player.h = mobile ? 116 : 94;
      state.player.y = GROUND - state.player.h;
      if (state.mode === 'running') resetGame();
      else draw();
    };

    try {
      state.best = Number(window.localStorage.getItem('naiwaRunBest') || 0) || 0;
    } catch (error) {
      state.best = 0;
    }
    if (bestEl) bestEl.textContent = String(state.best).padStart(3, '0');

    const setScore = () => {
      if (scoreEl) scoreEl.textContent = String(state.score).padStart(3, '0');
    };

    const resetGame = () => {
      state.mode = 'idle';
      state.score = 0;
      state.speed = 4.3;
      state.frame = 0;
      state.spawnIn = 95;
      state.obstacles = [];
      state.player.y = GROUND - state.player.h;
      state.player.vy = 0;
      state.player.onGround = true;
      setScore();
      if (overEl) overEl.hidden = true;
      if (startEl) startEl.hidden = false;
      draw();
    };

    const startGame = () => {
      state.mode = 'running';
      state.score = 0;
      state.speed = 4.3;
      state.frame = 0;
      state.spawnIn = 80;
      state.obstacles = [];
      state.player.y = GROUND - state.player.h;
      state.player.vy = 0;
      state.player.onGround = true;
      setScore();
      if (startEl) startEl.hidden = true;
      if (overEl) overEl.hidden = true;
      draw();
      window.requestAnimationFrame(loop);
    };

    const jump = () => {
      if (state.mode === 'idle' || state.mode === 'over') {
        startGame();
        return;
      }
      if (state.mode !== 'running' || !state.player.onGround) return;
      state.player.vy = -13.5;
      state.player.onGround = false;
    };

    const endGame = () => {
      state.mode = 'over';
      if (state.score > state.best) {
        state.best = state.score;
        try {
          window.localStorage.setItem('naiwaRunBest', String(state.best));
        } catch (error) {
          // ignore storage failures
        }
        if (bestEl) bestEl.textContent = String(state.best).padStart(3, '0');
      }
      if (overEl) overEl.hidden = false;
      draw();
    };

    const spawn = () => {
      const types = [
        { label: '论文', w: 44, h: 58, color: '#121212' },
        { label: '夜班', w: 52, h: 42, color: '#C8332D' },
        { label: '考试', w: 42, h: 62, color: '#121212' },
      ];
      const type = types[Math.floor(Math.random() * types.length)];
      state.obstacles.push({
        x: W + 30,
        y: GROUND - type.h,
        w: type.w,
        h: type.h,
        label: type.label,
        color: type.color,
      });
    };

    const hits = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

    const update = () => {
      state.frame += 1;
      state.speed = 4.3 + Math.min(2.8, state.score * 0.04);

      const p = state.player;
      p.vy += 0.58;
      p.y += p.vy;
      if (p.y >= GROUND - p.h) {
        p.y = GROUND - p.h;
        p.vy = 0;
        p.onGround = true;
      }

      state.spawnIn -= 1;
      if (state.spawnIn <= 0) {
        spawn();
        state.spawnIn = Math.max(60, 98 - Math.floor(state.score / 4) * 2) + Math.floor(Math.random() * 22);
      }

      const playerRect = { x: p.x, y: p.y, w: p.w, h: p.h };
      state.obstacles.forEach((o) => {
        o.x -= state.speed;
        if (hits(playerRect, o)) endGame();
      });

      const before = state.obstacles.length;
      state.obstacles = state.obstacles.filter((o) => {
        if (o.x + o.w < 0) {
          state.score += 1;
          setScore();
          return false;
        }
        return true;
      });
      if (state.obstacles.length < before) setScore();
    };

    const drawBackground = () => {
      ctx.fillStyle = '#F3E8D0';
      ctx.fillRect(0, 0, W, H);

      ctx.strokeStyle = 'rgba(18,18,18,.07)';
      ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 32) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let y = 0; y < H; y += 32) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }

      ctx.fillStyle = 'rgba(200,51,45,.12)';
      ctx.beginPath();
      ctx.arc(W - 70, 58, 92, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#121212';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, GROUND);
      ctx.lineTo(W, GROUND);
      ctx.stroke();

      ctx.fillStyle = '#C8332D';
      ctx.fillRect(0, GROUND + 3, W, 7);

      ctx.fillStyle = 'rgba(18,18,18,.55)';
      ctx.font = '700 9px Consolas, monospace';
      ctx.fillText('NAIWA MEDICAL UNIVERSITY / NIGHT SHIFT RUN', 18, 24);
    };

    const drawPlayer = () => {
      const p = state.player;
      if (sprite.complete && sprite.naturalWidth) {
        ctx.drawImage(sprite, p.x, p.y, p.w, p.h);
      } else {
        ctx.fillStyle = '#F6C900';
        ctx.fillRect(p.x, p.y, p.w, p.h);
      }
    };

    const draw = () => {
      drawBackground();

      state.obstacles.forEach((o) => {
        ctx.save();
        ctx.translate(o.x, o.y);
        ctx.fillStyle = o.color;
        ctx.fillRect(0, 0, o.w, o.h);
        ctx.strokeStyle = '#121212';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, o.w, o.h);
        ctx.fillStyle = '#FFF3D8';
        ctx.font = '900 10px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(o.label, o.w / 2, o.h / 2 + 4);
        ctx.restore();
      });

      drawPlayer();

      if (state.mode === 'idle') {
        ctx.fillStyle = 'rgba(18,18,18,.55)';
        ctx.font = '700 10px Consolas, monospace';
        ctx.textAlign = 'right';
        ctx.fillText('躲开论文 / 夜班 / 考试', W - 18, H - 58);
        ctx.textAlign = 'left';
      }
    };

    const loop = () => {
      if (state.mode !== 'running') return;
      update();
      draw();
      if (state.mode === 'running') window.requestAnimationFrame(loop);
    };

    if (wrap) {
      wrap.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        jump();
      });
      wrap.addEventListener('keydown', (event) => {
        if (event.key === ' ' || event.key === 'ArrowUp') {
          event.preventDefault();
          jump();
        }
      });
    }

    window.addEventListener('keydown', (event) => {
      if (event.key !== ' ' && event.key !== 'ArrowUp') return;
      const rect = wrap.getBoundingClientRect();
      const visible = rect.top < window.innerHeight - 80 && rect.bottom > 80;
      if (!visible) return;
      const tag = document.activeElement && document.activeElement.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      event.preventDefault();
      jump();
    });

    window.addEventListener('resize', sizeCanvas);

    state.player.y = GROUND - state.player.h;
    sizeCanvas();
    resetGame();
  }

  /* ---------------- footer year ---------------- */

  const year = new Date().getFullYear();
  if (year > 2026) {
    const copy = document.querySelector('.footer-bottom span:first-child');
    if (copy) copy.textContent = `© ${year} 中国奶娃医科大学 · 非官方粉丝整活`;
  }
})();
