(function () {
  'use strict';
  document.documentElement.classList.add('js');

  var body = document.body;
  var YM_ID = parseInt(body.dataset.ym, 10) || 0;

  // Боевой домен. Только здесь подключаются счётчики и отправляются заявки.
  // В предпросмотре (GitHub Pages, локально) сторонние скрипты не грузятся.
  var isProd = /(^|\.)(xn--80aggm3bh\.xn--p1ai|агерис\.рф)$/i.test(location.hostname);

  // ---------- Счётчики: Метрика, UIS (CoMagic), Botfaqtor, Radist ----------
  // Грузятся после отрисовки страницы: при первом действии посетителя
  // или через ~1,5 с после события load, если посетитель ничего не нажимал.
  function loadScript(src) {
    var s = document.createElement('script');
    s.async = true;
    s.src = src;
    document.head.appendChild(s);
  }
  var countersOn = false;
  function initCounters() {
    if (countersOn || !isProd) return;
    countersOn = true;
    triggers.forEach(function (t) { window.removeEventListener(t, initCounters, opts); });

    // Яндекс Метрика
    if (YM_ID) {
      window.ym = window.ym || function () { (window.ym.a = window.ym.a || []).push(arguments); };
      window.ym.l = 1 * new Date();
      loadScript('https://mc.yandex.ru/metrika/tag.js?id=' + YM_ID);
      window.ym(YM_ID, 'init', {
        ssr: true, webvisor: true, clickmap: true, ecommerce: 'dataLayer',
        referrer: document.referrer, url: location.href,
        accurateTrackBounce: true, trackLinks: true
      });
    }

    // UIS (CoMagic): подмена номера и офлайн-заявки
    loadScript('https://app.comagic.ru/static/cs.min.js?k=ICWycQx6m3NSBe3WlCeDAdAKMTmNhMHC');

    // Botfaqtor: защита рекламы от ботов
    window._ab_id_ = 162675;
    loadScript('https://cdn.botfaqtor.ru/one.js');

    // Radist: номер заявки в ссылках на мессенджеры
    window.radist_tracker = window.radist_tracker || function () {
      (window.radist_tracker.a = window.radist_tracker.a || []).push(arguments);
    };
    window.radist_tracker.l = 1 * new Date();
    loadScript('https://track.radist.me/tracker.min.js');
    window.radist_tracker({
      message: 'Здравствуйте! Появились вопросы по вашим услугам. Номер заявки: {radist_tracker}',
      whatsapp_enabled: true,
      tgbot_enabled: true,
      tg_enabled: true,
      max_enabled: true,
      vk_enabled: true
    });
  }
  var triggers = ['pointerdown', 'keydown', 'touchstart', 'scroll'];
  var opts = { passive: true, capture: true };
  if (isProd) {
    triggers.forEach(function (t) { window.addEventListener(t, initCounters, opts); });
    var idle = function () {
      if ('requestIdleCallback' in window) window.requestIdleCallback(initCounters, { timeout: 2000 });
      else initCounters();
    };
    if (document.readyState === 'complete') setTimeout(idle, 1500);
    else window.addEventListener('load', function () { setTimeout(idle, 1500); });
  }

  // Цели Яндекс Метрики (срабатывают, только если счётчик подключён)
  function goal(name) {
    try { if (window.ym && YM_ID) window.ym(YM_ID, 'reachGoal', name); } catch (e) {}
  }
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-goal]');
    if (el) goal(el.getAttribute('data-goal'));
  });

  // ---------- Шапка: тень после начала прокрутки (без чтения scrollY) ----------
  var header = document.querySelector('.site-header');
  if ('IntersectionObserver' in window) {
    var sentinel = document.createElement('div');
    sentinel.setAttribute('aria-hidden', 'true');
    sentinel.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:9px;pointer-events:none;visibility:hidden';
    body.insertBefore(sentinel, body.firstChild);
    new IntersectionObserver(function (entries) {
      header.classList.toggle('is-scrolled', !entries[0].isIntersecting);
    }).observe(sentinel);
  }

  // ---------- Мобильное меню ----------
  var burger = document.querySelector('.burger');
  var nav = document.getElementById('nav');
  function setMenu(open) {
    nav.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  }
  burger.addEventListener('click', function () { setMenu(!nav.classList.contains('is-open')); });
  nav.addEventListener('click', function (e) { if (e.target.tagName === 'A') setMenu(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

  // ---------- Подсветка пункта меню и плавное появление блоков ----------
  var links = [].slice.call(nav.querySelectorAll('a'));
  var map = {};
  links.forEach(function (a) { var s = document.querySelector(a.getAttribute('href')); if (s) map[s.id] = a; });
  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && map[en.target.id]) {
          links.forEach(function (l) { l.classList.remove('is-active'); });
          map[en.target.id].classList.add('is-active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(map).forEach(function (id) { spy.observe(document.getElementById(id)); });

    var targets = document.querySelectorAll('.section-head, .risk-list li, .ind-card, .pest, .step, .doc-grid li, .case, .review, .stats, .compare, .principles li, .factor-list li, details');
    targets.forEach(function (t) { t.classList.add('reveal'); });
    var rev = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); rev.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    targets.forEach(function (t) { rev.observe(t); });
  }

  // ---------- Окно заявки ----------
  var modal = document.getElementById('modal');
  var lastFocus = null;
  function openModal(topic) {
    lastFocus = document.activeElement;
    var t = modal.querySelector('input[name=topic]');
    t.value = topic || '';
    if (typeof modal.showModal === 'function') modal.showModal(); else modal.setAttribute('open', '');
    var first = modal.querySelector('input[type=text]');
    if (first) setTimeout(function () { first.focus(); }, 30);
  }
  function closeModal() {
    if (typeof modal.close === 'function') modal.close(); else modal.removeAttribute('open');
    if (lastFocus) lastFocus.focus();
  }
  document.addEventListener('click', function (e) {
    var op = e.target.closest('[data-open-form]');
    if (op) { e.preventDefault(); setMenu(false); openModal(op.getAttribute('data-topic')); return; }
    if (e.target.closest('[data-close]')) { closeModal(); return; }
    if (e.target === modal) closeModal();
  });

  // ---------- Маска телефона +7 (___) ___-__-__ ----------
  // Принимает 8 916…, +7 916…, 7916…, 916… и вставку целого номера.
  function nationalDigits(v) {
    v = String(v);
    var d = v.replace(/\D/g, '');
    if (/^\s*\+\s*7/.test(v)) d = d.slice(1); // уже есть +7
    // «8» или «7» перед номером: сразу для 8 9хх и 8 49х, в остальных случаях на 11-й цифре
    if (/^[78](9|49[5-9])/.test(d) || (d.length > 10 && /^[78]/.test(d))) d = d.slice(1);
    return d.slice(0, 10);
  }
  function formatPhone(d) {
    var r = '+7 (' + d.slice(0, 3);
    if (d.length > 3) r += ') ' + d.slice(3, 6);
    if (d.length > 6) r += '-' + d.slice(6, 8);
    if (d.length > 8) r += '-' + d.slice(8, 10);
    return r;
  }
  document.querySelectorAll('input[type=tel]').forEach(function (inp) {
    inp.addEventListener('focus', function () { if (!inp.value) inp.value = '+7 ('; });
    inp.addEventListener('input', function () { inp.value = formatPhone(nationalDigits(inp.value)); });
    inp.addEventListener('blur', function () { if (!nationalDigits(inp.value)) inp.value = ''; });
  });

  // ---------- Формы ----------
  function fieldErr(form, input, msg) {
    var box = form.querySelector('#' + input.getAttribute('aria-describedby'));
    input.classList.toggle('is-invalid', !!msg);
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (box) box.textContent = msg || '';
  }
  function validate(form) {
    var ok = true, firstBad = null;
    var tel = form.querySelector('input[type=tel]');
    var comp = form.querySelector('input[name=text-2]');
    var cons = form.querySelector('input[name=consent]');
    if (nationalDigits(tel.value).length !== 10) { fieldErr(form, tel, 'Укажите телефон полностью, например +7 (495) 123-45-67'); ok = false; firstBad = firstBad || tel; } else fieldErr(form, tel, '');
    if (!comp.value.trim()) { fieldErr(form, comp, 'Укажите название компании'); ok = false; firstBad = firstBad || comp; } else fieldErr(form, comp, '');
    if (!cons.checked) { fieldErr(form, cons, 'Нужно согласие на обработку персональных данных'); ok = false; firstBad = firstBad || cons; } else fieldErr(form, cons, '');
    if (firstBad) firstBad.focus();
    return ok;
  }

  // На агерис.рф заявки уходят в Contact Form 7 (форма №148) через REST API.
  // После успешной отправки: цель Метрики «audit» и офлайн-заявка UIS, как на текущей странице.
  document.querySelectorAll('[data-form]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var status = form.querySelector('.form-status');
      status.className = 'form-status';
      status.textContent = '';
      if (!validate(form)) return;

      if (!isProd) {
        status.className = 'form-status is-info';
        status.textContent = 'Режим предпросмотра: заявка не отправлена. На сайте агерис.рф форма передаёт данные в Contact Form 7.';
        return;
      }

      var btn = form.querySelector('button[type=submit]');
      var label = btn.textContent;
      btn.disabled = true; btn.textContent = 'Отправляем…';

      var fd = new FormData(form);
      var name = String(fd.get('text-1') || '').trim();
      var phone = String(fd.get('tel-1') || '').trim();
      var topic = fd.get('topic');
      if (topic) fd.set('textarea-1', ('Тема: ' + topic + '\n' + (fd.get('textarea-1') || '')).trim());
      fd.delete('topic'); fd.delete('consent');
      fd.append('_wpcf7', '148');
      fd.append('_wpcf7_version', '6.1.4');
      fd.append('_wpcf7_locale', 'ru_RU');
      fd.append('_wpcf7_unit_tag', 'wpcf7-f148-o1');
      fd.append('_wpcf7_container_post', '0');

      fetch(body.dataset.endpoint, { method: 'POST', body: fd, credentials: 'same-origin' })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          if (res.status === 'mail_sent') {
            status.className = 'form-status is-ok';
            status.textContent = 'Спасибо, заявка принята. Перезвоним в рабочее время и согласуем выезд специалиста.';
            form.reset();
            goal('audit');
            try {
              if (window.Comagic && typeof window.Comagic.addOfflineRequest === 'function') {
                window.Comagic.addOfflineRequest({ name: name, phone: phone });
              }
            } catch (err) {}
          } else {
            status.className = 'form-status is-err';
            status.textContent = res.message || 'Не удалось отправить заявку. Позвоните нам: +7 (495) 104-36-01.';
          }
        })
        .catch(function () {
          status.className = 'form-status is-err';
          status.textContent = 'Не удалось отправить заявку. Позвоните нам: +7 (495) 104-36-01.';
        })
        .finally(function () { btn.disabled = false; btn.textContent = label; });
    });
    form.addEventListener('input', function (e) {
      if (e.target.classList.contains('is-invalid')) fieldErr(form, e.target, '');
    });
  });
})();
