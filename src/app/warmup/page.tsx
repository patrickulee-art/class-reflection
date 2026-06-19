'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase';

const WARMUP_CHECK_KEY = 'warmup_checks_v1';
const WARMUP_CUSTOM_KEY = 'warmup_custom_v1';
const SUPABASE_WARMUP_ID = -2;

interface WarmupSection {
  title: string;
  description: string;
  items: string[];
}

const DEFAULT_SECTIONS: WarmupSection[] = [
  {
    title: '0. 아침 루틴',
    description: '수업 전 몸과 마음을 깨우는 기본 루틴',
    items: [
      '프로폴리스 치약으로 양치',
      '올리브유 + 레몬즙 샷',
      '뜨거운 물 + 정수',
      '모닝페이지 작성',
      '운동',
    ],
  },
  {
    title: '1. 몸풀기',
    description: '큰 관절과 근육에서 얼굴의 가장 작은 근육의 순서로 이완한다.',
    items: [
      '손목과 발목, 허리와 목, 고관절을 가볍게 회전하며 풀어준다.',
      '목 뒤와 턱관절, 귀 마사지',
      '눈동자: 위·아래·왼쪽·오른쪽 → 반시계 방향으로 회전, 반대로 다시 회전',
      '턱관절: 입을 크게 벌려 혀를 최대한 내민다. 이후 혀뿌리를 잘근잘근 씹어 굳은 혀를 풀어준다.',
      '입술 풀어주며 준비운동 (입술 부르르)',
    ],
  },
  {
    title: '2. 발성',
    description: '거친 소리가 나오지 않을 때까지 관찰하며 반복한다.',
    items: [
      '목 푸는 루틴: 가성 → 진성 → 저음 순서로 성대 유연화',
      'BRR - ARR - HA - MM - MA - 털면서 순서대로 이행',
      '음역대 확장-이완: 소 소리 MOO~ / 개 소리 MU! MU! / 고양이 소리 miAu',
    ],
  },
  {
    title: '3. 발음',
    description: '글자마다 정확히 발음하려고 하기보다 흐르듯 말하며 발음을 점검한다.',
    items: [
      '내가 그린 구름 그림은 새털 구름 그린 그림이고\n네가 그린 구름 그림은 양털 구름 그린 그림이다.',
      '저기 저 말뚝이 말 맬 말뚝인지 말 못 맬 말뚝인지 말이 없으니 말 주인은 말없이 서서 말을 못 매었다.',
      '도토리가 문을 도로록드르륵두루룩 열었는가\n도로록두루룩드르륵 열었는가',
      '팔랑팔랑 펄럭펄럭 질경질경 까딱까딱 덜덜 돌돌들들 딴딴 땡땡 탕탕\n말은 또박또박 물은 벌컥벌컥 걸음은 성큼성큼 입은 방긋이',
      '아기가 방글방글 엉덩이는 실룩실룩\n목소리가 나긋나긋 고양이가 살금살금',
    ],
  },
  {
    title: '4. 음독 (4페이지)',
    description: '스스로 4페이지 정도 책을 읽는다. 그 후, 연속된 4문장을 선택하여 녹음한 후 업로드.',
    items: [
      '얼굴 고정하고 말하기 (전현무처럼! 얼굴 흔들리지 않게)',
      '목이 앞으로 나가지 않게 주의 (벽에 견갑골 붙이고 낭독해도 좋음)',
      '눈높이는 턱을 살짝 든 정도로 유지',
      '★ 진성을 내라! 가성을 없애는 것이 급선무 (진성은 결심과 용기가 필요!)',
      '적극성: 톤(소리의 종류)을 일정하게 유지한다',
      '소리의 질: 앞으로 뻗어나가는 적극적인 소리',
      '어근 강조: 여행 경험이 많진 않지만 → 어근의 음높이를 동일하게\n(손바닥을 내미는 제스쳐와 함께 읽으면 어근 강조에 도움)',
      '★ 호흡: 코로 들이마시고, 한 문장 낭독하며 호흡을 다 쓴다\n횡격막이 하강하는 느낌. 어깨는 들썩이지 않는다.',
      '마침표와 쉼표에서 반드시 숨 쉬기',
      '입모양과 소리가 동시에 나가도록 (입모양이 소리보다 먼저 나가면 안 됨)',
      '내용 파악보다 소리를 내뱉는 데 집중. 감정 싣지 말고 같은 톤으로 평음 유지.',
      '조음 자체에 신경 쓰지 말고, 발음을 상대방에게 보내서 거기에 닿았을 때 완성되는 느낌',
      '자기 감시 하지 말 것. 쭉 밀고 나가라!',
      '처음에 목소리가 가라앉아 있는 것은 정상. 4페이지 읽으며 소리를 튜닝해라.',
    ],
  },
  {
    title: '5. 발성 트레이닝 (8단계)',
    description: '방송인·아나운서들이 리딩 전 목 풀기로 쓰는 8단계 기본 보이스 트레이닝. (스피치 교재 부록 1)',
    items: [
      '❶ 허밍 발성\n음마~ (5초)\n음마메미모무~ (10초)\n음메미묘뮤므~ (한 톤 낮게 10초)\n음미먀모뮤미~ (더 낮게 10초)\n음마~ (최대한 낮고 길게)',
      '❷ 스타카토 모음 발성\n(한 음절마다 한 번씩 복식호흡으로 배를 불렸다가 넣으며)\n아 / 에 / 이 / 오 / 우\n아에 / 이오 / 우아 / 오우 / 에이 / 이오\n아에이 / 이오우 / 우아애 / 에이오 / 이애오\n아에이오 / 이애오우 / 우아에이 / 이애오아',
      '❸ 이중모음 발성\n(한 음절마다 한 번씩 복식호흡으로 배를 불렸다가 넣으며)\n의의의 돼돼돼 과과과 와와와 회회회\n최최최 봐봐봐 뒤뒤뒤 귀귀귀 외외외\n뫼뮈뫄 뵈뷔봐 쇄쉬쇠 와위외\n(한 번에 X, 입술 모양을 두 번에 걸쳐 확실히 변화시키며 이중모음을 정확하게)\n귀 뉘 뒤 뤼 뮈 뷔 쉬 위 쥐 취 퀴 튀 퓌 휘\n과 놔 돠 롸 뫄 봐 솨 와 좌 촤 콰 톼 퐈 화\n회 푀 퇴 쾨 최 죄 외 쇠 뵈 뫼 뢰 되 뇌 괴',
      '❹ 이중모음 받침 발성\n(니은 받침 끝까지 정확히 누르며)\n권 눤 둰 뤈 뮌 뷘 쉰 원 쥔 췬 퀀 퉌 풘 훤\n횔 풜 퇼 퀼 췰 줠 월 쉴 뷜 묄 뤘 뒬 눨 궐\n콸콸콸 환환환 탕탕탕 퐘퐘퐘',
      '❺ 오독없이 집중력 있게 발성\n하파타카차자아 사바마라다나가\n휴표탸캐체지오 서부마르더냐가\n가누더로므비세애쟈쵸켜튜퍼허\n랄랄랄랄라 롤로롤로로 릴릴릴리릴\n랄라랄 라라랄 랄리라 라리랄\n랄라라랄 릴랄라라 랄랄라랄 라랄랄라',
      '❻ 조음 단련 훈련\n(입을 크게 벌려 정확하고 부드럽게 붙여읽기)\n라즈류빌 미냐 밀러이\n아깍 니녜쉬녜이 볘스너이\n브짐뉴 노취꾸 나루꼐\n우미냘 리우 믈라도이\n브쎄르쩨 밀롄끼 드루쥭\n좌르깔례치꺼 나루꼐\n가례미쉬녜예 미냐\n브 제례브냐흐 니 나이찌 찌볘 니그제\n나 추쥐예 볘례가\n후도줴스트벤뉘 빠슬랄 메냐\n자슬루줸늬 아르찌스트 이딸꼬브닉\n마르쉬 브스뚜뺄례니예 끄라스나이\n빼스니 레니누 빠욧 뼤아녜릐 땀이 둣\n즈뇨즈드늬에 뿌찌\n니 느나옛 춋찌야 똘꺼 또뜨\n앞센 초브 옆산 츄포\n옥테루 시레이트 욱트로 쓰리에티\n락셀 페달 룩셀 포댈\n샘손 캐스칼 샴순 코시컬\n캐플랫 터피 큐필룻 퍼포\n패렌 스엣픈 퍼렁 시엘폰\n멜살라 캐잇 토 무솔래 크악투\n쭐리 엣비오 쭐르 앵피우\n에이브러햄 야여밸리험 판초빌라 팬츄블러\n로얄 막퐈스 싸리톨 쥬피탈 캄퍄 큐을와화\n셀레우 와퐈큐사 푸랜 마네퓨 슈멘헤워제\n깅간후리와 디댜스코 바시례이아 게겐네탸이\n페레스테랑 포론소폰 파라클레세오스 쏘테라이스\n카탈루사유 마카리오스 에코루데산 디카이온순넨\n퐐레로사잉 화프슈톨론 유라이놔스 아휘옌톼이',
      '❼ 뻗어 나가는 발성 연습\n안녕하십니까? 반갑습니다.\n1. 무지개 발성법으로\n2. 로케트 발성법으로\n3. 투수 발성법으로\n4. 베어풋 발성법으로',
      '❽ 미소 훈련\n1. 5단 웃음 훈련법: 으흠 → 그렇지 → 배시시 → 와이키키 → 와! 신난다~\n2. 이예이예 반복법\n  · 이(밝은 표정: 눈을 옆으로 찢어지게 웃기. 손 뒤로)\n  · 예(신난 표정: 눈썹 올리며 눈을 동그랗게 뜨기. 손 앞으로. 에 X)\n3. 레스토랑 주문법: Hey sexy! Pizza, Spaghetti, Cheese cake, please!\n4. 눈썹운동법: 히히(눈썹 내리고) 히히(눈썹 올리고) 히히(내리고) 히히(올리고)\n5. 6종세트법: “눈은 크게, 눈썹은 올리고, 머리는 옆으로, 손으로 U자를! 고개를 콩! 고개를 코오옹”\n6. 미소밴 음성 연습: 안녕하십니까? 수험번호 1번 ○○○입니다. 반갑습니다. ○○○입니다. 환영합니다. 감사합니다. 늘 건강하시기 바랍니다. 함께해 주신 여러분, 고맙습니다.',
    ],
  },
  {
    title: '6. 발음 연습 문장 (텅트위스터)',
    description: '강의 수강생들이 가장 어려워했던 단어·문장을 모은 발음 연습 문장. 글자마다 정확히 발음하려 하기보다 흐르듯 빠르게 읽으며 조음기관을 단련한다. (스피치 교재 부록 2)',
    items: [
      '관광청 관광열차 기관사 곽환원 씨',
      '로얄 뉴로얄 아파트 옆 창경원 창살은 쌍철창살',
      '결합확률분포표와 누적확률분포표, 정규분포표평균',
      '정형돈 심양홍 연경흠 엄원희 류승룡 홍상삼의 척추측만증',
      '대한적십자사 지지자들이 모여 수수료율 인하를 촉구했습니다.',
      '철수책상 철책상을 새 철책상으로 바꿀까? 새 쇠책상으로 바꿀까?',
      '농촌진흥청 농업과학관의 상설전시실과 특별전시회곤충생태관 확충개관',
      '편집성 정신분열증으로 인한 망상 및 환각 증가와 향정신성 약물 생산현황',
      '라디오 속 샹송가수의 샹송 가사가 랄라라라, 릴라라라, 랄랄랄라, 라랄랄라',
      '개인대상사회복지실천기술의 직접적과 간접적 개입기술에 관한 직간접적 관찰',
      '화학, 과학교육활성화와 과학문화확산에 공헌한 교사에게 주어지는 과학교사상',
      '로얄 뉴로얄 아파트 옆 철도청 창살은 쌍창살, 서울시청 신청사 창살은 철창살',
      '혼성중창단의 혼성중창, 혼성듀엣, 혼성중창단과 여성중창단, 남성합창단과 남성중창단',
      '도토리 든 돌이가 문을 도로록, 드르륵, 두루룩 아니면 도루룩, 드로록, 두르룩 열었는가?',
      '외국에서 외로움을 외치던 외설적인 외교관이 외삼촌, 외손녀와 함께 외빈 외야석에 앉아있다.',
      '우유성분 함유율은 칼슘함유량이 철분함유량보다 높은가? 철분함유량이 칼슘함유량보다 높은가?',
      '도롱뇽 노래를 만들자 도레미파솔라시도도롱뇽 레롱뇽 미롱뇽 파롱뇽 솔롱뇽 라롱뇽 시롱뇽 도롱뇽',
      '왕위 계승 1순위인 찰스 왕세자가 관광객용 관람차를 타고 국립박물관과 국립미술관을 관광중이다.',
      '벨기에 브뤼셀에서 이뤄진 스가 요시히데 일본 관방장관과 중국 인민해방군부총참모장의 회담',
      '로랑 파비우스 프랑스 외무장관이 밝힌 바샤르 알아사드 시리아 정권의 화학무기 프로그램 폐기 결정',
      '초췌한 노르웨이인이 웬걸, 웨스트항공 귀빈석을 타고 오던 중 불의의 사고로 쇄골을 다쳐 왱왱 울었다.',
      '뇌성이냐 노성이냐 소리 높여 외치던 뇌물 먹은 농촌진흥청 농예인이 뇌성 뇌일혈로 논길에서 쓰러졌다.',
      '진실위 권고사항 이행 처리반 총리실 설치 이후 이뤄진 국무조정실의 진실위 권고사항 이행 추진계획 보고',
      '천주교지지자협회와 적십자사지지자 모임, 구로구 시니어 팝스오케스트라는 현재 공원묘원 공연을 준비중입니다.',
      '종국은 합성착향료와 합성착색료가 든 불량식품 대신 몸에 좋은 게살샥스핀과 안흥찜팥빵, 영동용봉탕을 챙겨 먹습니다.',
      '경상북도가 국민기초생활수급자 및 차상위건강보험전환자를 위해 총 110여 억 원을 들여 구강건강증진 보건실을 설치하기로 했습니다.',
      '앞집 팥죽은 붉은팥풋팥죽이고, 뒷집 콩죽은 햇콩단콩콩죽, 우리집 깨죽은 검은깨깨죽인데 사람들은 햇콩단콩콩죽 깨죽 죽먹기를 싫어한다.',
      '중국 공산당의 기관지 인민일보 자매지 환구시보는 중국의 한반도 전문가, 랴오닝성 사회과학원 뤼차오 연구원의 말을 인용해 이같이 보도했습니다.',
      '활화산마냥 화난 얼굴로 관광청의 환한 화환을 받은 환자 황환곽 씨와 서울시 서소문구 서소문동에 사는 신성수 씨가 인천공항 입출국장을 나섰습니다.',
      '분당 운중동 한국학중앙연구원에서 출발해 신분당선 환승역과 신논현역 사이 관광안내소를 지나 열네 개 적십자사 지사를 둔 대한적십자사 본사를 방문한 관람객',
      '우리 그룹의 이번 캄보디아 봉사는 깜퐁짬주의 오스와이 마을에서 이틀간 실시하고, 다시 깜퐁츠낭주 쏭마을 등에서 하루씩 진행돼 총 4일간 진행됐습니다.',
      '스투트가르트는 독일 남서부 바덴뷔르템베르크주에 자리잡고 있는 도시입니다. 뷔르템베르크 백작이 거주했고 도읍지로 발전한 도시였으나 프랑스의 침공으로 한때 쇠퇴했습니다.',
      '무르시 지지자들이 주축을 이룬 ‘정당성 지지를 위한 국민연합’은 압델 파타 엘시시 전 국방장관이 44%의 지지율로 당선된데 대해, 무함마드 무르시 대통령을 축출한 쿠데타에 반대한다는 의미라고 주장했습니다.',
      '그로할렘 브룬틀린 전 노르웨이 총리, 커티스 캐퍼로티 한미연합사령관 자비즈라자크 말레이시아 총리, 원주지청장과 원주지검 고위공무원이 벤로즈 백악관 국가안보회의 부보좌관의 뉴저지주 방문에 동행했습니다.',
      '단일질환으로 사망률 1위인 뇌졸중은 치료가 조금이라도 늦어지면 심각한 후유증을 낳습니다. 또 서구화된 식습관으로 동물성 지방 섭취가 늘면서 뇌혈관이 터지는 뇌출혈로 인한 뇌졸중보다 혈관이 막히는 뇌경색에 의한 뇌졸중이 많아졌습니다.',
      '오늘부터 여행유의를 의미하는 1단계에서 2단계로 조정된 지역은 방콕·논타부리주 전역과 빠툼타니주 랏룸께오구, 사뭇쁘라칸주 방필구 지역, 수린·시사켓주의 캄보디아 국경지역입니다. 태국 나라티왓·파타니·얄라주와 송크홀라주의 남부 말레이시아 국경지역 여행경보는 3단계인 여행제한으로 지정돼 있습니다.',
      '정 회장의 의지에 따라 현대그룹은 입찰 보증금으로 1조 원에서 1원 빠진 9천 999억 9천 999만 9천 999원을 냈습니다. 자신의 이름에 있는 ‘구’를 열두 개나 연이어 써냄으로써 한 전부지 인수가 자신의 뜻임을 내비친 것입니다. 보증금은 입찰가의 5% 이상만 내면 되지만 현대차그룹은 이런 의지를 반영하듯 입찰가 10조 5천 500억여 원의 9.5%에 이르는 돈을 보증금으로 냈습니다.',
      '세계박람회를 한국으로 유치하기 위한 장외 외교전이 뜨겁습니다. 정부가 박람회 유치활동을 위해 공식초청한 정상급 인사는 도미니카의 피에르 찰스 총리, 팔라우의 토미 레멩게사우 대통령, 세인트 킷츠 네비스 연방의 덴질 더글라스 총리, 벨리즈의 무사 총리, 나미비아의 하게 게인곱 총리 등 5명입니다. 미겔 앙헬 로드리게스 코스타리카 전 대통령, 빅토르 오르반 전 헝가리 총리와 각국 각료급 17명도 같은 이유로 초청됐습니다.',
      '중국 당국은 지난 23일 양쯔강 유역에 건설중인 세계 최대의 수력발전소 프로젝트인 산샤댐 건설 공사 부패에 연루된 정부와 당관리 21명에 대해 파면, 당적 박탈 등의 징계를 내렸다고 관영 신화통신이 보도했습니다. 이 통신은 충칭시 펑두현 전 당서기 가오 룽먀오와 전 당부서기 천즈슝이 산샤댐 건설지역 주민 이주비를 유용 또는 착복하거나, 불법 배정해 주고 금품을 받은 혐의 등으로 파면돼 당에서 축출됐다고 말했습니다.',
      '영등포구 여의나루역 옛 여의나루 근처에서 붉은밭풋팥죽 대회가 열렸다고 합니다. 팥식이네 앞집 밤팥죽 씨는 붉은밭풋팥죽에 도전했고 뒷집 콩숙이네 흥콩죽 씨는 햇콩단콩콩죽에 도전했다고 합니다. 그리고 마지막 도전자 콩숙이네 옆집 깨숙이네 감깨죽 씨는 검은깨들통깨복합깨죽에 도전했다고 합니다. 그런데 대회를 관람하던 정형돈 씨가 붉은밭풋팥죽, 햇콩단콩콩죽, 검은깨들통깨복합깨죽에 모두 성공해 결국 우승 팥죽을 차지했다고 합니다.',
      '국가총부채가 4천 8백조 원이 넘어 금리인상 등에 대비한 부채 관리가 시급한 것으로 나타났습니다. 한국경제연구원은 2015년 기준으로 국가총부채가 최대 4,835조 원으로 추정된다면서 국내총생산, GDP의 3.4배에 이른다고 밝혔습니다. 정부와 공공부문, 군인과 공무원 연금을 합친 국가관련 부채가 1,959조 원에 이르고 가계부채는 963조 원, 기업부채는 1,913조 원으로 조사됐습니다. 앞서 기획재정부는 지난해 국회에 제출한 자료에서 2013년 국가총부채가 4,507조 원이라고 밝혔는데 이번 통계는 3백조 원 이상 많습니다.',
      '오늘 새벽 정형돈 씨가 옆집 팥죽 붉은밭풋팥죽과 뒷집 콩죽 검은 콩죽을 먹고 음식값을 지불하지 않아 서울경찰청에 긴급체포 되었다고 합니다. 다음은 서울경찰청에서 남긴 정형돈 씨의 한마디입니다. “저기 저 경찰청 창문 쇠철창살은 녹슨 쇠철창살인가 녹 안슨 쇠철창살인가?”라고 말하자 옆에 있던 좀도둑 신현록 씨가 “저기 저 중앙청창살 쌍창살 시청창살 외창살 종합청사창살 겹창살”이라고 말해서 서울경찰청에서 때 아닌 경찰청 창살과 중앙청창살에 관한 논란이 벌어졌다고 합니다. 이에 서울경찰청에서는 “중앙청창살 외창살 시청창살 쌍창살 종합청사창살 쌍겹창살”이라고 공식 발표했다고 합니다.',
      '지난 2014년 대형건축물에 대한 과밀부담금제도가 시행된 이후 올 7월말까지 총 2천 4백 72억여 원의 과밀부담금이 부과됐으나 겨우 63억여 원이 징수된 것으로 집계됐습니다. 서울시가 국회 건설교통위에 제출한 자료에 따르면 과밀부담제 시행 이후 2014년 7백 85억여 원, 2015년 1천 7억여 원, 2016년 6백 79억여 원이 부과됐으며 이 중 각각 4억여 원, 38억여 원, 20억여 원이 걷혔습니다. 지금까지 부과된 과밀부담금은 구의동 테크노마트 빌딩이 1백 57억여 원으로 가장 많고, 다음으로 역삼동 현대사옥 1백 2억여 원, LG강남타워 84억여 원 등입니다. 이 밖에 50억 원 이상의 과밀부담금을 부과받은 건물은 을지로 두산타워 65억여 원, 여의도 한국산업은행 본점 63억여 원, 서초동 국제전자유통센터 52억여 원 등입니다.',
    ],
  },
];

function getTodayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function loadChecks(): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  try {
    const saved = localStorage.getItem(WARMUP_CHECK_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.date === getTodayKey()) return parsed.checks;
    }
  } catch { /* ignore */ }
  return {};
}

function saveChecks(checks: Record<string, boolean>) {
  localStorage.setItem(WARMUP_CHECK_KEY, JSON.stringify({ date: getTodayKey(), checks }));
}

function loadCustomItems(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(WARMUP_CUSTOM_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return [];
}

function saveCustomItems(items: string[]) {
  localStorage.setItem(WARMUP_CUSTOM_KEY, JSON.stringify(items));
}

export default function WarmupPage() {
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [customItems, setCustomItems] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Load from localStorage, then try Supabase for custom items
  useEffect(() => {
    setChecks(loadChecks());
    const localCustom = loadCustomItems();

    const loadRemote = async () => {
      const client = getSupabaseClient();
      if (client) {
        try {
          const { data } = await client
            .from('reflections')
            .select('data')
            .eq('id', SUPABASE_WARMUP_ID)
            .single();
          if (data?.data) {
            const remote = data.data as { customItems?: string[]; savedAt?: string };
            if (remote.customItems && remote.customItems.length > 0) {
              // Use remote if local is empty or remote is newer
              if (localCustom.length === 0) {
                setCustomItems(remote.customItems);
                saveCustomItems(remote.customItems);
                setLoaded(true);
                return;
              }
            }
          }
        } catch { /* ignore */ }
      }
      setCustomItems(localCustom);
      setLoaded(true);
    };

    loadRemote();
  }, []);

  const toggleCheck = useCallback((key: string) => {
    setChecks(prev => {
      const next = { ...prev, [key]: !prev[key] };
      saveChecks(next);
      return next;
    });
  }, []);

  const updateCustomItem = useCallback((index: number, value: string) => {
    setCustomItems(prev => {
      const next = [...prev];
      next[index] = value;
      saveCustomItems(next);
      return next;
    });
  }, []);

  const addCustomItem = useCallback(() => {
    setCustomItems(prev => {
      const next = [...prev, ''];
      saveCustomItems(next);
      return next;
    });
  }, []);

  const removeCustomItem = useCallback((index: number) => {
    setCustomItems(prev => {
      const next = prev.filter((_, i) => i !== index);
      saveCustomItems(next);
      return next;
    });
  }, []);

  const resetAllChecks = useCallback(() => {
    setChecks({});
    saveChecks({});
  }, []);

  // Sync custom items to Supabase (debounced)
  useEffect(() => {
    if (!loaded) return;
    const timer = setTimeout(() => {
      const client = getSupabaseClient();
      if (client) {
        client.from('reflections').upsert({
          id: SUPABASE_WARMUP_ID,
          data: { customItems, savedAt: new Date().toISOString() },
        }).then(() => {});
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [customItems, loaded]);

  const totalDefault = DEFAULT_SECTIONS.reduce((sum, s) => sum + s.items.length, 0);
  const totalCustom = customItems.length;
  const totalChecked = Object.values(checks).filter(Boolean).length;
  const totalAll = totalDefault + totalCustom;

  return (
    <div className="warmup-page">
      <div className="page-header">
        <h2>수업 전 준비운동</h2>
        <span className="warmup-progress">
          {totalChecked}/{totalAll} 완료
        </span>
      </div>

      <div className="content">
        {DEFAULT_SECTIONS.map((section, si) => (
          <div key={si} className="warmup-section">
            <h3 className="warmup-section-title">{section.title}</h3>
            <p className="warmup-section-desc">{section.description}</p>
            <div className="warmup-checklist">
              {section.items.map((item, ii) => {
                const key = `s${si}-i${ii}`;
                const checked = !!checks[key];
                return (
                  <label key={ii} className={`warmup-check-item${checked ? ' checked' : ''}`}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleCheck(key)}
                    />
                    <span className="warmup-check-text">{item}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}

        <div className="warmup-section">
          <h3 className="warmup-section-title">나만의 체크리스트</h3>
          <div className="warmup-checklist">
            {customItems.map((item, ci) => {
              const key = `custom-${ci}`;
              const checked = !!checks[key];
              return (
                <div key={ci} className="warmup-custom-row">
                  <label className={`warmup-check-item${checked ? ' checked' : ''}`} style={{ flex: 1 }}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleCheck(key)}
                    />
                    <input
                      type="text"
                      className="warmup-custom-input"
                      value={item}
                      onChange={(e) => updateCustomItem(ci, e.target.value)}
                      placeholder="체크 항목 입력..."
                    />
                  </label>
                  <button
                    className="warmup-remove-btn"
                    onClick={() => removeCustomItem(ci)}
                    title="항목 삭제"
                  >-</button>
                </div>
              );
            })}
          </div>
          <button className="warmup-add-btn" onClick={addCustomItem}>
            + 항목 추가
          </button>
        </div>

        <div className="warmup-tip">
          <strong>※ 준비 시간이 여유가 있다면,</strong><br />
          짧은 시 한 편, 또는 소설책 한 페이지를 읽으며<br />
          <strong>신체 이완과 발성, 발음</strong>이<br />
          유기적으로 움직이고 있는지 마지막 점검!
        </div>

        <button className="warmup-reset-btn" onClick={resetAllChecks}>
          모두 초기화
        </button>
      </div>
    </div>
  );
}
