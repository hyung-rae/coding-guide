(function () {
  'use strict';

  var root = document.documentElement;

  function store(key, value) {
    try {
      if (value === undefined) return localStorage.getItem(key);
      localStorage.setItem(key, value);
    } catch (e) {
      return null;
    }
  }

  /* ===== Theme toggle ===== */
  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

  function isDark() {
    var theme = root.getAttribute('data-theme');
    return theme ? theme === 'dark' : prefersDark.matches;
  }

  document.querySelector('.theme-toggle').addEventListener('click', function () {
    var next = isDark() ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    store('theme', next);
  });

  /* ===== Toast ===== */
  var toast = document.querySelector('.toast');
  var toastTimer;

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('show'); }, 1600);
  }

  /* ===== Scroll progress + active nav ===== */
  var progressBar = document.querySelector('.scroll-progress span');
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav a'));
  var sections = navLinks.map(function (a) { return document.querySelector(a.getAttribute('href')); });

  function onScroll() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    progressBar.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + '%';

    var current = -1;
    sections.forEach(function (section, i) {
      if (section && section.getBoundingClientRect().top < window.innerHeight * 0.35) current = i;
    });
    navLinks.forEach(function (a, i) { a.classList.toggle('active', i === current); });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ===== Reveal on scroll ===== */
  var revealTargets = document.querySelectorAll('.section-head, .arch, .card, .flow, .compare, .prep-item, .timeline li');

  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    revealTargets.forEach(function (el) {
      el.classList.add('reveal');
      observer.observe(el);
    });
  }

  /* ===== Architecture map → card ===== */
  document.querySelectorAll('[data-target]').forEach(function (button) {
    button.addEventListener('click', function () {
      var card = document.getElementById(button.getAttribute('data-target'));
      if (!card) return;
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      card.classList.remove('flash');
      void card.offsetWidth;
      card.classList.add('flash');
      setTimeout(function () { card.classList.remove('flash'); }, 1800);
    });
  });

  /* ===== Login data flow ===== */
  var FLOW = [
    { node: 'front', packet: '아이디·비밀번호' },
    { node: 'back', packet: '사용자 조회 요청' },
    { node: 'db', packet: '사용자 정보' },
    { node: 'back', packet: '로그인 성공' },
    { node: 'front', packet: '✓ 마이페이지' }
  ];

  var stage = document.querySelector('.flow-stage');
  var packet = document.querySelector('.packet');
  var nodes = {};
  document.querySelectorAll('.flow-node').forEach(function (n) { nodes[n.getAttribute('data-node')] = n; });
  var stepItems = document.querySelectorAll('.flow-steps li');
  var prevBtn = document.querySelector('[data-flow="prev"]');
  var nextBtn = document.querySelector('[data-flow="next"]');
  var playBtn = document.querySelector('[data-flow="play"]');
  var step = 0;
  var playTimer = null;

  function placePacket() {
    var node = nodes[FLOW[step].node];
    var stageRect = stage.getBoundingClientRect();
    var nodeRect = node.getBoundingClientRect();
    var center = nodeRect.left - stageRect.left + nodeRect.width / 2;
    var x = center - packet.offsetWidth / 2;
    x = Math.max(0, Math.min(x, stageRect.width - packet.offsetWidth));
    packet.style.transform = 'translateX(' + x + 'px)';
  }

  function renderFlow() {
    packet.textContent = FLOW[step].packet;
    Object.keys(nodes).forEach(function (key) {
      nodes[key].classList.toggle('active', key === FLOW[step].node);
    });
    stepItems.forEach(function (li, i) {
      li.classList.toggle('current', i === step);
      li.classList.toggle('past', i < step);
    });
    prevBtn.disabled = step === 0;
    nextBtn.disabled = step === FLOW.length - 1;
    placePacket();
  }

  function stopPlay() {
    clearInterval(playTimer);
    playTimer = null;
    playBtn.textContent = '▶ 자동 재생';
  }

  prevBtn.addEventListener('click', function () {
    stopPlay();
    if (step > 0) { step--; renderFlow(); }
  });

  nextBtn.addEventListener('click', function () {
    stopPlay();
    if (step < FLOW.length - 1) { step++; renderFlow(); }
  });

  playBtn.addEventListener('click', function () {
    if (playTimer) { stopPlay(); return; }
    if (step === FLOW.length - 1) { step = 0; renderFlow(); }
    playBtn.textContent = '⏸ 일시 정지';
    playTimer = setInterval(function () {
      if (step >= FLOW.length - 1) { stopPlay(); return; }
      step++;
      renderFlow();
    }, 1500);
  });

  stepItems.forEach(function (li, i) {
    li.style.cursor = 'pointer';
    li.addEventListener('click', function () { stopPlay(); step = i; renderFlow(); });
  });

  window.addEventListener('resize', placePacket);
  renderFlow();

  /* ===== Copy prompt ===== */
  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
  }

  document.querySelectorAll('.copy').forEach(function (button) {
    button.addEventListener('click', function () {
      var text = button.parentElement.querySelector('span').textContent.trim();
      var done = function () { showToast('복사 완료 — 에이전트에게 붙여 넣기'); };
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text); done(); });
      } else {
        fallbackCopy(text);
        done();
      }
    });
  });

  /* ===== Prep checklist ===== */
  var prepItems = document.querySelectorAll('.prep-item');
  var doneCount = document.querySelector('.done-count');
  var totalCount = document.querySelector('.total-count');
  var prepBar = document.querySelector('.prep-progress .bar span');
  var saved = {};

  try { saved = JSON.parse(store('prep') || '{}') || {}; } catch (e) { saved = {}; }

  function renderPrep() {
    var done = 0;
    prepItems.forEach(function (item) {
      var checked = item.querySelector('input').checked;
      item.classList.toggle('done', checked);
      if (checked) done++;
    });
    doneCount.textContent = done;
    totalCount.textContent = prepItems.length;
    prepBar.style.width = (done / prepItems.length) * 100 + '%';
  }

  prepItems.forEach(function (item) {
    var key = item.getAttribute('data-key');
    var input = item.querySelector('input');
    input.checked = !!saved[key];
    input.setAttribute('aria-label', item.querySelector('h3').firstChild.textContent.trim() + ' 준비 완료');
    input.addEventListener('change', function () {
      saved[key] = input.checked;
      store('prep', JSON.stringify(saved));
      renderPrep();
      if (input.checked && Object.keys(saved).filter(function (k) { return saved[k]; }).length === prepItems.length) {
        showToast('🎉 준비 완료! 이제 시작하기로');
      }
    });
  });

  renderPrep();
})();
