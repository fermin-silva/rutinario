(function () {
  'use strict';

  var I18N_KEY = 'gymlog_locale';
  var SUPPORTED = ['en', 'es'];
  var FALLBACK = 'en';

  var i18nData = {};
  var i18nEl = document.getElementById('i18n-data');
  if (i18nEl) {
    try { i18nData = JSON.parse(i18nEl.textContent); } catch (e) {}
  }

  function getLocale() {
    var stored = localStorage.getItem(I18N_KEY);
    if (stored && SUPPORTED.indexOf(stored) !== -1) return stored;
    var nav = (navigator.language || '').slice(0, 2).toLowerCase();
    return SUPPORTED.indexOf(nav) !== -1 ? nav : FALLBACK;
  }

  function setLocale(loc) {
    localStorage.setItem(I18N_KEY, loc);
  }

  var currentLocale = getLocale();

  function applyLocale() {
    document.documentElement.lang = currentLocale;

    var els = document.querySelectorAll('[data-i18n-en]');
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      el.innerHTML = el.getAttribute('data-i18n-' + currentLocale) ||
                     el.getAttribute('data-i18n-en');
    }

    var rp = document.querySelector('.routine-page');
    if (rp) {
      var rName = rp.getAttribute('data-name-' + currentLocale) ||
                  rp.getAttribute('data-name-en');
      if (rName) document.title = rName + ' \u2014 Rutinario';
    }
  }

  var langSwitch = document.querySelector('.lang-switch');
  if (langSwitch) {
    langSwitch.addEventListener('click', function () {
      currentLocale = currentLocale === 'en' ? 'es' : 'en';
      setLocale(currentLocale);
      applyLocale();
      if (navLinks) {
        navLinks.classList.remove('open');
        if (hamburger) hamburger.setAttribute('aria-expanded', 'false');
      }
      if (typeof renderWeek === 'function') renderWeek();
    });
  }

  var hamburger = document.querySelector('.hamburger');
  var navLinks = document.querySelector('.nav-links');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', function () {
      var open = navLinks.classList.toggle('open');
      hamburger.setAttribute('aria-expanded', open);
    });
  }

  applyLocale();

  var truncatedEls = document.querySelectorAll('.truncated');
  for (var i = 0; i < truncatedEls.length; i++) {
    (function (el) {
      if (el.scrollHeight <= el.offsetHeight + 2) {
        el.classList.add('is-expanded');
        return;
      }
      el.addEventListener('click', function () {
        el.style.maxHeight = el.scrollHeight + 'px';
        el.classList.add('is-expanded');
        el.addEventListener('transitionend', function cleanup() {
          el.style.maxHeight = '';
          el.removeEventListener('transitionend', cleanup);
        });
      });
    })(truncatedEls[i]);
  }

  var routinePage = document.querySelector('.routine-page');
  if (!routinePage) return;

  var slug = routinePage.dataset.slug;
  var weekOffset = 0;

  var weekLabel = document.querySelector('.week-label');
  var prevBtn = document.querySelector('.week-prev');
  var nextBtn = document.querySelector('.week-next');
  var progressEl = routinePage.querySelector('.routine-progress');
  var checklistItems = routinePage.querySelectorAll('.exercise-item[data-state-group]');
  var exerciseSections = routinePage.querySelectorAll('.exercise-section');
  var collapsibleSection = routinePage.querySelector('.exercise-section[data-collapsible]');
  var collapsibleToggle = collapsibleSection && collapsibleSection.querySelector('.section-header');
  var routineStatus = routinePage.querySelector('.routine-status');

  if (!prevBtn || !nextBtn || !weekLabel) return;

  if (collapsibleSection && collapsibleToggle) {
    var collapsibleToggleIcon = collapsibleToggle.querySelector('.section-toggle-icon');

    function updateCollapsibleSection() {
      var collapsed = collapsibleSection.classList.contains('is-collapsed');
      collapsibleToggle.setAttribute('aria-expanded', String(!collapsed));
      if (collapsibleToggleIcon) {
        collapsibleToggleIcon.textContent = collapsed ? '⏷' : '⏶';
      }
    }

    collapsibleToggle.addEventListener('click', function () {
      collapsibleSection.classList.toggle('is-collapsed');
      updateCollapsibleSection();
    });

    updateCollapsibleSection();
  }

  function getMondayOfWeek(offset) {
    var now = new Date();
    var day = now.getDay();
    var diff = day === 0 ? -6 : 1 - day;
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff + offset * 7);
  }

  function getISOWeek(date) {
    var d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    var weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
    return d.getUTCFullYear() + '-W' + String(weekNo).padStart(2, '0');
  }

  function formatWeekLabel(monday) {
    var langData = i18nData[currentLocale] || i18nData[FALLBACK] || {};
    var months = langData.months || ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var weekText = routinePage.dataset['weekLabel' + (currentLocale === 'es' ? 'Es' : 'En')] || 'Week';
    var sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    var monthStart = months[monday.getMonth()];
    var monthEnd = months[sunday.getMonth()];
    return weekText + ' ' + monday.getDate() + '/' + monthStart + ' \u2192 ' + sunday.getDate() + '/' + monthEnd;
  }

  function storageKey() {
    return 'gymlog_' + slug + '_' + getISOWeek(getMondayOfWeek(weekOffset));
  }

  function progressKey() {
    return storageKey() + '_progress';
  }

  function loadState() {
    try {
      return normalizeState(JSON.parse(localStorage.getItem(storageKey())));
    } catch (e) {
      return normalizeState(null);
    }
  }

  function saveState(state) {
    localStorage.setItem(storageKey(), JSON.stringify(normalizeState(state)));
  }

  function normalizeState(state) {
    var normalized = {
      exercises: {},
      excuses: {}
    };

    if (!state || typeof state !== 'object') {
      return normalized;
    }

    var hasNamespaces = Object.prototype.hasOwnProperty.call(state, 'exercises') ||
                        Object.prototype.hasOwnProperty.call(state, 'excuses');

    if (hasNamespaces) {
      if (state.exercises && typeof state.exercises === 'object') {
        normalized.exercises = state.exercises;
      }
      if (state.excuses && typeof state.excuses === 'object') {
        normalized.excuses = state.excuses;
      }
      return normalized;
    }

    for (var key in state) {
      if (Object.prototype.hasOwnProperty.call(state, key)) {
        normalized.exercises[key] = state[key];
      }
    }

    return normalized;
  }

  function getItemGroup(item) {
    return item.dataset.stateGroup || 'exercises';
  }

  function hasCheckedItems(items) {
    for (var key in items) {
      if (Object.prototype.hasOwnProperty.call(items, key) && items[key]) {
        return true;
      }
    }
    return false;
  }

  function loadProgress() {
    try {
      return JSON.parse(localStorage.getItem(progressKey())) || null;
    } catch (e) {
      return null;
    }
  }

  function saveProgress(progress) {
    localStorage.setItem(progressKey(), JSON.stringify(progress));
  }

  window.renderWeek = renderWeek;

  function renderWeek() {
    var monday = getMondayOfWeek(weekOffset);
    weekLabel.textContent = formatWeekLabel(monday);
  }

  function render() {
    renderWeek();
    nextBtn.disabled = weekOffset >= 0;

    var state = loadState();
    var totalItems = 0;
    var checkedItems = 0;

    for (var i = 0; i < checklistItems.length; i++) {
      var item = checklistItems[i];
      var checkbox = item.querySelector('input[type="checkbox"]');
      var group = getItemGroup(item);
      var checked = !!state[group][item.dataset.key];
      checkbox.checked = checked;
      item.classList.toggle('checked', checked);
      if (group === 'exercises') {
        totalItems++;
        if (checked) checkedItems++;
      }
    }

    updateAllProgress(totalItems, checkedItems, state);
  }

  function updateAllProgress(totalItems, checkedCount, state) {
    for (var i = 0; i < exerciseSections.length; i++) {
      var section = exerciseSections[i];
      var items = section.querySelectorAll('.exercise-item[data-state-group="exercises"]');
      var sectionCheckedItems = section.querySelectorAll('.exercise-item[data-state-group="exercises"].checked');
      var counter = section.querySelector('.progress-counter');
      if (counter) {
        counter.textContent = sectionCheckedItems.length + ' / ' + items.length;
      }
    }

    if (routineStatus) {
      routineStatus.classList.toggle('has-excuse', hasCheckedItems(state.excuses));
    }

    if (progressEl) {
      var total = totalItems || 0;
      var checked = checkedCount || 0;
      var stored = loadProgress();
      var pct = stored && stored.total === total && stored.checked === checked && typeof stored.pct === 'number'
        ? stored.pct
        : (total ? Math.round((checked / total) * 100) : 0);
      if (!stored || stored.total !== total || stored.checked !== checked || stored.pct !== pct) {
        saveProgress({
          total: total,
          checked: checked,
          pct: pct
        });
      }
      progressEl.textContent = pct + '%';
      if (routineStatus) {
        routineStatus.classList.toggle('is-complete', total > 0 && checked === total);
      }
    }
  }

  prevBtn.addEventListener('click', function () {
    weekOffset--;
    render();
  });

  nextBtn.addEventListener('click', function () {
    if (weekOffset < 0) {
      weekOffset++;
      render();
    }
  });

  routinePage.addEventListener('change', function (e) {
    var target = e.target;
    if (!target || target.type !== 'checkbox') return;

    var item = target.closest('.exercise-item[data-state-group]');
    if (!item) return;

    var state = loadState();
    var group = getItemGroup(item);
    state[group][item.dataset.key] = target.checked;
    saveState(state);

    render();
  });

  var deferredPrompt = null;
  var installBtn = document.createElement('button');
  installBtn.className = 'install-btn';
  var icon = '<span class="install-icon">&#8615;</span> ';
  installBtn.dataset.i18nEn = icon + (((i18nData.en || {}).install || {}).button || 'Add to Home Screen');
  installBtn.dataset.i18nEs = icon + (((i18nData.es || {}).install || {}).button || 'Add to Home Screen');
  installBtn.innerHTML = installBtn.getAttribute('data-i18n-' + currentLocale);
  document.body.appendChild(installBtn);

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.classList.add('visible');
  });

  installBtn.addEventListener('click', function () {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(function () {
      deferredPrompt = null;
      installBtn.classList.remove('visible');
    });
  });

  window.addEventListener('appinstalled', function () {
    installBtn.classList.remove('visible');
    deferredPrompt = null;
  });

  var isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  var isInStandalone = window.navigator.standalone === true;

  if (isIOS && !isInStandalone) {
    installBtn.classList.add('visible');
    installBtn.addEventListener('click', function () {
      if (navigator.share) {
        navigator.share({ title: document.title, url: window.location.href }).catch(function () {});
      }
      var tip = document.querySelector('.ios-install-tip');
      if (!tip) {
        tip = document.createElement('div');
        tip.className = 'ios-install-tip';
        tip.innerHTML = ((i18nData[currentLocale] || {}).install || {}).ios_hint || '';
        document.body.appendChild(tip);
        setTimeout(function () { if (tip) tip.remove(); }, 5000);
      }
    });
  }

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(function () {});
  }

  render();
})();
