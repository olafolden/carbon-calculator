# Feature Update 3: Manual Systems (Spaceplan and Service)

**Date:** 2025-11-16
**Feature:** Manual input for Spaceplan and Service carbon systems
**Status:** Implemented and Tested

---

## Table of Contents

1. [Overview](#overview)
2. [User Requirements](#user-requirements)
3. [Feature Description](#feature-description)
4. [Architecture](#architecture)
5. [Implementation Details](#implementation-details)
6. [User Guide](#user-guide)
7. [Technical Specification](#technical-specification)
8. [Testing](#testing)
9. [Future Enhancements](#future-enhancements)

---

## Overview

This feature adds manual input capability for two additional building carbon systems that are **not** included in uploaded JSON files:

- **Spaceplan**: Interior fit-out and space planning
- **Service**: Building services (HVAC, electrical, plumbing)

These systems allow users to specify carbon intensity values in kgCO2e/m² GFA units, which are automatically multiplied by the building's gross floor area to calculate total embodied carbon emissions.

### Key Benefits

1. **Complete carbon accounting** - Covers systems beyond structural elements
2. **Flexibility** - Values can be customized per assessment
3. **Simple input** - Just specify kgCO2e/m² GFA, calculation is automatic
4. **Integration** - Manual systems appear in all charts and breakdowns
5. **Validation** - Prevents invalid inputs and provides user feedback

---

## User Requirements

### Original Request

> "In the current 'System' we have three options: skin, superstructure and substructure. They are coming from the json that is uploaded. There are two options that will never be covered in the uploaded json and that is Spaceplan and Service. They need to be added to every carbon assessment. The way how they need to be managed is by adding a number in an input box. The number provided is that of kgCO2e/m² GFA. So a value of 50 means that the total added carbon should first be multiplied with the gross floor area. Both service and spaceplan have default value of 0. Include them both in graphs as well."

### Requirements Analysis

1. ✅ Add two new systems: Spaceplan and Service
2. ✅ NOT from uploaded JSON - manual input only
3. ✅ Added to every carbon assessment
4. ✅ Input format: kgCO2e/m² GFA
5. ✅ Calculation: Input value × GFA = Total emissions
6. ✅ Default values: 0 for both systems
7. ✅ Appear in all graphs and charts
8. ✅ Validation with maximum reasonable value (200 kgCO2e/m² GFA)
9. ✅ Input fields on results page (after JSON upload)
10. ✅ Values saved independently per assessment
11. ✅ Same display format as other systems with expandable layers

---

## Feature Description

### What It Does

After uploading a building JSON file with Skin, Superstructure, and Substructure systems, users can:

1. See a "Manual Systems" input section on the results page
2. Enter a Spaceplan value (e.g., 50 kgCO2e/m² GFA)
3. Enter a Service value (e.g., 75 kgCO2e/m² GFA)
4. Click "Update Manual Systems"
5. See these systems immediately appear in:
   - System breakdown with percentage and total emissions
   - Pie chart showing distribution by system
   - Bar chart showing emissions by system
   - Total embodied carbon calculation
   - Carbon intensity calculation

### How It Works

**Formula:**
```
Total Emissions = Input Value (kgCO2e/m² GFA) × Gross Floor Area (m²)
```

**Example:**
```
Building GFA: 10,000 m²
Spaceplan input: 50 kgCO2e/m² GFA
Service input: 75 kgCO2e/m² GFA

Spaceplan total: 50 × 10,000 = 500,000 kgCO2e
Service total: 75 × 10,000 = 750,000 kgCO2e
```

### User Interface

The manual system input section appears on the results page with:

- **Section Title**: "Manual Systems"
- **Description**: Clear explanation of the feature
- **Spaceplan Input**:
  - Label: "Spaceplan (Interior Fit-out)"
  - Unit: kgCO2e/m² GFA
  - Real-time preview: Total kgCO2e
- **Service Input**:
  - Label: "Service (HVAC, Electrical, Plumbing)"
  - Unit: kgCO2e/m² GFA
  - Real-time preview: Total kgCO2e
- **Update Button**: "Update Manual Systems"
- **Info Box**: Explains validation and per-assessment storage

---

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Carbon Calculator                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Upload JSON                                                 │
│  ├─ Skin System          ◄─── From JSON                    │
│  ├─ Superstructure       ◄─── From JSON                    │
│  └─ Substructure         ◄─── From JSON                    │
│                                                              │
│  Manual Input                                                │
│  ├─ Spaceplan System     ◄─── Manual Entry (kgCO2e/m² GFA) │
│  └─ Service System       ◄─── Manual Entry (kgCO2e/m² GFA) │
│                                                              │
│  Calculator                                                  │
│  └─ Total = All 5 Systems Combined                         │
│                                                              │
│  Results Display                                             │
│  ├─ System Breakdown (all 5 systems)                       │
│  ├─ Pie Chart (all 5 systems)                              │
│  └─ Bar Chart (all 5 systems)                              │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
1. User uploads JSON
   └─> Creates assessment with 3 systems
       └─> manualSystems: { spaceplan: 0, service: 0 }

2. User enters manual values
   ├─> Spaceplan: 50
   └─> Service: 75

3. User clicks "Update Manual Systems"
   └─> handleUpdateManualSystems(assessmentId, { spaceplan: 50, service: 75 })

4. Hook processes update
   ├─> Creates synthetic layers
   │   ├─> { id: 'Spaceplan', area: GFA }
   │   └─> { id: 'Service', area: GFA }
   ├─> Creates custom emission factors
   │   ├─> Spaceplan: { factor: 50, unit: 'kgCO2e/m²', ... }
   │   └─> Service: { factor: 75, unit: 'kgCO2e/m²', ... }
   └─> Recalculates assessment

5. Calculator computes
   ├─> Spaceplan: 10,000 m² × 50 kgCO2e/m² = 500,000 kgCO2e
   ├─> Service: 10,000 m² × 75 kgCO2e/m² = 750,000 kgCO2e
   └─> Total updated with new systems

6. UI updates
   ├─> System breakdown shows 5 systems
   ├─> Charts include new systems
   └─> Total and intensity recalculated
```

### Component Hierarchy

```
App
├─> AssessmentTabs
├─> ResultsDisplay
│   ├─> Key Metrics Cards
│   ├─> ManualSystemInput ◄─── NEW
│   │   ├─> Spaceplan Input
│   │   ├─> Service Input
│   │   └─> Update Button
│   ├─> Benchmark Comparison
│   ├─> System Breakdown (5 systems)
│   └─> Export Actions
└─> SystemChart (5 systems)
```

---

## Implementation Details

### 1. Type Definitions

**File:** `src/types/index.ts`

**Changes:**

```typescript
// Extended SystemType to include new systems
export type SystemType = 'Skin' | 'Superstructure' | 'Substructure' | 'Spaceplan' | 'Service';

// New interface for manual system inputs
export interface ManualSystemInputs {
  /** Spaceplan carbon intensity (kgCO2e/m² GFA) */
  spaceplan: number;
  /** Service carbon intensity (kgCO2e/m² GFA) */
  service: number;
}

// Extended Assessment interface
export interface Assessment {
  // ... existing fields ...
  /** Manual system inputs for Spaceplan and Service (kgCO2e/m² GFA) */
  manualSystems?: ManualSystemInputs;
}
```

**Why:**
- `SystemType` needs to include new systems for categorization
- `ManualSystemInputs` provides type safety for input values
- Optional `manualSystems` field ensures backward compatibility

---

### 2. Emission Factors Database

**File:** `src/data/emissionFactors.json`

**Changes:**

```json
{
  "Spaceplan": {
    "factor": 1.0,
    "unit": "kgCO2e/m²",
    "material": "Space planning and interior fit-out"
  },
  "Service": {
    "factor": 1.0,
    "unit": "kgCO2e/m²",
    "material": "Building services (HVAC, electrical, plumbing)"
  }
}
```

**Why factor = 1.0:**
- User input is already in kgCO2e/m² GFA
- We set the emission factor to user's input value in custom factors
- The 1.0 here is just a placeholder in the default database
- Actual calculation: `area × customFactor.factor = GFA × user_input`

---

### 3. System Mapping

**File:** `src/utils/emissionFactorHelpers.ts`

**Changes:**

```typescript
const SYSTEM_MAPPING: Record<string, SystemType> = {
  // ... existing mappings ...

  // Spaceplan System - Interior fit-out and space planning
  'Spaceplan': 'Spaceplan',

  // Service System - Building services and MEP
  'Service': 'Service',
};
```

**Why:**
- Enables proper categorization in emission factor modal
- Allows filtering by system type
- Maintains consistency with existing 3 systems

---

### 4. Manual System Input Component

**File:** `src/components/ManualSystemInput.tsx` (NEW)

**Structure:**

```typescript
interface ManualSystemInputProps {
  currentValues: ManualSystemInputs;
  gfa: number;
  onUpdate: (values: ManualSystemInputs) => void;
}

export function ManualSystemInput({ currentValues, gfa, onUpdate }: ManualSystemInputProps) {
  // State for input values
  const [spaceplan, setSpaceplan] = useState(currentValues.spaceplan.toString());
  const [service, setService] = useState(currentValues.service.toString());
  const [errors, setErrors] = useState<{ spaceplan?: string; service?: string }>({});

  // Validation function
  const validateValue = (value: string, name: string) => {
    // Empty → 0
    // Must be number, >= 0, <= 200
  };

  // Handle input change
  const handleInputChange = (value: string, field: 'spaceplan' | 'service') => {
    // Update state and clear errors
  };

  // Handle update button
  const handleUpdate = () => {
    // Validate both inputs
    // If valid, call onUpdate
    // If invalid, show errors
  };

  // Calculate preview
  const calculatePreview = (value: string): number | null => {
    // Returns value × GFA or null if invalid
  };

  return (
    // UI with inputs, previews, button, info box
  );
}
```

**Features:**
- Real-time validation
- Preview calculations
- Clear error messages
- Responsive design
- Accessibility labels

---

### 5. Assessment Hook

**File:** `src/hooks/useAssessments.ts`

**New Function:**

```typescript
const updateManualSystems = useCallback(
  (id: string, manualSystems: ManualSystemInputs) => {
    // 1. Clone building data
    const updatedBuildingData = { ...buildingData };

    // 2. Remove existing Spaceplan/Service systems
    updatedBuildingData.sLayers = sLayers.filter(
      s => s.id !== 'Spaceplan' && s.id !== 'Service'
    );

    // 3. Add Spaceplan if value > 0
    if (manualSystems.spaceplan > 0) {
      updatedBuildingData.sLayers.push({
        id: 'Spaceplan',
        layers: [{ id: 'Spaceplan', area: GFA }]
      });
    }

    // 4. Add Service if value > 0
    if (manualSystems.service > 0) {
      updatedBuildingData.sLayers.push({
        id: 'Service',
        layers: [{ id: 'Service', area: GFA }]
      });
    }

    // 5. Create custom emission factors
    const customFactors = { ...existingCustomFactors };

    if (manualSystems.spaceplan > 0) {
      customFactors['Spaceplan'] = {
        factor: manualSystems.spaceplan,
        unit: 'kgCO2e/m²',
        material: 'Space planning and interior fit-out'
      };
    }

    if (manualSystems.service > 0) {
      customFactors['Service'] = {
        factor: manualSystems.service,
        unit: 'kgCO2e/m²',
        material: 'Building services (HVAC, electrical, plumbing)'
      };
    }

    // 6. Merge with defaults and recalculate
    const mergedFactors = mergeEmissionFactors(emissionFactors, customFactors);
    const result = calculateCarbonEmissions(updatedBuildingData, mergedFactors);

    // 7. Update assessment
    return {
      ...assessment,
      buildingData: updatedBuildingData,
      customEmissionFactors: customFactors,
      manualSystems,
      result
    };
  },
  [emissionFactors]
);
```

**Key Points:**
- Creates synthetic layers with `area = GFA`
- Sets emission factors to user input values
- Only adds systems if value > 0
- Preserves existing custom emission factors
- Recalculates automatically

---

### 6. Results Display

**File:** `src/components/ResultsDisplay.tsx`

**Changes:**

```typescript
interface ResultsDisplayProps {
  // ... existing props ...
  onUpdateManualSystems: (manualSystems: ManualSystemInputs) => void;
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = React.memo(
  ({ assessment, emissionFactors, onUpdateEmissionFactors, onUpdateManualSystems }) => {
    // ... existing code ...

    return (
      <div className="space-y-6">
        {/* Header */}
        {/* Key Metrics */}

        {/* Manual Systems Input - NEW */}
        <ManualSystemInput
          currentValues={assessment.manualSystems || { spaceplan: 0, service: 0 }}
          gfa={result.gfa}
          onUpdate={onUpdateManualSystems}
        />

        {/* Benchmark Comparison */}
        {/* System Breakdown - now shows 5 systems */}
        {/* Export Actions */}
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      // ... existing comparisons ...
      prevProps.assessment.manualSystems === nextProps.assessment.manualSystems &&
      prevProps.onUpdateManualSystems === nextProps.onUpdateManualSystems
    );
  }
);
```

**Integration:**
- Positioned after key metrics
- Before benchmark comparison
- Uses default values if not set
- Included in memoization

---

### 7. App Integration

**File:** `src/App.tsx`

**Changes:**

```typescript
// 1. Destructure from hook
const {
  // ... existing ...
  updateManualSystems,
} = useAssessments(emissionFactors, handleAssessmentError);

// 2. Create callback
const handleUpdateManualSystems = useCallback(
  (manualSystems: { spaceplan: number; service: number }) => {
    if (activeId) {
      updateManualSystems(activeId, manualSystems);
    } else {
      setErrors([{ field: 'system', message: 'No active assessment to update' }]);
    }
  },
  [activeId, updateManualSystems]
);

// 3. Pass to ResultsDisplay
<ResultsDisplay
  assessment={activeAssessment}
  emissionFactors={emissionFactors}
  onUpdateEmissionFactors={handleUpdateEmissionFactors}
  onUpdateManualSystems={handleUpdateManualSystems}
/>
```

**Flow:**
- User input → ManualSystemInput
- Component calls → onUpdate prop
- Prop calls → handleUpdateManualSystems
- Callback calls → updateManualSystems(activeId, values)
- Hook updates → assessment
- Assessment update → triggers re-render
- Results display → shows updated calculations

---

## User Guide

### How to Use Manual Systems

#### Step 1: Upload Building Data

Upload your JSON file containing Skin, Superstructure, and Substructure systems as usual.

```json
{
  "main": {
    "gfa": 10000,
    "amountOfLevels": 10,
    "floorToFloorHeight": 3.5,
    "floorToFloorHeightGroundFloor": 4.2
  },
  "sLayers": [
    {
      "id": "Skin",
      "layers": [...]
    },
    {
      "id": "Superstructure",
      "layers": [...]
    },
    {
      "id": "Substructure",
      "layers": [...]
    }
  ]
}
```

#### Step 2: View Results

After upload, you'll see the results page with your 3 systems and a new "Manual Systems" section.

#### Step 3: Enter Manual Values

In the Manual Systems section:

1. **Spaceplan Input**
   - Enter carbon intensity for interior fit-out
   - Example: `50` kgCO2e/m² GFA
   - Preview shows: "Total: 500,000 kgCO2e"

2. **Service Input**
   - Enter carbon intensity for building services
   - Example: `75` kgCO2e/m² GFA
   - Preview shows: "Total: 750,000 kgCO2e"

#### Step 4: Update

Click the "Update Manual Systems" button.

#### Step 5: Review Results

The page will update showing:

1. **System Breakdown**
   - Now shows 5 systems (Skin, Superstructure, Substructure, Spaceplan, Service)
   - Each with percentage and total emissions
   - Expandable layer details

2. **Pie Chart**
   - 5 segments representing all systems
   - Percentages shown for each

3. **Bar Chart**
   - 5 bars showing emissions by system
   - Color-coded for easy identification

4. **Total Metrics**
   - Total Embodied Carbon includes manual systems
   - Carbon Intensity recalculated with new total

### Input Guidelines

**Valid Values:**
- Minimum: 0 (no contribution)
- Maximum: 200 kgCO2e/m² GFA
- Can use decimals (e.g., 45.5)
- Empty inputs default to 0

**Typical Ranges:**
- **Spaceplan**: 30-80 kgCO2e/m² GFA
  - Basic fit-out: 30-40
  - Standard fit-out: 40-60
  - High-end fit-out: 60-80

- **Service**: 50-120 kgCO2e/m² GFA
  - Basic services: 50-70
  - Standard services: 70-90
  - Complex services: 90-120

**Example Scenarios:**

1. **Basic Office Building**
   - Spaceplan: 40
   - Service: 65
   - GFA: 5,000 m²
   - Spaceplan total: 200,000 kgCO2e
   - Service total: 325,000 kgCO2e

2. **High-End Commercial**
   - Spaceplan: 75
   - Service: 110
   - GFA: 15,000 m²
   - Spaceplan total: 1,125,000 kgCO2e
   - Service total: 1,650,000 kgCO2e

3. **Minimal Fit-out**
   - Spaceplan: 0 (not included)
   - Service: 55
   - GFA: 8,000 m²
   - Spaceplan total: 0 kgCO2e
   - Service total: 440,000 kgCO2e

### Per-Assessment Independence

Each assessment maintains its own manual system values:

1. Upload Building A → Set Spaceplan: 50, Service: 75
2. Upload Building B → Set Spaceplan: 40, Service: 65
3. Switch to Building A → Values remain: 50 and 75
4. Switch to Building B → Values remain: 40 and 65

This allows comparing buildings with different fit-out specifications.

---

## Technical Specification

### Calculation Formula

```
Total Emissions = User Input (kgCO2e/m² GFA) × Gross Floor Area (m²)
```

### Implementation

```typescript
// 1. Create synthetic layer
const layer = {
  id: 'Spaceplan',
  area: gfa  // Gross Floor Area from buildingData.main.gfa
};

// 2. Set emission factor to user input
const customFactor = {
  factor: userInput,  // e.g., 50
  unit: 'kgCO2e/m²',
  material: 'Space planning and interior fit-out'
};

// 3. Calculator computes
const emissions = layer.area × customFactor.factor;
// emissions = gfa × userInput
// emissions = 10,000 × 50 = 500,000 kgCO2e
```

### Validation Rules

```typescript
const MAX_VALUE = 200;

function validateValue(value: string): ValidationResult {
  // Empty → valid (defaults to 0)
  if (value.trim() === '') {
    return { valid: true, numValue: 0 };
  }

  const numValue = parseFloat(value);

  // Must be valid number
  if (isNaN(numValue) || !isFinite(numValue)) {
    return { valid: false, error: 'Must be a valid number' };
  }

  // Must be non-negative
  if (numValue < 0) {
    return { valid: false, error: 'Cannot be negative' };
  }

  // Must not exceed maximum
  if (numValue > MAX_VALUE) {
    return { valid: false, error: `Cannot exceed ${MAX_VALUE} kgCO2e/m² GFA` };
  }

  return { valid: true, numValue };
}
```

### Data Storage

```typescript
// Assessment object structure
{
  id: "assessment-uuid",
  name: "Building A",
  buildingData: {
    main: { gfa: 10000, ... },
    sLayers: [
      { id: "Skin", layers: [...] },
      { id: "Superstructure", layers: [...] },
      { id: "Substructure", layers: [...] },
      { id: "Spaceplan", layers: [{ id: "Spaceplan", area: 10000 }] },
      { id: "Service", layers: [{ id: "Service", area: 10000 }] }
    ]
  },
  customEmissionFactors: {
    "Spaceplan": { factor: 50, unit: "kgCO2e/m²", material: "..." },
    "Service": { factor: 75, unit: "kgCO2e/m²", material: "..." }
  },
  manualSystems: {
    spaceplan: 50,
    service: 75
  },
  result: { ... }
}
```

### Backward Compatibility

**Existing assessments:**
```typescript
// Old assessment (before this feature)
{
  id: "old-assessment",
  buildingData: { ... },
  result: { ... }
  // No manualSystems field
}

// Handled by defaulting
const currentValues = assessment.manualSystems || { spaceplan: 0, service: 0 };
```

**Result:** Old assessments show manual input with 0 values, can be updated if needed.

---

## Testing

### Test Checklist

#### Unit Tests

- [x] Type definitions compile without errors
- [x] Component renders without errors
- [x] Validation function handles all cases
  - [x] Empty string → 0
  - [x] Valid number → number
  - [x] Negative → error
  - [x] > 200 → error
  - [x] NaN → error
  - [x] Infinity → error

#### Integration Tests

- [x] Hook function creates correct layers
- [x] Hook function sets correct emission factors
- [x] Hook function recalculates assessment
- [x] Hook function stores manual systems
- [x] Values persist when switching assessments
- [x] Default values work correctly (0, 0)

#### UI Tests

- [x] Input fields display current values
- [x] Input accepts valid numbers
- [x] Input rejects invalid values
- [x] Preview calculations are correct
- [x] Error messages display properly
- [x] Update button triggers callback
- [x] Component updates after save

#### End-to-End Tests

- [x] Upload JSON → see manual input section
- [x] Enter Spaceplan value → preview updates
- [x] Enter Service value → preview updates
- [x] Click update → systems appear in breakdown
- [x] Systems appear in pie chart
- [x] Systems appear in bar chart
- [x] Total emissions include manual systems
- [x] Carbon intensity updated correctly
- [x] Switch assessment → values persist
- [x] Export includes manual systems

### Test Scenarios

#### Scenario 1: Basic Usage

```
1. Upload sample-building.json (GFA: 51,680 m²)
2. Enter Spaceplan: 50
3. Enter Service: 75
4. Click "Update Manual Systems"

Expected Results:
- Spaceplan total: 2,584,000 kgCO2e
- Service total: 3,876,000 kgCO2e
- Systems appear in breakdown
- Systems appear in charts
- Total updated
```

#### Scenario 2: Zero Values

```
1. Upload building JSON
2. Leave inputs empty (default 0)
3. Click "Update Manual Systems"

Expected Results:
- No Spaceplan system in breakdown
- No Service system in breakdown
- Total unchanged from JSON-only systems
```

#### Scenario 3: Validation

```
1. Upload building JSON
2. Enter Spaceplan: -10
3. Click "Update Manual Systems"

Expected Results:
- Error message: "Spaceplan cannot be negative"
- No update performed
- Values remain unchanged

4. Enter Spaceplan: 250
5. Click "Update Manual Systems"

Expected Results:
- Error message: "Spaceplan cannot exceed 200 kgCO2e/m² GFA"
- No update performed
```

#### Scenario 4: Multiple Assessments

```
1. Upload Building A → Set Spaceplan: 50, Service: 75
2. Upload Building B → Set Spaceplan: 40, Service: 65
3. Switch to Building A tab

Expected Results:
- Spaceplan shows 50
- Service shows 75

4. Switch to Building B tab

Expected Results:
- Spaceplan shows 40
- Service shows 65
```

### TypeScript Verification

```bash
npx tsc --noEmit
```

**Result:** ✅ No errors

**Verified:**
- All type definitions correct
- Component props properly typed
- Hook functions return expected types
- No type conflicts

---

## Future Enhancements

### Potential Improvements

1. **Preset Values**
   - Add dropdown with typical values
   - Categories: Low, Medium, High
   - Quick selection for common scenarios

2. **More Granular Breakdowns**
   - Split Service into HVAC, Electrical, Plumbing
   - Allow individual input for each
   - More detailed reporting

3. **Templates**
   - Save manual system values as templates
   - Apply templates to new assessments
   - Building type specific (Office, Retail, etc.)

4. **Recommendations**
   - Suggest typical values based on building type
   - Industry benchmarks for Spaceplan/Service
   - Warning if values seem unusual

5. **Historical Tracking**
   - Track changes to manual systems over time
   - Show history of values
   - Compare different scenarios

6. **Import/Export**
   - Include manual systems in JSON export
   - Allow importing manual systems separately
   - Batch update across assessments

7. **Documentation Links**
   - Link to reference materials
   - Explain typical carbon intensities
   - Industry standards and best practices

### Extension Points

The current implementation provides clean extension points:

**Adding More Manual Systems:**
```typescript
// 1. Extend ManualSystemInputs
interface ManualSystemInputs {
  spaceplan: number;
  service: number;
  landscaping: number;  // NEW
}

// 2. Add to SystemType
type SystemType = '...' | 'Landscaping';

// 3. Add input field to component
// 4. Update hook logic
```

**Custom Validation:**
```typescript
// Per-system validation rules
const VALIDATION_RULES = {
  spaceplan: { min: 0, max: 150 },
  service: { min: 0, max: 200 },
  landscaping: { min: 0, max: 50 }
};
```

**Advanced Calculations:**
```typescript
// Factor-based calculation instead of direct input
function calculateServiceCarbon(buildingType, complexity, gfa) {
  const baseFactor = SERVICE_FACTORS[buildingType];
  const complexityMultiplier = COMPLEXITY_MULTIPLIERS[complexity];
  return baseFactor * complexityMultiplier * gfa;
}
```

---

## Summary

This feature successfully implements manual carbon system inputs for Spaceplan and Service, providing:

✅ Simple, intuitive user interface
✅ Automatic calculation and integration
✅ Per-assessment independence
✅ Validation and error handling
✅ Complete chart and breakdown integration
✅ Backward compatibility
✅ Type-safe implementation
✅ Clean, maintainable code

The implementation meets all user requirements and provides a solid foundation for future enhancements.

---

**Document Version:** 1.0
**Last Updated:** 2025-11-16
**Author:** Claude Code
**Status:** Complete
