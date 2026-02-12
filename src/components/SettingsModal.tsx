'use client';

import { useState, useEffect } from 'react';
import Modal from './Modal';
import { getSupabaseConfig, reinitializeSupabase } from '@/lib/supabase';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  showToast: (type: 'success' | 'error', message: string) => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  onSave,
  showToast,
}: SettingsModalProps) {
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');

  useEffect(() => {
    if (isOpen) {
      const config = getSupabaseConfig();
      setUrl(config.url);
      setKey(config.key);
    }
  }, [isOpen]);

  const handleSave = () => {
    if (!url.trim() || !key.trim()) {
      showToast('error', '모두 입력해주세요.');
      return;
    }

    reinitializeSupabase(url.trim(), key.trim());
    onClose();
    onSave();
    showToast('success', '저장되었습니다.');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="&#9881; 동기화 설정 (Supabase)">
      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
        컴퓨터와 휴대폰 간 데이터를 동기화하려면 Supabase 프로젝트 정보가 필요합니다.
      </p>
      <div className="form-group">
        <label>Project URL</label>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://your-project.supabase.co"
        />
      </div>
      <div className="form-group">
        <label>Anon Public Key</label>
        <input
          type="text"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="your-anon-key"
        />
      </div>
      <div className="modal-actions" style={{ marginTop: '20px' }}>
        <button className="btn btn-secondary" onClick={onClose}>
          닫기
        </button>
        <button className="btn btn-primary" onClick={handleSave}>
          설정 저장
        </button>
      </div>
    </Modal>
  );
}
