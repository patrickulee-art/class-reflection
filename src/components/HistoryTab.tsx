'use client';

import { useState, useCallback } from 'react';
import { Reflection } from '@/lib/types';
import Modal from './Modal';

interface HistoryTabProps {
  reflections: Reflection[];
  onDelete: (id: number) => void;
  showToast: (type: 'success' | 'error', message: string) => void;
}

function formatDate(datetime: string): string {
  const date = new Date(datetime);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function HistoryTab({ reflections, onDelete, showToast }: HistoryTabProps) {
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  const openDeleteModal = useCallback((id: number) => {
    setDeleteTargetId(id);
  }, []);

  const closeDeleteModal = useCallback(() => {
    setDeleteTargetId(null);
  }, []);

  const confirmDelete = useCallback(() => {
    if (deleteTargetId !== null) {
      onDelete(deleteTargetId);
      setDeleteTargetId(null);
      showToast('success', '기록이 삭제되었습니다.');
    }
  }, [deleteTargetId, onDelete, showToast]);

  const exportData = useCallback(() => {
    if (reflections.length === 0) {
      showToast('error', '내보낼 데이터가 없습니다.');
      return;
    }

    const dataStr = JSON.stringify(reflections, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `class-reflections-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('success', 'JSON 파일이 다운로드되었습니다.');
  }, [reflections, showToast]);

  return (
    <>
      <div className="history-controls">
        <span className="history-count">{`총 ${reflections.length}개의 기록`}</span>
        <button className="btn btn-secondary" onClick={exportData}>
          <span>&#128229;</span>
          JSON 내보내기
        </button>
      </div>

      <div className="history-list">
        {reflections.length === 0 ? (
          <div className="empty-state">
            <div className="icon">&#128218;</div>
            <h3>아직 기록이 없습니다</h3>
            <p>첫 번째 수업 성찰을 작성해보세요!</p>
          </div>
        ) : (
          reflections.map((r) => (
            <div className="history-item" key={r.id}>
              <div className="history-header">
                <div className="history-meta">
                  <span className="history-date">{formatDate(r.datetime)}</span>
                  <span className="history-class">{r.className}</span>
                  <span className="history-topic">{r.topic}</span>
                </div>
                <div className="history-scores">
                  <div className="score-badge">
                    <span className="score-badge-value">{r.scores.preparation}</span>
                    <span className="score-badge-label">준비</span>
                  </div>
                  <div className="score-badge">
                    <span className="score-badge-value">{r.scores.engagement}</span>
                    <span className="score-badge-label">참여</span>
                  </div>
                  <div className="score-badge">
                    <span className="score-badge-value">{r.scores.timeManagement}</span>
                    <span className="score-badge-label">시간</span>
                  </div>
                  <div className="score-badge">
                    <span className="score-badge-value">{r.scores.satisfaction}</span>
                    <span className="score-badge-label">만족</span>
                  </div>
                  <div className="score-badge">
                    <span className="score-badge-value">{r.scores.energy}</span>
                    <span className="score-badge-label">에너지</span>
                  </div>
                </div>
              </div>
              <div className="history-content">
                <div className="history-section">
                  <div className="history-section-title">&#128218; 수업 준비 과정</div>
                  <div className="history-section-content">
                    {r.preparationProcess || '-'}
                  </div>
                </div>
                <div className="history-section">
                  <div className="history-section-title">&#128077; 잘한 점</div>
                  <div className="history-section-content">
                    {r.strengths || '-'}
                  </div>
                </div>
                <div className="history-section">
                  <div className="history-section-title">&#128736; 개선할 점</div>
                  <div className="history-section-content">
                    {r.improvements || '-'}
                  </div>
                </div>
                <div className="history-section">
                  <div className="history-section-title">&#127919; 다음 수업 적용</div>
                  <div className="history-section-content">
                    {r.actionItems || '-'}
                  </div>
                </div>
              </div>
              <div className="history-actions">
                <button
                  className="btn btn-danger"
                  onClick={() => openDeleteModal(r.id)}
                >
                  &#128465; 삭제
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteTargetId !== null}
        onClose={closeDeleteModal}
        title="&#9888; 삭제 확인"
      >
        <p>이 성찰 기록을 삭제하시겠습니까? 삭제된 기록은 복구할 수 없습니다.</p>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={closeDeleteModal}>
            취소
          </button>
          <button className="btn btn-danger" onClick={confirmDelete}>
            삭제
          </button>
        </div>
      </Modal>
    </>
  );
}
