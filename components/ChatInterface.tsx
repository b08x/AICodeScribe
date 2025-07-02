import React, { useState, useRef, useEffect } from 'react';
import { SendIcon } from './icons/SendIcon';
import { MarkdownContent } from './MarkdownContent';
import { CopyButton } from './CopyButton';
import { TaskListIcon } from './icons/TaskListIcon';
import { LoaderIcon } from './icons/LoaderIcon';
import { MicrophoneIcon } from './icons/MicrophoneIcon';

// Type definitions for the Web Speech API to fix TypeScript errors.
interface SpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: any) => void;
  onerror: (event: any) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionStatic {
  new(): SpeechRecognition;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

interface ChatInterfaceProps {
  history: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
  isBacklogLoading: boolean;
  onGenerateBacklog: () => void;
}

// Allow SpeechRecognition on window object
declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionStatic;
    webkitSpeechRecognition: SpeechRecognitionStatic;
  }
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ history, isLoading, onSendMessage, isBacklogLoading, onGenerateBacklog }) => {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [history, isLoading]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${scrollHeight}px`;
    }
  }, [input]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Speech Recognition API is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
       // We only update on final results to avoid weird cursor jumps, but you could use interim if desired
      if (finalTranscript) {
         setInput(prevInput => (prevInput.trim() === '' ? '' : prevInput.trim() + ' ') + finalTranscript.trim());
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      if (isListening) {
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      if(isListening) {
        setIsListening(false);
      }
    };
    
    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, []); // isListening is intentionally omitted to avoid re-creating the object

  const handleToggleListening = () => {
    if (!recognitionRef.current) return;
    
    const wasListening = isListening;
    setIsListening(!wasListening);

    if (wasListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };


  const handleSend = () => {
    if (input.trim()) {
      if (isListening) {
        recognitionRef.current?.stop();
        setIsListening(false);
      }
      onSendMessage(input);
      setInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="mt-6 bg-slate-800/50 rounded-lg border border-slate-700 shadow-lg flex flex-col" style={{height: '70vh'}}>
      <header className="px-6 py-4 border-b border-slate-700 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-indigo-400">Chat with your Knowledge Base</h2>
          <p className="text-sm text-slate-400">Ask anything about your project's gems and code.</p>
        </div>
        {history.length > 1 && (
            <button
                onClick={onGenerateBacklog}
                disabled={isBacklogLoading}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isBacklogLoading ? (
                    <>
                        <LoaderIcon />
                        Generating...
                    </>
                ) : (
                    <>
                        <TaskListIcon />
                        Generate Task Backlog
                    </>
                )}
            </button>
        )}
      </header>
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="space-y-6">
          {history.map((msg, index) => (
            <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'model' && (
                <div className="w-8 h-8 rounded-full bg-indigo-500 flex-shrink-0 flex items-center justify-center font-bold text-sm">AI</div>
              )}
              <div className={`relative group max-w-xl p-4 rounded-lg shadow ${msg.role === 'user' ? 'bg-slate-700' : 'bg-slate-800'}`}>
                {msg.role === 'model' && (
                  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <CopyButton textToCopy={msg.text} />
                  </div>
                )}
                <MarkdownContent content={msg.text} />
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-start gap-3 justify-start">
               <div className="w-8 h-8 rounded-full bg-indigo-500 flex-shrink-0 flex items-center justify-center font-bold text-sm">AI</div>
               <div className="max-w-xl p-4 rounded-lg shadow bg-slate-800">
                  <div className="flex items-center gap-2 text-slate-400">
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-pulse delay-0"></span>
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-pulse delay-150"></span>
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-pulse delay-300"></span>
                  </div>
               </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="p-4 border-t border-slate-700 bg-slate-800/70">
        <div className="flex items-end gap-2 bg-slate-900 rounded-lg border border-slate-600 focus-within:ring-2 focus-within:ring-indigo-500">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isListening ? "Listening..." : "e.g., How am I using the 'pundit' gem?"}
            rows={1}
            className="flex-1 bg-transparent p-3 resize-none outline-none text-slate-200 placeholder-slate-500"
            disabled={isLoading || isBacklogLoading}
          />
           <button
            onClick={handleToggleListening}
            disabled={isLoading || isBacklogLoading}
            className="m-2 p-2 rounded-md text-slate-400 hover:bg-slate-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
            aria-label={isListening ? "Stop listening" : "Start listening"}
          >
            <MicrophoneIcon className={`${isListening ? 'text-red-500 animate-pulse' : ''}`} />
          </button>
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading || isBacklogLoading}
            className="m-2 p-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
            aria-label="Send message"
          >
            <SendIcon />
          </button>
        </div>
      </div>
    </div>
  );
};