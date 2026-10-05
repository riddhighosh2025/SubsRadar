import React, { useState } from 'react';
import { ParsedStatementItem, formatCurrency, getCurrencySymbol } from '../types/subscription.ts';
import { ComputedThemeStyles } from '../types/theme.ts';
import {
  ArrowLeft,
  CheckSquare,
  FileSpreadsheet,
  PlusCircle,
  RefreshCw,
  Square,
  X,
} from 'lucide-react';

interface StatementParserModalProps {
  isOpen: boolean;
  isInline?: boolean;
  currency: string;
  styles: ComputedThemeStyles;
  onClose: () => void;
  onImportItems: (items: ParsedStatementItem[]) => Promise<void>;
}

const SAMPLE_STATEMENTS: Record<string, string> = {
  'Sample 1: Credit Card Mix': `10/01/2026 AMZN MKTP US*PRIME TX 28319912 $14.99
10/02/2026 PELOTON*ALL-ACCESS MEMBERSHIP NY $44.00
10/02/2026 WHOLE FOODS MARKET #1042 AUSTIN TX $84.12
10/03/2026 OPENAI *CHATGPT PLUS SAN FRANCISCO CA $20.00
10/03/2026 HULU*DISNEY+ BUNDLE SANTA MONICA CA $19.99
10/04/2026 BLOOMBERG.COM DIGITAL SUBSCRIPTION $34.99`,
  'Sample 2: Dev & SaaS Stack': `09/28/2026 VERCEL INC PRO SEAT SAN FRANCISCO $20.00
09/29/2026 ANTHROPIC *CLAUDE PRO SUBSCRIPTION $20.00
09/30/2026 NOTION LABS INC PLUS PLAN $12.00
10/01/2026 LINEAR.APP WORKSPACE STANDARD $16.00
10/02/2026 SUPERHUMAN MAIL CLIENT RECURRING $30.00`,
  'Sample 3: Annual & Media Leaks': `09/15/2026 WSJ*WALL STREET JOURNAL DIGITAL $38.99
09/18/2026 MAX.COM *AD-FREE STREAMING $16.99
09/22/2026 STRAVA INC ANNUAL MEMBERSHIP $79.99
09/25/2026 HEADSPACE MEDITATION PLUS $12.99`,
};

export const StatementParserModal: React.FC<StatementParserModalProps> = ({
  isOpen,
  isInline = false,
  currency,
  styles,
  onClose,
  onImportItems,
}) => {
  const [rawText, setRawText] = useState<string>(
    SAMPLE_STATEMENTS['Sample 1: Credit Card Mix']
  );
  const [inferenceMode, setInferenceMode] = useState<'cloud' | 'ollama'>('cloud');
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [parsedItems, setParsedItems] = useState<ParsedStatementItem[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [providerUsed, setProviderUsed] = useState<string>('');
  const [isImporting, setIsImporting] = useState<boolean>(false);

  if (!isOpen && !isInline) return null;

  const currencySym = getCurrencySymbol(currency).trim();

  const handleParse = async () => {
    if (!rawText.trim()) return;
    setIsParsing(true);
    try {
      const res = await fetch('/api/ai/parse-statement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          statementText: rawText,
          inferenceMode,
        }),
      });
      const data = await res.json();
      const items: ParsedStatementItem[] = Array.isArray(data.items) ? data.items : [];
      setParsedItems(items);
      setSelectedIndices(items.map((_, i) => i));
      setProviderUsed(data.providerUsed || 'Gemma Statement Parser');
    } catch (err) {
      console.error('Statement parse error:', err);
    } finally {
      setIsParsing(false);
    }
  };

  const toggleIndex = (idx: number) => {
    setSelectedIndices((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const handleImportSelected = async () => {
    const toImport = parsedItems.filter((_, i) => selectedIndices.includes(i));
    if (toImport.length === 0) return;
    setIsImporting(true);
    try {
      await onImportItems(toImport);
      setParsedItems([]);
      setSelectedIndices([]);
      if (!isInline) onClose();
    } finally {
      setIsImporting(false);
    }
  };

  const body = (
    <div className={`${styles.cardClass} overflow-hidden w-full`}>
      <div className={`px-6 py-4 border-b ${styles.dividerClass} flex items-center justify-between gap-3`}>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className={`px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${styles.subPanelClass}`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>
          <h2 className={`text-lg font-bold ${styles.headingFontClass}`}>
            AI Bank &amp; Card Statement Parser ({currency})
          </h2>
        </div>

        {!isInline && (
          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 ${styles.mutedTextClass} hover:opacity-100 rounded-md transition-colors cursor-pointer`}
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {Object.keys(SAMPLE_STATEMENTS).map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => setRawText(SAMPLE_STATEMENTS[label])}
                className={`px-2.5 py-1 text-xs font-medium ${styles.subPanelClass} hover:opacity-85 transition-opacity cursor-pointer whitespace-nowrap`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className={`flex items-center gap-1 p-1 ${styles.subPanelClass} text-xs`}>
            <button
              type="button"
              onClick={() => setInferenceMode('cloud')}
              style={
                inferenceMode === 'cloud'
                  ? { backgroundColor: styles.accentHex, color: '#FFFFFF' }
                  : undefined
              }
              className="px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap"
            >
              Cloud Endpoint
            </button>
            <button
              type="button"
              onClick={() => setInferenceMode('ollama')}
              style={
                inferenceMode === 'ollama'
                  ? { backgroundColor: styles.accentHex, color: '#FFFFFF' }
                  : undefined
              }
              className="px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap"
            >
              Local Ollama
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1.5">
            Statement Lines (CSV / Text)
          </label>
          <textarea
            rows={5}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder={`e.g. AMZN MKTP US TX 28319912 ${currencySym}14.99`}
            className={`w-full p-3.5 font-mono text-xs border ${styles.inputClass} focus:outline-none`}
          />
          <div className="mt-2.5 flex justify-end">
            <button
              type="button"
              onClick={handleParse}
              disabled={isParsing || !rawText.trim()}
              style={{ backgroundColor: styles.accentHex, color: '#FFFFFF' }}
              className="px-4 py-2 text-xs font-semibold rounded-lg transition-opacity hover:opacity-90 flex items-center gap-2 cursor-pointer disabled:opacity-50 whitespace-nowrap"
            >
              {isParsing ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-3.5 h-3.5" />
              )}
              {isParsing ? 'Extracting...' : 'Extract Subscriptions'}
            </button>
          </div>
        </div>

        {parsedItems.length > 0 && (
          <div className={`border-t ${styles.dividerClass} pt-4 space-y-3`}>
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold">
                Extracted Subscriptions ({parsedItems.length})
              </div>
              <div className={`text-xs font-mono ${styles.mutedTextClass}`}>
                {providerUsed}
              </div>
            </div>

            <div className={`${styles.subPanelClass} overflow-hidden max-h-60 overflow-y-auto`}>
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className={`border-b ${styles.dividerClass} text-[11px] font-semibold ${styles.mutedTextClass}`}>
                    <th className="py-2 px-3 w-8">Select</th>
                    <th className="py-2 px-3">Merchant Name</th>
                    <th className="py-2 px-3">Category</th>
                    <th className="py-2 px-3">Cycle</th>
                    <th className="py-2 px-3 text-right">Usage</th>
                    <th className="py-2 px-3 text-right">Monthly Cost ({currencySym})</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${styles.dividerClass}`}>
                  {parsedItems.map((item, idx) => {
                    const checked = selectedIndices.includes(idx);
                    return (
                      <tr
                        key={idx}
                        onClick={() => toggleIndex(idx)}
                        className="hover:bg-slate-500/5 cursor-pointer"
                      >
                        <td className="py-2 px-3">
                          {checked ? (
                            <CheckSquare className="w-4 h-4" style={{ color: styles.accentHex }} />
                          ) : (
                            <Square className="w-4 h-4 opacity-50" />
                          )}
                        </td>
                        <td className="py-2 px-3 font-semibold">{item.name}</td>
                        <td className={`py-2 px-3 font-mono ${styles.mutedTextClass}`}>
                          {item.category}
                        </td>
                        <td className={`py-2 px-3 font-mono text-[11px] ${styles.mutedTextClass}`}>
                          {item.estimatedCycle}
                        </td>
                        <td className={`py-2 px-3 text-right font-mono tabular-nums ${styles.mutedTextClass}`}>
                          {item.suggestedUsageFrequency ?? 6}d/mo
                        </td>
                        <td className="py-2 px-3 text-right font-mono tabular-nums font-semibold">
                          {formatCurrency(Number(item.cost), currency)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                disabled={selectedIndices.length === 0 || isImporting}
                onClick={handleImportSelected}
                style={{ backgroundColor: styles.accentHex, color: '#FFFFFF' }}
                className="px-4 py-2 text-xs font-semibold rounded-lg transition-opacity hover:opacity-90 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 whitespace-nowrap"
              >
                <PlusCircle className="w-4 h-4" />
                {isImporting
                  ? 'Importing...'
                  : `Add ${selectedIndices.length} to Matrix`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (isInline) return body;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="max-w-3xl w-full my-8">{body}</div>
    </div>
  );
};
