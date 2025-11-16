import React, { useState, useCallback, useEffect, useMemo } from 'react';
import type { ManualSystemInputs } from '../types';

interface ManualSystemInputProps {
  /** Current manual system values */
  currentValues: ManualSystemInputs;
  /** Gross Floor Area for calculation preview */
  gfa: number;
  /** Callback when user saves changes */
  onUpdate: (values: ManualSystemInputs) => void;
}

// Maximum allowed value for manual systems (kgCO2e/m² GFA)
const MAX_VALUE = 200;

/**
 * Component for inputting manual carbon system values (Spaceplan and Service)
 * These systems are calculated as: Input (kgCO2e/m² GFA) × GFA = Total Emissions
 */
export const ManualSystemInput = React.memo(({ currentValues, gfa, onUpdate }: ManualSystemInputProps) => {
  const [spaceplan, setSpaceplan] = useState(currentValues.spaceplan.toString());
  const [service, setService] = useState(currentValues.service.toString());
  const [errors, setErrors] = useState<{ spaceplan?: string; service?: string }>({});

  // Sync local state with prop changes to prevent stale data
  useEffect(() => {
    setSpaceplan(currentValues.spaceplan.toString());
    setService(currentValues.service.toString());
  }, [currentValues.spaceplan, currentValues.service]);

  /**
   * Validates a manual system input value
   */
  const validateValue = useCallback((value: string, name: string): { valid: boolean; error?: string; numValue?: number } => {
    // Empty string is allowed (will default to 0)
    if (value.trim() === '') {
      return { valid: true, numValue: 0 };
    }

    // Reject scientific notation to prevent confusion
    if (/[eE]/.test(value)) {
      return { valid: false, error: `${name} cannot use scientific notation` };
    }

    const numValue = parseFloat(value);

    if (isNaN(numValue) || !isFinite(numValue)) {
      return { valid: false, error: `${name} must be a valid number` };
    }

    if (numValue < 0) {
      return { valid: false, error: `${name} cannot be negative` };
    }

    if (numValue > MAX_VALUE) {
      return { valid: false, error: `${name} cannot exceed ${MAX_VALUE} kgCO2e/m² GFA` };
    }

    return { valid: true, numValue };
  }, []);

  /**
   * Handles input change with validation
   */
  const handleInputChange = useCallback((value: string, field: 'spaceplan' | 'service') => {
    if (field === 'spaceplan') {
      setSpaceplan(value);
    } else {
      setService(value);
    }

    // Clear error for this field when user starts typing
    setErrors(prev => ({ ...prev, [field]: undefined }));
  }, []);

  /**
   * Handles form submission with validation
   */
  const handleUpdate = useCallback(() => {
    const spaceplanValidation = validateValue(spaceplan, 'Spaceplan');
    const serviceValidation = validateValue(service, 'Service');

    const newErrors: { spaceplan?: string; service?: string } = {};

    if (!spaceplanValidation.valid) {
      newErrors.spaceplan = spaceplanValidation.error;
    }

    if (!serviceValidation.valid) {
      newErrors.service = serviceValidation.error;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // All valid - update values
    onUpdate({
      spaceplan: spaceplanValidation.numValue ?? 0,
      service: serviceValidation.numValue ?? 0,
    });

    // Clear any existing errors
    setErrors({});
  }, [spaceplan, service, validateValue, onUpdate]);

  /**
   * Calculates total emissions preview for a given input value
   */
  const calculatePreview = useCallback((value: string): number | null => {
    const validation = validateValue(value, '');
    if (validation.valid && validation.numValue !== undefined) {
      return validation.numValue * gfa;
    }
    return null;
  }, [validateValue, gfa]);

  // Memoize preview calculations to avoid unnecessary recalculations
  const spaceplanPreview = useMemo(() => calculatePreview(spaceplan), [calculatePreview, spaceplan]);
  const servicePreview = useMemo(() => calculatePreview(service), [calculatePreview, service]);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Manual Systems
      </h3>
      <p className="text-sm text-gray-600 mb-4">
        Enter carbon intensity values for systems not included in the uploaded JSON.
        Values are specified in kgCO2e/m² GFA and will be multiplied by the building's gross floor area.
      </p>

      <div className="space-y-4">
        {/* Spaceplan Input */}
        <div>
          <label htmlFor="spaceplan-input" className="block text-sm font-medium text-gray-700 mb-1">
            Spaceplan (Interior Fit-out)
          </label>
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <div className="relative">
                <input
                  id="spaceplan-input"
                  type="number"
                  min="0"
                  max={MAX_VALUE}
                  step="0.1"
                  value={spaceplan}
                  onChange={(e) => handleInputChange(e.target.value, 'spaceplan')}
                  aria-label="Spaceplan carbon intensity in kilograms CO2 equivalent per square meter gross floor area"
                  aria-describedby={errors.spaceplan ? "spaceplan-error" : "spaceplan-help"}
                  aria-invalid={!!errors.spaceplan}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.spaceplan ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0"
                />
                <span className="absolute right-3 top-2 text-sm text-gray-500" aria-hidden="true">
                  kgCO2e/m² GFA
                </span>
              </div>
              {errors.spaceplan && (
                <p id="spaceplan-error" role="alert" className="mt-1 text-sm text-red-600">
                  {errors.spaceplan}
                </p>
              )}
              {!errors.spaceplan && spaceplanPreview !== null && (
                <p id="spaceplan-help" className="mt-1 text-sm text-gray-600">
                  Total: {spaceplanPreview.toLocaleString()} kgCO2e
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Service Input */}
        <div>
          <label htmlFor="service-input" className="block text-sm font-medium text-gray-700 mb-1">
            Service (HVAC, Electrical, Plumbing)
          </label>
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <div className="relative">
                <input
                  id="service-input"
                  type="number"
                  min="0"
                  max={MAX_VALUE}
                  step="0.1"
                  value={service}
                  onChange={(e) => handleInputChange(e.target.value, 'service')}
                  aria-label="Service carbon intensity in kilograms CO2 equivalent per square meter gross floor area"
                  aria-describedby={errors.service ? "service-error" : "service-help"}
                  aria-invalid={!!errors.service}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.service ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0"
                />
                <span className="absolute right-3 top-2 text-sm text-gray-500" aria-hidden="true">
                  kgCO2e/m² GFA
                </span>
              </div>
              {errors.service && (
                <p id="service-error" role="alert" className="mt-1 text-sm text-red-600">
                  {errors.service}
                </p>
              )}
              {!errors.service && servicePreview !== null && (
                <p id="service-help" className="mt-1 text-sm text-gray-600">
                  Total: {servicePreview.toLocaleString()} kgCO2e
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Update Button */}
        <div className="pt-2">
          <button
            onClick={handleUpdate}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Update Manual Systems
          </button>
        </div>

        {/* Info Box */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-xs text-blue-800">
            <strong>Note:</strong> Manual system values are saved independently for each assessment.
            Maximum allowed value is {MAX_VALUE} kgCO2e/m² GFA per system.
          </p>
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Return true if props are equal (skip re-render)
  return (
    prevProps.currentValues.spaceplan === nextProps.currentValues.spaceplan &&
    prevProps.currentValues.service === nextProps.currentValues.service &&
    prevProps.gfa === nextProps.gfa &&
    prevProps.onUpdate === nextProps.onUpdate
  );
});

ManualSystemInput.displayName = 'ManualSystemInput';
