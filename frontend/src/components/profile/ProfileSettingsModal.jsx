// frontend/src/components/profile/ProfileSettingsModal.jsx
import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Modal from '../core/Modal.jsx';
import Button from '../core/Button.jsx';
import FeedbackForm from './FeedbackForm.jsx';
import {
  Save,
  User,
  School,
  Hash,
  Award,
  Wrench,
  Calendar,
  Lightbulb,
  Goal,
  ChevronDown,
  MessageSquare,
  Key,
  Copy,
  Check,
  RefreshCw,
  Eye,
  EyeOff,
  Code2,
  Terminal,
  Globe,
  Zap,
  Layers
} from 'lucide-react';

const PUBLIC_API_BASE = 'https://61.0.228.124/api/v1';

const yearOptions = {
  "Bachelor's": ["1st Year", "2nd Year", "3rd Year", "4th Year"],
  "Master's": ["1st Year", "2nd Year"],
  "PhD": ["Coursework", "Research Phase", "Writing Phase"],
  "Diploma": ["1st Year", "2nd Year", "3rd Year"]
};

const getYearOptions = (degree) => {
  return yearOptions[degree] || ["1st Year", "2nd Year", "3rd Year", "4th Year", "Graduated"];
};

const ProfileSettingsModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'api' | 'feedback'
  const [profile, setProfile] = useState({
    name: '',
    college: '',
    universityNumber: '',
    degreeType: '',
    branch: '',
    year: '',
    learningStyle: 'Visual',
    currentGoals: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Developer API Key State
  const [keyStatus, setKeyStatus] = useState(null);
  const [fullKey, setFullKey] = useState(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isRefreshingKey, setIsRefreshingKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [selectedLang, setSelectedLang] = useState('python_openai');

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await api.getUserProfile();
      setProfile({
        name: data.name || '',
        college: data.college || '',
        universityNumber: data.universityNumber || '',
        degreeType: data.degreeType || "Bachelor's",
        branch: data.branch || 'Computer Science',
        year: data.year || '1st Year',
        learningStyle: data.learningStyle || 'Visual',
        currentGoals: data.currentGoals || ''
      });
    } catch (err) {
      toast.error('Failed to load profile data.');
      setError(err.message || 'Could not fetch profile.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchKeyStatus = useCallback(async () => {
    try {
      const data = await api.getDeveloperKeyStatus();
      setKeyStatus(data);
    } catch (err) {
      console.warn('Could not fetch developer key status:', err.message);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchProfile();
      fetchKeyStatus();
    }
  }, [isOpen, fetchProfile, fetchKeyStatus]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => {
      const newState = { ...prev, [name]: value };
      if (name === 'degreeType') {
        const newYearOptions = getYearOptions(value);
        newState.year = newYearOptions[0];
      }
      return newState;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    for (const key in profile) {
      if (key === 'currentGoals') continue;
      if (!profile[key] || profile[key].trim() === '') {
        toast.error(`Please fill out the '${key.replace(/([A-Z])/g, ' $1').trim()}' field.`);
        return;
      }
    }
    setIsLoading(true);
    setError('');
    try {
      const response = await api.updateUserProfile(profile);
      toast.success(response.message || 'Profile updated successfully!');
      onClose();
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update profile.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // API Key Actions
  const handleGenerateKey = async () => {
    setIsRefreshingKey(true);
    try {
      const res = await api.generateDeveloperKey();
      setFullKey(res.apiKey);
      setIsRevealed(true);
      toast.success('Developer API Key generated!');
      fetchKeyStatus();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate key.');
    } finally {
      setIsRefreshingKey(false);
    }
  };

  const handleRefreshKey = async () => {
    if (!window.confirm('Rotate Developer API Key? Any existing apps using the previous key will be disconnected immediately.')) {
      return;
    }
    setIsRefreshingKey(true);
    try {
      const res = await api.refreshDeveloperKey();
      setFullKey(res.apiKey);
      setIsRevealed(true);
      toast.success('New API Key generated!');
      fetchKeyStatus();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to refresh key.');
    } finally {
      setIsRefreshingKey(false);
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

  const displayKey = isRevealed && fullKey ? fullKey : (keyStatus?.maskedKey || 'No active key generated');
  const activeKeyForCode = fullKey || (keyStatus?.hasKey ? keyStatus.maskedKey : 'imk_live_YOUR_API_KEY_HERE');

  const getCodeSnippet = () => {
    switch (selectedLang) {
      case 'python_openai':
        return `# Install: pip install openai
from openai import OpenAI

client = OpenAI(
    base_url="${PUBLIC_API_BASE}",
    api_key="${activeKeyForCode}"
)

# Stream response from iMentor AI
response = client.chat.completions.create(
    model="imentor-default",
    messages=[
        {"role": "system", "content": "You are a concise academic tutor."},
        {"role": "user", "content": "Explain Maxwell's equations and their significance."}
    ],
    temperature=0.7,
    stream=True
)

for chunk in response:
    print(chunk.choices[0].delta.content or "", end="", flush=True)
print()
`;

      case 'python_requests':
        return `# Standard Python requests (Zero Dependencies)
import requests
import json

url = "${PUBLIC_API_BASE}/chat/completions"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer ${activeKeyForCode}",
    "X-iMentor-Course-Context": "Power Systems" # Optional Course Grounding
}
payload = {
    "model": "imentor-default",
    "messages": [
        {"role": "user", "content": "What is the Gauss-Seidel load flow method?"}
    ],
    "temperature": 0.5,
    "max_tokens": 1000
}

response = requests.post(url, headers=headers, json=payload)
data = response.json()
print("iMentor Response:")
print(data["choices"][0]["message"]["content"])
`;

      case 'java':
        return `// Java 11+ Native HttpClient Example
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class iMentorApp {
    public static void main(String[] args) throws Exception {
        HttpClient client = HttpClient.newHttpClient();

        String payload = """
        {
          "model": "imentor-default",
          "messages": [
            {"role": "user", "content": "Explain binary search trees in Java."}
          ],
          "stream": false
        }
        """;

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("${PUBLIC_API_BASE}/chat/completions"))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer ${activeKeyForCode}")
                .POST(HttpRequest.BodyPublishers.ofString(payload))
                .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        System.out.println("HTTP Status: " + response.statusCode());
        System.out.println("Output:\\n" + response.body());
    }
}
`;

      case 'javascript':
        return `// Node.js or Browser Fetch
const response = await fetch("${PUBLIC_API_BASE}/chat/completions", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer ${activeKeyForCode}"
  },
  body: JSON.stringify({
    model: "imentor-default",
    messages: [
      { role: "user", content: "Explain reactive power in AC circuits." }
    ],
    temperature: 0.7
  })
});

const data = await response.json();
console.log(data.choices[0].message.content);
`;

      case 'claude':
        return `# Claude / Anthropic Compatible Format
curl -X POST "${PUBLIC_API_BASE}/messages" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${activeKeyForCode}" \\
  -H "anthropic-version: 2023-06-01" \\
  -d '{
    "model": "claude-3-5-sonnet-20241022",
    "max_tokens": 1024,
    "system": "You are a direct scientific assistant.",
    "messages": [
      {"role": "user", "content": "State the laws of thermodynamics."}
    ]
  }'
`;

      case 'curl':
      default:
        return `# Terminal cURL Request
curl -X POST "${PUBLIC_API_BASE}/chat/completions" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${activeKeyForCode}" \\
  -d '{
    "model": "imentor-default",
    "messages": [
      {"role": "system", "content": "You are an expert tutor."},
      {"role": "user", "content": "Explain how PID Controllers work in 3 bullets."}
    ],
    "temperature": 0.7,
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

  const inputWrapperClass = "relative";
  const inputIconClass = "absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted-light dark:text-text-muted-dark pointer-events-none";
  const inputFieldStyledClass = "input-field pl-10 py-2.5 text-sm";

  const TABS = [
    { id: 'profile', label: 'Profile Details', Icon: User },
    { id: 'api', label: 'Developer API & SDK', Icon: Code2 },
    { id: 'feedback', label: 'Feedback', Icon: MessageSquare },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Account & Developer Settings"
      size="lg"
      footerContent={
        activeTab === 'profile' ? (
          <>
            <Button variant="secondary" onClick={onClose} disabled={isLoading}>Cancel</Button>
            <Button onClick={handleSubmit} isLoading={isLoading} leftIcon={<Save size={16} />}>
              Save Changes
            </Button>
          </>
        ) : (
          <Button variant="secondary" onClick={onClose}>Close</Button>
        )
      }
    >
      {/* ─── Tab Bar ─────────────────────────────────────────────────── */}
      <div className="flex border-b border-border-light dark:border-border-dark mb-4 -mx-1">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === id
                ? 'border-accent-light dark:border-accent-dark text-accent-light dark:text-accent-dark'
                : 'border-transparent text-text-muted-light dark:text-text-muted-dark hover:text-text-primary-light dark:hover:text-text-primary-dark'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* ─── Profile Tab ─────────────────────────────────────────────── */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-red-500">{error}</p>}
          
          <h3 className="text-sm font-semibold text-text-muted-light dark:text-text-muted-dark border-b border-border-light dark:border-border-dark pb-2">Academic Profile</h3>
          <div className={inputWrapperClass}>
            <User className={inputIconClass} />
            <input type="text" name="name" value={profile.name} onChange={handleChange} placeholder="Full Name" className={inputFieldStyledClass} required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={inputWrapperClass}>
              <School className={inputIconClass} />
              <input type="text" name="college" value={profile.college} onChange={handleChange} placeholder="College / Institution" className={inputFieldStyledClass} required />
            </div>
            <div className={inputWrapperClass}>
              <Hash className={inputIconClass} />
              <input type="text" name="universityNumber" value={profile.universityNumber} onChange={handleChange} placeholder="University Number" className={inputFieldStyledClass} required />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={inputWrapperClass}>
              <Award className={inputIconClass} />
              <select name="degreeType" value={profile.degreeType} onChange={handleChange} className="input-field !pl-10 !pr-8 py-2.5 text-sm appearance-none text-left" required>
                <option>Bachelor's</option><option>Master's</option><option>PhD</option><option>Diploma</option>
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted-light dark:text-text-muted-dark" />
            </div>
            <div className={inputWrapperClass}>
              <Wrench className={inputIconClass} />
              <select name="branch" value={profile.branch} onChange={handleChange} className="input-field !pl-10 !pr-8 py-2.5 text-sm appearance-none text-left" required>
                <option>Computer Science</option><option>Mechanical</option><option>Electrical</option><option>Civil</option><option>Electronics</option><option>Other</option>
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted-light dark:text-text-muted-dark" />
            </div>
            <div className={inputWrapperClass}>
              <Calendar className={inputIconClass} />
              <select name="year" value={profile.year} onChange={handleChange} className="input-field !pl-10 !pr-8 py-2.5 text-sm appearance-none text-left" required>
                {getYearOptions(profile.degreeType).map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted-light dark:text-text-muted-dark" />
            </div>
          </div>

          <h3 className="text-sm font-semibold text-text-muted-light dark:text-text-muted-dark border-b border-border-light dark:border-border-dark pb-2 pt-4">Learning Preferences</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-text-muted-light dark:text-text-muted-dark">Preferred Learning Style</label>
              <div className={inputWrapperClass}>
                <Lightbulb className={inputIconClass} />
                <select name="learningStyle" value={profile.learningStyle} onChange={handleChange} className="input-field !pl-10 !pr-8 py-2.5 text-sm appearance-none text-left" required>
                  <option>Visual</option>
                  <option>Auditory</option>
                  <option>Reading/Writing</option>
                  <option>Kinesthetic</option>
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted-light dark:text-text-muted-dark" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-text-muted-light dark:text-text-muted-dark">Current Learning Goals (Optional)</label>
              <div className={inputWrapperClass}>
                <Goal className={inputIconClass} />
                <textarea name="currentGoals" value={profile.currentGoals} onChange={handleChange} placeholder="e.g., Prepare for my AI exam..." className={`${inputFieldStyledClass} !h-[42px] resize-none`} maxLength="500"></textarea>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* ─── Developer API Tab ────────────────────────────────────────── */}
      {activeTab === 'api' && (
        <div className="space-y-4 animate-fade-in text-xs">
          {/* Key Management Card */}
          <div className="p-3.5 rounded-md border border-[var(--vs-border-hi)] bg-[var(--vs-panel)] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-200 flex items-center gap-1.5">
                <Key size={14} className="text-emerald-400" />
                Personal Developer API Key
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-medium ${
                keyStatus?.hasKey
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
              }`}>
                {keyStatus?.hasKey ? 'ACTIVE KEY' : 'NO KEY ISSUED'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1 font-mono text-xs px-3 py-2 rounded bg-[var(--vs-bg)] border border-[var(--vs-border)] text-emerald-300 select-all overflow-x-auto whitespace-nowrap">
                {displayKey}
              </div>
              {keyStatus?.hasKey && (
                <button
                  type="button"
                  onClick={handleRevealKey}
                  title={isRevealed ? "Hide Key" : "Reveal Key"}
                  className="p-2 rounded bg-[var(--vs-surface)] hover:bg-[var(--vs-hover)] border border-[var(--vs-border)] text-gray-300 transition-colors"
                >
                  {isRevealed ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              )}
              {keyStatus?.hasKey && (
                <button
                  type="button"
                  onClick={handleCopyKey}
                  title="Copy Key"
                  className="flex items-center gap-1 px-3 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors"
                >
                  {copiedKey ? <Check size={14} /> : <Copy size={14} />}
                  {copiedKey ? 'Copied' : 'Copy'}
                </button>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[var(--vs-border)] text-[11px] text-gray-400">
              <span>Endpoint: <code className="text-white">{PUBLIC_API_BASE}</code></span>
              <div>
                {!keyStatus?.hasKey ? (
                  <Button
                    onClick={handleGenerateKey}
                    isLoading={isRefreshingKey}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-3 py-1"
                  >
                    Generate Key
                  </Button>
                ) : (
                  <button
                    type="button"
                    onClick={handleRefreshKey}
                    disabled={isRefreshingKey}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-[var(--vs-surface)] hover:bg-red-500/20 text-gray-300 hover:text-red-300 border border-[var(--vs-border)] text-[11px] transition-all"
                  >
                    <RefreshCw size={12} className={isRefreshingKey ? 'animate-spin' : ''} />
                    Rotate / Refresh Key
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Language Code Snippets */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-200 flex items-center gap-1.5">
                <Terminal size={14} className="text-blue-400" />
                Quick-Start Code Examples
              </span>
              <button
                type="button"
                onClick={handleCopySnippet}
                className="flex items-center gap-1 text-[11px] text-emerald-400 hover:underline"
              >
                {copiedSnippet ? <Check size={12} /> : <Copy size={12} />}
                {copiedSnippet ? 'Copied Snippet' : 'Copy Code'}
              </button>
            </div>

            {/* Language Selector */}
            <div className="flex flex-wrap gap-1">
              {[
                { id: 'python_openai', label: 'Python (OpenAI SDK)' },
                { id: 'python_requests', label: 'Python (Requests)' },
                { id: 'java', label: 'Java (HttpClient)' },
                { id: 'javascript', label: 'JavaScript' },
                { id: 'claude', label: 'Claude SDK' },
                { id: 'curl', label: 'cURL' },
              ].map(l => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => setSelectedLang(l.id)}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                    selectedLang === l.id
                      ? 'bg-[var(--vs-active)] text-white border border-[var(--vs-border-hi)]'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-[var(--vs-hover)]'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>

            {/* Code Box */}
            <div className="rounded-md border border-[var(--vs-border-hi)] bg-[#0f141c] overflow-hidden">
              <pre className="p-3.5 font-mono text-[11px] text-gray-200 overflow-x-auto leading-relaxed max-h-56 custom-scrollbar">
                <code>{getCodeSnippet()}</code>
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* ─── Feedback Tab ─────────────────────────────────────────────── */}
      {activeTab === 'feedback' && <FeedbackForm />}
    </Modal>
  );
};

export default ProfileSettingsModal;
