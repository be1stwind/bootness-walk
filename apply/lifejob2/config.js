/* 인생업 2기 무료특강 신청 — 설정 (설계: 04_강의/인생업2기/무료특강_신청서_설계.md)
   다른 특강에 다시 쓸 때는 이 폴더를 복사해 이 파일만 바꾼다.
   formId 는 백엔드(신청폼_백엔드.gs) FORMS 의 키와 같아야 한다 → 그 탭에 적힌다. */
window.FORM = {
  formId:   'lifejob2',
  endpoint: 'https://script.google.com/macros/s/AKfycbxjd7-hFlao-hi2A-kB4Rg1OC1NbCBneBieqWA9lCkKUWk3c1Gv7D3hNlpKf6VloYnF/exec',                                  // ⬜ 오너가 Apps Script 배포 후 받은 /exec 주소 (모든 폼 공통)
  deadline: '2026-10-02T09:00:00+09:00',         // ⬜ 마감 시각 오너 확인 중 — 백엔드 FORMS.lifejob2.deadline 과 같게
  accent:   '#6b4c9a',                           // 인생업 색 — 머리띠 한 줄에만
  eyebrow:  '인생업 2기 · 무료특강',
  title:    '내 컴퓨터를 AI에게 맡기는 법',
  heroLines: ['<b>10월 1일(목) 밤 9시</b> · 라이브 · 강사 이모카'],

  pages: [{ fields: [
    { key: 'nick', type: 'text', label: '부트니스 카페 닉네임', hint: '카페 닉네임이 없으시면 불러 드릴 이름을 적어 주세요',
      required: true, maxlength: 40, autocomplete: 'nickname', err: '닉네임을 적어 주세요' },
    { key: 'name', type: 'text', label: '성함', required: true, maxlength: 30, autocomplete: 'name', err: '성함을 적어 주세요' },
    { key: 'phone', type: 'tel', label: '휴대폰 번호', hint: '숫자만 적어 주세요 (예: 01012345678)', required: true, autocomplete: 'tel' },
    { key: 'email', type: 'email', label: '이메일', autocomplete: 'email' },
    { key: 'src', type: 'source', label: '어떻게 알고 오셨나요?', required: true, err: '어떻게 알고 오셨는지 골라 주세요' },
    { key: 'ref', type: 'text', label: '추천해 주신 분 닉네임', maxlength: 40,
      requiredIf: function (a) { return a.src === 'ref'; }, err: '추천해 주신 분 닉네임을 적어 주세요' },
    { key: 'topics', type: 'multi', label: '관심 있는 주제', hint: '여러 개 골라도 돼요',
      options: ['AI생산성', '부동산투자', '경매', '재개발재건축', '공유숙박', '리셀', '이커머스', '유튜브', 'SNS', '글쓰기', '부업사업', '세금', '주식코인'] },
    { key: 'busy', type: 'choice', label: '요즘 제일 시간을 뺏는 일',
      options: ['본업 서류·보고', '부업 운영', '공부·자료 정리', '집안일·아이 챙기기', '기타'] },
    { key: 'privacy', type: 'consent', label: '개인정보 수집·이용에 동의합니다', required: true,
      err: '개인정보 수집·이용에 동의해야 신청할 수 있어요',
      notice: [['수집 항목', '카페 닉네임, 성함, 휴대폰 번호, 이메일'],
               ['이용 목적', '무료특강 안내와 입장 링크 보내기'],
               ['보관 기간', '특강이 끝난 뒤 1년, 그 뒤 파기'],          // ⬜ 오너 확인 필요 (초안)
               ['동의 거부', '동의하지 않으실 수 있지만, 그러면 신청이 되지 않아요']] },
    { key: 'marketing', type: 'consent', label: '강의·특강 소식 받기',
      notice: '부트니스의 강의·특강 소식을 카카오톡·문자로 받겠습니다. 3년간 보관하고, 언제든 거부할 수 있습니다. 선택이라 동의하지 않아도 신청할 수 있어요.' }
  ] }],

  done: {
    title: '신청됐어요!',
    html: '무료특강 입장 링크는 <b>오픈채팅방</b>에서 드려요. 지금 들어와 주세요 👇',
    button: { label: '오픈채팅방 들어가기', href: 'https://open.kakao.com/o/gdQkKchh' },
    tail: '10월 1일(목) 밤 9시에 뵙겠습니다.'
  },
  closed: { title: '신청이 마감됐어요', html: '관심 가져 주셔서 고마워요. 다음 특강 소식은 부트니스 카페에서 알려 드릴게요.' }
};
