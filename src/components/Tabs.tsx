'use client';

export type TabId = 'write' | 'history' | 'stats';

interface TabsProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const tabs: { id: TabId; icon: string; label: string }[] = [
  { id: 'write', icon: '\u{1F4DD}', label: '작성하기' },
  { id: 'history', icon: '\u{1F4DA}', label: '기록 보기' },
  { id: 'stats', icon: '\u{1F4CA}', label: '통계' },
];

export default function Tabs({ activeTab, onTabChange }: TabsProps) {
  return (
    <div className="tabs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`tab ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          <span>{tab.icon}</span>
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
