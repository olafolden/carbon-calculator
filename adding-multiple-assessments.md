# Multi-Assessment Feature Implementation Plan

## Overview
Add ability to manage up to 5 carbon assessments simultaneously with tabs, using filenames as default names with rename capability.

---

## Design Decisions

Based on requirements gathering, the feature will include:

- **Compact upload in tab bar**: "+" button replaces large dropzone once assessments exist
- **Filename-based naming with rename**: Extract filename from upload, allow inline tab editing
- **Session-only storage**: No localStorage, data lost on refresh (simpler implementation)
- **Smart limit handling**: Show selection dialog when uploading 6th assessment
- **Maximum 5 assessments**: Enforced limit with graceful handling

---

## Current Architecture Analysis

### State Management
**Location**: `src/App.tsx` (Lines 10-14)

Current state is managed via React's useState hooks:
```typescript
const [result, setResult] = useState<CalculationResult | null>(null);
const [errors, setErrors] = useState<ValidationError[]>([]);
const [emissionFactors, setEmissionFactors] = useState<EmissionFactorsDatabase | null>(null);
const [loadError, setLoadError] = useState<string | null>(null);
```

**Current behavior**:
- Single assessment at a time
- Uploading new file replaces existing result
- No persistence (session-only)
- No state management library

### Current Data Flow
```
1. User uploads file (FileUpload component)
   ↓
2. File parsed and validated
   ↓
3. App.handleDataLoaded() called
   ↓
4. calculateCarbonEmissions() runs
   ↓
5. setResult() updates state
   ↓
6. ResultsDisplay and SystemChart render with result
```

### Key Components

**App.tsx** (Main component)
- Line 93: "Building Carbon Calculator" header
- Lines 88-162: Conditional rendering (upload view vs results view)

**FileUpload.tsx**
- Uses react-dropzone
- Validates JSON structure
- Calls `onDataLoaded(buildingData)` callback

**ResultsDisplay.tsx**
- Line 39: "Carbon Calculation Results" header
- Lines 40-46: "Upload New File" button (will be removed)
- Displays metrics, benchmarks, system breakdown, export options

**SystemChart.tsx**
- Uses Recharts for pie and bar charts
- Visualizes emissions by system

### Data Structures

**BuildingData** (Input):
```typescript
interface BuildingData {
  main: {
    gfa: number;
    amountOfLevels: number;
    floorToFloorHeight: number;
    floorToFloorHeightGroundFloor: number;
  };
  sLayers: SystemLayer[];
}
```

**CalculationResult** (Output):
```typescript
interface CalculationResult {
  systems: SystemCalculation[];
  totalEmissions: number;
  carbonIntensity: number;
  gfa: number;
}
```

---

## New Architecture

### New Data Structure

**Assessment Interface** (to be added to `src/types.ts`):
```typescript
interface Assessment {
  id: string;                    // Unique identifier (timestamp-based)
  name: string;                  // Filename or user-renamed
  buildingData: BuildingData;    // Original input
  result: CalculationResult;     // Calculation results
  timestamp: number;             // When uploaded (for sorting)
}
```

### New State Management

**App.tsx** state will change to:
```typescript
const [assessments, setAssessments] = useState<Assessment[]>([]);
const [activeAssessmentId, setActiveAssessmentId] = useState<string | null>(null);
const [emissionFactors, setEmissionFactors] = useState<EmissionFactorsDatabase | null>(null);
const [errors, setErrors] = useState<ValidationError[]>([]);
```

### New UI Layout

```
┌─────────────────────────────────────────────────────────┐
│ Building Carbon Calculator                              │ ← Existing header
├─────────────────────────────────────────────────────────┤
│ [Assessment 1] [building.json*] [Test×] [Factory×] [+] │ ← NEW: Tab bar
│     inactive      ACTIVE         inactive   inactive    │
├─────────────────────────────────────────────────────────┤
│ Carbon Calculation Results                              │ ← Existing results
│ (Active assessment results displayed here)              │
└─────────────────────────────────────────────────────────┘
```

**Tab Features**:
- Click tab to switch active assessment
- Click × to close assessment (with confirmation)
- Double-click/click to rename (inline editing)
- + button opens compact file picker
- Active tab highlighted
- Max 5 tabs visible

---

## Implementation Steps

### Step 1: Update Type Definitions
**File**: `src/types.ts`

Add new interfaces:
```typescript
export interface Assessment {
  id: string;
  name: string;
  buildingData: BuildingData;
  result: CalculationResult;
  timestamp: number;
}

export interface AssessmentDialogProps {
  assessments: Assessment[];
  onSelect: (id: string) => void;
  onCancel: () => void;
}
```

---

### Step 2: Create Custom Hook for Assessment Management
**File**: `src/hooks/useAssessments.ts` (NEW)

**Purpose**: Encapsulate all assessment management logic

**Functions**:
```typescript
export function useAssessments(emissionFactors: EmissionFactorsDatabase | null) {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Add new assessment (with automatic calculation)
  const addAssessment = (buildingData: BuildingData, filename: string) => {
    // Generate unique ID
    // Extract clean name from filename
    // Calculate emissions
    // Add to assessments array
    // Set as active
  };

  // Remove assessment by ID
  const removeAssessment = (id: string) => {
    // Remove from array
    // If active was removed, set next as active
  };

  // Update assessment name (for rename feature)
  const updateAssessmentName = (id: string, newName: string) => {
    // Validate name
    // Update in array
  };

  // Set active assessment
  const setActive = (id: string) => {
    setActiveId(id);
  };

  // Get active assessment object
  const activeAssessment = assessments.find(a => a.id === activeId);

  return {
    assessments,
    activeAssessment,
    activeId,
    addAssessment,
    removeAssessment,
    updateAssessmentName,
    setActive,
  };
}
```

**Helper Functions**:
- `generateUniqueId()`: Create ID from timestamp
- `extractFilename()`: Clean filename (remove .json, handle special chars)
- `ensureUniqueName()`: Handle duplicate names with (2), (3) suffixes

---

### Step 3: Create AssessmentTabs Component
**File**: `src/components/AssessmentTabs.tsx` (NEW)

**Props**:
```typescript
interface AssessmentTabsProps {
  assessments: Assessment[];
  activeId: string | null;
  onTabClick: (id: string) => void;
  onTabClose: (id: string) => void;
  onTabRename: (id: string, newName: string) => void;
  onNewAssessment: () => void;
  maxAssessments?: number; // Default 5
}
```

**Features**:
- Render scrollable tab bar
- Active tab styling (highlighted)
- Inline rename (contentEditable or input overlay)
- Close button with confirmation dialog
- "+" button for new assessment
- Disable "+" when at max capacity
- Responsive design (mobile-friendly)

**UI Structure**:
```tsx
<div className="tab-bar">
  {assessments.map(assessment => (
    <Tab
      key={assessment.id}
      active={assessment.id === activeId}
      onSelect={() => onTabClick(assessment.id)}
      onClose={() => handleClose(assessment.id)}
      onRename={(name) => onTabRename(assessment.id, name)}
    >
      {assessment.name}
    </Tab>
  ))}
  <button
    onClick={onNewAssessment}
    disabled={assessments.length >= maxAssessments}
  >
    +
  </button>
</div>
```

**Confirmation Dialog**:
- "Are you sure you want to close '{name}'? This cannot be undone."
- Confirm / Cancel buttons

---

### Step 4: Create Replace Assessment Dialog
**File**: `src/components/ReplaceAssessmentDialog.tsx` (NEW)

**Props**:
```typescript
interface ReplaceAssessmentDialogProps {
  assessments: Assessment[];
  onSelect: (id: string) => void;
  onCancel: () => void;
}
```

**Purpose**:
When user tries to upload 6th assessment, show modal asking which assessment to replace.

**UI Structure**:
```tsx
<Modal>
  <h2>Maximum Assessments Reached</h2>
  <p>You can have up to 5 assessments open. Please select which assessment to replace:</p>

  <RadioGroup>
    {assessments.map(assessment => (
      <RadioOption key={assessment.id} value={assessment.id}>
        <div>
          <strong>{assessment.name}</strong>
          <small>{formatDate(assessment.timestamp)}</small>
          <small>{assessment.result.carbonIntensity} kgCO2e/m²</small>
        </div>
      </RadioOption>
    ))}
  </RadioGroup>

  <ButtonGroup>
    <Button onClick={onCancel}>Cancel</Button>
    <Button onClick={() => onSelect(selectedId)} primary>Replace</Button>
  </ButtonGroup>
</Modal>
```

---

### Step 5: Modify App.tsx
**File**: `src/App.tsx`

**Changes**:

1. **Import new hook and components**:
```typescript
import { useAssessments } from './hooks/useAssessments';
import AssessmentTabs from './components/AssessmentTabs';
import ReplaceAssessmentDialog from './components/ReplaceAssessmentDialog';
```

2. **Replace state management**:
```typescript
// OLD:
// const [result, setResult] = useState<CalculationResult | null>(null);

// NEW:
const {
  assessments,
  activeAssessment,
  activeId,
  addAssessment,
  removeAssessment,
  updateAssessmentName,
  setActive,
} = useAssessments(emissionFactors);

const [showReplaceDialog, setShowReplaceDialog] = useState(false);
const [pendingUpload, setPendingUpload] = useState<{data: BuildingData, filename: string} | null>(null);
```

3. **Update handleDataLoaded**:
```typescript
const handleDataLoaded = (data: BuildingData, filename: string) => {
  setErrors([]);

  // Check if at max capacity
  if (assessments.length >= 5) {
    setPendingUpload({ data, filename });
    setShowReplaceDialog(true);
    return;
  }

  // Add new assessment
  addAssessment(data, filename);
};

const handleReplaceSelection = (idToReplace: string) => {
  if (pendingUpload) {
    removeAssessment(idToReplace);
    addAssessment(pendingUpload.data, pendingUpload.filename);
    setPendingUpload(null);
    setShowReplaceDialog(false);
  }
};
```

4. **Update JSX structure** (Lines 88-162):
```tsx
<div className="min-h-screen bg-gray-50">
  <header className="bg-white shadow-sm">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <h1 className="text-3xl font-bold text-gray-900">
        Building Carbon Calculator
      </h1>
    </div>
  </header>

  {/* NEW: Tab bar (only show if assessments exist) */}
  {assessments.length > 0 && (
    <AssessmentTabs
      assessments={assessments}
      activeId={activeId}
      onTabClick={setActive}
      onTabClose={removeAssessment}
      onTabRename={updateAssessmentName}
      onNewAssessment={() => {/* trigger compact file picker */}}
      maxAssessments={5}
    />
  )}

  <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    {/* Show upload if no assessments, otherwise show active assessment */}
    {assessments.length === 0 ? (
      <>
        <FileUpload onDataLoaded={handleDataLoaded} onError={setErrors} />
        {/* Error display and instructions */}
      </>
    ) : activeAssessment ? (
      <>
        <ResultsDisplay
          assessment={activeAssessment}
          emissionFactors={emissionFactors}
        />
        <SystemChart assessment={activeAssessment} />
      </>
    ) : null}
  </main>

  {/* Replace dialog */}
  {showReplaceDialog && (
    <ReplaceAssessmentDialog
      assessments={assessments}
      onSelect={handleReplaceSelection}
      onCancel={() => {
        setShowReplaceDialog(false);
        setPendingUpload(null);
      }}
    />
  )}
</div>
```

---

### Step 6: Modify FileUpload Component
**File**: `src/components/FileUpload.tsx`

**Changes**:

1. **Update props interface**:
```typescript
interface FileUploadProps {
  onDataLoaded: (data: BuildingData, filename: string) => void; // Add filename
  onError: (errors: ValidationError[]) => void;
  compact?: boolean; // NEW: for tab bar compact mode
}
```

2. **Extract filename in handleDrop** (around line 72):
```typescript
const handleDrop = useCallback((acceptedFiles: File[]) => {
  const file = acceptedFiles[0];
  const filename = file.name; // Extract filename

  // ... existing validation logic ...

  if (errors.length > 0) {
    onError(errors);
  } else {
    onDataLoaded(jsonData as BuildingData, filename); // Pass filename
  }
}, [onDataLoaded, onError]);
```

3. **Add compact mode UI** (optional, for tab bar):
```typescript
if (compact) {
  return (
    <input
      type="file"
      accept=".json"
      onChange={(e) => {
        if (e.target.files?.[0]) {
          handleDrop([e.target.files[0]]);
        }
      }}
      style={{ display: 'none' }}
      ref={fileInputRef}
    />
  );
}
```

---

### Step 7: Modify ResultsDisplay Component
**File**: `src/components/ResultsDisplay.tsx`

**Changes**:

1. **Update props interface**:
```typescript
interface ResultsDisplayProps {
  assessment: Assessment; // Instead of just result
  emissionFactors: EmissionFactorsDatabase | null;
  // Remove onReset prop - no longer needed
}
```

2. **Remove "Upload New File" button** (Lines 40-46):
```typescript
// DELETE this section:
// <button onClick={onReset}>Upload New File</button>
```

3. **Update all references**:
```typescript
// Change result.systems to assessment.result.systems
// Change result.totalEmissions to assessment.result.totalEmissions
// etc.
```

4. **Optional: Show assessment name in header**:
```typescript
<h2 className="text-2xl font-bold text-gray-900">
  Carbon Calculation Results: {assessment.name}
</h2>
```

---

### Step 8: Modify SystemChart Component
**File**: `src/components/SystemChart.tsx`

**Changes**:

1. **Update props interface**:
```typescript
interface SystemChartProps {
  assessment: Assessment; // Instead of just result
}
```

2. **Update data extraction** (Lines 13-28):
```typescript
const chartData = useMemo(() => {
  return assessment.result.systems.map(system => ({
    // ... existing logic using assessment.result instead of result
  }));
}, [assessment.result]);
```

---

## Detailed Feature Specifications

### Tab Naming Logic

**Filename Extraction**:
```typescript
function extractFilename(file: File): string {
  let name = file.name;

  // Remove .json extension
  if (name.endsWith('.json')) {
    name = name.slice(0, -5);
  }

  // Truncate if too long (max 30 chars for display)
  if (name.length > 30) {
    name = name.slice(0, 27) + '...';
  }

  return name;
}
```

**Duplicate Name Handling**:
```typescript
function ensureUniqueName(name: string, existingNames: string[]): string {
  if (!existingNames.includes(name)) {
    return name;
  }

  let counter = 2;
  let uniqueName = `${name} (${counter})`;

  while (existingNames.includes(uniqueName)) {
    counter++;
    uniqueName = `${name} (${counter})`;
  }

  return uniqueName;
}
```

### Tab Rename Feature

**Implementation**:
- Double-click tab to enter edit mode
- Show inline input field
- Validate on blur or Enter key
- Escape key cancels edit
- Prevent duplicate names
- Max 30 characters

**Validation**:
```typescript
function validateAssessmentName(name: string, existingNames: string[], currentId: string): boolean {
  // Must not be empty
  if (!name.trim()) return false;

  // Must not exceed length limit
  if (name.length > 30) return false;

  // Must be unique (excluding current assessment)
  const otherNames = existingNames.filter((_, i) => assessments[i].id !== currentId);
  if (otherNames.includes(name)) return false;

  return true;
}
```

### Close Assessment Confirmation

**Dialog Content**:
```
┌─────────────────────────────────────────┐
│ Close Assessment                        │
├─────────────────────────────────────────┤
│ Are you sure you want to close          │
│ "{assessment.name}"?                    │
│                                         │
│ This action cannot be undone.           │
├─────────────────────────────────────────┤
│              [Cancel]  [Close]          │
└─────────────────────────────────────────┘
```

**Logic**:
- Show confirmation for every close action
- If closing active tab, set next tab as active
- If closing last tab, show upload area again

### Active Tab Switching

**Behavior**:
- Click any tab to make it active
- Active tab gets distinct styling (background color, border)
- Results display updates immediately
- Charts re-render with new data

**Performance Optimization**:
- Memoize chart data for each assessment
- Only render charts for active assessment
- Use React.memo for tab components

---

## Styling Guidelines

### Tab Bar Styling
```css
/* Tab container */
.assessment-tabs {
  display: flex;
  gap: 4px;
  padding: 8px 16px;
  background: #f9fafb;
  border-bottom: 2px solid #e5e7eb;
  overflow-x: auto;
}

/* Individual tab */
.assessment-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 6px 6px 0 0;
  cursor: pointer;
  transition: all 0.2s;
}

/* Active tab */
.assessment-tab.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

/* Close button */
.tab-close {
  width: 16px;
  height: 16px;
  opacity: 0.6;
}

.tab-close:hover {
  opacity: 1;
}

/* New assessment button */
.new-assessment-btn {
  padding: 8px 16px;
  background: #10b981;
  color: white;
  border-radius: 6px;
}

.new-assessment-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

---

## Testing Checklist

### Functional Testing
- [ ] Upload first file → tab appears, upload area hidden
- [ ] Upload 5 files → all 5 tabs visible
- [ ] Upload 6th file → replacement dialog appears
- [ ] Select assessment in dialog → replaces selected, new becomes active
- [ ] Cancel replacement dialog → upload cancelled, no changes
- [ ] Click tab → switches to that assessment's results
- [ ] Click × on tab → confirmation dialog appears
- [ ] Confirm close → tab removed, next tab becomes active
- [ ] Close last tab → upload area reappears
- [ ] Double-click tab → enters edit mode
- [ ] Rename tab with valid name → name updates
- [ ] Rename tab with duplicate name → shows error, reverts
- [ ] Rename tab with empty name → shows error, reverts
- [ ] Press Escape during rename → cancels edit
- [ ] Press Enter during rename → saves name
- [ ] Click + button when at 5 tabs → button disabled
- [ ] Click + button when under 5 tabs → file picker opens

### Edge Cases
- [ ] Upload file with very long filename → truncated correctly
- [ ] Upload multiple files with same name → numbered correctly
- [ ] Close active tab → next tab becomes active smoothly
- [ ] Close only tab → returns to upload view
- [ ] Upload file with special characters → filename sanitized
- [ ] Upload file with no extension → handled gracefully
- [ ] Rapid tab switching → no race conditions
- [ ] Multiple rapid uploads → handled in order

### UI/UX Testing
- [ ] Tab bar scrolls horizontally when tabs overflow
- [ ] Active tab clearly distinguished visually
- [ ] Hover states work on tabs and buttons
- [ ] Close button visible and clickable
- [ ] Confirmation dialogs are modal and centered
- [ ] Tab names are readable (good font size, contrast)
- [ ] Responsive on mobile (tabs stack or scroll)
- [ ] Keyboard navigation works (Tab, Enter, Escape)

### Data Integrity
- [ ] Switching tabs doesn't lose data
- [ ] Calculations remain accurate across switches
- [ ] Export works for active assessment
- [ ] Charts update correctly when switching
- [ ] Error states don't carry over between assessments

### Performance
- [ ] No lag when switching between 5 assessments
- [ ] Charts don't re-render unnecessarily
- [ ] Memory usage stays reasonable with 5 large assessments
- [ ] File upload speed unchanged

---

## Migration Strategy

### Phase 1: Foundation (Day 1)
1. Add Assessment interface to types.ts
2. Create useAssessments hook
3. Test hook in isolation

### Phase 2: Core Components (Day 1-2)
1. Create AssessmentTabs component
2. Create ReplaceAssessmentDialog component
3. Test components in Storybook or isolation

### Phase 3: Integration (Day 2)
1. Refactor App.tsx to use new state
2. Update FileUpload to return filename
3. Update ResultsDisplay props
4. Update SystemChart props
5. Wire everything together

### Phase 4: Polish (Day 2-3)
1. Add rename functionality
2. Add close confirmations
3. Style improvements
4. Responsive design
5. Accessibility improvements

### Phase 5: Testing (Day 3)
1. Manual testing of all features
2. Edge case testing
3. Performance testing
4. Bug fixes

---

## Potential Challenges & Solutions

### Challenge 1: Tab Bar Overflow on Mobile
**Problem**: 5 tabs might not fit on small screens

**Solution**:
- Make tab bar horizontally scrollable
- Alternative: Dropdown selector for tabs on mobile
- Show maximum 3 tabs + dropdown on screens < 768px

### Challenge 2: Memory Usage with Large Files
**Problem**: 5 large building JSON files might consume significant memory

**Solution**:
- Monitor memory usage during testing
- Consider implementing lazy chart rendering
- Add warning if file size exceeds threshold
- Limit file size to 5MB (already in place)

### Challenge 3: State Complexity
**Problem**: Managing multiple assessments adds complexity

**Solution**:
- Encapsulate all logic in useAssessments hook
- Keep App.tsx clean with minimal logic
- Use TypeScript for type safety
- Add comprehensive comments

### Challenge 4: Accidental Data Loss
**Problem**: Users might accidentally close assessments

**Solution**:
- Always show confirmation before closing
- Make confirmation message clear
- Consider adding "Undo" functionality (advanced)

### Challenge 5: Tab Naming Conflicts
**Problem**: Multiple uploads of same filename

**Solution**:
- Auto-increment with (2), (3), etc.
- Allow users to rename immediately after upload
- Validate uniqueness on rename

---

## Future Enhancements (Out of Scope)

These features are not part of the current plan but could be added later:

1. **Persistent Storage**
   - Save assessments to localStorage
   - Load on app mount
   - Add "Clear All" button

2. **Comparison Mode**
   - Select multiple assessments to compare
   - Show side-by-side charts
   - Highlight differences

3. **Assessment History**
   - Track changes over time
   - Version control for assessments
   - Restore previous versions

4. **Export All**
   - Export all 5 assessments as single ZIP
   - Batch export to CSV
   - Generate comparison report

5. **Drag to Reorder**
   - Drag tabs to reorder
   - Custom sorting options

6. **Color Coding**
   - Assign colors to assessments
   - Visual distinction in tabs

7. **Keyboard Shortcuts**
   - Ctrl+N for new assessment
   - Ctrl+W to close active tab
   - Ctrl+1-5 to switch tabs

---

## File Structure Summary

```
src/
├── components/
│   ├── AssessmentTabs.tsx          ← NEW
│   ├── ReplaceAssessmentDialog.tsx ← NEW
│   ├── FileUpload.tsx              ← MODIFY (add filename extraction)
│   ├── ResultsDisplay.tsx          ← MODIFY (accept assessment prop)
│   ├── SystemChart.tsx             ← MODIFY (accept assessment prop)
│   └── ...
├── hooks/
│   └── useAssessments.ts           ← NEW (main logic)
├── types.ts                        ← MODIFY (add Assessment interface)
├── App.tsx                         ← MODIFY (major refactor)
└── ...
```

---

## Estimated Timeline

- **Day 1**: Type definitions, useAssessments hook, basic components (6-8 hours)
- **Day 2**: Integration, refactor App.tsx, wire everything together (6-8 hours)
- **Day 3**: Polish, styling, testing, bug fixes (4-6 hours)

**Total**: 16-22 hours of development time

---

## Success Criteria

The feature will be considered complete when:

1. ✅ Users can upload up to 5 assessments
2. ✅ Tabs appear between header and results
3. ✅ Filenames are used as default tab names
4. ✅ Users can rename tabs inline
5. ✅ Clicking tabs switches active assessment
6. ✅ Close button removes assessments with confirmation
7. ✅ 6th upload triggers replacement dialog
8. ✅ All existing functionality still works
9. ✅ No data loss when switching tabs
10. ✅ Responsive design works on mobile

---

## Notes

- Session-only storage means assessments are lost on page refresh
- No backend changes needed (client-side only)
- Existing emission factors and calculation logic unchanged
- All validation rules remain the same
- Export functionality works per-assessment
