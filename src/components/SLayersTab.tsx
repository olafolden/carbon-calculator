import React from 'react';
import type { SLayersTabProps } from '../types';
import { ManualSystemInput } from './ManualSystemInput';
import { EmissionFactorsEditor } from './EmissionFactorsEditor';

/**
 * S-Layers tab component for configuring manual inputs and emission factors
 *
 * Contains two main sections:
 * 1. Manual S-Layer Inputs (Spaceplan and Service)
 * 2. Emission Factors Editor (inline table with search/filter)
 *
 * @param assessment - The assessment being edited
 * @param emissionFactors - Emission factors database (default + custom)
 * @param onUpdateEmissionFactors - Callback when emission factors are updated
 * @param onUpdateManualSystems - Callback when manual systems are updated
 *
 * @example
 * ```tsx
 * <SLayersTab
 *   assessment={activeAssessment}
 *   emissionFactors={emissionFactors}
 *   onUpdateEmissionFactors={updateAssessmentEmissionFactors}
 *   onUpdateManualSystems={updateManualSystems}
 * />
 * ```
 */
export const SLayersTab: React.FC<SLayersTabProps> = React.memo(({
  assessment,
  emissionFactors,
  onUpdateEmissionFactors,
  onUpdateManualSystems,
}) => {
  return (
    <div className="space-y-8">
      {/* Manual S-Layer Inputs Section */}
      <div>
        <ManualSystemInput
          currentValues={assessment.manualSystems || { spaceplan: 0, service: 0 }}
          gfa={assessment.result.gfa}
          onUpdate={onUpdateManualSystems}
        />
      </div>

      {/* Emission Factors Section */}
      {emissionFactors ? (
        <div>
          <EmissionFactorsEditor
            defaultFactors={emissionFactors}
            customFactors={assessment.customEmissionFactors}
            onUpdate={onUpdateEmissionFactors}
            compact={true}
          />
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-900 mb-2">
            Emission Factors Not Available
          </h3>
          <p className="text-sm text-yellow-800">
            The emission factors database could not be loaded. Please refresh the page or contact support if the problem persists.
          </p>
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for React.memo optimization
  return (
    prevProps.assessment.id === nextProps.assessment.id &&
    prevProps.assessment.customEmissionFactors === nextProps.assessment.customEmissionFactors &&
    prevProps.assessment.manualSystems === nextProps.assessment.manualSystems &&
    prevProps.assessment.result.gfa === nextProps.assessment.result.gfa &&
    prevProps.emissionFactors === nextProps.emissionFactors
  );
});

SLayersTab.displayName = 'SLayersTab';
