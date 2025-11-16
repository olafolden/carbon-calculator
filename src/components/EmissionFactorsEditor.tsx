import React, { useState, useMemo, useEffect, useCallback } from 'react';
import type {
  EmissionFactorsDatabase,
  EmissionFactorWithMeta,
  SystemType,
  EmissionFactorsEditorProps,
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
 * Reusable emission factors editor component
 *
 * Provides filtering, searching, and inline editing capabilities with
 * full keyboard navigation and screen reader support. Can be used inline
 * or within a modal dialog.
 *
 * @param defaultFactors - The global emission factors database
 * @param customFactors - Custom factors for the current assessment (optional)
 * @param onUpdate - Callback invoked when factors are updated
 * @param onValidationChange - Callback when validation state changes (optional)
 * @param compact - Whether to show in compact mode (no extra padding)
 *
 * @example
 * ```tsx
 * <EmissionFactorsEditor
 *   defaultFactors={emissionFactors}
 *   customFactors={assessment.customEmissionFactors}
 *   onUpdate={(factors) => updateAssessmentEmissionFactors(id, factors)}
 *   compact={true}
 * />
 * ```
 */
export const EmissionFactorsEditor: React.FC<EmissionFactorsEditorProps> = React.memo(({
  defaultFactors,
  customFactors,
  onUpdate,
  onValidationChange,
  compact = false,
}) => {
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

  // Track if there are unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Reset edited factors when customFactors prop changes
  useEffect(() => {
    setEditedFactors(customFactors || {});
    setValidationErrors({});
    setHasUnsavedChanges(false);
  }, [customFactors]);

  // Notify parent of validation state changes
  useEffect(() => {
    if (onValidationChange) {
      const hasErrors = Object.keys(validationErrors).length > 0;
      onValidationChange(hasErrors);
    }
  }, [validationErrors, onValidationChange]);

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
  const handleFactorChange = useCallback((id: string, newValue: string) => {
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
    setHasUnsavedChanges(true);
  }, [defaultFactors]);

  /**
   * Handles blur event for validation feedback
   */
  const handleFactorBlur = useCallback((id: string, value: string) => {
    if (value.trim() === '') {
      setValidationErrors(prev => ({ ...prev, [id]: 'Value is required' }));
    }
  }, []);

  /**
   * Resets a single factor to its default value
   */
  const handleResetFactor = useCallback((id: string) => {
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
    setHasUnsavedChanges(true);
  }, []);

  /**
   * Resets all factors to defaults
   */
  const handleResetAll = useCallback(() => {
    setEditedFactors({});
    setValidationErrors({});
    setHasUnsavedChanges(true);
  }, []);

  /**
   * Clears all active filters
   */
  const handleClearFilters = useCallback(() => {
    setSystemFilter('All');
    setUnitFilter('All');
    setSearchTerm('');
  }, []);

  /**
   * Saves the custom factors
   */
  const handleSave = useCallback(() => {
    // Check for validation errors (inline display handles showing them)
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    onUpdate(editedFactors);
    setHasUnsavedChanges(false);
  }, [editedFactors, validationErrors, onUpdate]);

  /**
   * Cancels changes and reverts to custom factors
   */
  const handleCancel = useCallback(() => {
    setEditedFactors(customFactors || {});
    setValidationErrors({});
    setHasUnsavedChanges(false);
  }, [customFactors]);

  /**
   * Gets the current factor value (custom or default)
   */
  const getFactorValue = useCallback((factor: EmissionFactorWithMeta): number => {
    return editedFactors[factor.id]?.factor ?? defaultFactors[factor.id].factor;
  }, [editedFactors, defaultFactors]);

  // Check if save button should be disabled
  const hasValidationErrors = Object.keys(validationErrors).length > 0;

  return (
    <div className={compact ? '' : 'bg-white rounded-lg shadow'}>
      {/* Header */}
      <div className={`${compact ? 'mb-4' : 'px-6 py-4 border-b border-gray-200'}`}>
        <h3 className="text-lg font-semibold text-gray-900">
          Emission Factors
        </h3>
        {customizedCount > 0 && (
          <p className="text-sm text-blue-600 mt-1">
            {customizedCount} factor{customizedCount !== 1 ? 's' : ''} customized
          </p>
        )}
      </div>

      {/* Filters */}
      <div className={`${compact ? 'mb-4' : 'px-6 py-4 border-b border-gray-200'} bg-gray-50`}>
        <div className="flex flex-wrap gap-4 items-end">
          {/* System Filter */}
          <div className="flex-1 min-w-[150px]">
            <label htmlFor="system-filter" className="block text-sm font-medium text-gray-700 mb-1">
              S-Layer Type
            </label>
            <select
              id="system-filter"
              value={systemFilter}
              onChange={(e) => setSystemFilter(e.target.value as SystemType | 'All')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="All">All S-Layers</option>
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

          {/* Reset All Button */}
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
      <div className={`${compact ? '' : 'px-6 py-4'} overflow-auto max-h-[600px] border border-gray-200 rounded-lg`}>
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
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Layer ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  S-Layer Type
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

      {/* Action Buttons */}
      {hasUnsavedChanges && (
        <div className={`${compact ? 'mt-4' : 'px-6 py-4 border-t border-gray-200'} bg-gray-50`}>
          {/* Validation Error Summary */}
          {hasValidationErrors && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded" role="alert">
              <p className="text-sm text-red-800 font-medium">
                Please fix {Object.keys(validationErrors).length} validation error{Object.keys(validationErrors).length !== 1 ? 's' : ''} before saving
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              onClick={handleCancel}
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
              Update Factors
            </button>
          </div>
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for React.memo optimization
  return (
    prevProps.defaultFactors === nextProps.defaultFactors &&
    prevProps.customFactors === nextProps.customFactors &&
    prevProps.compact === nextProps.compact
  );
});

EmissionFactorsEditor.displayName = 'EmissionFactorsEditor';

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
