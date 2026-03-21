'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useReflectionsContext } from '@/contexts/ReflectionsContext';
import { Reflection } from '@/lib/types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
}

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

function formatReflectionDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const mm = d.getMonth() + 1;
  const dd = d.getDate();
  const day = DAY_NAMES[d.getDay()];
  return `${mm}/${dd}(${day})`;
}

function getReflectionLabel(r: Reflection): string {
  if (r.courseTitle) {
    const session = r.sessionNumber ? ` ${r.sessionNumber}` : '';
    return `${r.courseTitle}${session}`;
  }
  return formatReflectionDate(r.date || r.createdAt);
}

export default function Sidebar({ isOpen, onClose, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { reflections } = useReflectionsContext();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const sortedReflections = useMemo(() => {
    return [...reflections].sort((a, b) => {
      const dateA = a.date || a.createdAt;
      const dateB = b.date || b.createdAt;
      return dateB.localeCompare(dateA);
    });
  }, [reflections]);

  const filteredReflections = useMemo(() => {
    if (!searchQuery.trim()) return sortedReflections;
    const q = searchQuery.toLowerCase();
    return sortedReflections.filter((r) => {
      const label = getReflectionLabel(r).toLowerCase();
      const date = formatReflectionDate(r.date || r.createdAt).toLowerCase();
      return label.includes(q) || date.includes(q);
    });
  }, [sortedReflections, searchQuery]);

  const handleRecentClick = (reflection: Reflection) => {
    localStorage.setItem('view_reflection_id', String(reflection.id));
    router.push('/reflections');
  };

  const handleSearchToggle = () => {
    if (searchOpen) {
      setSearchQuery('');
    }
    setSearchOpen(!searchOpen);
  };

  return (
    <>
      {isOpen && (
        <div className="sidebar-overlay" onClick={onClose} />
      )}
      <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <span className="sidebar-logo">수업 설계/회고</span>
          <button
            className="sidebar-toggle-btn"
            onClick={onToggle}
            aria-label="사이드바 접기/펼치기"
            title="사이드바 접기/펼치기"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="9" y1="3" x2="9" y2="21" />
            </svg>
          </button>
        </div>

        <nav className="sidebar-menu">
          <Link
            href="/"
            className={`sidebar-menu-item ${pathname === '/' ? 'active' : ''}`}

          >
            <span className="sidebar-menu-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </span>
            <span>홈</span>
          </Link>

          <Link
            href="/write?new=true"
            className="sidebar-menu-item sidebar-menu-item-new"

          >
            <span className="sidebar-menu-icon">+</span>
            <span>새 회고 작성</span>
          </Link>

          <Link
            href="/reflections"
            className={`sidebar-menu-item ${pathname === '/reflections' ? 'active' : ''}`}

          >
            <span className="sidebar-menu-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </span>
            <span>저장된 회고</span>
          </Link>

          <button
            className={`sidebar-menu-item ${searchOpen ? 'active' : ''}`}
            onClick={handleSearchToggle}
          >
            <span className="sidebar-menu-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <span>검색</span>
          </button>

          {searchOpen && (
            <div className="sidebar-search-box">
              <input
                type="text"
                className="sidebar-search-input"
                placeholder="제목, 차시로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              {searchQuery && (
                <button
                  className="sidebar-search-clear"
                  onClick={() => setSearchQuery('')}
                  aria-label="검색어 지우기"
                >
                  x
                </button>
              )}
            </div>
          )}

          <Link
            href="/settings"
            className={`sidebar-menu-item ${pathname === '/settings' ? 'active' : ''}`}

          >
            <span className="sidebar-menu-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </span>
            <span>설정</span>
          </Link>
        </nav>

        <div className="sidebar-recents">
          <div className="sidebar-recents-title">최근 회고</div>
          <div className="sidebar-recents-list">
            {filteredReflections.length === 0 ? (
              <div className="sidebar-recents-empty">
                {searchQuery ? '검색 결과가 없습니다' : '저장된 회고가 없습니다'}
              </div>
            ) : (
              filteredReflections.map((r) => (
                <button
                  key={r.id}
                  className="sidebar-recent-item"
                  onClick={() => handleRecentClick(r)}
                >
                  <span className="sidebar-recent-label">
                    {getReflectionLabel(r)}
                  </span>
                  <span className="sidebar-recent-date">
                    {formatReflectionDate(r.date || r.createdAt)}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
