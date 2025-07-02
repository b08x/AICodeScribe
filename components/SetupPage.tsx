
import React, { useState, useEffect } from 'react';
import { providers, ProviderDetails } from '../config';
import { IAiProviderConfig } from '../services/ai/provider';
import { validateApiKey } from '../services/ai';
import { KeyIcon } from './icons/KeyIcon';
import { LoaderIcon } from './icons/LoaderIcon';
import { SparklesIcon } from './icons/SparklesIcon';

interface SetupPageProps {
  onConfigured: (config: IAiProviderConfig) => void;
}

export const SetupPage: React.FC<SetupPageProps> = ({ onConfigured }) => {
  const [selectedProviderKey, setSelectedProviderKey] = useState<string>(providers[0].key);
  const [apiKey, setApiKey] = useState<string>('');
  
  const [isKeyValidating, setIsKeyValidating] = useState<boolean>(false);
  const [isKeyValidated, setIsKeyValidated] = useState<boolean>(false);
  const [keyValidationError, setKeyValidationError] = useState<string>('');

  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [temperature, setTemperature] = useState<number>(0.7);
  
  const selectedProviderDetails = providers.find(p => p.key === selectedProviderKey)!;

  useEffect(() => {
    // Reset state when provider changes
    setApiKey('');
    setIsKeyValidated(false);
    setIsKeyValidating(false);
    setKeyValidationError('');
    setAvailableModels(selectedProviderDetails.models);
    setSelectedModel(selectedProviderDetails.models[0]);
    setTemperature(selectedProviderDetails.defaultTemperature);
  }, [selectedProviderKey, selectedProviderDetails]);

  const handleValidateKey = async () => {
    if (!apiKey) {
      setKeyValidationError('API Key cannot be empty.');
      return;
    }
    setIsKeyValidating(true);
    setKeyValidationError('');
    
    const result = await validateApiKey(selectedProviderKey, apiKey);
    
    if (result.success) {
      setIsKeyValidated(true);
      if (result.models && result.models.length > 0) {
        setAvailableModels(result.models);
        setSelectedModel(result.models[0]);
      }
    } else {
      setKeyValidationError(result.error || 'An unknown validation error occurred.');
    }
    setIsKeyValidating(false);
  };
  
  const handleStart = () => {
    if (!isKeyValidated) return;
    onConfigured({
      provider: selectedProviderKey,
      providerName: selectedProviderDetails.name,
      apiKey,
      model: selectedModel,
      temperature
    });
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans flex items-center justify-center p-4">
      <div className="w-full max-w-2xl mx-auto">
        <div className="bg-slate-800/50 rounded-lg p-8 border border-slate-700 shadow-lg">
          <header className="text-center mb-8">
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500">
              Model Configuration
            </h1>
            <p className="text-slate-400 mt-2">Choose your AI provider and set up your model.</p>
          </header>
          
          <div className="space-y-6">
            {/* Step 1: Provider & Key */}
            <div>
              <label htmlFor="provider-select" className="block text-lg font-semibold text-cyan-300 mb-2">1. Select AI Provider</label>
              <select
                id="provider-select"
                value={selectedProviderKey}
                onChange={e => setSelectedProviderKey(e.target.value)}
                className="w-full p-3 bg-slate-900 border border-slate-600 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                disabled={isKeyValidated}
              >
                {providers.map(p => <option key={p.key} value={p.key}>{p.name}</option>)}
              </select>
            </div>
            
            <div>
              <label htmlFor="api-key-input" className="block text-lg font-semibold text-cyan-300 mb-2">2. Enter API Key</label>
              <div className="flex items-center gap-2">
                <div className="relative flex-grow">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <KeyIcon />
                    </div>
                    <input
                      id="api-key-input"
                      type="password"
                      value={apiKey}
                      onChange={e => setApiKey(e.target.value)}
                      placeholder={`Your ${selectedProviderDetails.name} API Key`}
                      className="w-full p-3 pl-10 bg-slate-900 border border-slate-600 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                      disabled={isKeyValidated}
                    />
                </div>
                <button
                  onClick={handleValidateKey}
                  disabled={!apiKey || isKeyValidating || isKeyValidated}
                  className="flex items-center justify-center gap-2 px-4 py-3 h-full font-semibold text-white bg-cyan-600 rounded-lg shadow-md hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 focus:ring-offset-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isKeyValidating ? <LoaderIcon /> : isKeyValidated ? '✓ Validated' : 'Validate Key'}
                </button>
              </div>
              {keyValidationError && <p className="text-red-400 mt-2 text-sm">{keyValidationError}</p>}
            </div>

            {/* Step 2: Model & Parameters (conditional) */}
            {isKeyValidated && (
              <div className="border-t border-slate-700 pt-6 space-y-6 animate-fade-in">
                <div>
                  <label htmlFor="model-select" className="block text-lg font-semibold text-green-300 mb-2">3. Choose a Model</label>
                  <select
                    id="model-select"
                    value={selectedModel}
                    onChange={e => setSelectedModel(e.target.value)}
                    className="w-full p-3 bg-slate-900 border border-slate-600 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    {availableModels.map(model => <option key={model} value={model}>{model}</option>)}
                  </select>
                </div>

                <div>
                    <label htmlFor="temperature-slider" className="block text-lg font-semibold text-green-300 mb-2">
                        4. Set Temperature <span className="text-slate-400 font-normal text-sm">(Creativity)</span>
                    </label>
                     <div className="flex items-center gap-4">
                        <input
                            id="temperature-slider"
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={temperature}
                            onChange={e => setTemperature(parseFloat(e.target.value))}
                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="font-mono text-green-300 w-10 text-center">{temperature.toFixed(1)}</span>
                    </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-slate-700">
             <button
                onClick={handleStart}
                disabled={!isKeyValidated}
                className="w-full flex items-center justify-center gap-3 px-8 py-4 font-semibold text-lg text-white bg-indigo-600 rounded-lg shadow-lg hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <SparklesIcon />
                Start Scribing
              </button>
          </div>
        </div>
      </div>
    </div>
  );
};
