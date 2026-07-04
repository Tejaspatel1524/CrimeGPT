import { useState, useEffect, useRef, useCallback } from 'react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import {
  Shield, Send, Trash2, ChevronDown, Loader2, Sparkles, MessageSquare,
  Copy, CheckCircle, Download, FileText, Clock, Users, Camera, Network,
  TrendingUp, Layers, BookOpen, Search, Zap, ChevronRight, AlertCircle,
} from 'lucide-react';
import api from '@/services/api';

/* -----------------------------------------------------------
   TYPES
----------------------------------------------------------- */
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
  sources?: string[];
  suggestions?: string[];
}

interface Case {
  case_id: string;
  case_number: string;
  title: string;
  fraud_type: string;
  status: string;
}

/* -----------------------------------------------------------
   QUICK PROMPTS
----------------------------------------------------------- */
const QUICK_PROMPTS = [
  { id: 'summary', label: 'Case Summary', icon: FileText, prompt: 'Provide a comprehensive case summary' },
  { id: 'evidence', label: 'Missing Evidence', icon: Camera, prompt: 'What critical evidence is missing from this investigation?' },
  { id: 'plan', label: 'Investigation Plan', icon: Search, prompt: 'What are the next investigation steps I should take?' },
  { id: 'recovery', label: 'Recovery Analysis', icon: TrendingUp, prompt: 'Analyze the recovery probability and explain the factors' },
  { id: 'related', label: 'Related Cases', icon: Layers, prompt: 'Show me related cases and cross-case entity matches' },
  { id: 'report', label: 'Generate Report', icon: FileText, prompt: 'Generate a comprehensive investigation report' },
];

/* -----------------------------------------------------------
   AI STATUS MESSAGES
----------------------------------------------------------- */
const AI_STATUS_MESSAGES = [
  'Analyzing case data...',
  'Reviewing evidence...',
  'Cross-checking entities...',
  'Analyzing timeline...',
  'Checking recovery intelligence...',
  'Preparing response...',
];

/* -----------------------------------------------------------
   HELPER FUNCTIONS
----------------------------------------------------------- */
function detectSources(content: string): string[] {
  const sources: string[] = [];
  if (content.includes('officer note') || content.includes('Officer Note')) sources.push('Officer Notes');
  if (content.includes('timeline') || content.includes('Timeline')) sources.push('Timeline Events');
  if (content.includes('OCR') || content.includes('extracted text')) sources.push('OCR Analysis');
  if (content.includes('evidence') || content.includes('Evidence')) sources.push('Evidence Files');
  if (content.includes('cross-case') || content.includes('related case')) sources.push('Cross-Case Intelligence');
  if (content.includes('recovery') || content.includes('Recovery')) sources.push('Recovery Intelligence');
  if (content.includes('entity') || content.includes('Entity') || content.includes('UPI') || content.includes('phone')) sources.push('Entity Extraction');
  return [...new Set(sources)];
}

function generateSuggestions(role: string, content: string): string[] {
  if (role !== 'assistant') return [];
  const suggestions: string[] = [];
  
  if (content.includes('recovery') || content.includes('probability')) {
    suggestions.push('What immediate actions should I take?');
    suggestions.push('Generate a bank freeze request letter');
  }
  if (content.includes('entity') || content.includes('UPI') || content.includes('phone')) {
    suggestions.push('Show me the entity relationship graph');
    suggestions.push('Which entities are high risk?');
  }
  if (content.includes('evidence') || content.includes('missing')) {
    suggestions.push('What evidence should I collect next?');
    suggestions.push('Generate a victim questionnaire');
  }
  if (content.includes('timeline') || content.includes('sequence')) {
    suggestions.push('Reconstruct the fraud timeline');
  }
  if (content.includes('cross-case') || content.includes('related')) {
    suggestions.push('Show detailed cross-case matches');
    suggestions.push('Is this part of an organized fraud ring?');
  }
  
  // Default suggestions
  if (suggestions.length === 0) {
    suggestions.push('What should I investigate next?');
    suggestions.push('Generate investigation report');
  }
  
  return suggestions.slice(0, 3);
}

/* -----------------------------------------------------------
   COPY BUTTON
----------------------------------------------------------- */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <button
      onClick={handleCopy}
      className="p-1.5 rounded-lg hover:bg-slate-700/50 text-[#F8FAFC]0 hover:text-[#F8FAFC] transition-colors"
      title="Copy response"
    >
      {copied ? (
        <CheckCircle className="w-3.5 h-3.5 text-[#00D084]" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
    </button>
  );
}

/* -----------------------------------------------------------
   SOURCE REFERENCES COMPONENT
----------------------------------------------------------- */
function SourceReferences({ sources }: { sources: string[] }) {
  if (!sources || sources.length === 0) return null;
  
  const sourceIcons: Record<string, any> = {
    'Officer Notes': BookOpen,
    'Timeline Events': Clock,
    'OCR Analysis': FileText,
    'Evidence Files': Camera,
    'Cross-Case Intelligence': Layers,
    'Recovery Intelligence': TrendingUp,
    'Entity Extraction': Users,
  };
  
  return (
    <div className="mt-3 pt-3 border-t border-[#223047]">
      <p className="text-[10px] text-[#98A2B3] uppercase tracking-wider mb-2">Data Sources</p>
      <div className="flex flex-wrap gap-1.5">
        {sources.map((source, idx) => {
          const Icon = sourceIcons[source] || FileText;
          return (
            <div
              key={idx}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#070B14]/50 border border-[#223047] text-xs text-[#98A2B3]"
            >
              <Icon className="w-3 h-3" />
              <span>{source}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* -----------------------------------------------------------
   SUGGESTED FOLLOW-UPS COMPONENT
----------------------------------------------------------- */
function SuggestedFollowUps({ suggestions, onSelect }: { suggestions: string[]; onSelect: (q: string) => void }) {
  if (!suggestions || suggestions.length === 0) return null;
  
  return (
    <div className="mt-3 pt-3 border-t border-[#223047]">
      <p className="text-[10px] text-[#98A2B3] uppercase tracking-wider mb-2">Suggested Follow-ups</p>
      <div className="space-y-1.5">
        {suggestions.map((sugg, idx) => (
          <button
            key={idx}
            onClick={() => onSelect(sugg)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-[#070B14]/30 border border-[#223047] hover:border-cyan-500/40 hover:bg-[#29C5FF]/5 text-left transition-all group"
          >
            <span className="text-xs text-[#98A2B3] group-hover:text-[#F8FAFC]">{sugg}</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#98A2B3] group-hover:text-indigo-400" />
          </button>
        ))}
      </div>
    </div>
  );
}

/* -----------------------------------------------------------
   MESSAGE BUBBLE COMPONENT
----------------------------------------------------------- */
function MessageBubble({ msg, onSuggestionClick }: { msg: Message; onSuggestionClick: (q: string) => void }) {
  const isUser = msg.role === 'user';
  
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} group`}>
      {/* Avatar */}
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
        isUser 
          ? 'bg-gradient-to-br from-cyan-600 to-cyan-500 shadow-lg' 
          : 'bg-gradient-to-br from-cyan-600 to-purple-700 shadow-lg'
      }`}>
        {isUser ? (
          <span className="text-xs font-bold text-[#F8FAFC]">IO</span>
        ) : (
          <Shield className="w-4 h-4 text-[#F8FAFC]" />
        )}
      </div>
      
      {/* Message Content */}
      <div className={`max-w-[85%] rounded-lg ${
        isUser
          ? 'bg-[#00B8FF]/10 border border-cyan-500/20'
          : 'bg-[#121B2A] border border-[#223047]'
      }`}>
        <div className="px-4 py-3">
          {isUser ? (
            <p className="text-sm text-[#F8FAFC] leading-relaxed">{msg.content}</p>
          ) : (
            <div className="prose prose-sm max-w-none prose-slate prose-invert">
              <ReactMarkdown
                components={{
                  h2: ({node, ...props}) => <h2 className="text-base font-bold text-slate-100 mt-4 mb-2" {...props} />,
                  h3: ({node, ...props}) => <h3 className="text-sm font-semibold text-[#F8FAFC] mt-3 mb-1.5" {...props} />,
                  p: ({node, ...props}) => <p className="text-sm text-[#F8FAFC] leading-relaxed mb-2" {...props} />,
                  ul: ({node, ...props}) => <ul className="list-disc list-inside space-y-1 text-sm text-[#F8FAFC] mb-2" {...props} />,
                  ol: ({node, ...props}) => <ol className="list-decimal list-inside space-y-1 text-sm text-[#F8FAFC] mb-2" {...props} />,
                  li: ({node, ...props}) => <li className="text-sm text-[#F8FAFC]" {...props} />,
                  strong: ({node, ...props}) => <strong className="font-semibold text-slate-100" {...props} />,
                  code: ({node, inline, ...props}: any) => 
                    inline 
                      ? <code className="px-1.5 py-0.5 rounded bg-[#070B14] text-cyan-300 text-xs font-mono" {...props} />
                      : <code className="block px-3 py-2 rounded-lg bg-[#070B14] text-cyan-300 text-xs font-mono overflow-x-auto" {...props} />,
                  blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-cyan-500 pl-3 italic text-[#98A2B3]" {...props} />,
                }}
              >
                {msg.content}
              </ReactMarkdown>
            </div>
          )}
        </div>
        
        {/* Footer with metadata and actions */}
        <div className={`px-4 pb-3 flex items-center ${isUser ? 'justify-end' : 'justify-between'} gap-3`}>
          {msg.created_at && (
            <span className="text-[10px] text-[#98A2B3]">
              {new Date(msg.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          {!isUser && <CopyButton text={msg.content} />}
        </div>
        
        {/* Source References (Assistant only) */}
        {!isUser && msg.sources && msg.sources.length > 0 && (
          <div className="px-4 pb-3">
            <SourceReferences sources={msg.sources} />
          </div>
        )}
        
        {/* Suggested Follow-ups (Assistant only) */}
        {!isUser && msg.suggestions && msg.suggestions.length > 0 && (
          <div className="px-4 pb-3">
            <SuggestedFollowUps suggestions={msg.suggestions} onSelect={onSuggestionClick} />
          </div>
        )}
      </div>
    </div>
  );
}

/* -----------------------------------------------------------
   AI THINKING INDICATOR
----------------------------------------------------------- */
function AIThinkingIndicator({ status }: { status: string }) {
  return (
    <div className="flex gap-3">
      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-600 to-purple-700 flex items-center justify-center shrink-0 shadow-lg">
        <Shield className="w-4 h-4 text-[#F8FAFC] animate-pulse" />
      </div>
      <div className="bg-[#121B2A] border border-[#223047] rounded-lg px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{animationDelay:'0ms'}} />
            <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{animationDelay:'150ms'}} />
            <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{animationDelay:'300ms'}} />
          </div>
          <span className="text-xs text-[#98A2B3]">{status}</span>
        </div>
      </div>
    </div>
  );
}

/* -----------------------------------------------------------
   MAIN COMPONENT
----------------------------------------------------------- */
export default function EnterpriseCrimeGPT() {
  const navigate = useNavigate();
  
  // State
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [showCaseDropdown, setShowCaseDropdown] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [aiStatus, setAiStatus] = useState('');
  const [statusIndex, setStatusIndex] = useState(0);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // Load cases
  useEffect(() => {
    api.get('/cases')
      .then(res => {
        setCases(res.data || []);
        if (res.data?.length > 0 && !selectedCase) {
          setSelectedCase(res.data[0]);
        }
      })
      .catch(() => {});
  }, []);
  
  // Load chat history when case changes
  useEffect(() => {
    if (!selectedCase) return;
    
    setLoadingHistory(true);
    setMessages([]);
    
    api.get(`/chat/${selectedCase.case_id}/history`)
      .then(res => {
        const hist = (res.data || []).map((m: any, i: number) => {
          const sources = detectSources(m.content);
          const suggestions = generateSuggestions(m.role, m.content);
          return {
            id: `hist-${i}`,
            ...m,
            sources,
            suggestions,
          };
        });
        setMessages(hist);
      })
      .catch(() => {})
      .finally(() => setLoadingHistory(false));
  }, [selectedCase]);
  
  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);
  
  // AI status rotation
  useEffect(() => {
    if (!loading) return;
    
    setStatusIndex(0);
    const interval = setInterval(() => {
      setStatusIndex(prev => (prev + 1) % AI_STATUS_MESSAGES.length);
    }, 1500);
    
    return () => clearInterval(interval);
  }, [loading]);
  
  useEffect(() => {
    if (loading) {
      setAiStatus(AI_STATUS_MESSAGES[statusIndex]);
    }
  }, [loading, statusIndex]);
  
  // Send message
  const sendMessage = useCallback(async (text?: string) => {
    const q = (text || input).trim();
    if (!q || !selectedCase || loading) return;
    
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: q,
      created_at: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setAiStatus(AI_STATUS_MESSAGES[0]);
    
    try {
      const res = await api.post('/chat', {
        case_id: selectedCase.case_id,
        question: q,
      });
      
      const sources = detectSources(res.data.answer);
      const suggestions = generateSuggestions('assistant', res.data.answer);
      
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res.data.answer,
        created_at: new Date().toISOString(),
        sources,
        suggestions,
      };
      
      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      const errMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `?? Error: ${err?.response?.data?.detail || 'Failed to get response. Please try again.'}`,
        created_at: new Date().toISOString(),
        sources: [],
        suggestions: ['Try rephrasing your question', 'Check case data availability'],
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
      setAiStatus('');
      inputRef.current?.focus();
    }
  }, [input, selectedCase, loading]);
  
  // Handle keyboard
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  
  // Clear history
  const clearHistory = async () => {
    if (!selectedCase || clearing) return;
    
    setClearing(true);
    try {
      await api.delete(`/chat/${selectedCase.case_id}/history`);
      setMessages([]);
    } catch {
      // Silent fail
    } finally {
      setClearing(false);
    }
  };
  
  // Export conversation
  const exportConversation = () => {
    if (messages.length === 0) return;
    
    const content = messages
      .map(m => `[${m.role.toUpperCase()}] (${m.created_at ? new Date(m.created_at).toLocaleString() : 'N/A'})\n${m.content}\n`)
      .join('\n---\n\n');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CrimeGPT_${selectedCase?.case_number || 'conversation'}_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  const isEmpty = messages.length === 0 && !loadingHistory;

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] max-h-[900px] bg-[#080e1c] rounded-lg border border-[#223047] overflow-hidden">
      
      {/* -----------------------------------------------------------
          HEADER
      ----------------------------------------------------------- */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#223047] bg-[#0d1525] shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-600 to-purple-700 flex items-center justify-center shadow-lg">
            <Shield className="w-5 h-5 text-[#F8FAFC]" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              CrimeGPT
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#00B8FF]/10 text-[#00B8FF] border border-cyan-500/20 font-semibold">
                AI ASSISTANT
              </span>
            </h1>
            <p className="text-[10px] text-[#F8FAFC]0">Enterprise Investigation Intelligence</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Case Selector */}
          <div className="relative">
            <button
              onClick={() => setShowCaseDropdown(v => !v)}
              className="flex items-center gap-2 px-3 py-2 bg-[#121B2A] border border-[#223047] rounded-lg text-sm text-[#F8FAFC] hover:border-white/[0.12] transition-colors max-w-[280px]"
            >
              {selectedCase ? (
                <>
                  <span className="font-mono text-xs text-[#00B8FF] shrink-0">
                    {selectedCase.case_number || selectedCase.case_id.slice(0, 8)}
                  </span>
                  <span className="truncate text-xs">{selectedCase.title}</span>
                </>
              ) : (
                <span className="text-[#F8FAFC]0">Select case�</span>
              )}
              <ChevronDown className="w-3.5 h-3.5 text-[#F8FAFC]0 shrink-0" />
            </button>
            
            {showCaseDropdown && (
              <div className="absolute right-0 top-full mt-1 w-96 bg-[#121B2A] border border-[#223047] rounded-lg shadow-2xl z-50 max-h-80 overflow-y-auto">
                {cases.map(c => (
                  <button
                    key={c.case_id}
                    onClick={() => {
                      setSelectedCase(c);
                      setShowCaseDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-3 hover:bg-[#070B14]/50 transition-colors border-b border-[#223047]/50 last:border-0 ${
                      selectedCase?.case_id === c.case_id ? 'bg-indigo-500/10' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-[#00B8FF]">
                        {c.case_number || c.case_id.slice(0, 8)}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold ${
                        c.status === 'Open'
                          ? 'bg-[#00B8FF]/20 text-[#00B8FF] border border-cyan-500/30'
                          : 'bg-slate-700/50 text-[#98A2B3]'
                      }`}>
                        {c.status}
                      </span>
                    </div>
                    <p className="text-xs text-[#F8FAFC] truncate">{c.title}</p>
                    <p className="text-[10px] text-[#F8FAFC]0 mt-0.5">{c.fraud_type}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Actions */}
          {selectedCase && (
            <button
              onClick={() => navigate(`/cases/${selectedCase.case_id}`)}
              className="px-3 py-2 text-xs text-[#00B8FF] border border-[#223047] rounded-lg hover:bg-[#29C5FF]/10 transition-colors"
            >
              Open Case
            </button>
          )}
          
          <button
            onClick={exportConversation}
            disabled={messages.length === 0}
            className="p-2 text-[#F8FAFC]0 hover:text-[#00D084] border border-[#223047] rounded-lg hover:border-emerald-500/30 transition-colors disabled:opacity-30"
            title="Export conversation"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          
          <button
            onClick={clearHistory}
            disabled={clearing || messages.length === 0}
            className="p-2 text-[#F8FAFC]0 hover:text-[#FF4D6D] border border-[#223047] rounded-lg hover:border-red-500/30 transition-colors disabled:opacity-30"
            title="Clear history"
          >
            {clearing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* -----------------------------------------------------------
          QUICK PROMPTS PANEL (when no messages)
      ----------------------------------------------------------- */}
      {isEmpty && selectedCase && (
        <div className="px-5 py-3 border-b border-[#223047]/50 bg-[#121B2A]">
          <p className="text-[10px] text-[#98A2B3] uppercase tracking-wider mb-2">Quick Prompts</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            {QUICK_PROMPTS.map(prompt => {
              const Icon = prompt.icon;
              return (
                <button
                  key={prompt.id}
                  onClick={() => sendMessage(prompt.prompt)}
                  disabled={loading}
                  className="flex flex-col items-center justify-center p-3 bg-[#0d1525] border border-[#223047] rounded-lg hover:border-cyan-500/40 hover:bg-[#29C5FF]/5 transition-all disabled:opacity-40 group"
                >
                  <Icon className="w-4 h-4 text-[#F8FAFC]0 group-hover:text-[#00B8FF] mb-1.5" />
                  <span className="text-[10px] text-[#98A2B3] group-hover:text-[#F8FAFC] text-center leading-tight">
                    {prompt.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
      
      {/* -----------------------------------------------------------
          MESSAGES AREA
      ----------------------------------------------------------- */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {loadingHistory ? (
          <div className="flex flex-col items-center justify-center h-full text-[#F8FAFC]0">
            <Loader2 className="w-6 h-6 animate-spin mb-2" />
            <p className="text-sm">Loading conversation history�</p>
          </div>
        ) : isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center px-4">
            <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-cyan-600 to-purple-700 flex items-center justify-center mb-4 shadow-xl">
              <Shield className="w-10 h-10 text-[#F8FAFC]" />
            </div>
            <h2 className="text-lg font-bold text-[#F8FAFC] mb-2">CrimeGPT Investigation Assistant</h2>
            <p className="text-sm text-[#F8FAFC]0 mb-6 max-w-md leading-relaxed">
              {selectedCase
                ? `Ask anything about ${selectedCase.case_number || selectedCase.case_id.slice(0, 8)} � entities, recovery analysis, investigation steps, legal actions, or report generation.`
                : 'Select a case above to start your investigation with AI assistance.'}
            </p>
            {selectedCase && (
              <div className="flex items-center gap-2 text-xs text-[#98A2B3]">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>All responses are based on verified case data and evidence</span>
              </div>
            )}
          </div>
        ) : (
          <>
            {messages.map(msg => (
              <MessageBubble
                key={msg.id}
                msg={msg}
                onSuggestionClick={sendMessage}
              />
            ))}
            
            {loading && <AIThinkingIndicator status={aiStatus} />}
          </>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* -----------------------------------------------------------
          QUICK ACTIONS BAR (when messages exist)
      ----------------------------------------------------------- */}
      {!isEmpty && selectedCase && (
        <div className="px-5 py-2 border-t border-[#223047]/50 bg-[#121B2A] overflow-x-auto shrink-0">
          <div className="flex gap-2 min-w-max">
            {QUICK_PROMPTS.slice(0, 4).map(prompt => (
              <button
                key={prompt.id}
                onClick={() => sendMessage(prompt.prompt)}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0d1525] border border-[#223047] rounded-lg text-xs font-medium text-[#98A2B3] hover:text-[#F8FAFC] hover:border-cyan-500/40 hover:bg-[#29C5FF]/5 transition-all disabled:opacity-40 whitespace-nowrap"
              >
                {React.createElement(prompt.icon, { className: 'w-3 h-3' })}
                {prompt.label}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* -----------------------------------------------------------
          INPUT AREA
      ----------------------------------------------------------- */}
      <div className="px-5 py-4 border-t border-[#223047] bg-[#0d1525] shrink-0">
        <div className={`flex items-end gap-3 bg-[#121B2A] border rounded-lg px-4 py-3 transition-colors ${
          selectedCase
            ? 'border-[#223047] focus-within:border-cyan-500/50 focus-within:shadow-lg focus-within:shadow-cyan-500/10'
            : 'border-[#223047] opacity-50'
        }`}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!selectedCase || loading}
            placeholder={
              selectedCase
                ? 'Ask CrimeGPT anything about this case� (Enter to send, Shift+Enter for new line)'
                : 'Select a case to start investigating�'
            }
            rows={1}
            className="flex-1 bg-transparent text-sm text-[#F8FAFC] placeholder-slate-500 resize-none focus:outline-none max-h-32"
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
            className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-600 to-purple-700 hover:from-cyan-500 hover:to-purple-600 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all shadow-lg disabled:shadow-none shrink-0"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 text-[#F8FAFC] animate-spin" />
            ) : (
              <Send className="w-4 h-4 text-[#F8FAFC]" />
            )}
          </button>
        </div>
        
        <div className="flex items-center justify-center gap-2 mt-2 text-[10px] text-[#98A2B3]">
          <Shield className="w-3 h-3" />
          <span>CrimeGPT uses only verified case data. All responses are traceable to evidence sources.</span>
        </div>
      </div>
    </div>
  );
}
