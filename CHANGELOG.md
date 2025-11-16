# Carbon Calculator - Development Changelog

> Automatically generated log of changes made by Claude Code

---

## Session Log

*This file tracks all modifications made during development sessions with Claude Code.*

---

## [Feature Update 2] - 2025-11-15

### Custom Emission Factors Feature

**Summary:** Added ability to customize emission factors on a per-assessment basis with library selection and filtering capabilities.

### New Features

- **Emission Factor Customization Modal**
  - Users can now customize emission factors after viewing initial results
  - Modal provides full library view with all 16 emission factors
  - Filter by system (Skin, Superstructure, Substructure)
  - Filter by unit type (area-based vs length-based)
  - Search by name or material description
  - Inline editing of factor values with validation
  - Reset individual factors or all factors to defaults

- **Per-Assessment Isolation**
  - Custom emission factors stored separately for each assessment
  - Changes to one assessment don't affect others
  - Each assessment maintains its own custom factor overrides

- **Visual Indicators**
  - "Custom emission factors applied" badge on results page
  - Customized factors marked with asterisk (*) in modal
  - Highlighted rows for customized entries

- **Automatic Recalculation**
  - Assessments automatically recalculate when custom factors are saved
  - Results update immediately to reflect new emission values

### Files Created

1. **`src/components/EmissionFactorModal.tsx`** (273 lines)
   - Modal component for emission factor editing
   - Filtering and search functionality
   - Editable table with validation
   - Reset capabilities

2. **`src/utils/emissionFactorHelpers.ts`** (168 lines)
   - System classification mapping (16 layers → 3 systems)
   - Enrichment functions for UI metadata
   - Filter and search utilities
   - Merge and validation functions

3. **`feature-update-2.md`** (950 lines)
   - Complete feature documentation
   - Architecture decisions and rationale
   - Implementation details
   - Testing checklist

### Files Modified

1. **`src/types/index.ts`**
   - Added `customEmissionFactors?: EmissionFactorsDatabase` to `Assessment` interface
   - Added `SystemType` type for building system classification
   - Added `EmissionFactorWithMeta` interface for enriched factors
   - Added `EmissionFactorModalProps` interface

2. **`src/hooks/useAssessments.ts`**
   - Added `updateAssessmentEmissionFactors()` function
   - Imported `mergeEmissionFactors` helper
   - Recalculation logic when custom factors change
   - Returns new function in hook API

3. **`src/components/ResultsDisplay.tsx`**
   - Added "Customize Emission Factors" button in header
   - Added visual indicator for custom factors
   - Integrated EmissionFactorModal component
   - Added new props: `emissionFactors` and `onUpdateEmissionFactors`
   - Updated memoization to include custom factors

4. **`src/App.tsx`**
   - Destructured `updateAssessmentEmissionFactors` from useAssessments hook
   - Passed emission factors and callback to ResultsDisplay
   - Wired up custom factor update flow

5. **`CHANGELOG.md`** (this file)
   - Documented Feature Update 2 changes

### Technical Details

**System Classification:**
- Skin: Roof, Facade, Glazing, External Wall (4 factors)
- Superstructure: Beams, Columns, Slabs, Core Wall, Staircase (8 factors)
- Substructure: Foundation, Basement Wall, Pile, Ground Floor Slab (4 factors)

**Data Flow:**
1. User clicks "Customize Emission Factors" button
2. Modal opens with default factors + any existing custom overrides
3. User filters, searches, and edits factor values
4. User clicks "Save Changes"
5. Custom factors passed to `updateAssessmentEmissionFactors()`
6. Hook merges custom with defaults
7. Calculator recalculates with merged factors
8. Results display updates automatically

**Backward Compatibility:**
- Existing assessments without `customEmissionFactors` use defaults
- No data migration required
- Calculator already supports dynamic emission factors
- Feature is fully opt-in

### Dependencies

No new npm packages required. Uses:
- React built-in hooks (useState, useMemo, useCallback)
- TypeScript for type safety
- Tailwind CSS for styling (existing)

### Testing Notes

All functional requirements tested:
- Modal opens and displays emission factors correctly
- Filters work (system, unit, search)
- Editing and validation functional
- Save updates assessment and recalculates
- Custom factors isolated per assessment
- Reset functionality works
- Visual indicators display correctly

### Related Documentation

See `feature-update-2.md` for complete implementation details, architecture decisions, and testing checklist.

