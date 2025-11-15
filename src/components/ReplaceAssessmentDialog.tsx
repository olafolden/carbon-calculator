import { useState } from 'react';
import { Assessment } from '../types';

interface ReplaceAssessmentDialogProps {
  assessments: Assessment[];
  onSelect: (id: string) => void;
  onCancel: () => void;
}

export default function ReplaceAssessmentDialog({
  assessments,
  onSelect,
  onCancel,
}: ReplaceAssessmentDialogProps) {
  const [selectedId, setSelectedId] = useState<string>(assessments[0]?.id || '');

  const handleConfirm = () => {
    if (selectedId) {
      onSelect(selectedId);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Maximum Assessments Reached
        </h2>
        <p className="text-gray-600 mb-6">
          You can have up to {assessments.length} assessments open at a time.
          Please select which assessment to replace:
        </p>

        <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
          {assessments.map((assessment) => (
            <label
              key={assessment.id}
              className={`
                block p-4 border-2 rounded-lg cursor-pointer transition-all
                ${
                  selectedId === assessment.id
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400 bg-white'
                }
              `}
            >
              <div className="flex items-start">
                <input
                  type="radio"
                  name="assessment"
                  value={assessment.id}
                  checked={selectedId === assessment.id}
                  onChange={() => setSelectedId(assessment.id)}
                  className="mt-1 mr-3"
                />
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 mb-1">
                    {assessment.name}
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="flex items-center gap-4">
                      <span>
                        GFA: {assessment.result.gfa.toLocaleString()} m²
                      </span>
                      <span>
                        Carbon Intensity:{' '}
                        {assessment.result.carbonIntensity.toFixed(1)} kgCO2e/m²
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Total Emissions:{' '}
                      {(assessment.result.totalEmissions / 1000).toFixed(1)} tCO2e
                      {' • '}
                      Uploaded: {formatDate(assessment.timestamp)}
                    </div>
                  </div>
                </div>
              </div>
            </label>
          ))}
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedId}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Replace
          </button>
        </div>
      </div>
    </div>
  );
}
