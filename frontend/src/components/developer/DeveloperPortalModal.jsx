// frontend/src/components/developer/DeveloperPortalModal.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Code2,
  Key,
  Copy,
  Check,
  RefreshCw,
  Eye,
  EyeOff,
  Terminal,
  Activity,
  ShieldCheck,
  Zap,
  Globe,
  Play,
  ChevronRight,
  ChevronDown,
  Cpu
} from 'lucide-react';
import Modal from '../core/Modal.jsx';
import Button from '../core/Button.jsx';
import api from '../../services/api';
import toast from 'react-hot-toast';

const PUBLIC_NAT_API_BASE = 'https://61.0.228.124/api/v1';

export default function DeveloperPortalModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('keys'); // 'keys' | 'code' | 'playground' | 'logs'
  const [endpointMode, setEndpointMode] = useState(() => (typeof window !== 'undefined' && window.location.hostname === '61.0.228.124' ? 'public' : 'origin')); // 'public' | 'origin'
  const [keyStatus, setKeyStatus] = useState(null);
  const [fullKey, setFullKey] = useState(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [codeLanguage, setCodeLanguage] = useState('python_openai');

  // Playground state
  const [pgPrompt, setPgPrompt] = useState('Explain how a Kalman Filter works in 3 concise bullet points.');
  const [pgSystem, setPgSystem] = useState('You are an expert engineering & AI assistant.');
  const [pgRunning, setPgRunning] = useState(false);
  const [pgResult, setPgResult] = useState(null);

  // Logs state
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedLogId, setExpandedLogId] = useState(null);

  const selectedApiBase = endpointMode === 'public'
    ? PUBLIC_NAT_API_BASE
    : `${window.location.origin}/api/v1`;

  const fetchKeyStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.getDeveloperKeyStatus();
      setKeyStatus(data);
    } catch (err) {
      toast.error('Could not load developer API status.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchLogs = useCallback(async (targetPage = 1) => {
    setLogsLoading(true);
    try {
      const data = await api.getDeveloperLogs(targetPage, 15);
      setLogs(data.logs || []);
      setPage(data.page || 1);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      toast.error('Could not fetch API request logs.');
    } finally {
      setLogsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchKeyStatus();
      if (activeTab === 'logs') fetchLogs(1);
    }
  }, [isOpen, activeTab, fetchKeyStatus, fetchLogs]);

  const handleGenerateKey = async () => {
    setIsRefreshing(true);
    try {
      const res = await api.generateDeveloperKey();
      setFullKey(res.apiKey);
      setIsRevealed(true);
      toast.success('Developer API Key generated!');
      fetchKeyStatus();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate key.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRefreshKey = async () => {
    if (!window.confirm('Are you sure you want to refresh your Developer API Key? Any existing applications or scripts using your current key will immediately be disconnected.')) {
      return;
    }
    setIsRefreshing(true);
    try {
      const res = await api.refreshDeveloperKey();
      setFullKey(res.apiKey);
      setIsRevealed(true);
      toast.success('New API Key generated! Old key revoked.');
      fetchKeyStatus();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to refresh key.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRevealKey = async () => {
    if (isRevealed && fullKey) {
      setIsRevealed(false);
      return;
    }
    if (fullKey) {
      setIsRevealed(true);
      return;
    }
    try {
      const res = await api.revealDeveloperKey();
      setFullKey(res.apiKey);
      setIsRevealed(true);
    } catch (err) {
      toast.error('Could not reveal API key.');
    }
  };

  const handleCopyKey = () => {
    const keyToCopy = fullKey || keyStatus?.maskedKey;
    if (!keyToCopy) return;
    navigator.clipboard.writeText(fullKey || keyToCopy);
    setCopiedKey(true);
    toast.success('API Key copied to clipboard!');
    setTimeout(() => setCopiedKey(false), 2500);
  };

  const handleRunPlayground = async () => {
    setPgRunning(true);
    setPgResult(null);
    const startTs = performance.now();
    try {
      let keyToUse = fullKey;
      if (!keyToUse) {
        const revealed = await api.revealDeveloperKey();
        keyToUse = revealed.apiKey;
        setFullKey(keyToUse);
      }
      if (!keyToUse) {
        toast.error('Please generate an API Key in the first tab before running the playground.');
        setPgRunning(false);
        return;
      }

      const resp = await fetch(`${window.location.origin}/api/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${keyToUse}`
        },
        body: JSON.stringify({
          model: 'imentor-default',
          messages: [
            { role: 'system', content: pgSystem },
            { role: 'user', content: pgPrompt }
          ],
          temperature: 0.6,
          max_tokens: 450,
          stream: false
        })
      });
      const data = await resp.json();
      const latency = Math.round(performance.now() - startTs);
      setPgResult({
        status: resp.status,
        latency,
        model: data.model || 'Qwen/Qwen3-8B-AWQ',
        content: data.choices?.[0]?.message?.content || JSON.stringify(data, null, 2),
        usage: data.usage || {}
      });
      fetchKeyStatus();
    } catch (err) {
      toast.error('Playground request failed: ' + err.message);
    } finally {
      setPgRunning(false);
    }
  };

  const displayKey = isRevealed && fullKey ? fullKey : (keyStatus?.maskedKey || 'No active key generated');
  const activeKeyForCode = fullKey || (keyStatus?.hasKey ? keyStatus.maskedKey : 'imk_live_YOUR_API_KEY_HERE');

  const getCodeSnippet = () => {
    switch (codeLanguage) {
      case 'python_openai':
        return `# Install: pip install openai httpx
from openai import OpenAI
import httpx

# Initialize iMentor client (served by local Qwen/Qwen3-8B-AWQ + AGY Ultra fallback)
client = OpenAI(
    base_url="${selectedApiBase}",
    api_key="${activeKeyForCode}",
    http_client=httpx.Client(verify=False)  # Required if using self-signed IP TLS cert
)

print("Connecting to iMentor Qwen3-8B AI Engine (Streaming)...\\n")

response = client.chat.completions.create(
    model="imentor-default",
    messages=[
        {"role": "system", "content": "You are an expert AI engineering assistant."},
        {"role": "user", "content": "Explain how PID Controllers work with a Python code example."}
    ],
    temperature=0.7,
    stream=True
)

for chunk in response:
    content = chunk.choices[0].delta.content or ""
    print(content, end="", flush=True)
print()
`;

      case 'python_tools':
        return `# iMentor Autonomous Tool Calling in Python (Qwen/Qwen3-8B-AWQ)
from openai import OpenAI
import httpx

client = OpenAI(
    base_url="${selectedApiBase}",
    api_key="${activeKeyForCode}",
    http_client=httpx.Client(verify=False)
)

tools = [
    {
        "type": "function",
        "function": {
            "name": "calculate_impedance",
            "description": "Calculates AC impedance for RLC circuit components",
            "parameters": {
                "type": "object",
                "properties": {
                    "resistance": {"type": "number", "description": "Resistance in Ohms"},
                    "capacitance": {"type": "number", "description": "Capacitance in Farads"},
                    "frequency": {"type": "number", "description": "Frequency in Hertz"}
                },
                "required": ["resistance", "capacitance", "frequency"]
            }
        }
    }
]

response = client.chat.completions.create(
    model="imentor-default",
    messages=[
        {"role": "user", "content": "Calculate impedance for R=100 ohms, C=10uF at 60Hz"}
    ],
    tools=tools,
    tool_choice="auto"
)

message = response.choices[0].message
if message.tool_calls:
    for tool_call in message.tool_calls:
        print(f"Tool Invoked: {tool_call.function.name}")
        print(f"Arguments: {tool_call.function.arguments}")
else:
    print(message.content)
`;

      case 'java':
        return `// Java 11+ Native HttpClient Example
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class iMentorApp {
    private static final String API_URL = "${selectedApiBase}/chat/completions";
    private static final String API_KEY = "${activeKeyForCode}";

    public static void main(String[] args) throws Exception {
        HttpClient client = HttpClient.newHttpClient();

        String jsonPayload = """
        {
          "model": "imentor-default",
          "messages": [
            {"role": "system", "content": "You are an elite Java and Algorithms tutor."},
            {"role": "user", "content": "Write a thread-safe Singleton class in Java."}
          ],
          "temperature": 0.5,
          "stream": false
        }
        """;

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(API_URL))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + API_KEY)
                .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        
        System.out.println("HTTP Status: " + response.statusCode());
        System.out.println("Response Payload:\\n" + response.body());
    }
}
`;

      case 'claude':
        return `# Claude / Anthropic Native API Drop-in
curl -k -X POST "${selectedApiBase}/messages" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${activeKeyForCode}" \\
  -H "anthropic-version: 2023-06-01" \\
  -d '{
    "model": "claude-3-5-sonnet-20241022",
    "max_tokens": 1024,
    "system": "You are iMentor AI, providing concise scientific answers.",
    "messages": [
      {"role": "user", "content": "What is the physical interpretation of Maxwell equations?"}
    ],
    "stream": true
  }'
`;

      case 'curl':
      default:
        return `# Direct cURL Request to iMentor API (-k allows self-signed IP certificate)
curl -k -X POST "${selectedApiBase}/chat/completions" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${activeKeyForCode}" \\
  -H "X-iMentor-Course-Context: Power Systems" \\
  -d '{
    "model": "imentor-default",
    "messages": [
      {"role": "system", "content": "You are an expert tutor."},
      {"role": "user", "content": "Explain Newton-Raphson load flow method in 3 points."}
    ],
    "temperature": 0.7,
    "max_tokens": 800,
    "stream": false
  }'
`;
    }
  };

  const handleCopySnippet = () => {
    navigator.clipboard.writeText(getCodeSnippet());
    setCopiedSnippet(true);
    toast.success('Code snippet copied!');
    setTimeout(() => setCopiedSnippet(false), 2500);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Code2 size={18} />
          </div>
          <div>
            <div className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
              Student Developer Platform & API Hub
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono">
                Qwen3-8B + AGY Ultra
              </span>
            </div>
            <div className="text-[11px] text-gray-400 font-normal">
              Build your own Python, Java, or Mobile apps powered by local Qwen/Qwen3-8B-AWQ & iMentor RAG
            </div>
          </div>
        </div>
      }
      maxWidth="max-w-4xl"
    >
      <div className="space-y-4">
        {/* Navigation Tabs + Endpoint Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--vs-border)] pb-2">
          <div className="flex items-center gap-1.5">
            {[
              { id: 'keys', label: 'API Key & Quota', icon: Key },
              { id: 'code', label: 'SDK & Code Generator', icon: Terminal },
              { id: 'playground', label: 'Live API Playground', icon: Play },
              { id: 'logs', label: 'Live Telemetry & Logs', icon: Activity },
            ].map(t => {
              const Icon = t.icon;
              const active = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setActiveTab(t.id);
                    if (t.id === 'logs') fetchLogs(1);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all ${
                    active
                      ? 'bg-[var(--vs-active)] text-white border border-[var(--vs-border-hi)]'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-[var(--vs-hover)]'
                  }`}
                >
                  <Icon size={14} />
                  {t.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1 bg-[var(--vs-panel)] p-1 rounded border border-[var(--vs-border)] text-[11px]">
            <button
              type="button"
              onClick={() => setEndpointMode('public')}
              className={`px-2 py-0.5 rounded font-mono transition-all ${
                endpointMode === 'public' ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
              title="NATted Public IP for external access"
            >
              Public IP (61.0.228.124)
            </button>
            <button
              type="button"
              onClick={() => setEndpointMode('origin')}
              className={`px-2 py-0.5 rounded font-mono transition-all ${
                endpointMode === 'origin' ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
              title="Current LAN / Browser Origin"
            >
              LAN / Current Host
            </button>
          </div>
        </div>

        {/* TAB 1: API Key & Management */}
        {activeTab === 'keys' && (
          <div className="space-y-4 animate-fade-in">
            <div className="p-4 rounded-md border border-[var(--vs-border-hi)] bg-[var(--vs-panel)] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-emerald-400" />
                  <span className="text-xs font-semibold text-gray-200">Your Developer API Key</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-medium ${
                    keyStatus?.hasKey
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                  }`}>
                    {keyStatus?.hasKey ? 'ACTIVE' : 'NO KEY GENERATED'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1 font-mono text-xs px-3 py-2 rounded bg-[var(--vs-bg)] border border-[var(--vs-border)] text-emerald-300 select-all overflow-x-auto whitespace-nowrap">
                  {displayKey}
                </div>
                {keyStatus?.hasKey && (
                  <button
                    onClick={handleRevealKey}
                    title={isRevealed ? "Hide API key" : "Reveal full API key"}
                    className="p-2 rounded bg-[var(--vs-surface)] hover:bg-[var(--vs-hover)] border border-[var(--vs-border)] text-gray-300 transition-colors"
                  >
                    {isRevealed ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                )}
                {keyStatus?.hasKey && (
                  <button
                    onClick={handleCopyKey}
                    title="Copy API key"
                    className="flex items-center gap-1 px-3 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors"
                  >
                    {copiedKey ? <Check size={14} /> : <Copy size={14} />}
                    {copiedKey ? 'Copied' : 'Copy'}
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[var(--vs-border)] text-xs">
                <div className="text-gray-400">
                  {keyStatus?.createdAt && (
                    <span>Created: {new Date(keyStatus.createdAt).toLocaleDateString()}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {!keyStatus?.hasKey ? (
                    <Button
                      onClick={handleGenerateKey}
                      isLoading={isRefreshing}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-3 py-1.5"
                    >
                      Generate API Key
                    </Button>
                  ) : (
                    <button
                      onClick={handleRefreshKey}
                      disabled={isRefreshing}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[var(--vs-surface)] hover:bg-red-500/20 text-gray-300 hover:text-red-300 border border-[var(--vs-border)] hover:border-red-500/40 text-xs transition-all"
                    >
                      <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
                      Refresh / Rotate Key
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-md bg-[var(--vs-panel)] border border-[var(--vs-border)] space-y-1">
                <div className="text-[11px] text-gray-400 flex items-center gap-1.5">
                  <Globe size={13} className="text-blue-400" />
                  Selected Endpoint
                </div>
                <div className="font-mono text-xs text-white truncate" title={selectedApiBase}>
                  {selectedApiBase}
                </div>
              </div>

              <div className="p-3 rounded-md bg-[var(--vs-panel)] border border-[var(--vs-border)] space-y-1">
                <div className="text-[11px] text-gray-400 flex items-center gap-1.5">
                  <Cpu size={13} className="text-purple-400" />
                  Active AI Engine
                </div>
                <div className="text-xs font-semibold text-white">
                  Qwen/Qwen3-8B-AWQ (SGLang)
                </div>
              </div>

              <div className="p-3 rounded-md bg-[var(--vs-panel)] border border-[var(--vs-border)] space-y-1">
                <div className="text-[11px] text-gray-400 flex items-center gap-1.5">
                  <Activity size={13} className="text-emerald-400" />
                  Lifetime API Requests
                </div>
                <div className="text-xs font-semibold text-emerald-400">
                  {keyStatus?.totalApiRequests?.toLocaleString() || 0} calls ({keyStatus?.apiRateLimitTier === 'unlimited' ? '500/min' : '60/min'})
                </div>
              </div>
            </div>

            <div className="p-3 rounded-md bg-[var(--vs-panel)] border border-[var(--vs-border)] text-xs space-y-2">
              <div className="font-semibold text-gray-300">Supported Developer Endpoints:</div>
              <ul className="space-y-1.5 font-mono text-[11px] text-gray-400">
                <li className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">POST</span>
                  <span className="text-white">/api/v1/chat/completions</span>
                  <span className="text-gray-500">— OpenAI SDK, Python, Java, cURL, Tools, SSE streaming</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold">POST</span>
                  <span className="text-white">/api/v1/messages</span>
                  <span className="text-gray-500">— Anthropic / Claude SDK compatible messaging endpoint</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold">GET</span>
                  <span className="text-white">/api/v1/models</span>
                  <span className="text-gray-500">— List available iMentor specialized tutor models</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* TAB 2: Interactive Code Generator */}
        {activeTab === 'code' && (
          <div className="space-y-3 animate-fade-in">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                {[
                  { id: 'python_openai', label: 'Python (OpenAI SDK)' },
                  { id: 'python_tools',  label: 'Python (Tool Calling)' },
                  { id: 'java',          label: 'Java (HttpClient)' },
                  { id: 'claude',        label: 'Claude SDK' },
                  { id: 'curl',          label: 'cURL' },
                ].map(l => (
                  <button
                    key={l.id}
                    onClick={() => setCodeLanguage(l.id)}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                      codeLanguage === l.id
                        ? 'bg-[var(--vs-active)] text-white border border-[var(--vs-border-hi)]'
                        : 'text-gray-400 hover:text-gray-200 hover:bg-[var(--vs-hover)]'
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>

              <button
                onClick={handleCopySnippet}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[var(--vs-surface)] hover:bg-[var(--vs-hover)] border border-[var(--vs-border)] text-xs text-emerald-400 font-medium transition-colors"
              >
                {copiedSnippet ? <Check size={14} /> : <Copy size={14} />}
                {copiedSnippet ? 'Copied Snippet' : 'Copy Code'}
              </button>
            </div>

            <div className="relative rounded-md border border-[var(--vs-border-hi)] bg-[#0f141c] overflow-hidden">
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-[var(--vs-border)] bg-[var(--vs-panel)] text-[11px] text-gray-400">
                <span className="font-mono">{codeLanguage.toUpperCase()} SNIPPET ({selectedApiBase})</span>
                <span className="text-emerald-400 font-mono">Ready to Run</span>
              </div>
              <pre className="p-4 font-mono text-xs text-gray-200 overflow-x-auto leading-relaxed max-h-[380px] custom-scrollbar">
                <code>{getCodeSnippet()}</code>
              </pre>
            </div>
          </div>
        )}

        {/* TAB 3: Live API Playground */}
        {activeTab === 'playground' && (
          <div className="space-y-3 animate-fade-in">
            <div className="p-4 rounded-md border border-[var(--vs-border-hi)] bg-[var(--vs-panel)] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white flex items-center gap-2">
                  <Zap size={14} className="text-emerald-400" />
                  Test Your API Key Live against Qwen/Qwen3-8B-AWQ
                </span>
                <span className="text-[11px] font-mono text-gray-400">
                  POST /api/v1/chat/completions
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2.5 text-xs">
                <div>
                  <label className="text-[11px] text-gray-400 block mb-1">System Prompt:</label>
                  <input
                    type="text"
                    value={pgSystem}
                    onChange={e => setPgSystem(e.target.value)}
                    className="w-full px-3 py-1.5 rounded bg-[var(--vs-bg)] border border-[var(--vs-border)] text-gray-200 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-gray-400 block mb-1">User Message:</label>
                  <textarea
                    rows={2}
                    value={pgPrompt}
                    onChange={e => setPgPrompt(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-[var(--vs-bg)] border border-[var(--vs-border)] text-gray-200 font-mono text-xs resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleRunPlayground}
                  isLoading={pgRunning}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-4 py-1.5"
                  leftIcon={<Play size={13} />}
                >
                  Send Live API Request
                </Button>
              </div>
            </div>

            {pgResult && (
              <div className="p-4 rounded-md border border-emerald-500/30 bg-[#0b1017] space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono border-b border-white/10 pb-2">
                  <span className="text-emerald-400 font-bold">HTTP {pgResult.status} OK</span>
                  <span className="text-blue-300">Model: {pgResult.model}</span>
                  <span className="text-amber-300">Latency: {pgResult.latency} ms</span>
                  <span className="text-gray-400">Tokens: {pgResult.usage?.total_tokens || 'N/A'}</span>
                </div>
                <pre className="text-xs text-gray-200 whitespace-pre-wrap font-mono max-h-56 overflow-y-auto leading-relaxed">
                  {pgResult.content}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: Telemetry & Audit Logs */}
        {activeTab === 'logs' && (
          <div className="space-y-3 animate-fade-in">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">
                Showing recent requests dispatched through your API Key with device telemetry:
              </span>
              <button
                onClick={() => fetchLogs(page)}
                disabled={logsLoading}
                className="flex items-center gap-1 text-emerald-400 hover:underline"
              >
                <RefreshCw size={12} className={logsLoading ? 'animate-spin' : ''} />
                Refresh Logs
              </button>
            </div>

            <div className="border border-[var(--vs-border)] rounded-md bg-[var(--vs-panel)] overflow-hidden">
              <div className="overflow-x-auto max-h-[360px] custom-scrollbar">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--vs-border)] bg-[var(--vs-surface)] text-[11px] text-gray-400 font-mono">
                      <th className="p-2.5">STATUS</th>
                      <th className="p-2.5">ENDPOINT</th>
                      <th className="p-2.5">LATENCY</th>
                      <th className="p-2.5">TOKENS</th>
                      <th className="p-2.5">DEVICE / IP</th>
                      <th className="p-2.5">TIMESTAMP</th>
                      <th className="p-2.5">INSPECT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--vs-border)] font-mono text-[11px]">
                    {logs.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-gray-500 font-sans">
                          {logsLoading ? 'Loading request history...' : 'No API calls recorded yet. Try running a request in the Live API Playground tab!'}
                        </td>
                      </tr>
                    ) : (
                      logs.map(item => {
                        const isSuccess = item.statusCode >= 200 && item.statusCode < 300;
                        const isExpanded = expandedLogId === item._id;
                        return (
                          <React.Fragment key={item._id}>
                            <tr
                              onClick={() => setExpandedLogId(isExpanded ? null : item._id)}
                              className="hover:bg-[var(--vs-hover)] cursor-pointer transition-colors"
                            >
                              <td className="p-2.5">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  isSuccess
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : 'bg-red-500/20 text-red-300'
                                }`}>
                                  {item.statusCode}
                                </span>
                              </td>
                              <td className="p-2.5 text-white font-medium">
                                {item.endpoint}
                              </td>
                              <td className="p-2.5 text-gray-300">
                                {item.latencyMs}ms
                              </td>
                              <td className="p-2.5 text-gray-400">
                                {item.tokenUsage?.totalTokens || 0}
                              </td>
                              <td className="p-2.5 text-gray-300">
                                <span title={item.userAgent}>
                                  {item.device?.browser || 'Client'} ({item.clientIp})
                                </span>
                              </td>
                              <td className="p-2.5 text-gray-500">
                                {new Date(item.timestamp).toLocaleTimeString()}
                              </td>
                              <td className="p-2.5 text-emerald-400">
                                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                              </td>
                            </tr>
                            
                            {isExpanded && (
                              <tr className="bg-[#0b0e14]">
                                <td colSpan={7} className="p-3">
                                  <div className="space-y-2 text-xs font-sans">
                                    <div className="font-semibold text-gray-300 text-[11px]">Request & Response Payload Audit:</div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[10px]">
                                      <div className="p-2 rounded bg-[var(--vs-panel)] border border-[var(--vs-border)] overflow-x-auto max-h-48">
                                        <div className="text-gray-400 mb-1 font-sans font-bold">Request Payload:</div>
                                        <pre className="text-gray-300">{JSON.stringify(item.requestPayload, null, 2)}</pre>
                                      </div>
                                      <div className="p-2 rounded bg-[var(--vs-panel)] border border-[var(--vs-border)] overflow-x-auto max-h-48">
                                        <div className="text-gray-400 mb-1 font-sans font-bold">Response Payload:</div>
                                        <pre className="text-emerald-300">{JSON.stringify(item.responsePayload, null, 2)}</pre>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="p-2 border-t border-[var(--vs-border)] flex items-center justify-between text-xs text-gray-400">
                  <span>Page {page} of {totalPages}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => fetchLogs(page - 1)}
                      disabled={page <= 1 || logsLoading}
                      className="px-2 py-1 rounded bg-[var(--vs-surface)] disabled:opacity-40"
                    >
                      Prev
                    </button>
                    <button
                      onClick={() => fetchLogs(page + 1)}
                      disabled={page >= totalPages || logsLoading}
                      className="px-2 py-1 rounded bg-[var(--vs-surface)] disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
