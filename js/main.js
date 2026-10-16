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
  var revealTargets = document.querySelectorAll('.section-head, .arch, .acc, .card, .flow, .ai-pair, .vs-col, .migrate li, .step');

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

  /* ===== Architecture map ↔ accordion ===== */
  var accItems = document.querySelectorAll('.acc-item');
  var mapTargets = document.querySelectorAll('.arch [data-target]');
  var stacked = window.matchMedia('(max-width: 1100px)');
  var arch = document.querySelector('.arch');
  var nextFrame = document.querySelector('.next-frame');

  function setAccordion(id) {
    accItems.forEach(function (item) {
      var open = item.id === id;
      item.classList.toggle('open', open);
      item.querySelector('.acc-head').setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    mapTargets.forEach(function (el) {
      el.classList.toggle('is-active', el.getAttribute('data-target') === id);
    });
    arch.classList.toggle('has-active', !!id);
    nextFrame.classList.toggle('is-framework', id === 'card-framework');
  }

  function openFromMap(id) {
    setAccordion(id);
    if (stacked.matches) {
      var item = document.getElementById(id);
      if (item) setTimeout(function () { item.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, 200);
    }
  }

  mapTargets.forEach(function (el) {
    var id = el.getAttribute('data-target');
    el.addEventListener('click', function () { openFromMap(id); });
    if (el.getAttribute('role') === 'button') {
      el.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openFromMap(id);
        }
      });
    }
  });

  accItems.forEach(function (item) {
    item.querySelector('.acc-head').addEventListener('click', function () {
      setAccordion(item.classList.contains('open') ? null : item.id);
    });
  });

  /* ===== Login data flow ===== */
  var FLOW = [
    { where: 'front', layers: ['html', 'css'], screen: 'pressed', browserHl: true },
    { where: 'front', layers: ['js'], screen: 'loading', lines: ['f1', 'f2'], link: 'fs', dir: 'fwd', packet: '이메일·비밀번호' },
    { where: 'back', screen: 'loading', lines: ['s1', 's2'], link: 'sd', dir: 'fwd', packet: 'kim@mail.com 조회', db: 'scan' },
    { where: 'db', screen: 'loading', lines: ['s2'], link: 'sd', dir: 'back', packet: '회원 정보', db: 'found' },
    { where: 'back', screen: 'loading', lines: ['s3', 's4', 's5', 's6'] },
    { where: 'back', screen: 'loading', lines: ['s7', 's8'], link: 'fs', dir: 'back', packet: '로그인 성공' },
    { where: 'front', layers: ['js'], screen: 'done', lines: ['f3'], url: 'my-service.com/mypage' }
  ];

  var flowNodes = document.querySelectorAll('.flow-node');
  var layerChips = document.querySelectorAll('.layer-chips span');
  var codeLines = document.querySelectorAll('.flow .ln');
  var browser = document.querySelector('.browser');
  var browserUrl = document.querySelector('.browser-url');
  var flowLinks = document.querySelectorAll('.flow-link');
  var dbTable = document.querySelector('.flow .db-table');
  var dbRows = dbTable.querySelectorAll('tbody tr');
  var stepItems = document.querySelectorAll('.flow-steps li');
  var step = 0;

  function has(list, value) {
    return !!list && list.indexOf(value) !== -1;
  }

  function restart(el, className) {
    el.classList.remove(className);
    void el.offsetWidth;
    el.classList.add(className);
  }

  function renderFlow() {
    var s = FLOW[step];

    flowNodes.forEach(function (node) {
      node.classList.toggle('active', node.getAttribute('data-node') === s.where);
    });
    layerChips.forEach(function (chip) {
      chip.classList.toggle('on', has(s.layers, chip.getAttribute('data-layer')));
    });
    codeLines.forEach(function (line) {
      line.classList.toggle('hl', has(s.lines, line.getAttribute('data-ln')));
    });

    browser.setAttribute('data-screen', s.screen);
    browser.classList.toggle('hl', !!s.browserHl);
    browserUrl.textContent = s.url || 'my-service.com/login';

    flowLinks.forEach(function (link) {
      var packet = link.querySelector('.packet');
      var active = link.getAttribute('data-link') === s.link;
      link.classList.toggle('go-fwd', active && s.dir === 'fwd');
      link.classList.toggle('go-back', active && s.dir === 'back');
      packet.classList.remove('show', 'fwd', 'back');
      if (active) {
        packet.textContent = s.packet;
        packet.classList.add(s.dir);
        restart(packet, 'show');
      }
    });

    dbTable.classList.remove('scan');
    if (s.db === 'scan') restart(dbTable, 'scan');
    dbRows.forEach(function (row) {
      row.classList.toggle('found', s.db === 'found' && row.getAttribute('data-row') === 'kim');
    });

    stepItems.forEach(function (li, i) {
      li.classList.toggle('current', i === step);
      li.classList.toggle('past', i < step);
    });
  }

  stepItems.forEach(function (li, i) {
    li.setAttribute('role', 'button');
    li.setAttribute('tabindex', '0');
    li.addEventListener('click', function () { step = i; renderFlow(); });
    li.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); step = i; renderFlow(); }
      if (e.key === 'ArrowDown' && stepItems[i + 1]) { e.preventDefault(); stepItems[i + 1].focus(); stepItems[i + 1].click(); }
      if (e.key === 'ArrowUp' && stepItems[i - 1]) { e.preventDefault(); stepItems[i - 1].focus(); stepItems[i - 1].click(); }
    });
  });

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

  /* ===== Start checklist ===== */
  var stepEls = document.querySelectorAll('.step');
  var doneCount = document.querySelector('.done-count');
  var totalCount = document.querySelector('.total-count');
  var stepsBar = document.querySelector('.steps-progress .bar span');
  var roadmapLinks = document.querySelectorAll('.roadmap a');
  var saved = {};

  try { saved = JSON.parse(store('steps') || '{}') || {}; } catch (e) { saved = {}; }

  function renderSteps() {
    var done = 0;
    stepEls.forEach(function (step) {
      var checked = step.querySelector('input').checked;
      step.classList.toggle('done', checked);
      if (checked) done++;
    });
    doneCount.textContent = done;
    totalCount.textContent = stepEls.length;
    stepsBar.style.width = (done / stepEls.length) * 100 + '%';

    roadmapLinks.forEach(function (link) {
      var phase = document.querySelector(link.getAttribute('href'));
      var items = phase.querySelectorAll('.step:not(.optional)');
      var allDone = Array.prototype.every.call(items, function (step) { return step.classList.contains('done'); });
      link.classList.toggle('done', allDone);
    });
    return done;
  }

  stepEls.forEach(function (step) {
    var key = step.getAttribute('data-key');
    var input = step.querySelector('input');
    input.checked = !!saved[key];
    input.setAttribute('aria-label', step.querySelector('h4').firstChild.textContent.trim() + ' 완료');
    input.addEventListener('change', function () {
      saved[key] = input.checked;
      store('steps', JSON.stringify(saved));
      var done = renderSteps();
      if (input.checked && done === stepEls.length) showToast('🎉 모든 단계 완료!');
    });
  });

  renderSteps();
})();
