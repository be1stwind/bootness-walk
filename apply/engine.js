/* 부트니스 신청 폼 엔진 — 2026-09-12 뚝딱이 · MacminiM4
 *
 * 폼 하나 = apply/<폴더>/config.js 하나(window.FORM). 이 파일과 engine.css 는 모든 폼이 같이 쓴다.
 * 문항을 바꾸려면 config.js 만 고친다. 여기를 고치면 모든 신청 페이지가 같이 바뀐다.
 *
 * 되는 것
 *  - 여러 쪽(pages) · 쪽마다 확인하고 넘어감
 *  - 조건부 문항(showIf) · 조건부 필수(requiredIf) · 답에 따라 바뀌는 안내(info 의 html 을 함수로)
 *  - 멈춤 조건(stopIf) — 예: 멤버십 + 온라인이면 신청 없이 안내 화면. 고르는 순간 바로 본다
 *  - 유입경로: 링크 ?src=코드 (Tally 시절 ?utm_source= 도 받는다). 문항이 있으면 미리 고르고, 없으면 숨겨서 보낸다
 *  - 휴대폰: 숫자만 남기기 · 두 번 적기(mustEqual) 또는 한 번 적고 크게 보여 주기(confirmLine)
 *  - 마감: 페이지가 마감 화면을 띄우고, 서버(신청폼_백엔드.gs)도 따로 막는다
 *  - 미리보기(시트에 아무것도 안 적힌다): ?preview=done|stop|closed 는 그 끝 화면을 바로 띄운다. &member=예 처럼 답을 붙이면 그 답으로.
 *    ?preview=1 은 처음부터 끝까지 써 볼 수 있고, 제출해도 서버로 보내지 않는다
 *  - 신청번호: 서버가 만들어 돌려준다(j.id). 끝 화면 설정이 함수면 두 번째 인자 res.id 로 받는다
 *
 * 오래된 안드로이드 카톡 웹뷰를 위해 ?. 와 ?? 는 쓰지 않는다.
 */
(function () {
  'use strict';
  var F = window.FORM;
  var app = document.getElementById('app');
  if (!F || !app) { if (app) app.innerHTML = '<p class="loaderr">신청서를 불러오지 못했어요. 새로고침해 주세요.</p>'; return; }

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var A = {};                                                   // 지금까지의 답
  function call(v) { return typeof v === 'function' ? v(A) : v; }
  function fmtPhone(v) { return String(v).replace(/^(\d{3})(\d{3,4})(\d{4})$/, '$1-$2-$3'); }
  var PHONE_RE = /^01\d{8,9}$/;

  var SOURCES = F.sources || [
    { label: '부트니스 카페', code: 'cafe' }, { label: '네이버 블로그', code: 'blog' },
    { label: '인스타그램', code: 'insta' }, { label: '스레드', code: 'threads' },
    { label: '유튜브', code: 'youtube' }, { label: '카카오톡 오픈채팅방', code: 'kakaoopen' },
    { label: '부트니스에서 보낸 카카오톡·문자', code: 'db' }, { label: '인스타·페이스북 광고', code: 'meta' },
    { label: '지인 추천', code: 'ref' }, { label: '기타', code: 'direct' }
  ];

  /* 쪽·문항 정리 — 설정에서 null 로 뺀 문항(스위치가 꺼진 것)은 버린다 */
  var PAGES = (F.pages || [{ fields: F.fields || [] }]).map(function (p) {
    return { title: p.title || '', fields: (p.fields || []).filter(function (x) { return x; }) };
  });
  var FIELDS = [], byKey = {}, infoN = 0;
  PAGES.forEach(function (p, i) {
    p.fields.forEach(function (fd) {
      if (!fd.key) fd.key = 'info' + (++infoN);
      fd._page = i; FIELDS.push(fd); byKey[fd.key] = fd;
    });
  });
  var cur = 0, sending = false;
  var qs = new URLSearchParams(location.search);
  var PREVIEW = (qs.get('preview') || '').toLowerCase();            // 미리보기 — 서버로 아무것도 보내지 않는다
  var JUMP = ['done', 'stop', 'closed'].indexOf(PREVIEW) >= 0 ? PREVIEW : '';

  document.documentElement.style.setProperty('--accent', F.accent || '#383839');
  document.title = F.docTitle || (F.title + ' · 신청 · 부트니스');

  /* ── 그리기 ─────────────────────────────────────────────────────────── */
  function defaultErr(fd) {
    if (fd.type === 'tel') return '휴대폰 번호를 숫자로만 적어 주세요 (예: 01012345678)';
    if (fd.type === 'email') return '이메일 주소를 다시 확인해 주세요';
    if (fd.type === 'choice' || fd.type === 'source') return '하나를 골라 주세요';
    if (fd.type === 'multi') return '하나 이상 골라 주세요';
    if (fd.type === 'consent' || fd.type === 'ack') return '확인하고 체크해 주세요';
    return '적어 주세요';
  }
  function options(fd) {
    if (fd.type === 'source') return SOURCES.map(function (s) { return { label: s.label, value: s.code }; });
    return (call(fd.options) || []).map(function (o) { return typeof o === 'string' ? { label: o, value: o } : o; });
  }
  function tag(fd) { return '<span data-tag="' + fd.key + '"></span>'; }
  function lab(fd) { return '<span data-label="' + fd.key + '">' + (call(fd.label) || '') + '</span>'; }   // label 이 함수면 refresh 가 다시 쓴다
  function errP(fd, style) { return '<p class="err"' + (style ? ' style="' + style + '"' : '') + '>' + esc(fd.err || defaultErr(fd)) + '</p>'; }

  function fieldHTML(fd) {
    var k = fd.key, id = 'f_' + k;
    var hint = fd.hint ? '<span class="hint">' + fd.hint + '</span>' : '';
    var open = '<div class="q' + (fd.type === 'info' ? ' info' : '') + '" data-k="' + k + '">';
    switch (fd.type) {
      case 'info':
        return open + '<div class="infobox' + (fd.warn ? ' warn' : '') + '" data-html="' + k + '"></div></div>';
      case 'text': case 'tel': case 'email':
        return open + '<label for="' + id + '">' + lab(fd) + tag(fd) + '</label>' + hint +
          '<input type="' + fd.type + '" id="' + id + '" data-key="' + k + '"' +
          (fd.type === 'tel' ? ' inputmode="numeric" maxlength="13"' : ' maxlength="' + (fd.maxlength || 80) + '"') +
          (fd.autocomplete ? ' autocomplete="' + fd.autocomplete + '"' : '') +
          (fd.placeholder ? ' placeholder="' + esc(fd.placeholder) + '"' : '') + '>' +
          (fd.confirmLine ? '<p class="confirm" data-confirm="' + k + '"></p>' : '') + errP(fd) + '</div>';
      case 'textarea':
        return open + '<label for="' + id + '">' + lab(fd) + tag(fd) + '</label>' + hint +
          '<textarea id="' + id + '" data-key="' + k + '" rows="3" maxlength="' + (fd.maxlength || 500) + '"></textarea>' + errP(fd) + '</div>';
      case 'choice': case 'source': case 'multi':
        var t = fd.type === 'multi' ? 'checkbox' : 'radio';
        return open + '<span class="lbl" id="l_' + k + '">' + lab(fd) + tag(fd) + '</span>' + hint +
          (fd.type === 'source' ? '<p class="picked" data-picked="' + k + '"></p>' : '') +
          '<div class="chips" role="' + (t === 'radio' ? 'radiogroup' : 'group') + '" aria-labelledby="l_' + k + '">' +
          options(fd).map(function (o) {
            return '<label class="chip"><input type="' + t + '" name="' + k + '" value="' + esc(o.value) + '" data-key="' + k + '"><span>' + esc(o.label) + '</span></label>';
          }).join('') + '</div>' + errP(fd) + '</div>';
      case 'ack':
        return open + '<span class="lbl">' + lab(fd) + tag(fd) + '</span>' + hint +
          '<div class="chips"><label class="chip"><input type="checkbox" data-key="' + k + '"><span>' + esc(fd.checkLabel || '예') + '</span></label></div>' + errP(fd) + '</div>';
      case 'consent':
        var note = !fd.notice ? '' : (Object.prototype.toString.call(fd.notice) === '[object Array]'
          ? '<dl class="agree-note">' + fd.notice.map(function (r) { return '<div><dt>' + esc(r[0]) + '</dt> <dd>' + esc(r[1]) + '</dd></div>'; }).join('') + '</dl>'
          : '<p class="agree-note">' + fd.notice + '</p>');
        return open + (fd.question ? '<span class="lbl">' + fd.question + tag(fd) + '</span>' : '') +
          '<label class="consent" for="' + id + '"><input type="checkbox" id="' + id + '" data-key="' + k + '"><span><b>' + lab(fd) + '</b>' +
          (fd.question ? '' : tag(fd)) + '</span></label>' + note + errP(fd, 'margin-left:32px') + '</div>';
    }
    return '';
  }

  var BANNER = call(F.banner);
  app.innerHTML =
    (PREVIEW ? '<p class="preview-strip">미리보기 화면이에요. 여기서 낸 신청은 접수되지 않아요.</p>' : '') +
    '<header class="hero"><div class="band" aria-hidden="true"></div><div class="in">' +
      (F.eyebrow ? '<p class="eyebrow">' + esc(F.eyebrow) + '</p>' : '') +
      '<h1>' + esc(F.title) + '</h1>' +
      (call(F.heroLines) || []).map(function (l) { return '<p class="meta">' + l + '</p>'; }).join('') +
    '</div></header>' +
    (BANNER ? '<div class="lead-box" id="leadBox">' + BANNER + '</div>' : '') +
    '<form id="f" class="card" novalidate>' +
      '<div id="steps"></div>' +
      FIELDS.map(fieldHTML).join('') +
      '<div class="hp" aria-hidden="true"><label>웹사이트<input type="text" id="website" tabindex="-1" autocomplete="off"></label></div>' +
      '<p class="formerr" id="formErr" role="alert"></p>' +
      '<div class="nav"><button type="button" class="back" id="back">이전</button><button type="submit" class="submit" id="go">다음</button></div>' +
    '</form>' +
    '<section class="end" id="done" hidden></section>' +
    '<section class="end" id="closed" hidden></section>' +
    '<section class="end" id="stop" hidden></section>' +
    '<p class="foot">부트니스 · BOOTNESS</p>';

  var form = document.getElementById('f'), back = document.getElementById('back'), go = document.getElementById('go');

  /* ── 답 읽기 ────────────────────────────────────────────────────────── */
  function readField(fd) {
    var k = fd.key;
    if (fd.type === 'info') return;
    var els = app.querySelectorAll('[data-key="' + k + '"]');
    var list = Array.prototype.slice.call(els);
    if (fd.type === 'multi') A[k] = list.filter(function (e) { return e.checked; }).map(function (e) { return e.value; });
    else if (fd.type === 'choice' || fd.type === 'source') { var c = list.filter(function (e) { return e.checked; })[0]; A[k] = c ? c.value : ''; }
    else if (fd.type === 'consent') A[k] = !!(list[0] && list[0].checked);
    else if (fd.type === 'ack') A[k] = list[0] && list[0].checked ? (fd.checkValue || fd.checkLabel || '예') : '';
    else if (fd.type === 'tel') A[k] = list[0] ? list[0].value.replace(/\D/g, '') : '';
    else A[k] = list[0] ? list[0].value.trim() : '';
  }
  function visible(fd) { return !fd.showIf || !!fd.showIf(A); }
  function required(fd) { return !!(fd.required || (fd.requiredIf && fd.requiredIf(A))); }

  /* ── 다시 그리기: 보이는 문항·필수 표시·답에 따라 바뀌는 안내 ────────────── */
  function refresh() {
    var lastVis = null;
    FIELDS.forEach(function (fd) {
      var q = app.querySelector('.q[data-k="' + fd.key + '"]'); if (!q) return;
      var on = fd._page === cur && visible(fd);
      if (fd.type === 'info') {
        var html = on ? call(fd.html) : '';
        app.querySelector('[data-html="' + fd.key + '"]').innerHTML = html || '';
        on = on && !!html;
      }
      q.hidden = !on;
      q.classList.remove('last-vis');
      if (on && fd.type !== 'info') lastVis = q;
      var t = app.querySelector('[data-tag="' + fd.key + '"]');
      if (t) { var r = required(fd); t.className = r ? 'req' : 'opt'; t.textContent = r ? '*' : '선택'; }
      if (typeof fd.label === 'function') { var le = app.querySelector('[data-label="' + fd.key + '"]'); if (le) le.innerHTML = call(fd.label) || ''; }
      if (fd.confirmLine) {
        var cf = app.querySelector('[data-confirm="' + fd.key + '"]'), v = A[fd.key] || '';
        cf.textContent = PHONE_RE.test(v) ? '이 번호로 안내가 갑니다: ' + fmtPhone(v) : '';
      }
    });
    if (lastVis) lastVis.classList.add('last-vis');
  }
  function stepsRender() {
    var s = document.getElementById('steps');
    if (PAGES.length < 2) { s.innerHTML = ''; return; }
    s.innerHTML = '<div class="steps"><span><b>' + (cur + 1) + '</b> / ' + PAGES.length + '</span><div class="bar"><i style="width:' +
      Math.round((cur + 1) / PAGES.length * 100) + '%"></i></div></div>' +
      (PAGES[cur].title ? '<h2 class="pagetitle">' + esc(PAGES[cur].title) + '</h2>' : '');
  }
  function setErr(m) { var e = document.getElementById('formErr'); e.textContent = m || ''; e.style.display = m ? 'block' : 'none'; }
  function showPage() {
    refresh(); stepsRender(); setErr('');
    back.hidden = cur === 0;
    go.textContent = cur === PAGES.length - 1 ? (F.submitLabel || '신청하기') : '다음';
    window.scrollTo(0, 0);
  }

  /* ── 확인 ───────────────────────────────────────────────────────────── */
  function validatePage() {
    var first = null;
    FIELDS.forEach(function (fd) {
      if (fd._page !== cur || fd.type === 'info') return;
      var q = app.querySelector('.q[data-k="' + fd.key + '"]'); if (!q) return;
      var bad = false;
      if (visible(fd)) {
        var v = A[fd.key];
        var empty = v == null || v === '' || v === false || (Object.prototype.toString.call(v) === '[object Array]' && !v.length);
        if (required(fd) && empty) bad = true;
        else if (!empty && fd.type === 'tel' && !PHONE_RE.test(v)) bad = true;
        else if (!empty && fd.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) bad = true;
        else if (!empty && fd.pattern && !new RegExp(fd.pattern).test(v)) bad = true;
        else if (fd.mustEqual && v !== A[fd.mustEqual]) bad = true;
      }
      q.classList.toggle('bad', bad);
      if (bad && !first) first = q;
    });
    if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return !first;
  }

  /* ── 끝 화면 (done · closed · stop) ────────────────────────────────── */
  function endButton(b) {
    if (!b) return '';
    if (b.restart) return '<button type="button" class="endbtn" data-restart="1">' + esc(b.label) + '</button>';   // 답을 비우고 1쪽으로
    return '<a class="endbtn" href="' + esc(b.href) + '"' + (b.sameTab ? '' : ' target="_blank" rel="noopener"') + '>' + esc(b.label) + '</a>';
  }
  function showEnd(kind) {
    form.hidden = !!kind;
    ['done', 'closed', 'stop'].forEach(function (x) { document.getElementById(x).hidden = x !== kind; });
    var lb = document.getElementById('leadBox'); if (lb) lb.hidden = !!kind;   // 맨 위 강조 상자는 신청서를 쓰는 동안만
  }
  function end(kind, res) {
    var c = F[kind] || {}; if (typeof c === 'function') c = c(A, res || {}) || {};
    var s = document.getElementById(kind);
    s.innerHTML = '<h2>' + esc(call(c.title) || '') + '</h2>' +
      (c.html ? '<p>' + call(c.html) + '</p>' : '') + endButton(c.button) +
      (c.tail ? '<p>' + call(c.tail) + '</p>' : '');
    showEnd(kind);
    window.scrollTo(0, 0);
  }
  /* 「처음으로」 — 답을 모두 비우고 1쪽부터. 링크의 유입경로는 다시 채운다 */
  function restart() {
    form.reset();
    Array.prototype.forEach.call(app.querySelectorAll('.q.bad'), function (q) { q.classList.remove('bad'); });
    applyLink();
    FIELDS.forEach(readField);
    cur = 0; showEnd('');
    showPage();
  }
  function closedNow() { return !!F.deadline && Date.now() > new Date(F.deadline).getTime(); }

  /* ── 보내기 ─────────────────────────────────────────────────────────── */
  function agreed(k) { var fd = byKey[k]; return !!fd && visible(fd) && A[k] === true; }   // 숨은 동의 칸(예: 회원)은 체크가 남아 있어도 안 보낸다
  function send() {
    if (PREVIEW) { end('done', { ok: true, id: F.previewId || 'PREVIEW', preview: true }); return; }   // 미리보기 — 보내지 않는다
    if (!F.endpoint) { setErr('신청 받기를 준비하고 있어요. 조금 뒤에 다시 와 주세요.'); return; }
    var answers = {};
    FIELDS.forEach(function (fd) {
      if (fd.type === 'info' || fd.type === 'consent' || fd.noSubmit || !visible(fd)) return;
      answers[fd.key] = A[fd.key];
    });
    if (!byKey.src) answers.src = LINK.src;                    // 문항이 없으면 링크 값만 숨겨서 보낸다
    if (!byKey.ref && LINK.ref) answers.ref = LINK.ref;
    if (F.computed) { var extra = F.computed(A); for (var x in extra) answers[x] = extra[x]; }
    var body = {
      form: F.formId, answers: answers,
      consentPrivacy: agreed('privacy'), consentMarketing: agreed('marketing'),
      website: document.getElementById('website').value
    };
    sending = true; go.disabled = true; go.textContent = '보내는 중…';
    // text/plain 으로 보내야 브라우저가 사전 확인(preflight) 없이 바로 보낸다 — 다이어리 백엔드와 같은 방식
    fetch(F.endpoint, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (j && j.ok) { end('done', j); return; }
        if (j && j.error === 'closed') { end('closed'); return; }
        throw new Error((j && j.error) || 'fail');
      })
      .catch(function () { setErr('잠깐 연결이 불안정해요. 다시 눌러 주세요.'); })
      .then(function () { sending = false; go.disabled = false; go.textContent = F.submitLabel || '신청하기'; });
  }

  function next() {
    if (sending) return;
    if (!PREVIEW && closedNow()) { end('closed'); return; }
    FIELDS.forEach(function (fd) { if (fd._page === cur) readField(fd); });
    if (!validatePage()) return;
    if (F.stopIf && F.stopIf(A)) { end('stop'); return; }
    if (cur < PAGES.length - 1) { cur++; showPage(); return; }
    send();
  }

  /* ── 이벤트 ─────────────────────────────────────────────────────────── */
  function onChange(e) {
    var k = e.target.getAttribute('data-key'); if (!k) return;
    var fd = byKey[k];
    if (fd.type === 'tel') e.target.value = e.target.value.replace(/[^\d]/g, '').slice(0, 11);
    if (fd.upper && e.target.value !== e.target.value.toUpperCase()) e.target.value = e.target.value.toUpperCase();
    readField(fd);
    var q = e.target.closest('.q'); if (q) q.classList.remove('bad');
    if (fd.type === 'source') { var pk = app.querySelector('[data-picked="' + k + '"]'); if (pk) pk.style.display = 'none'; }
    refresh();
    if (F.stopIf && F.stopIf(A)) end('stop');                    // 고르는 순간 — 나머지 칸을 쓰기 전에 멈춤 화면으로
  }
  app.addEventListener('input', onChange);
  app.addEventListener('change', onChange);
  back.addEventListener('click', function () { if (cur > 0) { cur--; showPage(); } });
  form.addEventListener('submit', function (e) { e.preventDefault(); next(); });
  app.addEventListener('click', function (e) { var t = e.target.closest ? e.target.closest('[data-restart]') : null; if (t) restart(); });

  /* ── 링크에서 유입경로 ──────────────────────────────────────────────── */
  var raw = (qs.get('src') || qs.get('utm_source') || '').trim(), LINK = { src: '', ref: '' };
  if (/^ref_/i.test(raw)) { LINK.ref = raw.slice(4); raw = 'ref'; }
  if (SOURCES.some(function (s) { return s.code === raw.toLowerCase(); })) LINK.src = raw.toLowerCase();
  function applyLink() {
    if (byKey.src && LINK.src) {
      var r = app.querySelector('input[data-key="src"][value="' + LINK.src + '"]');
      if (r) r.checked = true;
      var hit = SOURCES.filter(function (s) { return s.code === LINK.src; })[0];
      var pk = app.querySelector('[data-picked="src"]');
      if (pk && hit) { pk.textContent = '「' + hit.label + '」에서 오셨군요 — 맞지 않으면 다시 골라 주세요'; pk.style.display = 'block'; }
    }
    if (byKey.ref && LINK.ref) { var re = app.querySelector('input[data-key="ref"]'); if (re) re.value = LINK.ref; }
  }
  applyLink();

  FIELDS.forEach(readField);
  if (JUMP) {
    /* 미리보기로 끝 화면 바로 보기 — ?preview=done&member=예 처럼 붙인 답을 그 화면에 넘긴다 */
    FIELDS.forEach(function (fd) { if (qs.has(fd.key)) A[fd.key] = qs.get(fd.key); });
    end(JUMP, { ok: true, id: F.previewId || 'PREVIEW', preview: true });
  } else if (!PREVIEW && closedNow()) end('closed');
  else showPage();

  window.__FORM_DEBUG = { A: A, next: next, end: end, refresh: refresh, restart: restart, go: function (p) { cur = p; showPage(); } };   // 시험용
})();
