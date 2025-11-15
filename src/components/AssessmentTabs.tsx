import { useState, useRef, useEffect } from 'react';
import { Assessment } from '../types';

interface AssessmentTabsProps {
  assessments: Assessment[];
  activeId: string | null;
  onTabClick: (id: string) => void;
  onTabClose: (id: string) => void;
  onTabRename: (id: string, newName: string) => void;
  onNewAssessment: () => void;
  maxAssessments?: number;
}

export default function AssessmentTabs({
  assessments,
  activeId,
  onTabClick,
  onTabClose,
  onTabRename,
  onNewAssessment,
  maxAssessments = 5,
}: AssessmentTabsProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showCloseConfirm, setShowCloseConfirm] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when entering edit mode
  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  const handleDoubleClick = (assessment: Assessment) => {
    setEditingId(assessment.id);
    setEditValue(assessment.name);
  };

  const handleRenameSubmit = () => {
    if (editingId && editValue.trim()) {
      onTabRename(editingId, editValue.trim());
    }
    setEditingId(null);
    setEditValue('');
  };

  const handleRenameCancel = () => {
    setEditingId(null);
    setEditValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRenameSubmit();
    } else if (e.key === 'Escape') {
      handleRenameCancel();
    }
  };

  const handleCloseClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setShowCloseConfirm(id);
  };

  const confirmClose = () => {
    if (showCloseConfirm) {
      onTabClose(showCloseConfirm);
      setShowCloseConfirm(null);
    }
  };

  const cancelClose = () => {
    setShowCloseConfirm(null);
  };

  const assessmentToClose = assessments.find((a) => a.id === showCloseConfirm);

  return (
    <>
      <div className="bg-gray-100 border-b-2 border-gray-300 px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto">
          {assessments.map((assessment) => (
            <div
              key={assessment.id}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-t-lg border cursor-pointer
                transition-all duration-200 whitespace-nowrap
                ${
                  assessment.id === activeId
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }
              `}
              onClick={() => onTabClick(assessment.id)}
              onDoubleClick={() => handleDoubleClick(assessment)}
            >
              {editingId === assessment.id ? (
                <input
                  ref={inputRef}
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={handleRenameSubmit}
                  onKeyDown={handleKeyDown}
                  className="px-1 py-0.5 text-sm border border-gray-400 rounded text-gray-900 w-40"
                  maxLength={30}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span className="text-sm font-medium">{assessment.name}</span>
              )}

              <button
                onClick={(e) => handleCloseClick(e, assessment.id)}
                className={`
                  ml-1 w-5 h-5 flex items-center justify-center rounded
                  transition-opacity
                  ${
                    assessment.id === activeId
                      ? 'hover:bg-blue-700 text-white'
                      : 'hover:bg-gray-200 text-gray-600'
                  }
                `}
                aria-label="Close assessment"
              >
                ×
              </button>
            </div>
          ))}

          <button
            onClick={onNewAssessment}
            disabled={assessments.length >= maxAssessments}
            className={`
              px-4 py-2 rounded-lg font-medium text-sm
              transition-all duration-200
              ${
                assessments.length >= maxAssessments
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }
            `}
            title={
              assessments.length >= maxAssessments
                ? `Maximum ${maxAssessments} assessments reached`
                : 'Add new assessment'
            }
          >
            +
          </button>
        </div>
      </div>

      {/* Close Confirmation Dialog */}
      {showCloseConfirm && assessmentToClose && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Close Assessment
            </h2>
            <p className="text-gray-700 mb-6">
              Are you sure you want to close "{assessmentToClose.name}"?
              <br />
              <span className="text-sm text-gray-600">
                This action cannot be undone.
              </span>
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmClose}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
