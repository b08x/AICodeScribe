
import React, { useRef } from 'react';
import { LoaderIcon } from './icons/LoaderIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { UploadIcon } from './icons/UploadIcon';
import { FileIcon } from './icons/FileIcon';
import { GemInfo } from './DocumentationSidebar';

interface UploadPageProps {
  gemfileContent: string;
  projectFilesContent: string;
  gemfileName: string | null;
  uploadedFileName: string | null;
  isLoading: boolean;
  error: string;
  gems: GemInfo[];
  selectedGems: Set<string>;
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>, type: 'gemfile' | 'project') => void;
  handleGenerateClick: () => void;
  setSelectedGems: React.Dispatch<React.SetStateAction<Set<string>>>;
}

export const UploadPage: React.FC<UploadPageProps> = ({
  gemfileContent,
  projectFilesContent,
  gemfileName,
  uploadedFileName,
  isLoading,
  error,
  gems,
  selectedGems,
  handleFileChange,
  handleGenerateClick,
  setSelectedGems,
}) => {
  const gemfileInputRef = useRef<HTMLInputElement>(null);
  const projectFileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-6">
      <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700 shadow-lg">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Gemfile Upload */}
          <div className="flex-1 flex flex-col">
            <h2 className="text-2xl font-semibold mb-4 text-cyan-400">1. Upload Dependencies</h2>
            <div className="flex-grow w-full h-48 md:h-64 border-2 border-dashed border-slate-600 rounded-md focus-within:ring-2 focus-within:ring-cyan-500 focus-within:border-cyan-500 bg-slate-900 transition-all duration-200 flex items-center justify-center">
              <input
                ref={gemfileInputRef}
                type="file"
                id="gemfile-upload"
                onChange={(e) => handleFileChange(e, 'gemfile')}
                disabled={isLoading}
                className="sr-only"
              />
              <label
                htmlFor="gemfile-upload"
                className={`w-full h-full flex flex-col items-center justify-center text-center p-4 rounded-lg transition-colors ${isLoading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-slate-800/50'}`}
              >
                {gemfileName ? (
                  <>
                    <FileIcon color="text-cyan-400" />
                    <span className="mt-2 font-sans font-semibold text-cyan-400 break-all">{gemfileName}</span>
                    <span className="mt-1 text-xs text-slate-400">Click to choose a different file</span>
                  </>
                ) : (
                  <>
                    <UploadIcon />
                    <span className="mt-2 font-sans font-semibold text-slate-300">Click to upload dependency file</span>
                    <span className="mt-1 text-xs text-slate-400">e.g., Gemfile, package.json</span>
                  </>
                )}
              </label>
            </div>
            {/* Gem selection UI, always visible after Gemfile upload */}
            {gems.length > 0 && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold text-indigo-300 mb-2">Select Gems for RAG</h3>
                <ul className="space-y-1 max-h-40 overflow-y-auto pr-1 bg-slate-900 rounded-md p-3 border border-slate-700">
                  {gems.map(gem => (
                    <li key={gem.name} className="text-slate-200 text-sm flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedGems.has(gem.name)}
                        onChange={e => {
                          setSelectedGems(prev => {
                            const next = new Set(prev);
                            if (e.target.checked) next.add(gem.name); else next.delete(gem.name);
                            return next;
                          });
                        }}
                        className="accent-cyan-400"
                        id={`gem-select-main-${gem.name}`}
                      />
                      <label htmlFor={`gem-select-main-${gem.name}`} className="font-mono text-cyan-300 cursor-pointer select-none">
                        {gem.name}
                      </label>
                      {gem.version && <span className="text-slate-400">{gem.version}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Project JSON Upload */}
          <div className="flex-1 flex flex-col">
            <h2 className="text-2xl font-semibold mb-4 text-green-400">2. Upload Project (JSON)</h2>
            <div className="flex-grow w-full h-48 md:h-64 border-2 border-dashed border-slate-600 rounded-md focus-within:ring-2 focus-within:ring-green-500 focus-within:border-green-500 bg-slate-900 transition-all duration-200 flex items-center justify-center">
              <input
                ref={projectFileInputRef}
                type="file"
                id="project-file-upload"
                accept=".json,application/json"
                onChange={(e) => handleFileChange(e, 'project')}
                disabled={isLoading}
                className="sr-only"
              />
              <label
                htmlFor="project-file-upload"
                className={`w-full h-full flex flex-col items-center justify-center text-center p-4 rounded-lg transition-colors ${isLoading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-slate-800/50'}`}
              >
                {uploadedFileName ? (
                  <>
                    <FileIcon color="text-green-400" />
                    <span className="mt-2 font-sans font-semibold text-green-400 break-all">{uploadedFileName}</span>
                    <span className="mt-1 text-xs text-slate-400">Click to choose a different file</span>
                  </>
                ) : (
                  <>
                    <UploadIcon />
                    <span className="mt-2 font-sans font-semibold text-slate-300">Click to upload JSON file</span>
                    <span className="mt-1 text-xs text-slate-400">Contains your entire codebase.</span>
                  </>
                )}
              </label>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {/* RAG toggle can be placed here if needed */}
          </div>
          <button
            onClick={handleGenerateClick}
            disabled={!gemfileContent || !projectFilesContent || isLoading || selectedGems.size === 0}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 font-semibold text-white bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <LoaderIcon />
                Generating...
              </>
            ) : (
              <>
                <SparklesIcon />
                Generate Knowledge Base
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg">
          <p className="font-semibold">An Error Occurred</p>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};
