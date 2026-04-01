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
  var rerenderPage = null;

  function applyLocale() {
    document.documentElement.lang = currentLocale;

    var els = document.querySelectorAll('[data-i18n-en]');
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      el.innerHTML = el.getAttribute('data-i18n-' + currentLocale) ||
                     el.getAttribute('data-i18n-en');
    }

    var pageEl = document.querySelector('.routine-page, .weekly-page');
    if (pageEl) {
      var rName = pageEl.getAttribute('data-name-' + currentLocale) ||
                  pageEl.getAttribute('data-name-en');
      var titleSuffix = pageEl.getAttribute('data-title-suffix-' + currentLocale) || '';
      if (rName) {
        document.title = rName + (titleSuffix ? ' \u2014 ' + titleSuffix : '') + ' \u2014 Rutinario';
      }
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
      if (typeof rerenderPage === 'function') rerenderPage();
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
  for (var t = 0; t < truncatedEls.length; t++) {
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
    })(truncatedEls[t]);
  }

  var utils = (function () {
    var DEFAULT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    function startOfDay(date) {
      return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    }

    function addDays(date, days) {
      return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
    }

    function getCurrentWeekMonday(now) {
      var date = startOfDay(now || new Date());
      var day = date.getDay();
      var diff = day === 0 ? -6 : 1 - day;
      return addDays(date, diff);
    }

    function getMondayOnOrAfter(date) {
      var start = startOfDay(date);
      var monday = getCurrentWeekMonday(start);
      return monday < start ? addDays(monday, 7) : monday;
    }

    function getWeekMondayFromOffset(baseMonday, offset) {
      return addDays(baseMonday, offset * 7);
    }

    function getISOWeek(date) {
      var d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
      d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
      var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      var weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
      return d.getUTCFullYear() + '-W' + String(weekNo).padStart(2, '0');
    }

    function parseISOWeek(isoWeek) {
      var match = /^(\d{4})-W(\d{2})$/.exec(isoWeek || '');
      if (!match) return null;
      var year = Number(match[1]);
      var week = Number(match[2]);
      if (!year || week < 1 || week > 53) return null;
      return { year: year, week: week };
    }

    function getMondayFromISOWeek(isoWeek) {
      var parsed = parseISOWeek(isoWeek);
      if (!parsed) return null;
      var jan4 = new Date(parsed.year, 0, 4);
      var weekOneMonday = getCurrentWeekMonday(jan4);
      return addDays(weekOneMonday, (parsed.week - 1) * 7);
    }

    function getWeekOffsetFromISOWeek(baseMonday, isoWeek) {
      var monday = getMondayFromISOWeek(isoWeek);
      if (!monday) return null;
      return Math.round((startOfDay(monday) - startOfDay(baseMonday)) / 604800000);
    }

    function getMonths() {
      var langData = i18nData[currentLocale] || i18nData[FALLBACK] || {};
      return langData.months || DEFAULT_MONTHS;
    }

    function formatWeekLabel(monday, weekText) {
      var months = getMonths();
      var sunday = addDays(monday, 6);
      return weekText + ' ' + monday.getDate() + '/' + months[monday.getMonth()] +
        ' \u2192 ' + sunday.getDate() + '/' + months[sunday.getMonth()];
    }

    function formatShortDate(date) {
      var months = getMonths();
      return date.getDate() + ' ' + months[date.getMonth()];
    }

    function formatMonthLabel(date) {
      var months = getMonths();
      return months[date.getMonth()] + ' ' + date.getFullYear();
    }

    function buildStorageKey(slug, isoWeek) {
      return 'gymlog_' + slug + '_' + isoWeek;
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

    function normalizeProgress(progress) {
      if (!progress || typeof progress !== 'object') return null;
      var total = typeof progress.total === 'number' ? progress.total : null;
      var checked = typeof progress.checked === 'number' ? progress.checked : null;
      var pct = typeof progress.pct === 'number' ? progress.pct : null;
      if (total === null || checked === null || pct === null) return null;
      return {
        total: total,
        checked: checked,
        pct: pct
      };
    }

    function countCheckedItems(items) {
      var count = 0;
      for (var key in items) {
        if (Object.prototype.hasOwnProperty.call(items, key) && items[key]) {
          count++;
        }
      }
      return count;
    }

    function hasCheckedItems(items) {
      return countCheckedItems(items) > 0;
    }

    function getProgress(totalItems, checkedItems, storedProgress) {
      var total = totalItems || 0;
      var checked = checkedItems || 0;
      var stored = normalizeProgress(storedProgress);
      var pct = stored && stored.total === total && stored.checked === checked
        ? stored.pct
        : (total ? Math.round((checked / total) * 100) : 0);

      return {
        total: total,
        checked: checked,
        pct: pct,
        stored: stored
      };
    }

    function resolveStatus(state, progress) {
      var normalizedState = normalizeState(state);
      return {
        hasExcuse: hasCheckedItems(normalizedState.excuses),
        isComplete: progress.total > 0 && progress.checked === progress.total
      };
    }

    function getRecentMonthGroups(baseDate, totalMonths) {
      var groups = [];
      var currentWeekMonday = getCurrentWeekMonday(baseDate);

      for (var monthOffset = 0; monthOffset < totalMonths; monthOffset++) {
        var monthStart = new Date(currentWeekMonday.getFullYear(), currentWeekMonday.getMonth() - monthOffset, 1);
        var monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
        var firstWeekMonday = getMondayOnOrAfter(monthStart);
        var lastWeekMonday = getCurrentWeekMonday(monthEnd);
        var weeks = [];

        for (var monday = firstWeekMonday; monday <= lastWeekMonday && monday <= currentWeekMonday; monday = addDays(monday, 7)) {
          weeks.push({
            slot: weeks.length + 1,
            monday: monday,
            isoWeek: getISOWeek(monday)
          });
        }

        groups.push({
          monthStart: monthStart,
          weeks: weeks
        });
      }

      return groups;
    }

    return {
      buildStorageKey: buildStorageKey,
      countCheckedItems: countCheckedItems,
      formatMonthLabel: formatMonthLabel,
      formatShortDate: formatShortDate,
      formatWeekLabel: formatWeekLabel,
      getCurrentWeekMonday: getCurrentWeekMonday,
      getISOWeek: getISOWeek,
      getProgress: getProgress,
      getRecentMonthGroups: getRecentMonthGroups,
      getWeekMondayFromOffset: getWeekMondayFromOffset,
      getWeekOffsetFromISOWeek: getWeekOffsetFromISOWeek,
      normalizeProgress: normalizeProgress,
      normalizeState: normalizeState,
      resolveStatus: resolveStatus
    };
  })();

  var storage = {
    loadStateForWeek: function (slug, isoWeek) {
      try {
        return utils.normalizeState(JSON.parse(localStorage.getItem(utils.buildStorageKey(slug, isoWeek))));
      } catch (e) {
        return utils.normalizeState(null);
      }
    },
    saveStateForWeek: function (slug, isoWeek, state) {
      localStorage.setItem(utils.buildStorageKey(slug, isoWeek), JSON.stringify(utils.normalizeState(state)));
    },
    loadProgressForWeek: function (slug, isoWeek) {
      try {
        return utils.normalizeProgress(JSON.parse(localStorage.getItem(utils.buildStorageKey(slug, isoWeek) + '_progress')));
      } catch (e) {
        return null;
      }
    },
    saveProgressForWeek: function (slug, isoWeek, progress) {
      localStorage.setItem(utils.buildStorageKey(slug, isoWeek) + '_progress', JSON.stringify(progress));
    },
    getWeekSnapshot: function (slug, isoWeek, totalItems) {
      var state = this.loadStateForWeek(slug, isoWeek);
      var checkedItems = utils.countCheckedItems(state.exercises);
      var progress = utils.getProgress(totalItems, checkedItems, this.loadProgressForWeek(slug, isoWeek));
      return {
        state: state,
        progress: progress,
        status: utils.resolveStatus(state, progress)
      };
    },
    syncProgressForWeek: function (slug, isoWeek, progress) {
      if (!progress.stored ||
          progress.stored.total !== progress.total ||
          progress.stored.checked !== progress.checked ||
          progress.stored.pct !== progress.pct) {
        this.saveProgressForWeek(slug, isoWeek, {
          total: progress.total,
          checked: progress.checked,
          pct: progress.pct
        });
      }
    }
  };

  function applyStatusClasses(el, status) {
    if (!el) return;
    el.classList.toggle('has-excuse', !!status.hasExcuse);
    el.classList.toggle('is-complete', !!status.isComplete);
  }

  function createWeekStore(slug, getISOWeek) {
    return {
      readState: function () {
        return storage.loadStateForWeek(slug, getISOWeek());
      },
      saveState: function (state) {
        storage.saveStateForWeek(slug, getISOWeek(), state);
      },
      getSnapshot: function (totalItems) {
        return storage.getWeekSnapshot(slug, getISOWeek(), totalItems);
      },
      syncProgress: function (progress) {
        storage.syncProgressForWeek(slug, getISOWeek(), progress);
      }
    };
  }

  function initRoutinePage() {
    var routinePage = document.querySelector('.routine-page');
    if (!routinePage) return false;

    var slug = routinePage.dataset.slug;
    var baseMonday = utils.getCurrentWeekMonday(new Date());
    var weekOffset = 0;
    var weekStore = createWeekStore(slug, getCurrentISOWeek);

    var weekLabel = document.querySelector('.week-label');
    var prevBtn = document.querySelector('.week-prev');
    var nextBtn = document.querySelector('.week-next');
    var progressEl = routinePage.querySelector('.routine-progress');
    var checklistItems = routinePage.querySelectorAll('.exercise-item[data-state-group]');
    var exerciseSections = routinePage.querySelectorAll('.exercise-section');
    var collapsibleSection = routinePage.querySelector('.exercise-section[data-collapsible]');
    var collapsibleToggle = collapsibleSection && collapsibleSection.querySelector('.section-header');
    var routineStatus = routinePage.querySelector('.routine-status');

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

    function getCurrentISOWeek() {
      return utils.getISOWeek(utils.getWeekMondayFromOffset(baseMonday, weekOffset));
    }

    function getItemGroup(item) {
      return item.dataset.stateGroup || 'exercises';
    }

    function resolveInitialWeekOffset() {
      var params = new URLSearchParams(window.location.search);
      var requestedWeek = params.get('week');
      if (!requestedWeek) return 0;
      var offset = utils.getWeekOffsetFromISOWeek(baseMonday, requestedWeek);
      if (offset === null || offset > 0) return 0;
      return offset;
    }

    function renderWeekLabel() {
      if (!weekLabel) return;
      var weekText = routinePage.dataset['weekLabel' + (currentLocale === 'es' ? 'Es' : 'En')] || 'Week';
      var monday = utils.getWeekMondayFromOffset(baseMonday, weekOffset);
      weekLabel.textContent = utils.formatWeekLabel(monday, weekText);
    }

    function updateSectionCounters() {
      for (var i = 0; i < exerciseSections.length; i++) {
        var section = exerciseSections[i];
        var items = section.querySelectorAll('.exercise-item[data-state-group="exercises"]');
        var checkedItems = section.querySelectorAll('.exercise-item[data-state-group="exercises"].checked');
        var counter = section.querySelector('.progress-counter');
        if (counter) {
          counter.textContent = checkedItems.length + ' / ' + items.length;
        }
      }
    }

    function updateProgress(snapshot) {
      if (progressEl) {
        weekStore.syncProgress(snapshot.progress);
        progressEl.textContent = snapshot.progress.pct + '%';
      }

      applyStatusClasses(routineStatus, snapshot.status);
    }

    function syncChecklistState(state) {
      var totals = {
        totalItems: 0,
        checkedItems: 0
      };

      for (var i = 0; i < checklistItems.length; i++) {
        var item = checklistItems[i];
        var checkbox = item.querySelector('input[type="checkbox"]');
        var group = getItemGroup(item);
        var checked = !!state[group][item.dataset.key];
        checkbox.checked = checked;
        item.classList.toggle('checked', checked);

        if (group === 'exercises') {
          totals.totalItems++;
          if (checked) totals.checkedItems++;
        }
      }

      return totals;
    }

    function renderRoutinePage() {
      renderWeekLabel();
      if (nextBtn) nextBtn.disabled = weekOffset >= 0;

      var state = weekStore.readState();
      var totals = syncChecklistState(state);
      var snapshot = weekStore.getSnapshot(totals.totalItems);

      updateSectionCounters();
      updateProgress(snapshot);
    }

    weekOffset = resolveInitialWeekOffset();

    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        weekOffset--;
        renderRoutinePage();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        if (weekOffset < 0) {
          weekOffset++;
          renderRoutinePage();
        }
      });
    }

    routinePage.addEventListener('change', function (e) {
      var target = e.target;
      if (!target || target.type !== 'checkbox') return;

      var item = target.closest('.exercise-item[data-state-group]');
      if (!item) return;

      var state = weekStore.readState();
      var group = getItemGroup(item);
      state[group][item.dataset.key] = target.checked;
      weekStore.saveState(state);

      renderRoutinePage();
    });

    rerenderPage = renderRoutinePage;
    renderRoutinePage();
    return true;
  }

  function initWeeklyPage() {
    var weeklyPage = document.querySelector('.weekly-page');
    if (!weeklyPage) return false;

    var slug = weeklyPage.dataset.slug;
    var routineUrl = weeklyPage.dataset.routineUrl;
    var totalExercises = Number(weeklyPage.dataset.totalExercises || 0);
    var monthsContainer = weeklyPage.querySelector('[data-weekly-months]');
    var template = document.getElementById('weekly-month-row-template');

    if (!monthsContainer || !template) return false;

    function renderWeeklyPage() {
      var groups = utils.getRecentMonthGroups(new Date(), 12);
      var currentWeekIso = utils.getISOWeek(new Date());
      var monthPrefix = weeklyPage.getAttribute('data-month-prefix-' + currentLocale) ||
                        weeklyPage.getAttribute('data-month-prefix-en') ||
                        'Weeks';
      monthsContainer.innerHTML = '';

      for (var i = 0; i < groups.length; i++) {
        var group = groups[i];
        var fragment = template.content.cloneNode(true);
        var monthLabel = fragment.querySelector('[data-weekly-month-label]');
        var weekCells = fragment.querySelectorAll('[data-weekly-week]');
        var monthTitle = monthPrefix + ' ' + utils.formatMonthLabel(group.monthStart).toUpperCase();

        if (monthLabel) {
          monthLabel.textContent = monthTitle;
        }

        for (var slotIndex = 0; slotIndex < weekCells.length; slotIndex++) {
          var weekCell = weekCells[slotIndex];
          var weekData = group.weeks[slotIndex];

          if (!weekData) {
            weekCell.classList.add('is-hidden');
            continue;
          }

          var snapshot = storage.getWeekSnapshot(slug, weekData.isoWeek, totalExercises);
          var startEl = weekCell.querySelector('[data-weekly-week-start]');
          var progressEl = weekCell.querySelector('[data-weekly-week-progress]');
          var isCurrentWeek = weekData.isoWeek === currentWeekIso;

          weekCell.href = routineUrl + '?week=' + encodeURIComponent(weekData.isoWeek);
          weekCell.setAttribute('aria-label', monthTitle + ' ' + utils.formatShortDate(weekData.monday) + ' ' + snapshot.progress.pct + '%');
          if (isCurrentWeek) {
            weekCell.setAttribute('aria-current', 'date');
          } else {
            weekCell.removeAttribute('aria-current');
          }
          applyStatusClasses(weekCell, snapshot.status);

          if (startEl) startEl.textContent = utils.formatShortDate(weekData.monday);
          if (progressEl) progressEl.textContent = snapshot.progress.pct + '%';
        }

        monthsContainer.appendChild(fragment);
      }
    }

    rerenderPage = renderWeeklyPage;
    renderWeeklyPage();
    return true;
  }

  initRoutinePage() || initWeeklyPage();

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
})();
