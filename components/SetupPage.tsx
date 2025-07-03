

import { useState, useEffect } from 'react';
import { chatProviders, embeddingProviders, ProviderDetails } from '../config';
import { IAiProviderConfig } from '../services/ai/provider';
import { validateApiKey } from '../services/ai';
import { KeyIcon } from './icons/KeyIcon';
import { LoaderIcon } from './icons/LoaderIcon';
import { SparklesIcon } from './icons/SparklesIcon';

interface SetupPageProps {
  onConfigured: (chatConfig: IAiProviderConfig, embeddingConfig: IAiProviderConfig) => void;
}

export const SetupPage = ({ onConfigured }: SetupPageProps) => {
  const [selectedChatProviderKey, setSelectedChatProviderKey] = useState<string>(chatProviders[0].key);
  const [chatApiKey, setChatApiKey] = useState<string>('');
  const [isChatKeyValidating, setIsChatKeyValidating] = useState<boolean>(false);
  const [isChatKeyValidated, setIsChatKeyValidated] = useState<boolean>(false);
  const [chatKeyValidationError, setChatKeyValidationError] = useState<string>('');
  const [availableChatModels, setAvailableChatModels] = useState<string[]>([]);
  const [selectedChatModel, setSelectedChatModel] = useState<string>('');
  const [temperature, setTemperature] = useState<number>(0.7);

  const [selectedEmbeddingProviderKey, setSelectedEmbeddingProviderKey] = useState<string>(embeddingProviders[0].key);
  const [embeddingApiKey, setEmbeddingApiKey] = useState<string>('');
  const [isEmbeddingKeyValidating, setIsEmbeddingKeyValidating] = useState<boolean>(false);
  const [isEmbeddingKeyValidated, setIsEmbeddingKeyValidated] = useState<boolean>(false);
  const [embeddingKeyValidationError, setEmbeddingKeyValidationError] = useState<string>('');
  const [availableEmbeddingModels, setAvailableEmbeddingModels] = useState<string[]>([]);
  const [selectedEmbeddingModel, setSelectedEmbeddingModel] = useState<string>('');

  const selectedChatProviderDetails = chatProviders.find(p => p.key === selectedChatProviderKey)!;
  const selectedEmbeddingProviderDetails = embeddingProviders.find(p => p.key === selectedEmbeddingProviderKey)!;

  useEffect(() => {
    setChatApiKey('');
    setIsChatKeyValidated(false);
    setChatKeyValidationError('');
    setAvailableChatModels(selectedChatProviderDetails.models);
    setSelectedChatModel(selectedChatProviderDetails.models[0]);
    setTemperature(selectedChatProviderDetails.defaultTemperature);
  }, [selectedChatProviderKey, selectedChatProviderDetails]);

  useEffect(() => {
    setEmbeddingApiKey('');
    setEmbeddingKeyValidationError('');
    setAvailableEmbeddingModels(selectedEmbeddingProviderDetails.models);
    setSelectedEmbeddingModel(selectedEmbeddingProviderDetails.models[0]);
    if (selectedEmbeddingProviderKey === 'transformers.js') {
      setIsEmbeddingKeyValidated(true);
    } else {
      setIsEmbeddingKeyValidated(false);
    }
  }, [selectedEmbeddingProviderKey, selectedEmbeddingProviderDetails]);

  const handleValidateKey = async (type: 'chat' | 'embedding') => {
    if (type === 'chat') {
      if (!chatApiKey) {
        setChatKeyValidationError('API Key cannot be empty.');
        return;
      }
      setIsChatKeyValidating(true);
      setChatKeyValidationError('');
      const result = await validateApiKey(selectedChatProviderKey, chatApiKey);
      if (result.success) {
        setIsChatKeyValidated(true);
        if (result.models && result.models.length > 0) {
          setAvailableChatModels(result.models);
          setSelectedChatModel(result.models[0]);
        }
      } else {
        setChatKeyValidationError(result.error || 'An unknown validation error occurred.');
      }
      setIsChatKeyValidating(false);
    } else {
      if (!embeddingApiKey && selectedEmbeddingProviderKey !== 'transformers.js') {
        setEmbeddingKeyValidationError('API Key cannot be empty.');
        return;
      }
      setIsEmbeddingKeyValidating(true);
      setEmbeddingKeyValidationError('');
      const result = await validateApiKey(selectedEmbeddingProviderKey, embeddingApiKey);
      if (result.success) {
        setIsEmbeddingKeyValidated(true);
        if (result.models && result.models.length > 0) {
          setAvailableEmbeddingModels(result.models);
          setSelectedEmbeddingModel(result.models[0]);
        }
      } else {
        setEmbeddingKeyValidationError(result.error || 'An unknown validation error occurred.');
      }
      setIsEmbeddingKeyValidating(false);
    }
  };

  const handleStart = () => {
    if (!isChatKeyValidated || !isEmbeddingKeyValidated) return;
    
    const chatConfig: IAiProviderConfig = {
      provider: selectedChatProviderKey,
      providerName: selectedChatProviderDetails.name,
      apiKey: chatApiKey,
      model: selectedChatModel,
      temperature,
    };

    const embeddingConfig: IAiProviderConfig = {
      provider: selectedEmbeddingProviderKey,
      providerName: selectedEmbeddingProviderDetails.name,
      apiKey: embeddingApiKey,
      model: selectedEmbeddingModel,
      temperature: 0, // Not applicable for embeddings
    };

    onConfigured(chatConfig, embeddingConfig);
  };

  const isStartDisabled = !isChatKeyValidated || !isEmbeddingKeyValidated;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans flex items-center justify-center p-4">
      <div className="w-full max-w-4xl mx-auto">
        <div className="bg-slate-800/50 rounded-lg p-8 border border-slate-700 shadow-lg">
          <header className="text-center mb-8">
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500">
              Model Configuration
            </h1>
            <p className="text-slate-400 mt-2">Choose your AI providers and set up your models.</p>
          </header>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Chat Provider Configuration */}
            <div className="space-y-6 p-6 bg-slate-800/50 rounded-lg border border-slate-700">
              <h2 className="text-2xl font-bold text-center text-cyan-300">Chat Model</h2>
              <div>
                <label htmlFor="chat-provider-select" className="block text-lg font-semibold text-cyan-300 mb-2">1. Select Provider</label>
                <select
                  id="chat-provider-select"
                  value={selectedChatProviderKey}
                  onChange={e => setSelectedChatProviderKey(e.target.value)}
                  className="w-full p-3 bg-slate-900 border border-slate-600 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  disabled={isChatKeyValidated}
                >
                  {chatProviders.map(p => <option key={p.key} value={p.key}>{p.name}</option>)}
                </select>
              </div>
              
              <div>
                <label htmlFor="chat-api-key-input" className="block text-lg font-semibold text-cyan-300 mb-2">2. Enter API Key</label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-grow">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <KeyIcon />
                      </div>
                      <input
                        id="chat-api-key-input"
                        type="password"
                        value={chatApiKey}
                        onChange={e => setChatApiKey(e.target.value)}
                        placeholder={`Your ${selectedChatProviderDetails.name} API Key`}
                        className="w-full p-3 pl-10 bg-slate-900 border border-slate-600 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                        disabled={isChatKeyValidated}
                      />
                  </div>
                  <button
                    onClick={() => handleValidateKey('chat')}
                    disabled={!chatApiKey || isChatKeyValidating || isChatKeyValidated}
                    className="flex items-center justify-center gap-2 px-4 py-3 h-full font-semibold text-white bg-cyan-600 rounded-lg shadow-md hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 focus:ring-offset-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isChatKeyValidating ? <LoaderIcon /> : isChatKeyValidated ? '✓ Validated' : 'Validate'}
                  </button>
                </div>
                {chatKeyValidationError && <p className="text-red-400 mt-2 text-sm">{chatKeyValidationError}</p>}
              </div>

              {isChatKeyValidated && (
                <div className="border-t border-slate-700 pt-6 space-y-6 animate-fade-in">
                  <div>
                    <label htmlFor="chat-model-select" className="block text-lg font-semibold text-green-300 mb-2">3. Choose a Model</label>
                    <select
                      id="chat-model-select"
                      value={selectedChatModel}
                      onChange={e => setSelectedChatModel(e.target.value)}
                      className="w-full p-3 bg-slate-900 border border-slate-600 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      {availableChatModels.map(model => <option key={model} value={model}>{model}</option>)}
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

            {/* Embedding Provider Configuration */}
            <div className="space-y-6 p-6 bg-slate-800/50 rounded-lg border border-slate-700">
              <h2 className="text-2xl font-bold text-center text-indigo-300">Embedding Model</h2>
              <div>
                <label htmlFor="embedding-provider-select" className="block text-lg font-semibold text-indigo-300 mb-2">1. Select Provider</label>
                <select
                  id="embedding-provider-select"
                  value={selectedEmbeddingProviderKey}
                  onChange={e => setSelectedEmbeddingProviderKey(e.target.value)}
                  className="w-full p-3 bg-slate-900 border border-slate-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  disabled={isEmbeddingKeyValidated}
                >
                  {embeddingProviders.map(p => <option key={p.key} value={p.key}>{p.name}</option>)}
                </select>
              </div>
              
              {selectedEmbeddingProviderKey !== 'transformers.js' && (
                <div>
                  <label htmlFor="embedding-api-key-input" className="block text-lg font-semibold text-indigo-300 mb-2">2. Enter API Key</label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-grow">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <KeyIcon />
                        </div>
                        <input
                          id="embedding-api-key-input"
                          type="password"
                          value={embeddingApiKey}
                          onChange={e => setEmbeddingApiKey(e.target.value)}
                          placeholder={`Your ${selectedEmbeddingProviderDetails.name} API Key`}
                          className="w-full p-3 pl-10 bg-slate-900 border border-slate-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          disabled={isEmbeddingKeyValidated}
                        />
                    </div>
                    <button
                      onClick={() => handleValidateKey('embedding')}
                      disabled={!embeddingApiKey || isEmbeddingKeyValidating || isEmbeddingKeyValidated}
                      className="flex items-center justify-center gap-2 px-4 py-3 h-full font-semibold text-white bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isEmbeddingKeyValidating ? <LoaderIcon /> : isEmbeddingKeyValidated ? '✓ Validated' : 'Validate'}
                    </button>
                  </div>
                  {embeddingKeyValidationError && <p className="text-red-400 mt-2 text-sm">{embeddingKeyValidationError}</p>}
                </div>
              )}

              {isEmbeddingKeyValidated && (
                <div className="border-t border-slate-700 pt-6 space-y-6 animate-fade-in">
                  <div>
                    <label htmlFor="embedding-model-select" className="block text-lg font-semibold text-green-300 mb-2">3. Choose a Model</label>
                    <select
                      id="embedding-model-select"
                      value={selectedEmbeddingModel}
                      onChange={e => setSelectedEmbeddingModel(e.target.value)}
                      className="w-full p-3 bg-slate-900 border border-slate-600 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      {availableEmbeddingModels.map(model => <option key={model} value={model}>{model}</option>)}
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-700">
             <button
                onClick={handleStart}
                disabled={isStartDisabled}
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
