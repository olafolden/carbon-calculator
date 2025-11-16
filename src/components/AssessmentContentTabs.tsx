import React, { useRef, useCallback } from 'react';
import type { AssessmentContentTabsProps, AssessmentContentTabType } from '../types';
import { ASSESSMENT_CONTENT_TABS } from '../types';

// Static tabs array - prevents recreation on every render
const TABS: AssessmentContentTabType[] = ['carbon-report', 's-layers'];

/**
 * Tab navigation component for switching between Carbon Report and S-Layers views
 *
 * Provides accessible tab navigation with keyboard support (arrow keys, Home, End)
 * and proper ARIA attributes for screen readers.
 *
 * @param activeTab - Currently active tab
 * @param onTabChange - Callback when user switches tabs
 * @param assessmentId - Assessment ID for ARIA controls
 *
 * @example
 * ```tsx
 * <AssessmentContentTabs
 *   activeTab={activeContentTab}
 *   onTabChange={setActiveContentTab}
 *   assessmentId={assessment.id}
 * />
 * ```
 */
export const AssessmentContentTabs: React.FC<AssessmentContentTabsProps> = React.memo(({
  activeTab,
  onTabChange,
  assessmentId,
}) => {
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);

  /**
   * Handles keyboard navigation between tabs
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent, currentIndex: number) => {
    let nextIndex: number | null = null;

    switch (e.key) {
      case 'ArrowLeft':
        // Move to previous tab (wrap around)
        nextIndex = currentIndex > 0 ? currentIndex - 1 : TABS.length - 1;
        break;
      case 'ArrowRight':
        // Move to next tab (wrap around)
        nextIndex = currentIndex < TABS.length - 1 ? currentIndex + 1 : 0;
        break;
      case 'Home':
        // Jump to first tab
        nextIndex = 0;
        break;
      case 'End':
        // Jump to last tab
        nextIndex = TABS.length - 1;
        break;
      default:
        return;
    }

    if (nextIndex !== null) {
      e.preventDefault();
      const nextTab = TABS[nextIndex];
      onTabChange(nextTab);
      // Focus the next tab button
      tabsRef.current[nextIndex]?.focus();
    }
  }, [onTabChange]);

  /**
   * Handles tab click with focus management
   */
  const handleTabClick = useCallback((tab: AssessmentContentTabType, index: number) => {
    onTabChange(tab);
    // Only focus if not already focused (prevents conflicts with keyboard navigation)
    if (document.activeElement !== tabsRef.current[index]) {
      tabsRef.current[index]?.focus();
    }
  }, [onTabChange]);

  return (
    <div className="border-b-2 border-gray-300 bg-gray-100">
      <div
        role="tablist"
        aria-label="Assessment content views"
        className="flex gap-2 px-4 py-2"
      >
        {TABS.map((tab, index) => {
          const isActive = activeTab === tab;
          const tabId = `content-tab-${assessmentId}-${tab}`;
          const panelId = `content-tabpanel-${assessmentId}-${tab}`;

          return (
            <button
              key={tab}
              ref={(el) => (tabsRef.current[index] = el)}
              role="tab"
              id={tabId}
              aria-selected={isActive}
              aria-controls={panelId}
              tabIndex={isActive ? 0 : -1}
              onClick={() => handleTabClick(tab, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={`
                px-6 py-2 rounded-t-lg font-medium text-sm border-2 transition-colors
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                ${
                  isActive
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }
              `}
            >
              {ASSESSMENT_CONTENT_TABS[tab]}
            </button>
          );
        })}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for React.memo optimization
  // Include onTabChange to prevent stale closures
  return (
    prevProps.activeTab === nextProps.activeTab &&
    prevProps.assessmentId === nextProps.assessmentId &&
    prevProps.onTabChange === nextProps.onTabChange
  );
});

AssessmentContentTabs.displayName = 'AssessmentContentTabs';
