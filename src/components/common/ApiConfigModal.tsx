import React, { useState } from 'react';
import { Check, Globe, RefreshCw, Server, X, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { useApiConfig } from '../../contexts/ApiConfigContext';
import { Modal } from './Modal';
import { pingServer } from '../../services/apiClient';

interface ApiConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiConfigModal: React.FC<ApiConfigModalProps> = ({ isOpen, onClose }) => {
  const { apiBaseUrl, setApiBaseUrl, apiMode, setApiMode } = useApiConfig();
  const [urlInput, setUrlInput] = useState(apiBaseUrl);
  const [modeInput, setModeInput] = useState<'live' | 'demo'>(apiMode);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  const handleSave = () => {
    setApiBaseUrl(urlInput.trim());
    setApiMode(modeInput);
    toast.success('API configuration saved successfully');
    onClose();
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const ok = await pingServer(urlInput.trim());
      if (ok) {
        setTestResult({ ok: true, message: 'Connected successfully to backend server!' });
        toast.success('Backend server is reachable');
      } else {
        setTestResult({
          ok: false,
          message: 'Server responded but endpoints could not be verified. You can still use Demo mode.',
        });
      }
    } catch (err: any) {
      setTestResult({
        ok: false,
        message: err.message || 'Unable to connect to server URL. Check CORS or URL.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Server & API Configuration">
      <div className="space-y-6">
        <p className="text-xs text-zinc-400">
          Configure how the frontend connects to your tc-auth backend instance or run in standalone Demo Mock Mode.
        </p>

        {/* Mode Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Operation Mode</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setModeInput('live')}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                modeInput === 'live'
                  ? 'bg-indigo-600/15 border-indigo-500/80 text-white'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2 font-bold text-sm text-white">
                  <Globe className="w-4 h-4 text-emerald-400" />
                  <span>Live Server</span>
                </div>
                {modeInput === 'live' && <Check className="w-4 h-4 text-indigo-400" />}
              </div>
              <p className="text-[11px] text-zinc-400">Connect to a live tc-auth REST API server with real JWTs and DB.</p>
            </button>

            <button
              type="button"
              onClick={() => setModeInput('demo')}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                modeInput === 'demo'
                  ? 'bg-amber-500/15 border-amber-500/80 text-white'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2 font-bold text-sm text-white">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Demo Mode</span>
                </div>
                {modeInput === 'demo' && <Check className="w-4 h-4 text-amber-400" />}
              </div>
              <p className="text-[11px] text-zinc-400">Run with local state without requiring a backend server.</p>
            </button>
          </div>
        </div>

        {/* Base URL Input */}
        {modeInput === 'live' && (
          <div className="space-y-2 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Server Base URL</label>
              <button
                type="button"
                onClick={() => setUrlInput(window.location.origin)}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 cursor-pointer underline"
              >
                Use current origin
              </button>
            </div>
            <div className="relative">
              <Server className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="http://localhost:8000 or https://auth.yourdomain.com"
                className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting || !urlInput}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                <span>Test Connection</span>
              </button>
            </div>

            {testResult && (
              <div
                className={`p-3 rounded-xl border text-xs ${
                  testResult.ok
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}
              >
                {testResult.message}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white rounded-xl cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md shadow-indigo-600/25 transition-all cursor-pointer"
          >
            Save Changes
          </button>
        </div>
      </div>
    </Modal>
  );
};
