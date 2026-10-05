import React, { useEffect, useState } from 'react';
import { jsPDF } from 'jspdf';
import {
  CancellationReason,
  CancellationScriptResponse,
  CancellationTone,
  Subscription,
  formatCurrency,
  getCategoryDisplayLabel,
} from '../types/subscription.ts';
import { ComputedThemeStyles } from '../types/theme.ts';
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarClock,
  Check,
  Copy,
  Download,
  Globe,
  RefreshCw,
  ShieldAlert,
  X,
} from 'lucide-react';

interface GemmaActionModalProps {
  subscription: Subscription | null;
  subscriptions: Subscription[];
  isOpen: boolean;
  isInline?: boolean;
  currency: string;
  styles: ComputedThemeStyles;
  onClose: () => void;
  onSelectSubscription?: (sub: Subscription) => void;
  onMarkStatus: (id: string, status: 'CANCELING' | 'CANCELED') => Promise<void>;
}

const TONES: CancellationTone[] = ['Firm & Direct', 'Polite & Brief', 'Negotiate Discount'];
const REASONS: CancellationReason[] = [
  'Too expensive',
  "Don't use it",
  'Found alternative',
  'Unexplained price hike',
];

export const GemmaActionModal: React.FC<GemmaActionModalProps> = ({
  subscription,
  subscriptions,
  isOpen,
  isInline = false,
  currency,
  styles,
  onClose,
  onSelectSubscription,
  onMarkStatus,
}) => {
  const activeSub = subscription || subscriptions[0] || null;

  const [tone, setTone] = useState<CancellationTone>('Firm & Direct');
  const [reason, setReason] = useState<CancellationReason>("Don't use it");
  const [inferenceMode, setInferenceMode] = useState<'cloud' | 'ollama'>('cloud');

  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [streamRawText, setStreamRawText] = useState<string>('');
  const [scriptResult, setScriptResult] = useState<CancellationScriptResponse | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [statusMarked, setStatusMarked] = useState<boolean>(false);

  const generateStreamedScript = async (
    targetSub: Subscription,
    selectedTone: CancellationTone,
    selectedReason: CancellationReason,
    mode: 'cloud' | 'ollama'
  ) => {
    setIsStreaming(true);
    setStreamRawText('');
    setScriptResult(null);
    setStatusMarked(false);

    const requestPayload = {
      subscriptionName: targetSub.name,
      monthlyCost: targetSub.monthlyCost,
      currency,
      userReason: selectedReason,
      preferredTone: selectedTone,
      category: targetSub.category,
      customCategory: targetSub.customCategory,
      billingCycle: targetSub.billingCycle,
      renewalDate: targetSub.renewalDate,
      inferenceMode: mode,
    };

    try {
      const response = await fetch('/api/ai/cancellation-script/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok || !response.body) {
        const unaryRes = await fetch('/api/ai/cancellation-script', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestPayload),
        });
        const unaryData = (await unaryRes.json()) as CancellationScriptResponse;
        setScriptResult(unaryData);
        setIsStreaming(false);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        for (const ev of events) {
          const line = ev.trim();
          if (!line.startsWith('data:')) continue;
          const jsonStr = line.replace(/^data:\s*/, '');
          try {
            const parsed = JSON.parse(jsonStr);
            if (parsed.type === 'delta' && parsed.text) {
              setStreamRawText((prev) => prev + parsed.text);
            } else if (parsed.type === 'done' && parsed.result) {
              setScriptResult(parsed.result as CancellationScriptResponse);
            }
          } catch {
            // ignore partial JSON chunk
          }
        }
      }
    } catch (err) {
      console.error('Failed to stream cancellation script:', err);
    } finally {
      setIsStreaming(false);
    }
  };

  useEffect(() => {
    if ((isOpen || isInline) && activeSub) {
      generateStreamedScript(activeSub, tone, reason, inferenceMode);
    }
  }, [isOpen, isInline, activeSub?.id, tone, reason, inferenceMode, currency]);

  if (!isOpen && !isInline) return null;
  if (!activeSub) return null;

  const formattedRenewalDate = new Date(activeSub.renewalDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const daysRemaining = Math.max(
    0,
    Math.ceil((new Date(activeSub.renewalDate).getTime() - Date.now()) / 86400000)
  );

  const handleCopyText = async () => {
    const textToCopy = scriptResult
      ? `Subject: ${scriptResult.subject}\n\n${scriptResult.body}`
      : streamRawText;
    await navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPdf = () => {
    const doc = new jsPDF({ unit: 'pt', format: 'letter' });
    const subject =
      scriptResult?.subject || `Formal Notice of Subscription Cancellation — ${activeSub.name}`;
    const body = scriptResult?.body || streamRawText;
    const advice = scriptResult?.darkPatternAdvice || '';
    const dateStr = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('FORMAL CONSUMER OPT-OUT & BILLING REVOCATION NOTICE', 48, 56);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(`Generated via SubsRadar Consumer Protection Engine · Date: ${dateStr}`, 48, 74);
    doc.text(
      `Merchant: ${activeSub.name} (${getCategoryDisplayLabel(activeSub)}) · Cost: ${formatCurrency(activeSub.monthlyCost, currency)}/mo · Cycle: ${activeSub.billingCycle} · Renewal: ${formattedRenewalDate}`,
      48,
      88
    );

    doc.setDrawColor(200, 200, 200);
    doc.line(48, 100, 564, 100);

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    const wrappedSubject = doc.splitTextToSize(`RE: ${subject}`, 516);
    doc.text(wrappedSubject, 48, 124);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    const wrappedBody = doc.splitTextToSize(body, 516);
    doc.text(wrappedBody, 48, 156);

    const bodyHeight = wrappedBody.length * 14;
    const footerStartY = Math.min(640, 175 + bodyHeight);

    if (advice) {
      doc.setDrawColor(220, 38, 38);
      doc.line(48, footerStartY, 564, footerStartY);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(185, 28, 28);
      doc.text('CONSUMER RETENTION & DARK-PATTERN ADVISORY:', 48, footerStartY + 18);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      const wrappedAdvice = doc.splitTextToSize(advice, 516);
      doc.text(wrappedAdvice, 48, footerStartY + 34);
    }

    const safeFileName = activeSub.name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    doc.save(`SubsRadar_OptOut_${safeFileName}.pdf`);
  };

  const portalHref =
    activeSub.cancellationUrl ||
    `https://www.google.com/search?q=${encodeURIComponent(
      `${activeSub.name} cancel subscription account billing`
    )}`;

  const content = (
    <div className={`${styles.cardClass} overflow-hidden w-full`}>
      <div className={`px-6 py-4 border-b ${styles.dividerClass} flex flex-wrap items-center justify-between gap-3`}>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className={`px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${styles.subPanelClass}`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>
          <div>
            <h2 className={`text-xl font-bold ${styles.headingFontClass}`}>
              AI Action Engine — {activeSub.name}
            </h2>
            <div className={`text-xs font-mono tabular-nums ${styles.mutedTextClass}`}>
              {activeSub.category} · {formatCurrency(activeSub.monthlyCost, currency)}/mo · Renews{' '}
              {formattedRenewalDate} ({daysRemaining}d)
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isInline && onSelectSubscription && (
            <select
              value={activeSub.id}
              onChange={(e) => {
                const found = subscriptions.find((s) => s.id === e.target.value);
                if (found) onSelectSubscription(found);
              }}
              className={`px-3 py-1.5 text-xs font-medium border ${styles.inputClass} focus:outline-none`}
            >
              {subscriptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.billingCycle} · {formatCurrency(s.monthlyCost, currency)}/mo)
                </option>
              ))}
            </select>
          )}

          {!isInline && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 opacity-60 hover:opacity-100 rounded-md transition-opacity cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Parameter Controls */}
      <div className={`p-5 border-b ${styles.dividerClass}`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5">01. Tone</label>
            <div className={`flex flex-col gap-1 p-1 ${styles.subPanelClass}`}>
              {TONES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTone(t)}
                  style={
                    tone === t
                      ? { backgroundColor: styles.accentHex, color: '#FFFFFF' }
                      : undefined
                  }
                  className="py-1.5 px-3 text-xs font-medium rounded-md text-left transition-colors cursor-pointer whitespace-nowrap"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5">02. Reason</label>
            <div className={`grid grid-cols-1 gap-1 p-1 ${styles.subPanelClass}`}>
              {REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(r)}
                  style={
                    reason === r
                      ? { backgroundColor: styles.accentHex, color: '#FFFFFF' }
                      : undefined
                  }
                  className="py-1.5 px-3 text-xs font-medium rounded-md text-left transition-colors cursor-pointer whitespace-nowrap"
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col justify-between">
            <div>
              <label className="block text-xs font-semibold mb-1.5">03. Runtime</label>
              <div className={`grid grid-cols-1 gap-1 p-1 ${styles.subPanelClass}`}>
                <button
                  type="button"
                  onClick={() => setInferenceMode('cloud')}
                  style={
                    inferenceMode === 'cloud'
                      ? { backgroundColor: styles.accentHex, color: '#FFFFFF' }
                      : undefined
                  }
                  className="py-1.5 px-3 text-xs font-medium rounded-md text-left transition-colors cursor-pointer whitespace-nowrap"
                >
                  Gemini + Google Search
                </button>
                <button
                  type="button"
                  onClick={() => setInferenceMode('ollama')}
                  style={
                    inferenceMode === 'ollama'
                      ? { backgroundColor: styles.accentHex, color: '#FFFFFF' }
                      : undefined
                  }
                  className="py-1.5 px-3 text-xs font-medium rounded-md text-left transition-colors cursor-pointer whitespace-nowrap"
                >
                  Local Ollama (gemma4:e4b)
                </button>
              </div>
            </div>

            <button
              type="button"
              disabled={isStreaming}
              onClick={() => generateStreamedScript(activeSub, tone, reason, inferenceMode)}
              className={`mt-3 w-full py-2 px-3 text-xs font-semibold ${styles.subPanelClass} flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 whitespace-nowrap`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isStreaming ? 'animate-spin' : ''}`} />
              {isStreaming ? 'Streaming...' : 'Regenerate Script'}
            </button>
          </div>
        </div>
      </div>

      {/* Live Streaming Output Area */}
      <div className="p-5 space-y-4">
        {scriptResult ? (
          <div className="space-y-3.5">
            {scriptResult.cancellationScheduleNote && (
              <div className={`p-3 ${styles.subPanelClass} flex items-start gap-2.5`}>
                <CalendarClock className="w-4 h-4 shrink-0 mt-0.5" style={{ color: styles.accentHex }} />
                <div className="text-xs leading-relaxed">
                  <span className="font-semibold">Renewal Alignment: </span>
                  {scriptResult.cancellationScheduleNote}
                </div>
              </div>
            )}

            <div className={`border-b ${styles.dividerClass} pb-2.5`}>
              <div className={`text-[11px] font-semibold ${styles.mutedTextClass}`}>
                Subject
              </div>
              <div className="text-sm font-semibold mt-0.5 select-all">
                {scriptResult.subject}
              </div>
            </div>

            <div>
              <div className={`text-[11px] font-semibold mb-1 ${styles.mutedTextClass}`}>
                Opt-Out Letter
              </div>
              <pre className={`whitespace-pre-wrap font-sans text-xs leading-relaxed p-4 ${styles.subPanelClass} select-all max-h-64 overflow-y-auto`}>
                {scriptResult.body}
              </pre>
            </div>

            {scriptResult.darkPatternAdvice && (
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed">
                  <span className="font-semibold">Dark-Pattern Advisory: </span>
                  {scriptResult.darkPatternAdvice}
                </div>
              </div>
            )}

            {scriptResult.groundingSources && scriptResult.groundingSources.length > 0 && (
              <div className={`p-3 ${styles.subPanelClass} flex flex-wrap items-center gap-3 text-xs`}>
                <span className="font-semibold flex items-center gap-1" style={{ color: styles.accentHex }}>
                  <Globe className="w-3.5 h-3.5" />
                  Sources:
                </span>
                {scriptResult.groundingSources.map((src, idx) => (
                  <a
                    key={idx}
                    href={src.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-[11px] flex items-center gap-1"
                    style={{ color: styles.accentHex }}
                  >
                    <span>{src.title}</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </a>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <div className={`text-xs font-mono ${styles.mutedTextClass} flex items-center gap-2`}>
              <span
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: styles.accentHex }}
              />
              Streaming for {activeSub.name}...
            </div>
            <pre className={`whitespace-pre-wrap font-mono text-xs leading-relaxed p-4 ${styles.subPanelClass} min-h-[200px]`}>
              {streamRawText || 'Initializing stream...'}
            </pre>
          </div>
        )}

        {/* Action Buttons Bar */}
        <div className={`pt-3 border-t ${styles.dividerClass} flex flex-wrap items-center justify-between gap-3`}>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopyText}
              style={{ backgroundColor: styles.accentHex, color: '#FFFFFF' }}
              className="px-4 py-2 text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy Text'}
            </button>

            <a
              href={portalHref}
              target="_blank"
              rel="noopener noreferrer"
              className={`px-4 py-2 text-xs font-semibold ${styles.subPanelClass} flex items-center gap-1.5 whitespace-nowrap`}
            >
              Open Subscription Portal
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>

            <button
              type="button"
              onClick={handleDownloadPdf}
              className={`px-4 py-2 text-xs font-semibold ${styles.subPanelClass} flex items-center gap-1.5 cursor-pointer whitespace-nowrap`}
            >
              <Download className="w-3.5 h-3.5" />
              Download PDF Opt-Out Letter
            </button>
          </div>

          <button
            type="button"
            onClick={async () => {
              await onMarkStatus(activeSub.id, 'CANCELING');
              setStatusMarked(true);
            }}
            className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              statusMarked || activeSub.status === 'CANCELING'
                ? 'bg-amber-500/20 text-amber-600'
                : styles.subPanelClass
            }`}
          >
            {statusMarked || activeSub.status === 'CANCELING'
              ? 'Marked Canceling'
              : 'Mark as Canceling'}
          </button>
        </div>
      </div>
    </div>
  );

  if (isInline) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="max-w-3xl w-full my-8">{content}</div>
    </div>
  );
};
