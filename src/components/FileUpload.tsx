import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { BuildingData, ValidationError } from '../types';
import { validateBuildingData } from '../utils/calculator';

interface FileUploadProps {
  onDataLoaded: (data: BuildingData) => void;
  onError: (errors: ValidationError[]) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onDataLoaded, onError }) => {
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const MAX_JSON_DEPTH = 20; // Increased to accommodate complex building data structures

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        onError([{
          field: 'file',
          message: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`
        }]);
        return;
      }

      const reader = new FileReader();

      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;

          // Check content length
          if (content.length > MAX_FILE_SIZE) {
            onError([{ field: 'file', message: 'File content too large' }]);
            return;
          }

          // Parse with reviver to prevent prototype pollution
          const jsonData = JSON.parse(content, function reviver(key, value) {
            if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
              return undefined; // Prevent prototype pollution
            }
            return value;
          });

          // Check depth after parsing
          const checkDepth = (obj: unknown, currentDepth = 0): number => {
            if (obj === null || typeof obj !== 'object') {
              return currentDepth;
            }
            if (currentDepth > MAX_JSON_DEPTH) {
              throw new Error(`JSON structure too deeply nested (depth: ${currentDepth}, max: ${MAX_JSON_DEPTH})`);
            }
            let maxDepth = currentDepth;
            const values = Array.isArray(obj) ? obj : Object.values(obj);
            for (const value of values) {
              const depth = checkDepth(value, currentDepth + 1);
              maxDepth = Math.max(maxDepth, depth);
            }
            return maxDepth;
          };

          const actualDepth = checkDepth(jsonData);
          console.log(`JSON depth: ${actualDepth}, max allowed: ${MAX_JSON_DEPTH}`);

          const errors = validateBuildingData(jsonData);

          if (errors.length > 0) {
            onError(errors);
          } else {
            onDataLoaded(jsonData as BuildingData);
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Invalid JSON file';
          onError([{ field: 'file', message }]);
        }
      };

      reader.onerror = () => {
        onError([{ field: 'file', message: 'Error reading file' }]);
      };

      reader.readAsText(file);
    },
    [onDataLoaded, onError]
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'application/json': ['.json'],
    },
    multiple: false,
    maxFiles: 1,
    maxSize: MAX_FILE_SIZE,
    onDropRejected: (fileRejections) => {
      const errors = fileRejections.map(rejection => {
        const reason = rejection.errors[0]?.message || 'File rejected';
        return { field: 'file', message: reason };
      });
      onError(errors);
    },
  });

  return (
    <div
      {...getRootProps()}
      role="button"
      tabIndex={0}
      aria-label="Upload building data JSON file"
      aria-describedby="upload-instructions"
      className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
        isDragActive
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-300 hover:border-gray-400 bg-white'
      }`}
    >
      <input {...getInputProps()} aria-label="File input for building data" />
      <div className="flex flex-col items-center gap-4">
        <svg
          className="w-16 h-16 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        {isDragActive ? (
          <p className="text-lg text-blue-600">Drop the file here...</p>
        ) : (
          <>
            <p id="upload-instructions" className="text-lg text-gray-700">
              Drag and drop a building JSON file here, or click to select
            </p>
            <p className="text-sm text-gray-500">Only .json files are accepted (max 5MB)</p>
          </>
        )}
      </div>
      {fileRejections.length > 0 && (
        <p className="text-sm text-red-600 mt-2" role="alert">
          {fileRejections[0].errors[0]?.message}
        </p>
      )}
    </div>
  );
};
