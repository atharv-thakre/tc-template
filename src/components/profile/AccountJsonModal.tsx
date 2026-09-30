import React, { useState } from 'react';
import { Copy, Check, Braces } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '../common/Modal';

interface AccountJsonModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
}

export const AccountJsonModal: React.FC<AccountJsonModalProps> = ({
  isOpen,
  onClose,
  data,
}) => {
  const [hasCopied, setHasCopied] = useState(false);

  const formattedJson = data ? JSON.stringify(data, null, 2) : '// No account data available';

  const handleCopy = async () => {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(formattedJson);
      setHasCopied(true);
      toast.success('Account JSON copied to clipboard!');
      setTimeout(() => setHasCopied(false), 2000);
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="xl"
      title={
        <div className="flex items-center gap-2 text-white">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shadow-inner">
            <Braces className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Raw Account JSON</h3>
            <p className="text-xs text-zinc-400 font-normal">
              Structured account payload and claims.
            </p>
          </div>
        </div>
      }
    >
      <div className="space-y-4 pt-1">
        {/* Code block */}
        <div className="relative group">
          <div className="flex items-center justify-between px-3 py-2 bg-black/60 border-t border-x border-white/10 rounded-t-xl text-[11px] font-mono text-zinc-400">
            <span className="flex items-center gap-1.5 text-zinc-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>application/json</span>
            </span>
            <span className="text-zinc-500 text-[10px]">
              {data ? `${Object.keys(data).length} top-level fields` : ''}
            </span>
          </div>

          <pre className="p-4 rounded-b-xl bg-black/90 border border-white/10 text-xs font-mono text-zinc-200 max-h-[55vh] overflow-auto select-text leading-relaxed shadow-inner">
            <code>{formattedJson}</code>
          </pre>

          <div className="absolute right-3 top-10 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={handleCopy}
              disabled={!data}
              className="px-2.5 py-1 rounded-lg bg-zinc-800/90 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-xs font-mono flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
            >
              {hasCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{hasCopied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-zinc-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 rounded-xl transition-all cursor-pointer active:scale-95"
          >
            Close
          </button>

          <button
            type="button"
            onClick={handleCopy}
            disabled={!data}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50 active:scale-95"
          >
            {hasCopied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-300" />
                <span>Copied to Clipboard</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy JSON</span>
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};
