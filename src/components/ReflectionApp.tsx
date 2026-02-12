'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from './Header';
import Tabs, { TabId } from './Tabs';
import WriteTab from './WriteTab';
import HistoryTab from './HistoryTab';
import StatsTab from './StatsTab';
import SettingsModal from './SettingsModal';
import Toast from './Toast';
import { useReflections } from '@/hooks/useReflections';
import { useToast } from '@/hooks/useToast';
import { getSupabaseClient } from '@/lib/supabase';

export default function ReflectionApp() {
  const [activeTab, setActiveTab] = useState<TabId>('write');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [supabaseConfigured, setSupabaseConfigured] = useState(false);

  const {
    reflections,
    addReflection,
    deleteReflection,
    syncWithSupabase,
    isSyncing,
    isOnline,
  } = useReflections();

  const { toast, showToast } = useToast();

  // Check Supabase configuration and sync on mount
  useEffect(() => {
    const client = getSupabaseClient();
    if (client) {
      setSupabaseConfigured(true);
      syncWithSupabase();
    }
  }, [syncWithSupabase]);

  const handleSettingsSave = useCallback(() => {
    const client = getSupabaseClient();
    if (client) {
      setSupabaseConfigured(true);
      syncWithSupabase();
    }
  }, [syncWithSupabase]);

  return (
    <div className="container">
      <Header
        isOnline={isOnline}
        isSyncing={isSyncing}
        onOpenSettings={() => setSettingsOpen(true)}
        supabaseConfigured={supabaseConfigured}
      />

      <Tabs activeTab={activeTab} onTabChange={setActiveTab} />

      <div className={`tab-content ${activeTab === 'write' ? 'active' : ''}`}>
        {activeTab === 'write' && (
          <WriteTab onSubmit={addReflection} showToast={showToast} />
        )}
      </div>

      <div className={`tab-content ${activeTab === 'history' ? 'active' : ''}`}>
        {activeTab === 'history' && (
          <HistoryTab
            reflections={reflections}
            onDelete={deleteReflection}
            showToast={showToast}
          />
        )}
      </div>

      <div className={`tab-content ${activeTab === 'stats' ? 'active' : ''}`}>
        {activeTab === 'stats' && <StatsTab reflections={reflections} />}
      </div>

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSave={handleSettingsSave}
        showToast={showToast}
      />

      <Toast toast={toast} />
    </div>
  );
}
