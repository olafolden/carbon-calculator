# Carbon Calculator - Development Changelog

> Automatically generated log of changes made by Claude Code

---

## Session Log

*This file tracks all modifications made during development sessions with Claude Code.*

---

## [Feature Update 3] - 2025-11-16

### Manual Systems: Spaceplan and Service

**Summary:** Added manual input capability for Spaceplan and Service systems that are not included in uploaded JSON files. These systems allow users to specify carbon intensity values (kgCO2e/m² GFA) which are automatically multiplied by the building's gross floor area.

### New Features

- **Manual System Input Component**
  - Two input fields for Spaceplan (interior fit-out) and Service (HVAC, electrical, plumbing)
  - Values specified in kgCO2e/m² GFA units
  - Real-time calculation preview showing total emissions
  - Validation: non-negative values with maximum of 200 kgCO2e/m² GFA
  - User-friendly error messages and info boxes
  - Positioned on results page after key metrics

- **Per-Assessment Independence**
  - Manual system values stored separately for each assessment
  - Each assessment maintains its own Spaceplan and Service values
  - Default values of 0 for both systems
  - Values persist when switching between assessments

- **Automatic Integration**
  - Manual systems automatically appear in system breakdown
  - Included in pie charts and bar charts
  - Contribute to total embodied carbon calculations
  - Update carbon intensity metrics

- **Formula**: Total Emissions = Input Value (kgCO2e/m² GFA) × Gross Floor Area (m²)
  - Example: 50 kgCO2e/m² × 10,000 m² = 500,000 kgCO2e

### Files Created

1. **`src/components/ManualSystemInput.tsx`** (~220 lines)
   - Component for inputting manual system values
   - Two number inputs with validation
   - Real-time calculation preview
   - Error handling and user feedback
   - Update button to save changes

2. **`feature-update-3.md`** (~800 lines)
   - Complete feature documentation
   - Architecture and implementation details
   - User guide and examples
   - Testing checklist and verification

### Files Modified

1. **`src/types/index.ts`**
   - Added `'Spaceplan'` and `'Service'` to `SystemType` union (now 5 systems)
   - Added `ManualSystemInputs` interface with spaceplan and service fields
   - Added `manualSystems?: ManualSystemInputs` to `Assessment` interface

2. **`src/data/emissionFactors.json`**
   - Added "Spaceplan" emission factor (1.0 kgCO2e/m²)
   - Added "Service" emission factor (1.0 kgCO2e/m²)
   - Factor of 1.0 acts as multiplier since input is already in kgCO2e/m²

3. **`src/utils/emissionFactorHelpers.ts`**
   - Added 'Spaceplan' and 'Service' to SYSTEM_MAPPING
   - Enables proper categorization and filtering

4. **`src/hooks/useAssessments.ts`**
   - Imported `ManualSystemInputs` type
   - Added `updateManualSystems()` function
   - Creates synthetic layers with area = GFA
   - Sets emission factors to user input values
   - Stores manual systems in assessment
   - Recalculates emissions automatically
   - Returns new function in hook API

5. **`src/components/ResultsDisplay.tsx`**
   - Imported `ManualSystemInput` component
   - Added `onUpdateManualSystems` prop
   - Integrated ManualSystemInput below key metrics
   - Updated memoization comparison to include manualSystems
   - Passes current values and GFA to input component

6. **`src/App.tsx`**
   - Destructured `updateManualSystems` from useAssessments hook
   - Created `handleUpdateManualSystems` callback
   - Passed callback to ResultsDisplay component

7. **`CHANGELOG.md`** (this file)
   - Documented Feature Update 3 changes

### Technical Details

**System Expansion:**
- Original 3 systems: Skin, Superstructure, Substructure (from JSON)
- New 2 systems: Spaceplan, Service (manual input)
- Total: 5 building systems

**Data Flow:**
1. User uploads JSON with Skin, Superstructure, Substructure
2. Results page displays with manual system input section
3. User enters Spaceplan value (e.g., 50 kgCO2e/m² GFA)
4. User enters Service value (e.g., 75 kgCO2e/m² GFA)
5. User clicks "Update Manual Systems"
6. Hook creates synthetic layers: `{ id: 'Spaceplan', area: GFA }`
7. Hook creates custom emission factors with user input values
8. Calculator recalculates: `emissions = GFA × input_value`
9. Results update showing new systems in breakdown and charts

**Calculation Example:**
- Building GFA: 10,000 m²
- Spaceplan input: 50 kgCO2e/m² GFA
- Service input: 75 kgCO2e/m² GFA
- Spaceplan total: 10,000 × 50 = 500,000 kgCO2e
- Service total: 10,000 × 75 = 750,000 kgCO2e
- Both included in building total and intensity calculations

**Validation Rules:**
- Minimum value: 0 (non-negative)
- Maximum value: 200 kgCO2e/m² GFA
- Empty inputs default to 0
- Must be valid finite numbers

**Backward Compatibility:**
- Existing assessments without `manualSystems` default to `{ spaceplan: 0, service: 0 }`
- No data migration required
- Systems with 0 values don't appear in calculations
- Feature is fully opt-in

### Dependencies

No new npm packages required. Uses:
- React built-in hooks (useState, useCallback)
- TypeScript for type safety
- Tailwind CSS for styling (existing)

### Testing Notes

TypeScript compilation successful with no errors:
- Type definitions properly extended
- Component props correctly typed
- Hook functions return expected types
- No type conflicts or errors

Functional requirements:
- Input validation working (min 0, max 200)
- Real-time preview calculations correct
- Manual systems stored per-assessment
- Calculations follow formula: input × GFA
- Systems appear in breakdown and charts
- Values persist across assessment switches
- Default values of 0 work correctly

### Related Documentation

See `feature-update-3.md` for complete implementation details, user guide, architecture decisions, and testing checklist.

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

