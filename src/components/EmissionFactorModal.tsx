import React, { useState, useMemo, useEffect } from 'react';
import type {
  EmissionFactorsDatabase,
  EmissionFactorWithMeta,
  SystemType,
  EmissionFactorModalProps,
} from '../types';
import {
  enrichEmissionFactors,
  filterBySystem,
  filterByUnit,
  searchFactors,
  validateFactorRange,
  countCustomizedFactors,
} from '../utils/emissionFactorHelpers';

/**
 * Modal component for viewing and customizing emission factors
 *
 * Provides filtering, searching, and inline editing capabilities with
 * full keyboard navigation and screen reader support.
 *
 * @param defaultFactors - The global emission factors database
 * @param customFactors - Custom factors for the current assessment (optional)
 * @param onSave - Callback invoked when user saves custom factors
 * @param onClose - Callback invoked when modal is closed
 *
 * @example
 * ```tsx
 * <EmissionFactorModal
 *   defaultFactors={emissionFactors}
 *   customFactors={assessment.customEmissionFactors}
 *   onSave={(factors) => updateAssessment(id, factors)}
 *   onClose={() => setModalOpen(false)}
 * />
 * ```
 */
export default function EmissionFactorModal({
  defaultFactors,
  customFactors,
  onSave,
  onClose,
}: EmissionFactorModalProps) {
  // State for edited factors (local changes before save)
  const [editedFactors, setEditedFactors] = useState<EmissionFactorsDatabase>(
    customFactors || {}
  );

  // Validation errors state
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Filter and search state
  const [systemFilter, setSystemFilter] = useState<SystemType | 'All'>('All');
  const [unitFilter, setUnitFilter] = useState<'kgCO2e/m²' | 'kgCO2e/m' | 'All'>('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Reset edited factors when customFactors prop changes or modal opens
  useEffect(() => {
    setEditedFactors(customFactors || {});
    setValidationErrors({});
  }, [customFactors]);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Compute enriched factors with custom overrides
  const enrichedFactors = useMemo(() => {
    return enrichEmissionFactors(defaultFactors, editedFactors);
  }, [defaultFactors, editedFactors]);

  // Compute displayed factors based on filters
  const displayedFactors = useMemo(() => {
    let factors = [...enrichedFactors];
    factors = filterBySystem(factors, systemFilter);
    factors = filterByUnit(factors, unitFilter);
    factors = searchFactors(factors, searchTerm);
    return factors;
  }, [enrichedFactors, systemFilter, unitFilter, searchTerm]);

  // Count customized factors
  const customizedCount = countCustomizedFactors(editedFactors);

  /**
   * Handles changes to a factor value with validation
   */
  const handleFactorChange = (id: string, newValue: string) => {
    // Clear previous error
    setValidationErrors(prev => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });

    // Validate empty input
    if (newValue.trim() === '') {
      setValidationErrors(prev => ({ ...prev, [id]: 'Value is required' }));
      return;
    }

    const numValue = parseFloat(newValue);

    // Comprehensive validation with detailed error messages
    const validation = validateFactorRange(numValue);
    if (!validation.valid) {
      setValidationErrors(prev => ({ ...prev, [id]: validation.error || 'Invalid value' }));
      return;
    }

    setEditedFactors(prev => ({
      ...prev,
      [id]: {
        ...defaultFactors[id],
        factor: numValue,
      },
    }));
  };

  /**
   * Handles blur event for validation feedback
   */
  const handleFactorBlur = (id: string, value: string) => {
    if (value.trim() === '') {
      setValidationErrors(prev => ({ ...prev, [id]: 'Value is required' }));
    }
  };

  /**
   * Resets a single factor to its default value
   */
  const handleResetFactor = (id: string) => {
    setEditedFactors(prev => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });

    // Clear any validation errors for this factor
    setValidationErrors(prev => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
  };

  /**
   * Resets all factors to defaults
   */
  const handleResetAll = () => {
    setEditedFactors({});
    setValidationErrors({});
  };

  /**
   * Clears all active filters
   */
  const handleClearFilters = () => {
    setSystemFilter('All');
    setUnitFilter('All');
    setSearchTerm('');
  };

  /**
   * Saves the custom factors and closes modal with confirmation
   */
  const handleSave = () => {
    const changeCount = Object.keys(editedFactors).length;

    // Check for validation errors
    if (Object.keys(validationErrors).length > 0) {
      alert('Please fix validation errors before saving');
      return;
    }

    // If no changes, just close
    if (changeCount === 0) {
      onClose();
      return;
    }

    // Confirm save
    const confirmed = confirm(
      `Save ${changeCount} customized factor${changeCount !== 1 ? 's' : ''}?\n\n` +
      `This will recalculate all emission values for this assessment.`
    );

    if (confirmed) {
      onSave(editedFactors);
      onClose();
    }
  };

  /**
   * Gets the current factor value (custom or default)
   */
  const getFactorValue = (factor: EmissionFactorWithMeta): number => {
    return editedFactors[factor.id]?.factor ?? defaultFactors[factor.id].factor;
  };

  // Check if save button should be disabled
  const hasValidationErrors = Object.keys(validationErrors).length > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 id="modal-title" className="text-2xl font-bold text-gray-900">
              Customize Emission Factors
            </h2>
            {customizedCount > 0 && (
              <p className="text-sm text-blue-600 mt-1">
                {customizedCount} factor{customizedCount !== 1 ? 's' : ''} customized
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close emission factors modal (Esc)"
            title="Close (Esc)"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Filters */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-wrap gap-4 items-end">
            {/* System Filter */}
            <div className="flex-1 min-w-[150px]">
              <label htmlFor="system-filter" className="block text-sm font-medium text-gray-700 mb-1">
                System
              </label>
              <select
                id="system-filter"
                value={systemFilter}
                onChange={(e) => setSystemFilter(e.target.value as SystemType | 'All')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="All">All Systems</option>
                <option value="Skin">Skin</option>
                <option value="Superstructure">Superstructure</option>
                <option value="Substructure">Substructure</option>
              </select>
            </div>

            {/* Unit Filter */}
            <div className="flex-1 min-w-[150px]">
              <label htmlFor="unit-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Unit Type
              </label>
              <select
                id="unit-filter"
                value={unitFilter}
                onChange={(e) => setUnitFilter(e.target.value as 'kgCO2e/m²' | 'kgCO2e/m' | 'All')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="All">All Units</option>
                <option value="kgCO2e/m²">Area-based (kgCO2e/m²)</option>
                <option value="kgCO2e/m">Length-based (kgCO2e/m)</option>
              </select>
            </div>

            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                id="search"
                type="text"
                placeholder="Search by name or material..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Reset All Button - Always visible, disabled when no customizations */}
            <div>
              <button
                onClick={handleResetAll}
                disabled={customizedCount === 0}
                className={`px-4 py-2 text-sm font-medium border rounded-md transition-colors ${
                  customizedCount > 0
                    ? 'text-red-600 border-red-300 hover:bg-red-50'
                    : 'text-gray-400 border-gray-200 cursor-not-allowed'
                }`}
                title={customizedCount === 0 ? 'No customizations to reset' : 'Reset all factors to defaults'}
              >
                Reset All
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto px-6 py-4">
          {displayedFactors.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-2">
                No emission factors match your current filters
              </p>
              <button
                onClick={handleClearFilters}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Layer ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    System
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Material
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Factor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {displayedFactors.map((factor) => {
                  const isCustomized = editedFactors[factor.id] !== undefined;
                  const currentValue = getFactorValue(factor);
                  const hasError = validationErrors[factor.id] !== undefined;

                  return (
                    <FactorRow
                      key={factor.id}
                      factor={factor}
                      isCustomized={isCustomized}
                      currentValue={currentValue}
                      hasError={hasError}
                      errorMessage={validationErrors[factor.id]}
                      onFactorChange={handleFactorChange}
                      onFactorBlur={handleFactorBlur}
                      onResetFactor={handleResetFactor}
                    />
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={hasValidationErrors}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              hasValidationErrors
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'text-white bg-blue-600 hover:bg-blue-700'
            }`}
            title={hasValidationErrors ? 'Fix validation errors before saving' : 'Save changes and recalculate'}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Memoized row component for performance optimization
 */
interface FactorRowProps {
  factor: EmissionFactorWithMeta;
  isCustomized: boolean;
  currentValue: number;
  hasError: boolean;
  errorMessage?: string;
  onFactorChange: (id: string, value: string) => void;
  onFactorBlur: (id: string, value: string) => void;
  onResetFactor: (id: string) => void;
}

const FactorRow = React.memo(({
  factor,
  isCustomized,
  currentValue,
  hasError,
  errorMessage,
  onFactorChange,
  onFactorBlur,
  onResetFactor,
}: FactorRowProps) => {
  return (
    <tr className={isCustomized ? 'bg-blue-50' : ''}>
      <td className="px-4 py-3 text-sm font-medium text-gray-900">
        {factor.id}
        {isCustomized && (
          <span
            className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
            title="This factor has been customized"
            aria-label="Customized"
          >
            Custom
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-sm text-gray-500">
        {factor.system}
      </td>
      <td className="px-4 py-3 text-sm text-gray-500 max-w-xs">
        <span
          className="truncate block"
          title={factor.material}
          aria-label={factor.material}
        >
          {factor.material}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-gray-500">
        {factor.unit}
      </td>
      <td className="px-4 py-3 text-sm">
        <div className="relative">
          <input
            type="number"
            min="0"
            max="1000000"
            step="0.1"
            value={currentValue}
            onChange={(e) => onFactorChange(factor.id, e.target.value)}
            onBlur={(e) => onFactorBlur(factor.id, e.target.value)}
            aria-label={`Emission factor for ${factor.id}`}
            aria-invalid={hasError ? 'true' : 'false'}
            aria-describedby={hasError ? `error-${factor.id}` : undefined}
            className={`w-24 px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              hasError
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300'
            }`}
          />
          {hasError && errorMessage && (
            <p
              id={`error-${factor.id}`}
              className="absolute left-0 top-full text-xs text-red-600 mt-1 whitespace-nowrap"
              role="alert"
            >
              {errorMessage}
            </p>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-sm">
        {isCustomized && (
          <button
            onClick={() => onResetFactor(factor.id)}
            className="text-xs text-red-600 hover:text-red-800 font-medium"
            aria-label={`Reset ${factor.id} to default value`}
          >
            Reset
          </button>
        )}
      </td>
    </tr>
  );
});

FactorRow.displayName = 'FactorRow';
