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
