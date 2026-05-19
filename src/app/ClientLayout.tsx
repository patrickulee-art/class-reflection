'use client';

import { ReactNode, useState, useCallback, useEffect, Component, ErrorInfo } from 'react';
import { ReflectionsProvider } from '@/contexts/ReflectionsContext';
import Sidebar from '@/components/Sidebar';

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('App error:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'system-ui' }}>
          <h2>문제가 발생했습니다</h2>
          <p style={{ color: '#6B7280', marginBottom: '20px' }}>
            앱을 다시 로드해주세요. 문제가 계속되면 브라우저 캐시를 삭제해보세요.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false });
              window.location.reload();
            }}
            style={{
              padding: '10px 24px', background: '#6366F1', color: 'white',
              border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px',
            }}
          >
            새로고침
          </button>
          <button
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}
            style={{
              padding: '10px 24px', background: '#EF4444', color: 'white',
              border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px',
              marginLeft: '10px',
            }}
          >
            캐시 삭제 후 새로고침
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

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
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
}
