import { useState, useCallback } from 'react';
import { Assessment, BuildingData, EmissionFactorsDatabase } from '../types';
import { calculateCarbonEmissions } from '../utils/calculator';
import { mergeEmissionFactors } from '../utils/emissionFactorHelpers';
import { MAX_ASSESSMENT_NAME_LENGTH } from '../constants';

/**
 * Generates a unique ID using crypto.randomUUID or fallback
 */
function generateUniqueId(): string {
  // Use crypto.randomUUID if available (modern browsers)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback with counter to prevent collisions
  const timestamp = Date.now();
  const random1 = Math.random().toString(36).slice(2, 11);
  const random2 = Math.random().toString(36).slice(2, 11);
  return `${timestamp}-${random1}-${random2}`;
}

/**
 * Extracts a clean filename from a File object
 * Removes .json extension and handles special characters
 */
export function extractFilename(filename: string): string {
  let name = filename.trim();

  // Handle empty or just extension
  if (!name || name === '.json') {
    return 'Untitled';
  }

  // Remove all .json extensions (handles .backup.json, etc.)
  name = name.replace(/\.json$/i, '');

  // Remove leading/trailing dots and spaces
  name = name.replace(/^[.\s]+|[.\s]+$/g, '');

  // Replace sequences of special chars with single space
  name = name.replace(/[^\w\s-]/g, ' ').replace(/\s+/g, ' ').trim();

  // Handle still empty after cleaning
  if (!name) {
    return 'Untitled';
  }

  // Truncate if too long
  if (name.length > MAX_ASSESSMENT_NAME_LENGTH) {
    name = name.slice(0, MAX_ASSESSMENT_NAME_LENGTH - 3) + '...';
  }

  return name;
}

/**
 * Ensures assessment name is unique by appending (2), (3), etc. if needed
 */
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

/**
 * Custom hook for managing multiple carbon assessments
 */
export function useAssessments(
  emissionFactors: EmissionFactorsDatabase | null,
  onError?: (error: { message: string; field: string }) => void
) {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  /**
   * Add a new assessment with automatic calculation
   */
  const addAssessment = useCallback(
    (buildingData: BuildingData, filename: string) => {
      if (!emissionFactors) {
        const error = {
          field: 'system',
          message: 'Cannot add assessment: emission factors not loaded',
        };
        console.error(error.message);
        onError?.(error);
        return { success: false, error: error.message };
      }

      try {
        // Generate unique ID
        const id = generateUniqueId();

        // Use functional update to avoid stale closure
        setAssessments((prev) => {
          // Extract and ensure unique name using prev state
          const baseName = extractFilename(filename);
          const existingNames = prev.map((a) => a.name);
          const name = ensureUniqueName(baseName, existingNames);

          // Calculate emissions with error handling
          const result = calculateCarbonEmissions(buildingData, emissionFactors);

          // Create new assessment
          const newAssessment: Assessment = {
            id,
            name,
            buildingData,
            result,
            timestamp: Date.now(),
          };

          return [...prev, newAssessment];
        });

        // Set active after state update
        setActiveId(id);
        return { success: true, id };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Calculation failed';
        const errorObj = { field: 'calculation', message };
        console.error('Failed to add assessment:', error);
        onError?.(errorObj);
        return { success: false, error: message };
      }
    },
    [emissionFactors, onError]
  );

  /**
   * Remove an assessment by ID
   */
  const removeAssessment = useCallback(
    (id: string) => {
      const wasActive = id === activeId;

      setAssessments((prev) => {
        const filtered = prev.filter((a) => a.id !== id);

        // If removing active assessment, calculate next active ID
        if (wasActive && filtered.length > 0) {
          const removedIndex = prev.findIndex((a) => a.id === id);
          const nextIndex = removedIndex < filtered.length ? removedIndex : filtered.length - 1;
          const nextActiveId = filtered[nextIndex]?.id || null;

          // Use queueMicrotask to ensure proper state update order
          queueMicrotask(() => {
            setActiveId(nextActiveId);
          });
        } else if (filtered.length === 0) {
          queueMicrotask(() => {
            setActiveId(null);
          });
        }

        return filtered;
      });
    },
    [activeId]
  );

  /**
   * Replace an existing assessment with a new one
   */
  const replaceAssessment = useCallback(
    (idToReplace: string, buildingData: BuildingData, filename: string) => {
      if (!emissionFactors) {
        const error = {
          field: 'system',
          message: 'Cannot replace assessment: emission factors not loaded',
        };
        console.error(error.message);
        onError?.(error);
        return { success: false, error: error.message };
      }

      try {
        // Generate unique ID for new assessment
        const id = generateUniqueId();

        // Use functional update to avoid stale closure
        setAssessments((prev) => {
          // Extract and ensure unique name (excluding the one being replaced)
          const baseName = extractFilename(filename);
          const existingNames = prev
            .filter((a) => a.id !== idToReplace)
            .map((a) => a.name);
          const name = ensureUniqueName(baseName, existingNames);

          // Calculate emissions with error handling
          const result = calculateCarbonEmissions(buildingData, emissionFactors);

          // Create new assessment
          const newAssessment: Assessment = {
            id,
            name,
            buildingData,
            result,
            timestamp: Date.now(),
          };

          // Replace in array
          const index = prev.findIndex((a) => a.id === idToReplace);
          if (index === -1) return prev;

          const updated = [...prev];
          updated[index] = newAssessment;
          return updated;
        });

        // Set new assessment as active
        setActiveId(id);
        return { success: true, id };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Calculation failed';
        const errorObj = { field: 'calculation', message };
        console.error('Failed to replace assessment:', error);
        onError?.(errorObj);
        return { success: false, error: message };
      }
    },
    [emissionFactors, onError]
  );

  /**
   * Update assessment name
   */
  const updateAssessmentName = useCallback(
    (id: string, newName: string) => {
      const trimmedName = newName.trim();

      // Use functional update to get current state
      let validationError: string | null = null;

      setAssessments((prev) => {
        // Validate name
        if (!trimmedName) {
          validationError = 'Assessment name cannot be empty';
          return prev;
        }

        if (trimmedName.length > MAX_ASSESSMENT_NAME_LENGTH) {
          validationError = `Assessment name cannot exceed ${MAX_ASSESSMENT_NAME_LENGTH} characters`;
          return prev;
        }

        // Check for duplicates (excluding current assessment)
        const existingNames = prev
          .filter((a) => a.id !== id)
          .map((a) => a.name);

        if (existingNames.includes(trimmedName)) {
          validationError = 'Assessment name must be unique';
          return prev;
        }

        // Update name
        return prev.map((a) => (a.id === id ? { ...a, name: trimmedName } : a));
      });

      if (validationError) {
        console.warn(validationError);
        return { success: false, error: validationError };
      }

      return { success: true };
    },
    []
  );

  /**
   * Update emission factors for an assessment and recalculate
   */
  const updateAssessmentEmissionFactors = useCallback(
    (id: string, customFactors: EmissionFactorsDatabase) => {
      if (!emissionFactors) {
        const error = {
          field: 'system',
          message: 'Cannot update emission factors: emission factors not loaded',
        };
        console.error(error.message);
        onError?.(error);
        return { success: false, error: error.message };
      }

      try {
        let assessmentFound = false;
        let updateSuccess = false;

        setAssessments((prev) => {
          // Check if assessment exists
          const assessment = prev.find(a => a.id === id);
          if (!assessment) {
            assessmentFound = false;
            return prev;
          }

          assessmentFound = true;

          return prev.map((assessment) => {
            if (assessment.id !== id) return assessment;

            try {
              // Store custom factors (remove if empty)
              const updatedAssessment: Assessment = {
                ...assessment,
                customEmissionFactors:
                  Object.keys(customFactors).length > 0 ? customFactors : undefined,
              };

              // Recalculate with merged factors
              const mergedFactors = mergeEmissionFactors(emissionFactors, customFactors);
              const result = calculateCarbonEmissions(
                assessment.buildingData,
                mergedFactors
              );
              updatedAssessment.result = result;

              updateSuccess = true;

              // Log for debugging
              if (Object.keys(customFactors).length === 0 && assessment.customEmissionFactors) {
                console.info(`Cleared custom emission factors for assessment ${id}`);
              }

              return updatedAssessment;
            } catch (calcError) {
              console.error('Error during recalculation:', calcError);
              return assessment; // Return unchanged on error
            }
          });
        });

        if (!assessmentFound) {
          const error = {
            field: 'assessment',
            message: 'Assessment not found',
          };
          onError?.(error);
          return { success: false, error: error.message };
        }

        if (!updateSuccess) {
          const error = {
            field: 'calculation',
            message: 'Failed to recalculate with custom factors',
          };
          onError?.(error);
          return { success: false, error: error.message };
        }

        return {
          success: true,
          cleared: Object.keys(customFactors).length === 0,
          factorCount: Object.keys(customFactors).length,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Recalculation failed';
        const errorObj = { field: 'calculation', message };
        console.error('Failed to update emission factors:', error);
        onError?.(errorObj);
        return { success: false, error: message };
      }
    },
    [emissionFactors, onError]
  );

  /**
   * Set active assessment
   */
  const setActive = useCallback((id: string) => {
    setActiveId(id);
  }, []);

  /**
   * Get active assessment object
   */
  const activeAssessment = assessments.find((a) => a.id === activeId) || null;

  return {
    assessments,
    activeAssessment,
    activeId,
    addAssessment,
    removeAssessment,
    replaceAssessment,
    updateAssessmentName,
    updateAssessmentEmissionFactors,
    setActive,
  };
}
