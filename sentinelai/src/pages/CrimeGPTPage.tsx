import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield, Send, Trash2, ChevronDown, Loader2,
  Sparkles, MessageSquare, RefreshCw, Copy, CheckCircle,
} from 'lucide-react';
import api from '@/services/api';

/* ── Types ── */
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
}

interface Case {
  case_id: string;
  case_number: string;
  title: string;
  fraud_type: string;
  status: string;
}

/* ── Starter prompts ── */
const STARTERS = [
  { label: 'Case Summary',            prompt: 'Summarize this case' },
  { label: 'Investigation Plan',      prompt: 'What should I investigate next?' },
  { label: 'Missing Evidence',        prompt: 'What evidence is missing?' },
  { label: 'Recovery Analysis',       prompt: 'Why is the recovery probability high or low?' },
  { label: 'Suspicious Entities',     prompt: 'Show me the suspicious entities in this case' },
  { label: 'Generate Freeze Request', prompt: 'Generate a bank freeze request for this case' },
  { label: 'Victim Questionnaire',    prompt: 'Generate a victim questionnaire for this case' },
  { label: 'Related Cases',           prompt: 'Show me related cases and cross-case matches' },
];

/* ── Markdown renderer (lightweight) ── */
function renderMarkdown(text: string): string {
  return text
    .replace(/^## (.+)$/gm, '<h2 class="text-sm font-bold text-white mt-4 mb-2">$1</h2>')
    .replace(/^### (.+)$/gm, '<h3 class="text-xs font-bold text-[#F8FAFC] mt-3 mb-1">$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white">$1</strong>')
    .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-[#070B14] text-[#90E0EF] text-xs font-mono">$1</code>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 text-[#F8FAFC] list-disc">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 text-[#F8FAFC] list-decimal">$2</li>')
    .replace(/\n{2,}/g, '</p><p class="mb-2">')
    .replace(/\n/g, '<br/>');
}

/* ── Copy button ── */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="p-1.5 rounded hover:bg-[#0d2488] text-[#F8FAFC]0 hover:text-[#F8FAFC] transition-colors"
      title="Copy"
    >
      {copied ? <CheckCircle className="w-3.5 h-3.5 text-[#00D084]" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

/* ── Message bubble ── */
function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} group`}>
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
        isUser ? 'bg-[#00B8FF] text-[#03045E]' : 'bg-[#121B2A] border border-[#223047] text-[#00B8FF]'
      }`}>
        {isUser ? <span className="text-xs font-bold">IO</span> : <Shield className="w-4 h-4" />}
      </div>
      {/* Bubble */}
      <div className={`max-w-[80%] rounded-lg px-4 py-3 ${
        isUser
          ? 'bg-[#00B8FF]/10 border border-cyan-500/20 text-[#F8FAFC]'
          : 'bg-[#121B2A] border border-[#223047] text-[#F8FAFC]'
      }`}>
        {isUser ? (
          <p className="text-sm">{msg.content}</p>
        ) : (
          <div className="text-sm leading-relaxed">
            <div
              dangerouslySetInnerHTML={{ __html: '<p class="mb-2">' + renderMarkdown(msg.content) + '</p>' }}
              className="prose-sm"
            />
          </div>
        )}
        <div className="flex items-center justify-between mt-1.5 gap-2">
          {msg.created_at && (
            <span className="text-[10px] text-[#98A2B3]">
              {new Date(msg.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          {!isUser && <CopyButton text={msg.content} />}
        </div>
      </div>
    </div>
  );
}

/* ── Main page ── */
export default function CrimeGPTPage() {
  const navigate = useNavigate();
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [showCaseDropdown, setShowCaseDropdown] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [clearing, setClearing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load cases
  useEffect(() => {
    api.get('/cases').then(res => {
      setCases(res.data || []);
      if (res.data?.length > 0 && !selectedCase) setSelectedCase(res.data[0]);
    }).catch(() => {});
  }, []);

  // Load history when case changes
  useEffect(() => {
    if (!selectedCase) return;
    setLoadingHistory(true);
    setMessages([]);
    api.get(`/chat/${selectedCase.case_id}/history`)
      .then(res => {
        const hist = (res.data || []).map((m: any, i: number) => ({ id: `hist-${i}`, ...m }));
        setMessages(hist);
      })
      .catch(() => {})
      .finally(() => setLoadingHistory(false));
  }, [selectedCase]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = useCallback(async (text?: string) => {
    const q = (text || input).trim();
    if (!q || !selectedCase || loading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: q, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/chat', { case_id: selectedCase.case_id, question: q });
      const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: res.data.answer, created_at: new Date().toISOString() };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      const errMsg: Message = {
        id: (Date.now() + 1).toString(), role: 'assistant',
        content: `Error: ${err?.response?.data?.detail || 'Failed to get response. Please try again.'}`,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [input, selectedCase, loading]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const clearHistory = async () => {
    if (!selectedCase) return;
    setClearing(true);
    await api.delete(`/chat/${selectedCase.case_id}/history`).catch(() => {});
    setMessages([]);
    setClearing(false);
  };

  const isEmpty = messages.length === 0 && !loadingHistory;

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] max-h-[900px] bg-[#070B14] rounded-lg border border-[#223047] overflow-hidden animate-fade-in">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#223047] bg-[#121B2A] shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#070B14] border border-[#223047] flex items-center justify-center shadow-lg">
            <Shield className="w-4 h-4 text-[#00B8FF]" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white flex items-center gap-1.5">
              CrimeGPT <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#0d2488] text-[#90E0EF] border border-[#223047] font-medium">AI</span>
            </h1>
            <p className="text-[10px] text-[#98A2B3]">Investigation Intelligence Assistant</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Case selector */}
          <div className="relative">
            <button
              onClick={() => setShowCaseDropdown(v => !v)}
              className="flex items-center gap-2 px-3 py-2 bg-[#0d2488] border border-[#223047] rounded-xl text-sm text-[#F8FAFC] hover:border-white/[0.16] transition-colors max-w-[260px]"
            >
              {selectedCase ? (
                <>
                  <span className="font-mono text-xs text-[#00B8FF]">{selectedCase.case_number || selectedCase.case_id.slice(0, 8)}</span>
                  <span className="truncate text-xs">{selectedCase.title}</span>
                </>
              ) : (
                <span className="text-[#F8FAFC]0">Select case…</span>
              )}
              <ChevronDown className="w-3.5 h-3.5 text-[#F8FAFC]0 shrink-0" />
            </button>
            {showCaseDropdown && (
              <div className="absolute right-0 top-full mt-1 w-80 bg-[#121B2A] border border-[#223047] rounded-xl shadow-2xl z-50 max-h-64 overflow-y-auto">
                {cases.map(c => (
                  <button key={c.case_id} onClick={() => { setSelectedCase(c); setShowCaseDropdown(false); }}
                    className={`w-full text-left px-4 py-3 hover:bg-[#070B14] transition-colors border-b border-[#223047] last:border-0 ${selectedCase?.case_id === c.case_id ? 'bg-[#070B14]' : ''}`}>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-[#00B8FF]">{c.case_number || c.case_id.slice(0, 8)}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${
                        c.status === 'Open' ? 'bg-[#00D084]/20 text-[#00D084] border border-emerald-500/30' : 'bg-slate-700/50 text-[#98A2B3]'
                      }`}>{c.status}</span>
                    </div>
                    <p className="text-xs text-[#F8FAFC] truncate mt-0.5">{c.title}</p>
                    <p className="text-[10px] text-[#F8FAFC]0">{c.fraud_type}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedCase && (
            <button onClick={() => navigate(`/cases/${selectedCase.case_id}`)}
              className="px-3 py-2 text-xs text-[#00B8FF] border border-[#223047] rounded-xl hover:bg-[#29C5FF]/20 hover:text-cyan-300 transition-colors">
              Open Case
            </button>
          )}

          <button onClick={clearHistory} disabled={clearing || messages.length === 0}
            className="p-2 text-[#98A2B3] hover:text-[#FF4D6D] border border-[#223047] rounded-xl hover:border-red-500/30 transition-colors disabled:opacity-30"
            title="Clear history">
            {clearing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* ── Messages area ── */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-[#020340]/40">
        {loadingHistory ? (
          <div className="flex items-center justify-center h-32 text-[#98A2B3]">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading history…
          </div>
        ) : isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center px-4">
            <div className="w-16 h-16 rounded-lg bg-[#121B2A] border border-[#223047] flex items-center justify-center mb-4 shadow-xl">
              <Shield className="w-8 h-8 text-[#00B8FF]" />
            </div>
            <h2 className="text-lg font-bold text-[#F8FAFC] mb-1">CrimeGPT</h2>
            <p className="text-sm text-[#98A2B3] mb-6 max-w-sm">
              {selectedCase
                ? `Ask anything about ${selectedCase.case_number || selectedCase.case_id.slice(0, 8)} - entities, recovery, next steps, legal actions.`
                : 'Select a case above to start investigating.'}
            </p>
            {selectedCase && (
              <div className="grid grid-cols-2 gap-2 w-full max-w-lg">
                {STARTERS.map(s => (
                  <button key={s.label} onClick={() => sendMessage(s.prompt)}
                    className="flex items-center px-4 py-3 bg-[#121B2A] border border-[#223047] rounded-xl text-left hover:border-cyan-500/50 hover:bg-[#070B14] transition-all group">
                    <span className="text-xs font-medium text-[#F8FAFC] group-hover:text-white transition-colors leading-snug">{s.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#121B2A] border border-[#223047] text-[#00B8FF] flex items-center justify-center shrink-0">
                  <Shield className="w-4 h-4" />
                </div>
                <div className="bg-[#121B2A] border border-[#223047] rounded-lg px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-[#00B8FF] animate-bounce" style={{animationDelay:'0ms'}} />
                    <div className="w-2 h-2 rounded-full bg-[#00B8FF] animate-bounce" style={{animationDelay:'150ms'}} />
                    <div className="w-2 h-2 rounded-full bg-[#00B8FF] animate-bounce" style={{animationDelay:'300ms'}} />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Quick starters row (when messages exist) ── */}
      {!isEmpty && selectedCase && (
        <div className="px-5 py-2 border-t border-[#223047] bg-[#020340] overflow-x-auto shrink-0">
          <div className="flex gap-2 min-w-max">
            {STARTERS.slice(0, 5).map(s => (
              <button key={s.label} onClick={() => sendMessage(s.prompt)} disabled={loading}
                className="px-3 py-1.5 bg-[#121B2A] border border-[#223047] rounded-xl text-xs font-medium text-[#F8FAFC] hover:text-white hover:border-cyan-500/50 hover:bg-[#070B14] transition-all disabled:opacity-40 whitespace-nowrap">
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Input ── */}
      <div className="px-5 py-4 border-t border-[#223047] bg-[#020340] shrink-0">
        <div className={`flex items-end gap-3 bg-[#0d2488] border rounded-lg px-4 py-3 transition-colors ${
          selectedCase ? 'border-[#223047] focus-within:border-cyan-500' : 'border-[#223047] opacity-50'
        }`}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!selectedCase || loading}
            placeholder={selectedCase ? 'Ask CrimeGPT anything about this case… (Enter to send, Shift+Enter for new line)' : 'Select a case to start…'}
            rows={1}
            className="flex-1 bg-transparent text-sm text-[#F8FAFC] placeholder-slate-400/60 resize-none focus:outline-none max-h-32"
            style={{ lineHeight: '1.5' }}
            onInput={e => {
              const el = e.currentTarget;
              el.style.height = 'auto';
              el.style.height = Math.min(el.scrollHeight, 128) + 'px';
            }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || !selectedCase || loading}
            className="w-8 h-8 rounded-xl bg-[#00B8FF] hover:bg-[#29C5FF] disabled:bg-slate-700 disabled:opacity-35 disabled:cursor-not-allowed flex items-center justify-center transition-colors shrink-0"
          >
            {loading ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
          </button>
        </div>
        <p className="text-[10px] text-[#F8FAFC]0 mt-2 text-center">
          CrimeGPT uses only verified case data. All responses are traceable to evidence.
        </p>
      </div>
    </div>
  );
}
