/* 9월 정기특강 신청 — 설정
   설계: 03_01_정기특강_신청페이지_설계.md · 문구: Tally 폼 mOx9Wp 블록 65개 원문 (2026-09-12 읽음)
   ▣ 회차마다 바꾸는 곳은 맨 위 「회차」 한 덩어리뿐이다. 다음 달엔 이 폴더를 복사해 그것만 바꾼다.
   ▣ 「스위치」 여섯 개는 설계 문서 2장의 바꿀 점이다. 오너 확인 전이라 전부 꺼 두었다 = Tally 와 똑같이 동작.
     true 로 바꾸면 그 자리에서 켜진다. 문항·문구는 아래 pages 에 있다. */

var 회차 = {
  formId:   'lecture2609',                          // 백엔드 FORMS 키 → 탭 「정기특강_전해청_2609」
  endpoint: '',                                     // ⬜ Apps Script /exec 주소 (인생업 무료특강과 같은 주소)
  title:    '전해청 변호사님의 『⬜ 정식 제목』',       // ⬜
  when:     '9월 19일 (토) 오후 3시 ~ 6시',
  place:    '⬜ 장소',                               // ⬜ 예: '강남 10번 출구 라이지움'
  placeUrl: '',                                     // ⬜ 지도 링크 (naver.me/…)
  online:   true,                                   // ⬜ 온라인 라이브 동시 진행이면 true, 오프라인만이면 false
  replay:   '온오프라인 참여자 모두 다시보기 3일간 제공됩니다.',   // ⬜ 온라인일 때만 보인다
  feeMember: 10000,                                 // ⬜ 멤버십 회원 (강의실 비용) — Tally 와 같다고 가정
  feeNonmember: 50000,                              // ⬜ 비회원
  deadline: '2026-09-19T00:00:00+09:00',            // ⬜ 오너 확인 중 — 백엔드 FORMS.lecture2609.deadline 과 같게
  deadlineText: '9월 18일 자정까지 신청 가능합니다.', // ⬜ deadline 과 같은 말이어야 한다
  account:  '카카오뱅크 3333-17-0228060 · 예금주 이진규',
  kakaoChannel: 'https://pf.kakao.com/_xmHxgNT'
};

var 스위치 = {
  phoneOnceConfirm: false,   // ① 휴대폰을 한 번만 받고 「이 번호로 안내가 갑니다」로 확인 (끄면 Tally 처럼 두 번 적기)
  sourceQuestion:   false,   // ② 「어떻게 알고 오셨나요?」 문항 (끄면 링크 ?src= 만 숨겨서 받는다 — Tally 의 utm_source 와 같다)
  couponField:      false,   // ③ 함께 걷는 일주일 정기특강 참석권 쿠폰번호 칸 (BW-XXXX). 대조는 아침 정산이 시트에서 한다
  topicsQuestion:   false,   // ④ 관심 주제 체크박스 (「원하는 특강」 자유 답은 그대로 둔다)
  marketingConsent: false,   // ⑤ 마케팅 수신 동의(선택)를 개인정보 동의와 따로 받기
  memberOnlineStop: false    // ⑥ 멤버십 「예」 + 「온라인」이면 신청 없이 안내 화면으로 끝
};

/* ── 여기부터는 회차가 바뀌어도 그대로 둔다 ─────────────────────────── */
function won(n) { return Math.round(n).toLocaleString('ko-KR') + '원'; }
function feeOf(a) { return a.member === '예' ? 회차.feeMember : 회차.feeNonmember; }
function useCoupon(a) { return 스위치.couponField && /^BW-[A-Z0-9]{4}$/.test(a.coupon || ''); }

window.FORM = {
  formId: 회차.formId,
  endpoint: 회차.endpoint,
  deadline: 회차.deadline,
  accent: '#383839',
  eyebrow: '부트니스 정기특강',
  title: 회차.title,
  heroLines: [
    '📅 일정 : ' + 회차.when,
    '📍 장소 : ' + 회차.place + (회차.placeUrl ? ' <a href="' + 회차.placeUrl + '" target="_blank" rel="noopener">지도 보기</a>' : ''),
    회차.online ? '🖥️ 온라인 라이브도 동시에 진행됩니다.' : '🛑 오프라인으로만 진행되며 다시보기 제공되지 않습니다.',
    회차.online && 회차.replay ? '📼 ' + 회차.replay : null,
    '⚠️ ' + 회차.deadlineText
  ].filter(function (x) { return x; }),
  submitLabel: '신청서 제출',

  pages: [
    { title: '', fields: [
      { key: 'nick', type: 'text', label: '닉네임이 어떻게 되시나요? (한글로 입력하여 주세요)', required: true, maxlength: 40, autocomplete: 'nickname', err: '닉네임을 적어 주세요' },
      { key: 'name', type: 'text', label: '성함을 적어주세요.', required: true, maxlength: 30, autocomplete: 'name', err: '성함을 적어 주세요' },
      { key: 'phone', type: 'tel', label: '휴대폰 번호를 적어주세요.', hint: '숫자만 적어 주세요 (예: 01012345678)', required: true, autocomplete: 'tel',
        confirmLine: 스위치.phoneOnceConfirm },
      스위치.phoneOnceConfirm ? null :
        { key: 'phone2', type: 'tel', label: '휴대폰 번호가 틀리면 안내가 불가하니 한 번 더 적어주세요.', required: true, mustEqual: 'phone', noSubmit: true,
          err: '위에 적은 번호와 똑같이 적어 주세요' },
      { key: 'member', type: 'choice', label: "부트니스 '유료' 멤버십 회원인가요?", required: true, options: ['예', '아니오'] },
      스위치.sourceQuestion ? { key: 'src', type: 'source', label: '어떻게 알고 오셨나요?', required: true, err: '어떻게 알고 오셨는지 골라 주세요' } : null,
      스위치.sourceQuestion ? { key: 'ref', type: 'text', label: '추천해 주신 분 닉네임', maxlength: 40,
        requiredIf: function (a) { return a.src === 'ref'; }, err: '추천해 주신 분 닉네임을 적어 주세요' } : null,
      { key: 'privacy', type: 'consent', question: '개인 정보 수집 · 이용에 동의하시나요?', label: '네, 동의합니다.', required: true,
        err: '개인 정보 수집·이용에 동의해야 신청할 수 있어요',
        notice: [['1. 개인 정보 수집·이용 목적 :', '강의 진행 및 안내, 자료배포 등'],
                 ['2. 수집하려는 개인정보의 항목 :', '성함, 휴대폰 번호, 이메일'],
                 ['3. 개인 정보의 보유 및 이용 기간 :', '1년'],
                 ['4. 개인 정보를 제공 받는 자 :', '부트니스 대표 및 스탭']] },
      스위치.marketingConsent ? { key: 'marketing', type: 'consent', label: '강의·특강 소식 받기',
        notice: '부트니스의 강의·특강 소식을 카카오톡·문자로 받겠습니다. 3년간 보관하고, 언제든 거부할 수 있습니다. 선택이라 동의하지 않아도 신청할 수 있어요.' } : null
    ] },

    { title: '강의 진행 관련 필요사항 설문', fields: [
      { key: 'mode', type: 'choice', label: '온오프라인 참석여부를 선택해주세요', required: true,
        hint: 스위치.memberOnlineStop ? '' : "⚠️ 정기회원 '온라인' 참여자는 신청서를 작성하지 마세요",
        options: 회차.online ? ['온라인', '오프라인'] : ['오프라인'] },
      { key: 'afterparty', type: 'choice', label: '오프라인 참석자의 경우 뒤풀이 참석여부를 선택해주세요. 원활한 진행을 위해 가부를 확실히 부탁드립니다.',
        required: true, options: ['참석', '불참'], showIf: function (a) { return a.mode === '오프라인'; } },
      { key: 'wish', type: 'textarea', label: '차후 원하는 종류의 특강이 있으면 적어주세요.', maxlength: 500 },
      스위치.topicsQuestion ? { key: 'topics', type: 'multi', label: '관심 있는 주제', hint: '여러 개 골라도 돼요',
        options: ['AI생산성', '부동산투자', '경매', '재개발재건축', '공유숙박', '리셀', '이커머스', '유튜브', 'SNS', '글쓰기', '부업사업', '세금', '주식코인'] } : null
    ] },

    { title: '입금 정보 및 환불 관련 안내', fields: [
      { type: 'info', warn: true, html: '⚠️ 강의수강 방법 및 강의진행 관련 안내는 카카오톡으로 발송됩니다.' },
      스위치.couponField ? { key: 'coupon', type: 'text', label: '정기특강 참석권 쿠폰번호가 있으시면 적어주세요.', upper: true, maxlength: 7,
        hint: '함께 걷는 일주일 12걸음 완주 쿠폰 (예: BW-7F3K)', pattern: '^BW-[A-Z0-9]{4}$', err: '쿠폰번호를 BW-7F3K 처럼 적어 주세요' } : null,
      { type: 'info', html: function (a) {
          if (useCoupon(a)) return '<b>쿠폰으로 참석</b> — 쿠폰이 확인되면 입금 없이 참석하실 수 있어요. 확인 결과는 카카오톡으로 알려 드려요.';
          var fee = feeOf(a), total = a.receipt ? fee * 1.1 : fee;
          return '입금계좌 : <b>' + 회차.account + '</b><br>' +
            (a.member === '예' ? '수강료 : 멤버십 회원 <b>' + won(회차.feeMember) + '</b> (강의실 비용)'
                               : '수강료 : 비회원 <b>' + won(회차.feeNonmember) + '</b>') +
            '<br><span class="big">입금하실 금액 ' + won(total) + '</span>' + (a.receipt ? ' <span style="color:#6e6a60">(현금영수증 10% 포함)</span>' : '');
        } },
      { key: 'receipt', type: 'ack', label: '소득공제 혹은 지출증빙을 위해 현금영수증 발급을 원하실 경우 강의비의 10%(부가세)를 추가 입금해주세요.', checkLabel: '예',
        showIf: function (a) { return !useCoupon(a); } },
      { key: 'receiptNo', type: 'text', label: '현금영수증 발급을 원하는 휴대폰 번호 또는 사업자 번호를 적어주세요.', maxlength: 20,
        showIf: function (a) { return !useCoupon(a); } },
      { key: 'depositAck', type: 'ack', label: '본 신청서를 제출하시면 계좌조회가 불가하며 입금이 완료되어야 신청이 완료된 것으로 봅니다. 숙지하셨나요?',
        checkLabel: '예', required: true, err: '확인하고 「예」를 눌러 주세요' },
      { key: 'depositor', type: 'text', label: '입금자명이 앞서 적은 성함과 다르면 입금자명을 적어주세요.', maxlength: 30,
        showIf: function (a) { return !useCoupon(a); } }
    ] }
  ],

  /* 시트 「안내금액」 열 — 입금 대조용. 계좌 조회 없이도 누가 얼마를 넣어야 하는지 바로 보인다 */
  computed: function (a) {
    return { amount: useCoupon(a) ? '쿠폰' : won(a.receipt ? feeOf(a) * 1.1 : feeOf(a)) };
  },

  stopIf: 스위치.memberOnlineStop ? function (a) { return a.member === '예' && a.mode === '온라인'; } : null,

  done: {
    title: '신청서를 받았어요',
    html: '부트니스에서는 수강생의 귀한 비용과 시간이 아깝지 않은 강의 준비를 위해 최선을 다하고 있습니다.<br><br>부트니스의 다양한 강의 소식들을 가장 빨리 접하고 싶으시다면',
    button: { label: '카카오채널 추가하기', href: 회차.kakaoChannel },
    tail: '카카오채널을 추가해주세요! 😄'
  },
  closed: {
    title: '부트니스 특강 모집마감 안내',
    html: '죄송합니다. 이번 특강 접수는 마감되었습니다. 더 좋은 특강으로 찾아뵙겠습니다. 🙏<br><br>특강 공지는 <a href="https://cafe.naver.com/goldentree2nd" target="_blank" rel="noopener">부트니스 네이버카페</a>에서 가장 빨리 접하실 수 있습니다. 😊'
  },
  stop: {
    title: '멤버십 회원은 온라인 신청이 필요 없어요',
    html: '링크는 공지방으로 드립니다.'
  }
};
