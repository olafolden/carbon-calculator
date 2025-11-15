import { useState, useCallback } from 'react';
import { Assessment, BuildingData, EmissionFactorsDatabase } from '../types';
import { calculateCarbonEmissions } from '../utils/calculator';

/**
 * Generates a unique ID based on timestamp and random number
 */
function generateUniqueId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Extracts a clean filename from a File object
 * Removes .json extension and handles special characters
 */
export function extractFilename(filename: string): string {
  let name = filename;

  // Remove .json extension
  if (name.toLowerCase().endsWith('.json')) {
    name = name.slice(0, -5);
  }

  // Truncate if too long (max 30 chars for display)
  if (name.length > 30) {
    name = name.slice(0, 27) + '...';
  }

  return name.trim() || 'Untitled';
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
export function useAssessments(emissionFactors: EmissionFactorsDatabase | null) {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  /**
   * Add a new assessment with automatic calculation
   */
  const addAssessment = useCallback(
    (buildingData: BuildingData, filename: string) => {
      if (!emissionFactors) {
        console.error('Cannot add assessment: emission factors not loaded');
        return;
      }

      // Generate unique ID
      const id = generateUniqueId();

      // Extract and ensure unique name
      const baseName = extractFilename(filename);
      const existingNames = assessments.map((a) => a.name);
      const name = ensureUniqueName(baseName, existingNames);

      // Calculate emissions
      const result = calculateCarbonEmissions(buildingData, emissionFactors);

      // Create new assessment
      const newAssessment: Assessment = {
        id,
        name,
        buildingData,
        result,
        timestamp: Date.now(),
      };

      // Add to assessments and set as active
      setAssessments((prev) => [...prev, newAssessment]);
      setActiveId(id);
    },
    [assessments, emissionFactors]
  );

  /**
   * Remove an assessment by ID
   */
  const removeAssessment = useCallback(
    (id: string) => {
      setAssessments((prev) => {
        const filtered = prev.filter((a) => a.id !== id);

        // If removing active assessment, set next one as active
        if (id === activeId) {
          if (filtered.length > 0) {
            // Find the index of the removed assessment
            const removedIndex = prev.findIndex((a) => a.id === id);
            // Set the next assessment as active, or previous if it was the last one
            const nextIndex = removedIndex < filtered.length ? removedIndex : filtered.length - 1;
            setActiveId(filtered[nextIndex]?.id || null);
          } else {
            setActiveId(null);
          }
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
        console.error('Cannot replace assessment: emission factors not loaded');
        return;
      }

      // Generate unique ID for new assessment
      const id = generateUniqueId();

      // Extract and ensure unique name (excluding the one being replaced)
      const baseName = extractFilename(filename);
      const existingNames = assessments
        .filter((a) => a.id !== idToReplace)
        .map((a) => a.name);
      const name = ensureUniqueName(baseName, existingNames);

      // Calculate emissions
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
      setAssessments((prev) => {
        const index = prev.findIndex((a) => a.id === idToReplace);
        if (index === -1) return prev;

        const updated = [...prev];
        updated[index] = newAssessment;
        return updated;
      });

      // Set new assessment as active
      setActiveId(id);
    },
    [assessments, emissionFactors]
  );

  /**
   * Update assessment name
   */
  const updateAssessmentName = useCallback(
    (id: string, newName: string) => {
      const trimmedName = newName.trim();

      // Validate name
      if (!trimmedName) {
        console.warn('Assessment name cannot be empty');
        return false;
      }

      if (trimmedName.length > 30) {
        console.warn('Assessment name cannot exceed 30 characters');
        return false;
      }

      // Check for duplicates (excluding current assessment)
      const existingNames = assessments
        .filter((a) => a.id !== id)
        .map((a) => a.name);

      if (existingNames.includes(trimmedName)) {
        console.warn('Assessment name must be unique');
        return false;
      }

      // Update name
      setAssessments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, name: trimmedName } : a))
      );

      return true;
    },
    [assessments]
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
    setActive,
  };
}
