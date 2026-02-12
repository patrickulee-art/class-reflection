'use client';

interface HeaderProps {
  isOnline: boolean;
  isSyncing: boolean;
  onOpenSettings: () => void;
  supabaseConfigured: boolean;
}

export default function Header({
  isOnline,
  isSyncing,
  onOpenSettings,
  supabaseConfigured,
}: HeaderProps) {
  const getSyncText = () => {
    if (!supabaseConfigured) return '오프라인';
    if (isSyncing) return '동기화 중...';
    if (isOnline) return '동기화 완료';
    return '오프라인';
  };

  const getSyncStatus = () => {
    if (!supabaseConfigured) return 'offline';
    if (isSyncing || isOnline) return 'online';
    return 'offline';
  };

  return (
    <header>
      <div className="header-actions">
        <button
          className="btn-icon"
          onClick={onOpenSettings}
          title="설정"
        >
          <span style={{ fontSize: '1.25rem' }}>&#9881;</span>
        </button>
      </div>
      <h1>수업 성찰 일지</h1>
      <p>수능 영어 수업을 돌아보며 성장하기</p>
      {supabaseConfigured && (
        <div className="sync-status">
          <div className={`sync-dot ${getSyncStatus()}`}></div>
          <span>{getSyncText()}</span>
        </div>
      )}
    </header>
  );
}
