import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { BuildingData, ValidationError } from '../types';
import { processJSONFile } from '../utils/fileProcessor';
import { MAX_FILE_SIZE } from '../constants';

interface FileUploadProps {
  onDataLoaded: (data: BuildingData, filename: string) => void;
  onError: (errors: ValidationError[]) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onDataLoaded, onError }) => {
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];

      // Use the shared file processor
      await processJSONFile(file, onDataLoaded, onError);
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
