import { useState, useEffect, useRef } from 'react';
import { BuildingData, ValidationError, EmissionFactorsDatabase, EmissionFactor } from './types';
import { FileUpload } from './components/FileUpload';
import { ResultsDisplay } from './components/ResultsDisplay';
import { SystemChart } from './components/SystemChart';
import AssessmentTabs from './components/AssessmentTabs';
import ReplaceAssessmentDialog from './components/ReplaceAssessmentDialog';
import { useAssessments } from './hooks/useAssessments';
import { processJSONFile } from './utils/fileProcessor';
import { MAX_ASSESSMENTS } from './constants';
import emissionFactorsData from './data/emissionFactors.json';
import { logger } from './utils/logger';

function App() {
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [emissionFactors, setEmissionFactors] = useState<EmissionFactorsDatabase | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showReplaceDialog, setShowReplaceDialog] = useState(false);
  const [pendingUpload, setPendingUpload] = useState<{ data: BuildingData; filename: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Error callback for assessments hook
  const handleAssessmentError = (error: { message: string; field: string }) => {
    setErrors([error]);
  };

  // Use the assessments hook
  const {
    assessments,
    activeAssessment,
    activeId,
    addAssessment,
    removeAssessment,
    replaceAssessment,
    updateAssessmentName,
    setActive,
  } = useAssessments(emissionFactors, handleAssessmentError);

  useEffect(() => {
    // Validate emission factors on mount
    try {
      if (!emissionFactorsData || typeof emissionFactorsData !== 'object') {
        throw new Error('Invalid emission factors data structure');
      }

      // Validate each entry
      const validated: EmissionFactorsDatabase = {};
      for (const [key, value] of Object.entries(emissionFactorsData)) {
        if (!value || typeof value !== 'object') {
          throw new Error(`Invalid emission factor for ${key}`);
        }
        if (typeof value.factor !== 'number' || value.factor < 0) {
          throw new Error(`Invalid factor value for ${key}`);
        }
        if (!['kgCO2e/m²', 'kgCO2e/m'].includes(value.unit)) {
          throw new Error(`Invalid unit for ${key}`);
        }
        validated[key] = value as EmissionFactor;
      }

      setEmissionFactors(validated);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load emission factors';
      setLoadError(message);
      logger.error('Emission factors validation failed:', error);
    }
  }, []);

  const handleDataLoaded = async (data: BuildingData, filename: string) => {
    if (!emissionFactors) {
      setErrors([{ field: 'system', message: 'Emission factors not loaded' }]);
      return;
    }

    if (isProcessing) {
      console.warn('Upload already in progress');
      return;
    }

    setIsProcessing(true);
    setErrors([]);

    try {
      // Use setTimeout to allow UI to update
      await new Promise(resolve => setTimeout(resolve, 0));

      // Check if at max capacity
      if (assessments.length >= MAX_ASSESSMENTS) {
        setPendingUpload({ data, filename });
        setShowReplaceDialog(true);
        return;
      }

      // Add new assessment
      addAssessment(data, filename);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to process file';
      setErrors([{ field: 'system', message }]);
      console.error('Error processing file:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleError = (validationErrors: ValidationError[]) => {
    setErrors(validationErrors);
  };

  const handleReplaceSelection = (idToReplace: string) => {
    if (pendingUpload) {
      replaceAssessment(idToReplace, pendingUpload.data, pendingUpload.filename);
      setPendingUpload(null);
      setShowReplaceDialog(false);
    }
  };

  const handleNewAssessment = () => {
    if (!fileInputRef.current) {
      console.error('File input ref not attached');
      setErrors([{
        field: 'system',
        message: 'File upload is not available. Please refresh the page.'
      }]);
      return;
    }

    // Trigger file input
    fileInputRef.current.click();
  };

  const handleReplaceCancel = () => {
    setShowReplaceDialog(false);
    setPendingUpload(null);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md p-8 bg-white rounded-lg shadow">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Configuration Error</h1>
          <p className="text-gray-700">{loadError}</p>
        </div>
      </div>
    );
  }

  if (!emissionFactors) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Skip to main content link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:p-4 focus:bg-blue-600 focus:text-white focus:no-underline"
      >
        Skip to main content
      </a>

      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Building Carbon Calculator</h1>
          <p className="mt-2 text-sm text-gray-600">
            Calculate embodied carbon emissions for your building project
          </p>
        </div>
      </header>

      {/* Assessment Tabs - only show if there are assessments */}
      {assessments.length > 0 && (
        <AssessmentTabs
          assessments={assessments}
          activeId={activeId}
          onTabClick={setActive}
          onTabClose={removeAssessment}
          onTabRename={updateAssessmentName}
          onNewAssessment={handleNewAssessment}
          maxAssessments={MAX_ASSESSMENTS}
        />
      )}

      {/* Main Content */}
      <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {assessments.length === 0 ? (
          <div className="space-y-6">
            <FileUpload onDataLoaded={handleDataLoaded} onError={handleError} />

            {/* Error Display */}
            {errors.length > 0 && (
              <div
                role="alert"
                aria-live="assertive"
                className="bg-red-50 border border-red-200 rounded-lg p-4"
              >
                <h3 className="text-sm font-semibold text-red-800 mb-2">
                  Validation Errors:
                </h3>
                <ul className="list-disc list-inside space-y-1">
                  {errors.map((error) => (
                    <li key={`${error.field}-${error.message}`} className="text-sm text-red-700">
                      <span className="font-medium">{error.field}:</span> {error.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">How to use:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
                <li>Prepare your building data in JSON format with the required structure</li>
                <li>Upload the JSON file using the drag-and-drop area above</li>
                <li>Review the calculated carbon emissions and system breakdown</li>
                <li>Export results as JSON or CSV for further analysis</li>
              </ol>
              <div className="mt-4 p-4 bg-white rounded border border-blue-100">
                <p className="text-xs font-mono text-gray-700 mb-2">Expected JSON structure:</p>
                <pre className="text-xs text-gray-600 overflow-x-auto">
{`{
  "main": {
    "gfa": 51680,
    "amountOfLevels": 10,
    "floorToFloorHeight": 3.5,
    "floorToFloorHeightGroundFloor": 4.2
  },
  "sLayers": [
    {
      "id": "Skin",
      "layers": [
        { "id": "Roof", "area": 5168 },
        { "id": "Facade", "area": 8400 }
      ]
    },
    {
      "id": "Superstructure",
      "layers": [
        { "id": "Beam -8.4 m", "length": 1200 },
        { "id": "Column -8.4 m", "length": 840 }
      ]
    }
  ]
}`}
                </pre>
              </div>
            </div>
          </div>
        ) : activeAssessment ? (
          <div
            role="tabpanel"
            id={`tabpanel-${activeAssessment.id}`}
            aria-labelledby={`tab-${activeAssessment.id}`}
            className="space-y-6"
          >
            <ResultsDisplay assessment={activeAssessment} />
            <SystemChart assessment={activeAssessment} />
          </div>
        ) : null}
      </main>

      {/* Hidden file input for tab bar + button */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (file) {
            await processJSONFile(file, handleDataLoaded, handleError);
          }
          // Reset input
          e.target.value = '';
        }}
      />

      {/* Loading Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-gray-700 font-medium">Calculating emissions...</p>
            </div>
          </div>
        </div>
      )}

      {/* Replace Assessment Dialog */}
      {showReplaceDialog && (
        <ReplaceAssessmentDialog
          assessments={assessments}
          onSelect={handleReplaceSelection}
          onCancel={handleReplaceCancel}
        />
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-sm text-gray-500 text-center">
            Building Carbon Calculator - Calculate embodied carbon emissions for construction projects
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
