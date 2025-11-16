# Feature Update 2: Custom Emission Factors

## Overview
This feature allows users to customize emission factors on a per-assessment basis. Users can view the emission factor library, filter/search for specific factors, and override values before recalculation.

**Date:** 2025-11-15

---

## Feature Requirements

### User Requirements
1. After uploading building data and seeing initial results, users can customize emission factors
2. Custom emission factors are isolated per assessment (changes don't affect other assessments)
3. Users can filter the emission factor library by:
   - System type (Skin, Superstructure, Substructure)
   - Unit type (area-based kgCO2e/m² vs length-based kgCO2e/m)
   - Search by name/material description
4. Users can override any emission factor value
5. Customization UI appears in a modal/dialog overlay
6. Assessment recalculates automatically when custom factors are saved

### Technical Requirements
1. Store custom emission factors with each assessment
2. Merge custom factors with defaults (custom overrides default)
3. Provide visual indicators showing which factors are customized
4. Maintain backward compatibility with existing assessments
5. Keep UI visually simple while mechanics are functional

---

## Design Decisions

### Architecture Decisions

**1. Per-Assessment Custom Factors**
- Each `Assessment` object stores optional `customEmissionFactors`
- Custom factors are merged with global defaults at calculation time
- Provides maximum flexibility without affecting other assessments

**2. Modal-Based UI**
- Dedicated modal for emission factor editing
- Keeps main results view clean and uncluttered
- Allows focused editing experience with filters

**3. Non-Destructive Editing**
- Original emission factors JSON remains unchanged
- Custom factors stored alongside assessment data
- Users can reset individual factors to defaults

**4. System Classification**
- Emission factors categorized by building system
- Mapping based on industry-standard component groupings:
  - **Skin:** Roof, Facade, Glazing, External Wall
  - **Superstructure:** Beams, Columns, Floor Slabs, Core Wall, Staircase
  - **Substructure:** Foundation, Basement Wall, Pile, Ground Floor Slab

---

## Current Architecture Analysis

### Existing Emission Factor Flow

```
emissionFactors.json (static file)
        ↓
App.tsx (loads on mount)
        ↓
useAssessments hook (receives global factors)
        ↓
calculateCarbonEmissions() (uses for all calculations)
        ↓
Results displayed
```

### Current Data Structures

**EmissionFactor Interface:**
```typescript
interface EmissionFactor {
  factor: number;           // Emission value
  unit: 'kgCO2e/m²' | 'kgCO2e/m';
  material: string;         // Description
}
```

**EmissionFactorsDatabase Type:**
```typescript
type EmissionFactorsDatabase = Record<string, EmissionFactor>;
```

**Current Assessment Interface:**
```typescript
interface Assessment {
  id: string;
  name: string;
  buildingData: BuildingData;
  result: CalculationResult;
  timestamp: number;
}
```

---

## New Architecture

### Updated Data Flow

```
emissionFactors.json (global defaults)
        ↓
App.tsx (loads defaults)
        ↓
Assessment with optional customEmissionFactors
        ↓
calculateCarbonEmissions(buildingData, defaultFactors, customFactors?)
  ├─ Merge: custom overrides default
  └─ Use merged factors for calculation
        ↓
Results displayed with customization indicators
```

### New Data Structures

**Updated Assessment Interface:**
```typescript
interface Assessment {
  id: string;
  name: string;
  buildingData: BuildingData;
  result: CalculationResult;
  timestamp: number;
  customEmissionFactors?: EmissionFactorsDatabase;  // NEW
}
```

**New Helper Types:**
```typescript
interface EmissionFactorWithMeta extends EmissionFactor {
  id: string;              // Layer ID
  system: SystemType;      // Which building system
  isCustomized: boolean;   // Whether user has overridden
}

type SystemType = 'Skin' | 'Superstructure' | 'Substructure';

interface EmissionFactorModalProps {
  defaultFactors: EmissionFactorsDatabase;
  customFactors?: EmissionFactorsDatabase;
  onSave: (customFactors: EmissionFactorsDatabase) => void;
  onClose: () => void;
}
```

---

## Implementation Details

### Step 1: Type Definitions Update

**File:** `src/types/index.ts`

**Changes:**
1. Add `customEmissionFactors?: EmissionFactorsDatabase` to `Assessment` interface
2. Add new interfaces for emission factor editing:

```typescript
export interface EmissionFactorWithMeta extends EmissionFactor {
  id: string;
  system: SystemType;
  isCustomized: boolean;
}

export type SystemType = 'Skin' | 'Superstructure' | 'Substructure';

export interface EmissionFactorModalProps {
  defaultFactors: EmissionFactorsDatabase;
  customFactors?: EmissionFactorsDatabase;
  onSave: (customFactors: EmissionFactorsDatabase) => void;
  onClose: () => void;
}
```

---

### Step 2: Emission Factor Helpers Utility

**File:** `src/utils/emissionFactorHelpers.ts` (NEW)

**Purpose:** Categorization, filtering, and searching of emission factors

**Functions:**

**1. System Classification:**
```typescript
export const SYSTEM_MAPPING: Record<string, SystemType> = {
  // Skin
  'Roof': 'Skin',
  'Facade': 'Skin',
  'Glazing': 'Skin',
  'External Wall': 'Skin',

  // Superstructure
  'Beam -8.4 m': 'Superstructure',
  'Beam -6.3 m': 'Superstructure',
  'Column -8.4 m': 'Superstructure',
  'Column -6.3 m': 'Superstructure',
  'Floor Slab': 'Superstructure',
  'Composite Floor': 'Superstructure',
  'Core Wall': 'Superstructure',
  'Staircase': 'Superstructure',

  // Substructure
  'Foundation': 'Substructure',
  'Basement Wall': 'Substructure',
  'Pile': 'Substructure',
  'Ground Floor Slab': 'Substructure',
};

export function getSystemForLayer(layerId: string): SystemType {
  return SYSTEM_MAPPING[layerId] || 'Superstructure';
}
```

**2. Enrichment Function:**
```typescript
export function enrichEmissionFactors(
  defaultFactors: EmissionFactorsDatabase,
  customFactors?: EmissionFactorsDatabase
): EmissionFactorWithMeta[] {
  return Object.entries(defaultFactors).map(([id, factor]) => ({
    id,
    ...factor,
    system: getSystemForLayer(id),
    isCustomized: customFactors?.[id] !== undefined,
    // Use custom value if exists, otherwise default
    factor: customFactors?.[id]?.factor ?? factor.factor,
  }));
}
```

**3. Filter Functions:**
```typescript
export function filterBySystem(
  factors: EmissionFactorWithMeta[],
  system: SystemType | 'All'
): EmissionFactorWithMeta[] {
  if (system === 'All') return factors;
  return factors.filter(f => f.system === system);
}

export function filterByUnit(
  factors: EmissionFactorWithMeta[],
  unit: 'kgCO2e/m²' | 'kgCO2e/m' | 'All'
): EmissionFactorWithMeta[] {
  if (unit === 'All') return factors;
  return factors.filter(f => f.unit === unit);
}

export function searchFactors(
  factors: EmissionFactorWithMeta[],
  searchTerm: string
): EmissionFactorWithMeta[] {
  if (!searchTerm.trim()) return factors;

  const term = searchTerm.toLowerCase();
  return factors.filter(f =>
    f.id.toLowerCase().includes(term) ||
    f.material.toLowerCase().includes(term)
  );
}
```

**4. Merge Function:**
```typescript
export function mergeEmissionFactors(
  defaultFactors: EmissionFactorsDatabase,
  customFactors?: EmissionFactorsDatabase
): EmissionFactorsDatabase {
  if (!customFactors) return defaultFactors;

  return {
    ...defaultFactors,
    ...customFactors,
  };
}
```

---

### Step 3: EmissionFactorModal Component

**File:** `src/components/EmissionFactorModal.tsx` (NEW)

**Purpose:** Modal UI for viewing and editing emission factors

**Component Structure:**

```typescript
import React, { useState, useMemo } from 'react';
import { EmissionFactorsDatabase, EmissionFactorWithMeta, SystemType } from '../types';
import { enrichEmissionFactors, filterBySystem, filterByUnit, searchFactors } from '../utils/emissionFactorHelpers';

interface EmissionFactorModalProps {
  defaultFactors: EmissionFactorsDatabase;
  customFactors?: EmissionFactorsDatabase;
  onSave: (customFactors: EmissionFactorsDatabase) => void;
  onClose: () => void;
}

export default function EmissionFactorModal({
  defaultFactors,
  customFactors,
  onSave,
  onClose
}: EmissionFactorModalProps) {
  // State
  const [editedFactors, setEditedFactors] = useState<EmissionFactorsDatabase>(
    customFactors || {}
  );
  const [systemFilter, setSystemFilter] = useState<SystemType | 'All'>('All');
  const [unitFilter, setUnitFilter] = useState<'kgCO2e/m²' | 'kgCO2e/m' | 'All'>('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Enrich and filter factors
  const displayedFactors = useMemo(() => {
    let factors = enrichEmissionFactors(defaultFactors, editedFactors);
    factors = filterBySystem(factors, systemFilter);
    factors = filterByUnit(factors, unitFilter);
    factors = searchFactors(factors, searchTerm);
    return factors;
  }, [defaultFactors, editedFactors, systemFilter, unitFilter, searchTerm]);

  // Handlers
  const handleFactorChange = (id: string, newValue: number) => {
    setEditedFactors(prev => ({
      ...prev,
      [id]: {
        ...defaultFactors[id],
        factor: newValue,
      }
    }));
  };

  const handleResetFactor = (id: string) => {
    setEditedFactors(prev => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
  };

  const handleResetAll = () => {
    setEditedFactors({});
  };

  const handleSave = () => {
    onSave(editedFactors);
    onClose();
  };

  return (
    // Modal UI implementation
  );
}
```

**UI Layout:**

```
┌─────────────────────────────────────────────────────────┐
│ Customize Emission Factors                         [X]  │
├─────────────────────────────────────────────────────────┤
│ Filters:                                                │
│ System: [All ▾] Unit: [All ▾] Search: [________]       │
│                                         [Reset All]     │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Layer ID          | Material       | Unit  | Factor │ │
│ │───────────────────────────────────────────────────── │ │
│ │ Roof              | Typical roof.. | m²    | [12.5] │ │
│ │ Facade *          | Curtain wall.. | m²    | [45.2] │ │ * = customized
│ │ Beam -8.4 m       | Steel beam..   | m     | [650]  │ │
│ │ ...                                                  │ │
│ └─────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│                                    [Cancel]  [Save]     │
└─────────────────────────────────────────────────────────┘
```

**Features:**
- Filters: System dropdown, Unit dropdown, Search input
- Table with editable factor values
- Visual indicator (*) for customized factors
- "Reset" button per factor
- "Reset All" button
- Cancel/Save actions

---

### Step 4: Update useAssessments Hook

**File:** `src/hooks/useAssessments.ts`

**Changes:**

**1. Add new function:**
```typescript
const updateAssessmentEmissionFactors = (
  id: string,
  customFactors: EmissionFactorsDatabase
) => {
  setAssessments(prev => {
    const updated = prev.map(assessment => {
      if (assessment.id !== id) return assessment;

      // Store custom factors
      const updatedAssessment = {
        ...assessment,
        customEmissionFactors: Object.keys(customFactors).length > 0
          ? customFactors
          : undefined,
      };

      // Recalculate with new factors
      if (emissionFactors) {
        const mergedFactors = mergeEmissionFactors(emissionFactors, customFactors);
        const result = calculateCarbonEmissions(
          assessment.buildingData,
          mergedFactors
        );
        updatedAssessment.result = result;
      }

      return updatedAssessment;
    });

    return updated;
  });
};
```

**2. Return in hook:**
```typescript
return {
  assessments,
  activeAssessment,
  activeId,
  addAssessment,
  removeAssessment,
  updateAssessmentName,
  updateAssessmentEmissionFactors,  // NEW
  setActive,
};
```

---

### Step 5: Update Calculator

**File:** `src/utils/calculator.ts`

**Changes:**

**Modify `calculateCarbonEmissions` signature (line ~204):**

```typescript
// OLD:
export function calculateCarbonEmissions(
  buildingData: BuildingData,
  emissionFactors: EmissionFactorsDatabase
): CalculationResult

// NEW:
export function calculateCarbonEmissions(
  buildingData: BuildingData,
  emissionFactors: EmissionFactorsDatabase,
  customEmissionFactors?: EmissionFactorsDatabase  // NEW parameter
): CalculationResult {
  // Merge custom factors with defaults
  const mergedFactors = customEmissionFactors
    ? { ...emissionFactors, ...customEmissionFactors }
    : emissionFactors;

  // Use mergedFactors in all calculations instead of emissionFactors
  // ... rest of function remains the same, just replace references
}
```

**Note:** Update all `emissionFactors[layer.id]` references to use `mergedFactors[layer.id]`

---

### Step 6: Update ResultsDisplay Component

**File:** `src/components/ResultsDisplay.tsx`

**Changes:**

**1. Add imports:**
```typescript
import { useState } from 'react';
import EmissionFactorModal from './EmissionFactorModal';
```

**2. Update props to include callback:**
```typescript
interface ResultsDisplayProps {
  assessment: Assessment;
  emissionFactors: EmissionFactorsDatabase | null;
  onUpdateEmissionFactors: (customFactors: EmissionFactorsDatabase) => void;  // NEW
}
```

**3. Add state for modal:**
```typescript
const [showEmissionFactorModal, setShowEmissionFactorModal] = useState(false);
```

**4. Add button in header section (after title, line ~40):**
```typescript
<div className="flex justify-between items-center mb-6">
  <h2 className="text-2xl font-bold text-gray-900">
    Carbon Calculation Results
    {assessment.customEmissionFactors && (
      <span className="ml-3 text-sm font-normal text-blue-600">
        (Custom emission factors applied)
      </span>
    )}
  </h2>
  <button
    onClick={() => setShowEmissionFactorModal(true)}
    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
  >
    Customize Emission Factors
  </button>
</div>
```

**5. Add modal at end of component:**
```typescript
{showEmissionFactorModal && emissionFactors && (
  <EmissionFactorModal
    defaultFactors={emissionFactors}
    customFactors={assessment.customEmissionFactors}
    onSave={onUpdateEmissionFactors}
    onClose={() => setShowEmissionFactorModal(false)}
  />
)}
```

**6. Optional: Add visual indicators in breakdown:**
```typescript
// In the layer details section, show if factor is customized
{assessment.customEmissionFactors?.[layer.id] && (
  <span className="ml-2 text-xs text-blue-600">*</span>
)}
```

---

### Step 7: Update App.tsx

**File:** `src/App.tsx`

**Changes:**

**1. Update ResultsDisplay usage (around line ~140):**
```typescript
<ResultsDisplay
  assessment={activeAssessment}
  emissionFactors={emissionFactors}
  onUpdateEmissionFactors={(customFactors) => {
    if (activeId) {
      updateAssessmentEmissionFactors(activeId, customFactors);
    }
  }}
/>
```

**2. Destructure new function from hook:**
```typescript
const {
  assessments,
  activeAssessment,
  activeId,
  addAssessment,
  removeAssessment,
  updateAssessmentName,
  updateAssessmentEmissionFactors,  // ADD THIS
  setActive,
} = useAssessments(emissionFactors);
```

---

## File Changes Summary

### Files Modified

1. **`src/types/index.ts`**
   - Added `customEmissionFactors` field to `Assessment` interface
   - Added `EmissionFactorWithMeta` interface
   - Added `SystemType` type
   - Added `EmissionFactorModalProps` interface

2. **`src/hooks/useAssessments.ts`**
   - Added `updateAssessmentEmissionFactors()` function
   - Updated return object to include new function
   - Recalculation logic when custom factors change

3. **`src/utils/calculator.ts`**
   - Modified `calculateCarbonEmissions()` to accept optional `customEmissionFactors`
   - Added merge logic for custom factors
   - Updated all references to use merged factors

4. **`src/components/ResultsDisplay.tsx`**
   - Added "Customize Emission Factors" button
   - Added modal state management
   - Added visual indicator for custom factors
   - Added `onUpdateEmissionFactors` prop
   - Integrated EmissionFactorModal component

5. **`src/App.tsx`**
   - Updated ResultsDisplay props with callback
   - Destructured `updateAssessmentEmissionFactors` from hook

6. **`CHANGELOG.md`**
   - Added entry documenting Feature Update 2

### Files Created

1. **`src/utils/emissionFactorHelpers.ts`**
   - System classification mapping (16 layer types → 3 systems)
   - Enrichment function (adds metadata to emission factors)
   - Filter functions (by system, unit, search term)
   - Merge function (combines default + custom factors)

2. **`src/components/EmissionFactorModal.tsx`**
   - Modal component for emission factor editing
   - Filter controls (system, unit, search)
   - Editable factor table
   - Reset individual/all functionality
   - Save/Cancel actions

3. **`feature-update-2.md`** (this file)
   - Complete documentation of feature implementation
   - Architecture decisions and design rationale
   - Detailed implementation steps
   - Testing checklist

---

## Testing Checklist

### Functional Testing

**Basic Functionality:**
- [ ] Upload building data → see results with default factors
- [ ] Click "Customize Emission Factors" → modal opens
- [ ] Modal displays all 16 emission factors correctly
- [ ] Can edit any factor value
- [ ] Click "Save" → modal closes, assessment recalculates
- [ ] Results update with new custom factor values
- [ ] Custom factors indicator appears ("Custom emission factors applied")

**Filtering:**
- [ ] System filter "All" → shows all 16 factors
- [ ] System filter "Skin" → shows 4 factors (Roof, Facade, Glazing, External Wall)
- [ ] System filter "Superstructure" → shows 8 factors (Beams, Columns, Slabs, etc.)
- [ ] System filter "Substructure" → shows 4 factors (Foundation, Basement Wall, Pile, Ground Floor Slab)
- [ ] Unit filter "All" → shows all factors
- [ ] Unit filter "kgCO2e/m²" → shows only area-based factors
- [ ] Unit filter "kgCO2e/m" → shows only length-based factors (Beams, Columns, Pile)
- [ ] Search "roof" → shows only Roof
- [ ] Search "beam" → shows Beam -8.4 m and Beam -6.3 m
- [ ] Search "steel" → shows factors with "steel" in material description
- [ ] Combining filters works (e.g., Superstructure + area-based + search)

**Editing:**
- [ ] Edit factor value → input updates
- [ ] Edit with invalid value (negative, non-number) → validation error
- [ ] Click "Reset" on customized factor → reverts to default
- [ ] Click "Reset All" → all factors revert to defaults
- [ ] Click "Cancel" → modal closes, no changes saved
- [ ] Edit multiple factors → all saved correctly

**Per-Assessment Isolation:**
- [ ] Create Assessment 1, customize factors
- [ ] Create Assessment 2, verify it uses default factors
- [ ] Customize factors in Assessment 2
- [ ] Switch to Assessment 1 → verify custom factors unchanged
- [ ] Each assessment maintains its own custom factors

**Persistence:**
- [ ] Customize factors in an assessment
- [ ] Switch to another assessment and back
- [ ] Custom factors are preserved
- [ ] Close and remove assessment → custom factors removed with it

### Edge Cases

- [ ] Upload building with layer not in emission factors → handled gracefully
- [ ] Customize factor, then upload new building to same assessment → custom factors reset
- [ ] Set factor to 0 → calculation handles correctly
- [ ] Set factor to very large number → UI displays correctly
- [ ] Search with special characters → no errors
- [ ] Open modal with no emission factors loaded → error handling
- [ ] Rapid open/close modal → no state issues

### UI/UX Testing

- [ ] Modal is centered and responsive
- [ ] Modal closes when clicking outside (optional)
- [ ] Filters are clearly labeled
- [ ] Search input has placeholder text
- [ ] Editable inputs are clearly distinguishable
- [ ] Customized factors have visual indicator (*)
- [ ] Buttons have appropriate hover states
- [ ] Table scrolls if too many factors
- [ ] Mobile responsiveness (modal fits on small screens)

### Data Integrity

- [ ] Original emissionFactors.json unchanged
- [ ] Default factors never modified in state
- [ ] Calculations match expected values
- [ ] Export includes correct factor values
- [ ] Custom factors stored correctly in Assessment object
- [ ] Switching assessments doesn't leak custom factors

### Performance

- [ ] Modal opens quickly
- [ ] Filtering is instant (no lag)
- [ ] Searching updates results smoothly
- [ ] Recalculation after save is fast
- [ ] No memory leaks when opening/closing modal multiple times

---

## Known Limitations

1. **Session-Only Storage**
   - Custom emission factors are lost on page refresh
   - Future enhancement: Add localStorage persistence

2. **No Version Tracking**
   - No history of factor changes
   - Can't undo after saving
   - Future enhancement: Add version history

3. **No Batch Import**
   - Can't import custom factors from file
   - Must edit individually
   - Future enhancement: CSV/JSON import

4. **Basic Validation**
   - Only checks for non-negative numbers
   - No range validation
   - Future enhancement: Add min/max ranges, warnings for extreme values

---

## Future Enhancements (Out of Scope)

1. **Emission Factor Templates**
   - Save custom factor sets as templates
   - Apply templates to new assessments
   - Share templates between users

2. **Bulk Editing**
   - Select multiple factors to edit
   - Apply percentage increase/decrease to multiple factors
   - Copy factor values between layers

3. **Factor History**
   - Track changes to emission factors over time
   - Compare different factor sets
   - Undo/redo functionality

4. **Import/Export**
   - Export custom factors as JSON/CSV
   - Import factor sets from external files
   - Integration with external databases

5. **Advanced Search**
   - Filter by carbon intensity range
   - Filter by customized vs default
   - Sort by factor value

6. **Visual Comparison**
   - Side-by-side comparison of default vs custom
   - Visual diff highlighting
   - Impact preview before saving

7. **Validation Rules**
   - Define acceptable ranges per factor
   - Warning for unusual values
   - Require justification for extreme changes

---

## Migration Notes

This feature is fully backward compatible:

1. **Existing Assessments**
   - Assessments without `customEmissionFactors` use defaults
   - No data migration required

2. **Existing Code**
   - Calculator accepts optional parameter (defaults to undefined)
   - All existing calls work without modification

3. **Gradual Adoption**
   - Users can continue using default factors
   - Customization is opt-in per assessment

---

## Dependencies

**No new npm packages required.**

All functionality implemented using:
- React built-in hooks (useState, useMemo)
- TypeScript for type safety
- Tailwind CSS for styling (already in project)
- Existing utility functions

---

## Estimated Effort

- **Type Definitions**: 0.5 hours
- **Emission Factor Helpers**: 1 hour
- **EmissionFactorModal Component**: 3-4 hours
- **useAssessments Update**: 1 hour
- **Calculator Update**: 0.5 hours
- **ResultsDisplay Update**: 1 hour
- **Testing**: 2-3 hours
- **Documentation**: 1 hour (this file)

**Total: 10-12 hours**

---

## Success Criteria

The feature will be considered complete when:

1. ✅ Users can open emission factor customization modal from results view
2. ✅ Modal displays all emission factors with system classification
3. ✅ Filters work correctly (system, unit, search)
4. ✅ Users can edit any factor value
5. ✅ Saving updates the assessment and recalculates results
6. ✅ Custom factors are isolated per assessment
7. ✅ Visual indicators show when custom factors are in use
8. ✅ Reset functionality works (individual and all)
9. ✅ All existing functionality remains unchanged
10. ✅ UI is clean, simple, and intuitive

---

## Technical Debt / Follow-up Items

1. Add unit tests for emission factor helpers
2. Add component tests for EmissionFactorModal
3. Add E2E tests for customization workflow
4. Consider adding localStorage persistence
5. Improve accessibility (keyboard navigation, screen readers)
6. Add loading states if calculations become slow
7. Consider adding undo/redo functionality

---

## Related Documentation

- Original requirements: User request (2025-11-15)
- Related feature: Multi-Assessment Feature (adding-multiple-assessments.md)
- Emission factors data: `src/data/emissionFactors.json`
- Type definitions: `src/types/index.ts`
- Calculator logic: `src/utils/calculator.ts`

---

**END OF DOCUMENTATION**
