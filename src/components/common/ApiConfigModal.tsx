import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  Bookmark,
  Check,
  Database,
  Edit2,
  Globe,
  Info,
  Layers,
  Pencil,
  RefreshCw,
  Server,
  Trash2,
  X,
  Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useApiConfig } from '../../contexts/ApiConfigContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  clearAllTokensAndCookies,
  deleteCustomPreset,
  getAllPresets,
  getCustomPresets,
  normalizeBaseUrl,
  pingServer,
  saveCustomPreset,
  ServerPreset,
  updateCustomPreset,
} from '../../services/apiClient';

interface ApiConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToLogin?: () => void;
}

export const ApiConfigModal: React.FC<ApiConfigModalProps> = ({
  isOpen,
  onClose,
  onNavigateToLogin,
}) => {
  const { apiBaseUrl, setApiBaseUrl, apiMode, setApiMode } = useApiConfig();
  const { isAuthenticated } = useAuth();

  const [selectedMode, setSelectedMode] = useState<'demo' | 'live'>(apiMode);
  const [urlInput, setUrlInput] = useState<string>(apiBaseUrl);
  const [presets, setPresets] = useState<ServerPreset[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    message: string;
    latency?: number;
  } | null>(null);

  // Modal for adding / editing presets
  const [presetModal, setPresetModal] = useState<{
    isOpen: boolean;
    mode: 'add' | 'edit';
    id?: string;
    name: string;
    url: string;
  }>({
    isOpen: false,
    mode: 'add',
    name: '',
    url: '',
  });

  useEffect(() => {
    if (isOpen) {
      setSelectedMode(apiMode);
      setUrlInput(apiBaseUrl);
      setPresets(getAllPresets());
      setTestResult(null);
    }
  }, [isOpen, apiMode, apiBaseUrl]);

  if (!isOpen) return null;

  const handleApply = async () => {
    const previousMode = apiMode;
    const normalized = normalizeBaseUrl(urlInput.trim());

    setApiBaseUrl(normalized);
    setApiMode(selectedMode);

    // Requirement: When inside demo mode in dashboard/profile and switched to live server, redirect to login
    const isSwitchingFromDemoToLive = previousMode === 'demo' && selectedMode === 'live';
    const isInsideDashboard =
      isAuthenticated ||
      (typeof window !== 'undefined' &&
        !window.location.pathname.includes('/login') &&
        !window.location.pathname.includes('/signup'));

    if (isSwitchingFromDemoToLive && isInsideDashboard) {
      clearAllTokensAndCookies();
      toast.success('Switched to Live Server mode. Please sign in to your live account.');
      onClose();
      if (onNavigateToLogin) {
        onNavigateToLogin();
      } else if (typeof window !== 'undefined') {
        window.history.pushState({}, '', '/login');
        window.dispatchEvent(new Event('popstate'));
      }
      return;
    }

    toast.success(`Server settings applied (${selectedMode === 'live' ? 'Live Server' : 'Demo Mock'})`);
    onClose();
  };

  const handleTestConnection = async () => {
    const targetUrl = normalizeBaseUrl(urlInput.trim());
    setIsTesting(true);
    setTestResult(null);
    const start = performance.now();
    try {
      const isOnline = await pingServer(targetUrl);
      const latency = Math.round(performance.now() - start);
      if (isOnline) {
        setTestResult({
          ok: true,
          message: `Connected successfully (${latency}ms)`,
          latency,
        });
        toast.success(`Server reachable: ${latency}ms latency`);
      } else {
        setTestResult({
          ok: false,
          message: 'Server did not respond. Verify endpoint or CORS setup.',
        });
        toast.error('Unable to reach backend server');
      }
    } catch (err: any) {
      setTestResult({
        ok: false,
        message: err.message || 'Connection failed',
      });
      toast.error('Connection test failed');
    } finally {
      setIsTesting(false);
    }
  };

  const handleSelectPreset = (preset: ServerPreset) => {
    setUrlInput(preset.url);
    setSelectedMode('live');
    setTestResult(null);
  };

  const handleOpenAddPreset = () => {
    setPresetModal({
      isOpen: true,
      mode: 'add',
      name: '',
      url: urlInput || 'https://api.codesena.me/tc-auth',
    });
  };

  const handleOpenEditPreset = (preset: ServerPreset, e: React.MouseEvent) => {
    e.stopPropagation();
    setPresetModal({
      isOpen: true,
      mode: 'edit',
      id: preset.id,
      name: preset.name,
      url: preset.url,
    });
  };

  const handleDeletePreset = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteCustomPreset(id);
    setPresets(getAllPresets());
    toast.success('Preset deleted');
  };

  const handleSavePresetModal = () => {
    if (!presetModal.url.trim()) {
      toast.error('Please enter a server URL');
      return;
    }
    if (presetModal.mode === 'add') {
      saveCustomPreset(presetModal.name || presetModal.url, presetModal.url);
      toast.success('Preset saved');
    } else if (presetModal.id) {
      updateCustomPreset(presetModal.id, presetModal.name || presetModal.url, presetModal.url);
      toast.success('Preset updated');
    }
    setPresets(getAllPresets());
    setPresetModal({ isOpen: false, mode: 'add', name: '', url: '' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-[430px] bg-[#0c0f17] border border-zinc-800/90 rounded-2xl p-4 sm:p-5 shadow-2xl shadow-black/90 text-white overflow-hidden my-auto max-h-[92vh] flex flex-col justify-between">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shadow-inner shrink-0">
              <div className="flex flex-col gap-0.5 items-center justify-center">
                <div className="w-4 h-1.5 rounded-[2px] border border-indigo-400/80 bg-indigo-500/20 flex items-center justify-end px-0.5">
                  <div className="w-0.5 h-0.5 rounded-full bg-indigo-300" />
                </div>
                <div className="w-4 h-1.5 rounded-[2px] border border-indigo-400/80 bg-indigo-500/20 flex items-center justify-end px-0.5">
                  <div className="w-0.5 h-0.5 rounded-full bg-indigo-300" />
                </div>
              </div>
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">Server Settings</h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="space-y-3.5 pt-3.5 overflow-y-auto custom-scrollbar">
          {/* Section 1: Execution Mode */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
              EXECUTION MODE
            </label>
            <div className="grid grid-cols-2 gap-2">
              {/* Card 1: Demo Mock */}
              <div
                onClick={() => setSelectedMode('demo')}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between select-none ${
                  selectedMode === 'demo'
                    ? 'bg-[#181510] border-amber-500 shadow-xs shadow-amber-500/10'
                    : 'bg-[#090b10] border-zinc-800/90 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                    <Database className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-white truncate">Demo Mock</h4>
                    <p className="text-[10px] text-zinc-400 truncate">In-memory mode</p>
                  </div>
                </div>

                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                    selectedMode === 'demo'
                      ? 'border-amber-400 bg-amber-400/20'
                      : 'border-zinc-700 bg-transparent'
                  }`}
                >
                  {selectedMode === 'demo' && (
                    <div className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.9)]" />
                  )}
                </div>
              </div>

              {/* Card 2: Live Server */}
              <div
                onClick={() => setSelectedMode('live')}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between select-none ${
                  selectedMode === 'live'
                    ? 'bg-[#0b1613] border-emerald-500 shadow-xs shadow-emerald-500/10'
                    : 'bg-[#090b10] border-zinc-800/90 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                    <Globe className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-white truncate">Live Server</h4>
                    <p className="text-[10px] text-zinc-400 truncate">Connect to API</p>
                  </div>
                </div>

                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                    selectedMode === 'live'
                      ? 'border-emerald-400 bg-emerald-400/20'
                      : 'border-zinc-700 bg-transparent'
                  }`}
                >
                  {selectedMode === 'live' && (
                    <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]" />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Server URL */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1 text-zinc-400">
              <label className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
                SERVER URL
              </label>
              <Info className="w-3 h-3 text-zinc-500" />
            </div>
            <div className="relative">
              <Globe className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
              <input
                type="text"
                value={urlInput}
                onChange={(e) => {
                  setUrlInput(e.target.value);
                  setTestResult(null);
                }}
                placeholder="https://api.codesena.me/tc-auth"
                className="w-full pl-8.5 pr-3 py-2 text-xs font-mono bg-[#080a10] border border-zinc-800 rounded-xl text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
            </div>
          </div>

          {/* Section 3: Saved Presets */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
                SAVED PRESETS
              </label>
              <button
                type="button"
                onClick={handleOpenAddPreset}
                className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 cursor-pointer select-none"
              >
                <Bookmark className="w-3 h-3" />
                <span>+ Save as Preset</span>
              </button>
            </div>

            <div className="space-y-1.5 max-h-[105px] overflow-y-auto pr-1 custom-scrollbar">
              {presets.map((preset) => {
                const isSelected =
                  selectedMode === 'live' &&
                  normalizeBaseUrl(urlInput) === normalizeBaseUrl(preset.url);

                return (
                  <div
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset)}
                    className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-between select-none ${
                      isSelected
                        ? 'bg-indigo-950/25 border-indigo-600/80 text-white shadow-xs shadow-indigo-600/10'
                        : 'bg-[#080a10] border-zinc-800/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'border-indigo-400 bg-indigo-400/20'
                            : 'border-zinc-700 bg-transparent'
                        }`}
                      >
                        {isSelected && (
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_4px_rgba(129,140,248,0.9)]" />
                        )}
                      </div>

                      <span className="font-mono text-[11px] text-zinc-300 truncate">
                        {preset.url}
                      </span>

                      {preset.isBuiltin && preset.id === 'codesena-live' && (
                        <span className="px-1.5 py-0.2 rounded-full bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 text-[9px] font-bold uppercase tracking-wider shrink-0">
                          Default
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0 ml-1.5">
                      {!preset.isBuiltin && (
                        <>
                          <button
                            type="button"
                            onClick={(e) => handleOpenEditPreset(preset, e)}
                            className="p-1 rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
                            title="Edit preset"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeletePreset(preset.id, e)}
                            className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 transition-colors"
                            title="Delete preset"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </>
                      )}
                      {preset.isBuiltin && (
                        <div className="p-0.5 text-zinc-600 opacity-40">
                          <Pencil className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 4: Test Connection */}
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting || !urlInput}
              className="w-full p-2.5 rounded-xl bg-[#0e121d] hover:bg-[#131929] active:bg-[#0a0d15] border border-indigo-500/25 hover:border-indigo-500/50 text-white transition-all flex items-center justify-between cursor-pointer disabled:opacity-50 select-none group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
                  {isTesting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                  ) : (
                    <Zap className="w-3.5 h-3.5 text-indigo-400" />
                  )}
                </div>
                <span className="text-xs font-semibold text-zinc-200 group-hover:text-white">
                  {isTesting ? 'Testing Server...' : 'Test Connection'}
                </span>
              </div>

              <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
            </button>

            {/* Test Result Message */}
            {testResult && (
              <div
                className={`p-2 rounded-xl border text-[11px] flex items-center gap-1.5 animate-in fade-in duration-150 ${
                  testResult.ok
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}
              >
                <div
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    testResult.ok ? 'bg-emerald-400' : 'bg-rose-400'
                  }`}
                />
                <span className="font-medium truncate">{testResult.message}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3.5 mt-3.5 border-t border-zinc-800/80">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-zinc-300 hover:text-white bg-[#12151e] hover:bg-zinc-800 border border-zinc-800 rounded-xl transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-6 py-2 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 active:from-indigo-700 active:to-indigo-600 rounded-xl shadow-md shadow-indigo-600/35 transition-all cursor-pointer"
          >
            Apply
          </button>
        </div>
      </div>

      {/* Save / Edit Preset Sub-modal */}
      <AnimatePresence>
        {presetModal.isOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs">
            <div className="w-full max-w-xs bg-[#0e111a] border border-zinc-800 rounded-xl p-4 shadow-2xl space-y-3 text-white">
              <h3 className="text-sm font-bold">
                {presetModal.mode === 'add' ? 'Save New Preset' : 'Edit Preset'}
              </h3>

              <div className="space-y-2.5 text-left">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Preset Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Staging Server"
                    value={presetModal.name}
                    onChange={(e) => setPresetModal({ ...presetModal, name: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs bg-[#080a10] border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Server URL</label>
                  <input
                    type="text"
                    placeholder="https://api.example.com/tc-auth"
                    value={presetModal.url}
                    onChange={(e) => setPresetModal({ ...presetModal, url: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs font-mono bg-[#080a10] border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setPresetModal({ isOpen: false, mode: 'add', name: '', url: '' })}
                  className="px-3 py-1 text-xs text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSavePresetModal}
                  className="px-3.5 py-1 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
