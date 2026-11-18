(() => {
  const answerForm = document.getElementById('answerForm');
  const answerInput = document.getElementById('answerInput');
  const feedback = document.getElementById('feedback');
  const announcer = document.getElementById('announcer');

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  const andi = new Audio('assets/audio/andi.mp3');
  andi.preload = 'auto';
  andi.volume = 0.9;

  let andiCtx = null;
  let andiBuffer = null;

  const loadAndi = async () => {
    if (!andiCtx) return;
    try {
      const response = await fetch('assets/audio/andi.mp3');
      const data = await response.arrayBuffer();
      andiBuffer = await andiCtx.decodeAudioData(data);
    } catch (error) {
      // HTMLAudio fallback
    }
  };

  if (AudioContextClass) {
    try {
      andiCtx = new AudioContextClass();
      loadAndi();
    } catch (error) {
      andiCtx = null;
    }
  }

  const playAndiHtml = () => {
    try {
      andi.currentTime = 0;
      const promise = andi.play();
      if (promise) promise.catch(() => {});
    } catch (error) {
      // 浏览器拦截时仍继续返回
    }
  };

  const playAndi = () => {
    if (andiCtx && andiBuffer) {
      andiCtx.resume().then(() => {
        const source = andiCtx.createBufferSource();
        source.buffer = andiBuffer;
        source.connect(andiCtx.destination);
        source.start(0);
      }).catch(playAndiHtml);
    } else {
      playAndiHtml();
    }
  };

  let locked = false;

  const setFeedback = (text, kind) => {
    feedback.textContent = text;
    feedback.classList.remove('is-ok', 'is-wrong');
    if (kind) feedback.classList.add(kind);
  };

  const returnTo = (url, delay) => {
    window.setTimeout(() => { window.location.href = url; }, delay);
  };

  answerForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (locked) return;

    const value = answerInput.value.trim();
    const normalized = value
      .replace(/[\s，。！？、,.!?·—\-_]/g, '')
      .toLowerCase();

    if (!normalized) {
      setFeedback('先写一个答案。时间门不猜。', 'is-wrong');
      answerInput.focus();
      return;
    }

    const hasNaiwa = normalized.includes('奶龙') || normalized.includes('奶娃');
    const isStitch = normalized.includes('史迪奇') || normalized.includes('stitch') || normalized.includes('626');

    if (hasNaiwa) {
      locked = true;
      setFeedback('回答正确。安迪！时间门记住了你。', 'is-ok');
      announcer.textContent = '回答正确，正在返回主界面。';
      playAndi();
      answerInput.disabled = true;
      answerForm.querySelector('button').disabled = true;
      returnTo('index.html', 1750);
      return;
    }

    if (isStitch) {
      locked = true;
      setFeedback('史迪奇也算可爱。不过时间门更想听奶龙或奶娃。', 'is-ok');
      announcer.textContent = '史迪奇被接受了，正在返回主界面。';
      answerInput.disabled = true;
      answerForm.querySelector('button').disabled = true;
      returnTo('index.html', 1750);
      return;
    }

    locked = true;
    setFeedback('打错了。时间把你退回来了。', 'is-wrong');
    announcer.textContent = '答案错误，正在返回时间门。';
    answerInput.disabled = true;
    answerForm.querySelector('button').disabled = true;
    returnTo('clock.html', 1550);
  });
})();
