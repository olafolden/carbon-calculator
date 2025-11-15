import { useState, useRef, useEffect } from 'react';
import { Assessment } from '../types';
import { MAX_ASSESSMENT_NAME_LENGTH } from '../constants';

interface AssessmentTabsProps {
  assessments: Assessment[];
  activeId: string | null;
  onTabClick: (id: string) => void;
  onTabClose: (id: string) => void;
  onTabRename: (id: string, newName: string) => { success: boolean; error?: string };
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
  const [renameError, setRenameError] = useState<string | null>(null);
  const [showCloseConfirm, setShowCloseConfirm] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

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
    setRenameError(null);
  };

  const handleRenameSubmit = () => {
    if (editingId && editValue.trim()) {
      const result = onTabRename(editingId, editValue.trim());

      if (!result.success) {
        // Show error - keep edit mode active
        setRenameError(result.error || 'Failed to rename assessment');
        return;
      }
    }
    setEditingId(null);
    setEditValue('');
    setRenameError(null);
  };

  const handleRenameCancel = () => {
    setEditingId(null);
    setEditValue('');
    setRenameError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRenameSubmit();
    } else if (e.key === 'Escape') {
      handleRenameCancel();
    }
  };

  const handleTabKeyDown = (e: React.KeyboardEvent, index: number) => {
    let nextIndex: number | null = null;

    switch (e.key) {
      case 'ArrowLeft':
        nextIndex = index > 0 ? index - 1 : assessments.length - 1;
        break;
      case 'ArrowRight':
        nextIndex = index < assessments.length - 1 ? index + 1 : 0;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = assessments.length - 1;
        break;
      default:
        return;
    }

    if (nextIndex !== null) {
      e.preventDefault();
      onTabClick(assessments[nextIndex].id);
      // Focus the next tab
      const tabElements = document.querySelectorAll('[role="tab"]');
      (tabElements[nextIndex] as HTMLElement)?.focus();
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

  // Focus trapping for dialog
  useEffect(() => {
    if (showCloseConfirm && dialogRef.current) {
      const previouslyFocused = document.activeElement as HTMLElement;

      // Focus first focusable element in dialog
      const focusableElements = dialogRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (focusableElements.length > 0) {
        (focusableElements[0] as HTMLElement).focus();
      }

      // Trap focus
      const handleTab = (e: KeyboardEvent) => {
        if (e.key !== 'Tab' || !dialogRef.current) return;

        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      };

      // Close on Escape
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          cancelClose();
        }
      };

      document.addEventListener('keydown', handleTab);
      document.addEventListener('keydown', handleEscape);

      return () => {
        document.removeEventListener('keydown', handleTab);
        document.removeEventListener('keydown', handleEscape);
        previouslyFocused?.focus();
      };
    }
  }, [showCloseConfirm]);

  return (
    <>
      <div className="bg-gray-100 border-b-2 border-gray-300 px-4 py-2">
        <div
          role="tablist"
          aria-label="Assessment tabs"
          className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto"
        >
          {assessments.map((assessment, index) => (
            <div
              key={assessment.id}
              role="tab"
              id={`tab-${assessment.id}`}
              aria-selected={assessment.id === activeId}
              aria-controls={`tabpanel-${assessment.id}`}
              tabIndex={assessment.id === activeId ? 0 : -1}
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
              onKeyDown={(e) => handleTabKeyDown(e, index)}
            >
              {editingId === assessment.id ? (
                <div className="flex flex-col" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-1">
                    <input
                      ref={inputRef}
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className={`px-1 py-0.5 text-sm border rounded text-gray-900 w-32 ${
                        renameError ? 'border-red-500' : 'border-gray-400'
                      }`}
                      maxLength={MAX_ASSESSMENT_NAME_LENGTH}
                      aria-invalid={!!renameError}
                      aria-describedby={renameError ? 'rename-error' : undefined}
                    />
                    <button
                      onClick={handleRenameSubmit}
                      className="p-1 text-green-600 hover:bg-green-100 rounded text-sm"
                      title="Save"
                      aria-label="Save name"
                    >
                      ✓
                    </button>
                    <button
                      onClick={handleRenameCancel}
                      className="p-1 text-red-600 hover:bg-red-100 rounded text-sm"
                      title="Cancel"
                      aria-label="Cancel rename"
                    >
                      ✗
                    </button>
                  </div>
                  {renameError && (
                    <span id="rename-error" className="text-xs text-red-600 mt-1">
                      {renameError}
                    </span>
                  )}
                </div>
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
                aria-label={`Close ${assessment.name}`}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
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
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="dialog-title"
        >
          <div ref={dialogRef} className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h2 id="dialog-title" className="text-xl font-bold text-gray-900 mb-4">
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
