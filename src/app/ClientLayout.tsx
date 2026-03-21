'use client';

import { ReactNode, useState, useCallback, useEffect } from 'react';
import { ReflectionsProvider } from '@/contexts/ReflectionsContext';
import Sidebar from '@/components/Sidebar';

const SIDEBAR_STATE_KEY = 'sidebar_open_v1';

export default function ClientLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Load saved sidebar state (desktop only)
  useEffect(() => {
    const isDesktop = window.matchMedia('(min-width: 769px)').matches;
    if (isDesktop) {
      const saved = localStorage.getItem(SIDEBAR_STATE_KEY);
      setSidebarOpen(saved !== 'false');
    } else {
      setSidebarOpen(false);
    }
    setInitialized(true);
  }, []);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
    localStorage.setItem(SIDEBAR_STATE_KEY, 'false');
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_STATE_KEY, String(next));
      return next;
    });
  }, []);

  return (
    <ReflectionsProvider>
      <div className={`main-layout ${sidebarOpen ? 'sidebar-expanded' : 'sidebar-collapsed'}`}>
        <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} onToggle={toggleSidebar} />
        {!sidebarOpen && (
          <button
            className="hamburger-btn"
            onClick={toggleSidebar}
            aria-label="메뉴 열기"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        )}
        <div className={`app-content ${initialized ? '' : 'app-content-init'}`}>
          {children}
        </div>
      </div>
    </ReflectionsProvider>
  );
}
