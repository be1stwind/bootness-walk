/* 9월 정기특강 신청 — 설정
   설계: 03_01_정기특강_신청페이지_설계.md · 문구: Tally 폼 mOx9Wp 블록 65개 원문 (2026-09-12 읽음)
   ▣ 회차마다 바꾸는 곳은 맨 위 「회차」 한 덩어리뿐이다. 다음 달엔 이 폴더를 복사해 그것만 바꾼다.
   ▣ 「스위치」 여섯 개는 설계 문서 2장의 바꿀 점이다. ⑥만 켜 두었다(9/12 오너 결정). 나머지는 꺼져 있어 Tally 와 똑같이 동작.
   ▣ 카드 결제(그로블, 2026-09-12 오너 지시): 결제 링크 칸이 **비어 있으면 그 사람은 지금처럼 계좌 입금 안내**를 본다.
     링크가 있으면 3쪽에서 계좌·현금영수증·입금자명이 사라지고, 신청서를 낸 뒤 「수강료 결제하기」로 그로블 결제창에 간다.
     결제창 주소 뒤에 ?ref=<신청번호> 가 붙고, 그 값이 그로블 웹훅 sellerReference 로 돌아와 시트 「신청번호」와 이어진다.
   ▣ 멤버십 회원은 개인정보 동의 체크 없이 안내 한 줄만 본다(9/12 오너 결정). 시트 동의 칸에는 서버가 「회원(계약 이행)」으로 적는다.
   ▣ 비회원은 3쪽에서 [카드로 결제] / [계좌로 입금] 을 고른다(9/12 오너). 금액은 「회차」의 cardAmountNonmember ·
     transferAmountNonmember · receiptSurcharge 세 칸 — 오너 결정이 오면 여기만 바꾼다.
   ▣ 미리보기(시트에 아무것도 안 적힌다)
       ?preview=done&member=아니오&payWith=카드  비회원 카드 끝 화면(결제 버튼)
       ?preview=done&member=아니오&payWith=계좌  비회원 계좌 끝 화면      ?preview=done&member=예  회원 끝 화면
       ?preview=stop  멤버십·온라인 멈춤 화면      ?preview=1  처음부터 끝까지 써 보기(제출해도 안 보낸다) */

var 회차 = {
  formId:   'lecture2609',                          // 백엔드 FORMS 키 → 「정기특강_신청명단」 시트의 탭 「2609_전해청」
  endpoint: 'https://script.google.com/macros/s/AKfycbxjd7-hFlao-hi2A-kB4Rg1OC1NbCBneBieqWA9lCkKUWk3c1Gv7D3hNlpKf6VloYnF/exec',                                     // ⬜ Apps Script /exec 주소 (인생업 무료특강과 같은 주소)
  title:    '전해청 변호사님의 9월 정기특강',          // ⬜ 정식 제목이 정해지면 '전해청 변호사님의 『제목』' 으로
  when:     '9월 19일 (토) 오후 3시 ~ 6시',
  place:    '',                                     // ⬜ 예: '강남 10번 출구 라이지움'. 비어 있으면 「📍 장소」 줄이 안 보인다(9/12)
  placeUrl: '',                                     // ⬜ 지도 링크 (naver.me/…)
  online:   true,                                   // ⬜ 온라인 라이브 동시 진행이면 true, 오프라인만이면 false
  replay:   '온오프라인 참여자 모두 다시보기 3일간 제공됩니다.',   // ⬜ 온라인일 때만 보인다
  feeMember: 10000,                                 // 계좌 입금 — 멤버십 회원 (강의실 비용). 회원은 계좌 입금으로 간다(9/12 오너 결정)
  /* 카드 결제 — 그로블 결제 링크. 상품 하나에 가격이 하나라 회원·비회원 링크가 따로다. 비워 두면 계좌 입금 */
  payUrlNonmember: 'https://groble.im/payment/nSC2PJ', // 그로블 상품 nSC2PJ (55,000원) — 판매 시작은 오너 샘플 확인 뒤
  /* 비회원 금액 — 3쪽에서 고른 방법대로 안내하고 시트 「안내금액」에 적는다. ⬜ 오너 결정이 오면 바꾼다 */
  cardAmountNonmember: 55000,                       // 카드 결제(그로블) — 부가세 포함. 그로블 상품 가격과 같아야 한다
  transferAmountNonmember: 50000,                   // 계좌 입금
  receiptSurcharge: 0.1,                            // 현금영수증을 고르면 더하는 비율(0.1 = 10%). 0 이면 현금영수증 칸만 받고 금액은 그대로
  payUrlMember: '',                                 // 비워 둠 = 회원은 계좌 10,000원 (9/12 오너 결정)
  payAmountMember: null,
  deadline: '2026-09-19T12:00:00+09:00',            // 9/19(토) 낮 12시 (9/12 오너 결정). 백엔드 FORMS.lecture2609.deadline · 그로블 판매 마감과 같다
  deadlineText: '9월 19일(토) 낮 12시까지 신청 가능합니다.', // deadline 과 같은 말이어야 한다
  previewId: 'RL2609-SAMPLE00',                     // 미리보기 끝 화면에 쓰는 샘플 신청번호 (진짜 번호는 서버가 RL2609-XXXXXXXX 로 만든다)
  account:  '카카오뱅크 3333-17-0228060 · 예금주 이진규',
  kakaoChannel: 'https://pf.kakao.com/_xmHxgNT'
};

var 스위치 = {
  phoneOnceConfirm: false,   // ① 휴대폰을 한 번만 받고 「이 번호로 안내가 갑니다」로 확인 (끄면 Tally 처럼 두 번 적기)
  sourceQuestion:   false,   // ② 「어떻게 알고 오셨나요?」 문항 (끄면 링크 ?src= 만 숨겨서 받는다 — Tally 의 utm_source 와 같다)
  couponField:      false,   // ③ 함께 걷는 일주일 정기특강 참석권 쿠폰번호 칸 (BW-XXXX). 대조는 아침 정산이 시트에서 한다
  topicsQuestion:   false,   // ④ 관심 주제 체크박스 (「원하는 특강」 자유 답은 그대로 둔다)
  marketingConsent: false,   // ⑤ 마케팅 수신 동의(선택)를 개인정보 동의와 따로 받기
  memberOnlineStop: true     // ⑥ 켬(9/12 오너) — 멤버십 「예」 + 「온라인」을 고르는 순간 신청 없이 멈춤 화면.
                             //    켜면 두 문항이 1쪽 맨 앞으로 오고, 히어로 아래 노랑 상자가 뜬다. 끄면 Tally 순서 그대로
};

/* ── 여기부터는 회차가 바뀌어도 그대로 둔다 ─────────────────────────── */
function won(n) { return Math.round(n).toLocaleString('ko-KR') + '원'; }
function surcharge() { return 회차.receiptSurcharge || 0; }
function pct() { return Math.round(surcharge() * 100); }
function feeOf(a) { return a.member === '예' ? 회차.feeMember : 회차.transferAmountNonmember; }       // 계좌 입금 기본 금액
function useCoupon(a) { return 스위치.couponField && /^BW-[A-Z0-9]{4}$/.test(a.coupon || ''); }
function payUrlOf(a) { return a.member === '예' ? 회차.payUrlMember : 회차.payUrlNonmember; }
function payChoice(a) { return a.member === '아니오' && !useCoupon(a) && !!회차.payUrlNonmember; }  // 비회원이 카드·계좌를 고르는 경우
function payPending(a) { return payChoice(a) && !a.payWith; }                                        // 아직 안 고름
function cardPay(a) {                                                                               // 쿠폰이 확인되면 카드도 계좌도 없다
  if (useCoupon(a)) return false;
  return a.member === '예' ? !!회차.payUrlMember : payChoice(a) && a.payWith === '카드';
}
function bankPay(a) { return !useCoupon(a) && !cardPay(a) && !payPending(a); }
function payAmountOf(a) {                                                                           // 카드 금액
  return a.member === '예' ? (회차.payAmountMember || Math.round(회차.feeMember * (1 + surcharge()))) : 회차.cardAmountNonmember;
}
function bankTotal(a) { return Math.round(feeOf(a) * (a.receipt ? 1 + surcharge() : 1)); }        // 입금하실 금액
var 멈춤 = 스위치.memberOnlineStop;

/* 멈춤 스위치를 켜면 1쪽 맨 앞으로 오는 두 문항 */
var 멤버십문항 = { key: 'member', type: 'choice', label: "부트니스 '유료' 멤버십 회원인가요?", required: true, options: ['예', '아니오'] };
var 참석문항 = { key: 'mode', type: 'choice', label: '온오프라인 참석여부를 선택해주세요', required: true,
  hint: 멈춤 ? '' : '⚠️ 멤버십 회원이 온라인으로 들으시면 신청서를 쓰지 않으셔도 돼요',
  options: 회차.online ? ['온라인', '오프라인'] : ['오프라인'] };

window.FORM = {
  formId: 회차.formId,
  endpoint: 회차.endpoint,
  deadline: 회차.deadline,
  previewId: 회차.previewId,
  keepDraft: true,                                    // 새로고침해도 쓰던 답이 남는다(이 기기·이 탭에만). 제출·마감 때 지운다
  accent: '#383839',
  eyebrow: '부트니스 정기특강',
  title: 회차.title,
  heroLines: [
    '📅 일정 : ' + 회차.when,
    회차.place ? '📍 장소 : ' + 회차.place + (회차.placeUrl ? ' <a href="' + 회차.placeUrl + '" target="_blank" rel="noopener">지도 보기</a>' : '') : null,
    회차.online ? '🖥️ 온라인 라이브도 동시에 진행됩니다.' : '🛑 오프라인으로만 진행되며 다시보기 제공되지 않습니다.',
    회차.online && 회차.replay ? '📼 ' + 회차.replay : null,
    '⚠️ ' + 회차.deadlineText
  ].filter(function (x) { return x; }),
  /* 히어로 아래 노랑 상자 (문구: 한결 · 오너, 문구검사 통과 — 고치지 않는다) */
  banner: 멈춤 && 회차.online ? '<b>멤버십 회원이신가요?</b><br>온라인으로 들으실 거면 신청서를 쓰지 않으셔도 돼요. 라이브 링크는 멤버십 공지방에서 드려요.<br>오프라인으로 오실 분만 신청해 주세요.' : '',
  submitLabel: '신청서 제출',

  pages: [
    { title: '', fields: [
      멈춤 ? 멤버십문항 : null,
      멈춤 ? 참석문항 : null,
      { key: 'nick', type: 'text', label: '닉네임이 어떻게 되시나요? (한글로 입력하여 주세요)', required: true, maxlength: 40, autocomplete: 'nickname', err: '닉네임을 적어 주세요' },
      { key: 'name', type: 'text', label: '성함을 적어주세요.', required: true, maxlength: 30, autocomplete: 'name', err: '성함을 적어 주세요' },
      { key: 'phone', type: 'tel', label: '휴대폰 번호를 적어주세요.', hint: '숫자만 적어 주세요 (예: 01012345678)', required: true, autocomplete: 'tel',
        confirmLine: 스위치.phoneOnceConfirm },
      스위치.phoneOnceConfirm ? null :
        { key: 'phone2', type: 'tel', label: '휴대폰 번호가 틀리면 안내가 불가하니 한 번 더 적어주세요.', required: true, mustEqual: 'phone', noSubmit: true,
          err: '위에 적은 번호와 똑같이 적어 주세요' },
      멈춤 ? null : 멤버십문항,
      스위치.sourceQuestion ? { key: 'src', type: 'source', label: '어떻게 알고 오셨나요?', required: true, err: '어떻게 알고 오셨는지 골라 주세요' } : null,
      스위치.sourceQuestion ? { key: 'ref', type: 'text', label: '추천해 주신 분 닉네임', maxlength: 40,
        requiredIf: function (a) { return a.src === 'ref'; }, err: '추천해 주신 분 닉네임을 적어 주세요' } : null,
      /* 개인정보 동의 — 비회원만 체크(필수). 멤버십 회원은 계약 이행이라 체크 없이 안내 한 줄 (9/12 오너 결정) */
      { key: 'privacy', type: 'consent', question: '개인 정보 수집 · 이용에 동의하시나요?', label: '네, 동의합니다.', required: true,
        showIf: function (a) { return a.member === '아니오'; },
        err: '개인 정보 수집·이용에 동의해야 신청할 수 있어요',
        notice: [['1. 개인 정보 수집·이용 목적 :', '강의 진행 및 안내, 자료배포 등'],
                 ['2. 수집하려는 개인정보의 항목 :', '성함, 휴대폰 번호, 이메일'],
                 ['3. 개인 정보의 보유 및 이용 기간 :', '3년'],   // 비회원 3년 (9/12 오너). 회원 안내 한 줄은 1년 그대로
                 ['4. 개인 정보를 제공 받는 자 :', '부트니스 대표 및 스탭']] },
      { type: 'info', html: '적어 주신 정보는 이번 특강 안내와 진행에만 쓰고, 1년 뒤 지웁니다.',
        showIf: function (a) { return a.member === '예'; } },
      스위치.marketingConsent ? { key: 'marketing', type: 'consent', label: '강의·특강 소식 받기',
        notice: '부트니스의 강의·특강 소식을 카카오톡·문자로 받겠습니다. 3년간 보관하고, 언제든 거부할 수 있습니다. 선택이라 동의하지 않아도 신청할 수 있어요.' } : null
    ] },

    { title: '강의 진행 관련 필요사항 설문', fields: [
      멈춤 ? null : 참석문항,
      { key: 'afterparty', type: 'choice', label: '오프라인 참석자의 경우 뒤풀이 참석여부를 선택해주세요. 원활한 진행을 위해 가부를 확실히 부탁드립니다.',
        required: true, options: ['참석', '불참'], showIf: function (a) { return a.mode === '오프라인'; } },
      { key: 'wish', type: 'textarea', label: '차후 원하는 종류의 특강이 있으면 적어주세요.', maxlength: 500 },
      스위치.topicsQuestion ? { key: 'topics', type: 'multi', label: '관심 있는 주제', hint: '여러 개 골라도 돼요',
        options: ['AI생산성', '부동산투자', '경매', '재개발재건축', '공유숙박', '리셀', '이커머스', '유튜브', 'SNS', '글쓰기', '부업사업', '세금', '주식코인'] } : null
    ] },

    /* 쪽 제목 — 카드로 내는 사람(아직 안 고른 비회원 포함)은 「결제」, 계좌로 내는 사람은 Tally 그대로 「입금」 (9/12 오너) */
    { title: function (a) { return cardPay(a) || payPending(a) ? '결제 정보 및 환불 관련 안내' : '입금 정보 및 환불 관련 안내'; }, fields: [
      { type: 'info', warn: true, html: '⚠️ 강의수강 방법 및 강의진행 관련 안내는 카카오톡으로 발송됩니다.' },
      스위치.couponField ? { key: 'coupon', type: 'text', label: '정기특강 참석권 쿠폰번호가 있으시면 적어주세요.', upper: true, maxlength: 7,
        hint: '함께 걷는 일주일 12걸음 완주 쿠폰 (예: BW-7F3K)', pattern: '^BW-[A-Z0-9]{4}$', err: '쿠폰번호를 BW-7F3K 처럼 적어 주세요' } : null,
      /* 비회원 결제 방법 (9/12 오너) — 고른 쪽에 맞는 문항만 보이고, 숨은 문항은 필수 검사도 안 한다 */
      { key: 'payWith', type: 'choice', label: '결제 방법을 골라 주세요.', required: true,
        options: [{ label: '카드로 결제', value: '카드' }, { label: '계좌로 입금', value: '계좌' }],
        showIf: payChoice, err: '카드와 계좌 가운데 하나를 골라 주세요' },
      { type: 'info', html: function (a) {
          if (useCoupon(a)) return '<b>쿠폰으로 참석</b> — 쿠폰이 확인되면 입금 없이 참석하실 수 있어요. 확인 결과는 카카오톡으로 알려 드려요.';
          if (payPending(a)) return '';
          if (cardPay(a)) return '수강료 <span class="big">' + won(payAmountOf(a)) + '</span> (부가세 포함) — 신청서를 내면 다음 화면에서 카드로 결제합니다. <b>결제까지 마쳐야 신청이 완료됩니다.</b>';
          return '입금계좌 : <b>' + 회차.account + '</b><br>' +
            (a.member === '예' ? '수강료 : 멤버십 회원 <b>' + won(회차.feeMember) + '</b> (강의실 비용)'
                               : '수강료 : 비회원 <b>' + won(회차.transferAmountNonmember) + '</b>') +
            '<br><span class="big">입금하실 금액 ' + won(bankTotal(a)) + '</span>' +
            (a.receipt && surcharge() ? ' <span style="color:#6e6a60">(현금영수증 ' + pct() + '% 포함)</span>' : '');
        } },
      /* 계좌로 내는 사람만 — 카드 전표가 지출 증빙이라 카드는 현금영수증·입금자명이 필요 없다 */
      { key: 'receipt', type: 'ack', checkLabel: '예', showIf: bankPay,
        label: function () {
          return surcharge() ? '소득공제 혹은 지출증빙을 위해 현금영수증 발급을 원하실 경우 강의비의 ' + pct() + '%(부가세)를 추가 입금해주세요.'
                             : '소득공제 혹은 지출증빙을 위해 현금영수증 발급을 원하시면 「예」를 눌러 주세요.';
        } },
      { key: 'receiptNo', type: 'text', label: '현금영수증 발급을 원하는 휴대폰 번호 또는 사업자 번호를 적어주세요.', maxlength: 20, showIf: bankPay },
      { key: 'depositAck', type: 'ack', checkLabel: '예', required: true, err: '확인하고 「예」를 눌러 주세요',
        showIf: function (a) { return !payPending(a); },
        label: function (a) {
          return cardPay(a) ? '결제까지 마쳐야 신청이 완료된다는 것을 확인하셨나요?'
                            : '본 신청서를 제출하시면 계좌조회가 불가하며 입금이 완료되어야 신청이 완료된 것으로 봅니다. 숙지하셨나요?';
        } },
      { key: 'depositor', type: 'text', label: '입금자명이 앞서 적은 성함과 다르면 입금자명을 적어주세요.', maxlength: 30, showIf: bankPay }
    ] }
  ],

  /* 시트 「안내금액」·「결제방식」 — 입금·결제 대조용. 신청번호는 서버가 만든다 */
  computed: function (a) {
    if (useCoupon(a)) return { amount: '쿠폰', payMethod: '쿠폰' };
    if (cardPay(a)) return { amount: won(payAmountOf(a)), payMethod: '카드' };
    return { amount: won(bankTotal(a)), payMethod: '계좌' };
  },

  stopIf: 멈춤 ? function (a) { return a.member === '예' && a.mode === '온라인'; } : null,

  /* 끝 화면 — 카드로 낼 사람은 결제 버튼이 제일 먼저. 같은 탭에서 연다(카톡 인앱 브라우저가 새 탭을 막는다).
     결제가 끝나면 그로블이 카카오채널로 보낸다(상품에 설정). 계좌·쿠폰은 Tally 끝 화면 그대로 */
  done: function (a, res) {
    if (cardPay(a)) {
      var url = payUrlOf(a);
      if (res.id) url += (url.indexOf('?') >= 0 ? '&' : '?') + 'ref=' + encodeURIComponent(res.id);   // 신청번호 → 그로블 sellerReference
      return {
        title: '결제만 남았어요',
        button: { label: '수강료 결제하기', href: url, sameTab: true },
        tail: '결제 창을 닫으셨다면 이 버튼을 다시 눌러 주세요.<br><b>결제까지 마쳐야 신청이 완료됩니다.</b>'
      };
    }
    return {
      title: '신청서를 받았어요',
      html: '부트니스에서는 수강생의 귀한 비용과 시간이 아깝지 않은 강의 준비를 위해 최선을 다하고 있습니다.<br><br>부트니스의 다양한 강의 소식들을 가장 빨리 접하고 싶으시다면',
      button: { label: '카카오채널 추가하기', href: 회차.kakaoChannel },
      tail: '카카오채널을 추가해주세요! 😄'
    };
  },
  closed: {
    title: '부트니스 특강 모집마감 안내',
    html: '죄송합니다. 이번 특강 접수는 마감되었습니다. 더 좋은 특강으로 찾아뵙겠습니다. 🙏<br><br>특강 공지는 <a href="https://cafe.naver.com/goldentree2nd" target="_blank" rel="noopener">부트니스 네이버카페</a>에서 가장 빨리 접하실 수 있습니다. 😊'
  },
  /* 멤버십·온라인 멈춤 화면 (문구: 한결 · 오너, 문구검사 통과) */
  stop: {
    title: '멤버십 회원은 온라인 신청이 필요 없어요',
    html: '라이브 링크는 멤버십 공지방에서 드려요. 그날 뵐게요!',
    button: { label: '잘못 골랐어요, 돌아가기', back: true, clear: ['mode'] }   // 쓴 답은 두고 온오프라인만 다시 고르게 (9/12 오너)
  }
};
