// frontend/src/components/landing/CampusDeployConfigurator.jsx
import React, { useState, useEffect } from 'react';
import {
    Server, Cpu, HardDrive, Globe, Download, CheckCircle2,
    AlertTriangle, Terminal, Building2, Shield, Sparkles, Copy, Check
} from 'lucide-react';
import toast from 'react-hot-toast';

const OS_OPTIONS = [
    {
        id: 'ubuntu_linux',
        label: 'Ubuntu Linux 22.04 / 24.04',
        badge: 'Recommended',
        sub: 'Fastest Docker + GPU/CPU I/O, systemd auto-recovery'
    },
    {
        id: 'windows_wsl2',
        label: 'Windows 11 / Server (WSL2)',
        badge: 'Docker Desktop',
        sub: 'Full container stack with WSL2 GPU pass-through'
    },
    {
        id: 'windows_native',
        label: 'Windows Native Portable (.exe)',
        badge: 'No Docker / BIOS Lock OK',
        sub: 'Runs natively without Hyper-V or WSL2 virtualization'
    }
];

const ACCEL_OPTIONS = [
    {
        id: 'nvidia_gpu',
        label: 'NVIDIA GPU (CUDA)',
        sub: 'RTX 3060/4060/4070/4090, A4000, L4'
    },
    {
        id: 'amd_gpu',
        label: 'AMD GPU (Vulkan / ROCm)',
        sub: 'Radeon RX 7000/9000, PRO W-Series, Instinct'
    },
    {
        id: 'lab_pc_pool',
        label: 'Pool 3–5 Lab Desktop GPUs',
        sub: 'Use existing CAD/AIML lab PCs — ₹0 new server GPU'
    },
    {
        id: 'cpu_only',
        label: 'CPU-Only PC (No GPU)',
        sub: 'Intel Xeon / Core / AMD Ryzen / EPYC RAM server'
    }
];

const MEM_OPTIONS = [
    { id: '8_12gb',    label: '8 – 12 GB',  sub: 'Entry GPU / Compact' },
    { id: '16_24gb',   label: '16 – 24 GB', sub: 'Standard Classroom' },
    { id: '32_64gb',   label: '32 – 64 GB', sub: 'High Concurrency / MoE' },
    { id: '64gb_plus', label: '64+ GB',     sub: 'Department / Multi-Batch' }
];

const CONN_OPTIONS = [
    {
        id: 'campus_lan_internet',
        label: 'Campus LAN + Academic Search',
        sub: '100% local LLM + live OpenAlex/arXiv paper search'
    },
    {
        id: 'offline_airgapped',
        label: '100% Air-Gapped Offline',
        sub: 'Zero internet required — strict exam/defense lab mode'
    },
    {
        id: 'hybrid_cloud_gpu',
        label: 'Hybrid: Local DB + iMentor Cloud GPU',
        sub: 'Best for No-GPU colleges needing 100+ live students'
    }
];

export default function CampusDeployConfigurator() {
    const [osTarget, setOsTarget]                 = useState('ubuntu_linux');
    const [accelerator, setAccelerator]           = useState('nvidia_gpu');
    const [memoryTier, setMemoryTier]             = useState('16_24gb');
    const [connectivityMode, setConnectivityMode] = useState('campus_lan_internet');

    const [collegeName, setCollegeName]           = useState('');
    const [coordinatorName, setCoordinatorName]   = useState('');
    const [officialEmail, setOfficialEmail]       = useState('');
    const [phone, setPhone]                       = useState('');
    const [studentCount, setStudentCount]         = useState('100-500');
    const [campusDomain, setCampusDomain]         = useState('imentor.campus.local');

    const [plan, setPlan]                         = useState(null);
    const [isDownloading, setIsDownloading]       = useState(false);
    const [generatedBundle, setGeneratedBundle]   = useState(null);
    const [copiedCmd, setCopiedCmd]               = useState(false);

    const apiBase = import.meta.env.VITE_API_BASE_URL || '/api';

    // Fetch live deterministic sizing recommendation whenever hardware matrix changes
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch(`${apiBase}/deploy/recommend`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ osTarget, accelerator, memoryTier, connectivityMode, campusDomain })
                });
                if (!res.ok) return;
                const data = await res.json();
                if (!cancelled && data?.plan) setPlan(data.plan);
            } catch { /* ignore */ }
        })();
        return () => { cancelled = true; };
    }, [osTarget, accelerator, memoryTier, connectivityMode, campusDomain, apiBase]);

    const handleGenerateInstaller = async (e) => {
        e.preventDefault();
        if (collegeName.trim().length < 2) {
            toast.error('Please enter your College / Institution Name.');
            return;
        }
        if (!officialEmail.trim() && !phone.trim()) {
            toast.error('Please enter an Official Email or Phone number.');
            return;
        }

        setIsDownloading(true);
        try {
            const res = await fetch(`${apiBase}/deploy/generate-installer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    collegeName: collegeName.trim(),
                    coordinatorName: coordinatorName.trim(),
                    officialEmail: officialEmail.trim(),
                    phone: phone.trim(),
                    studentCountEstimate: studentCount,
                    campusDomain: campusDomain.trim() || 'imentor.campus.local',
                    osTarget,
                    accelerator,
                    memoryTier,
                    connectivityMode
                })
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to generate custom installer');
            }

            const bundleId = res.headers.get('X-Bundle-Id') || 'IMC-CUSTOM';
            const filename = res.headers.get('X-Installer-Filename') || 'imentor-campus-installer.zip';
            const blob = await res.blob();

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);

            const isWin = osTarget !== 'ubuntu_linux';
            const quickCmd = isWin
                ? `Expand-Archive -Path ${filename} -DestinationPath C:\\iMentor; cd C:\\iMentor; Set-ExecutionPolicy Bypass -Scope Process; .\\install-campus.ps1`
                : `unzip ${filename} -d ~/imentor-campus && cd ~/imentor-campus && chmod +x *.sh && ./install-campus.sh`;

            setGeneratedBundle({ bundleId, filename, quickCmd, isWin });
            toast.success(`Custom installer (${filename}) downloaded!`);
        } catch (err) {
            toast.error(err.message || 'Could not generate installer');
        } finally {
            setIsDownloading(false);
        }
    };

    const copyQuickCommand = () => {
        if (!generatedBundle?.quickCmd) return;
        navigator.clipboard.writeText(generatedBundle.quickCmd).then(() => {
            setCopiedCmd(true);
            toast.success('Quick-start command copied!');
            setTimeout(() => setCopiedCmd(false), 2000);
        }).catch(() => {});
    };

    return (
        <section id="campus-deploy" className="relative bg-black border-t border-zinc-900 py-20 px-4 sm:px-8 lg:px-16">
            <div className="max-w-6xl mx-auto space-y-10">

                {/* ── Section Heading ────────────────────────────────────────── */}
                <div className="text-center max-w-3xl mx-auto space-y-3">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        <Building2 size={13} /> Enterprise Multi-College Self-Hosted Builder
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                        Configure & Download Your Custom Campus Installer
                    </h2>
                    <p className="text-zinc-400 text-sm sm:text-base">
                        Select your college server’s Operating System, GPU/CPU hardware, and network mode — iMentor compiles a ready-to-run deployment kit tailored to your exact lab infrastructure.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                    {/* ── Left Column (7 cols): Interactive PyTorch-Style Selector Matrix ── */}
                    <div className="lg:col-span-7 space-y-6 rounded-2xl bg-zinc-950 border border-zinc-800 p-5 sm:p-7">

                        {/* Row 1: Operating System */}
                        <div className="space-y-2.5">
                            <label className="text-xs font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                                <Server size={14} className="text-teal-400" /> 1. Server Operating System
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                {OS_OPTIONS.map((opt) => {
                                    const active = osTarget === opt.id;
                                    return (
                                        <button
                                            key={opt.id}
                                            type="button"
                                            data-testid={`os-${opt.id}`}
                                            onClick={() => setOsTarget(opt.id)}
                                            className={`text-left p-3 rounded-xl border transition-all ${
                                                active
                                                    ? 'bg-teal-500/15 border-teal-400 text-white shadow-sm'
                                                    : 'bg-zinc-900/70 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between gap-1 mb-1">
                                                <span className="text-xs font-bold leading-snug">{opt.label}</span>
                                            </div>
                                            <span className="inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded bg-black/50 text-teal-300 mb-1.5">
                                                {opt.badge}
                                            </span>
                                            <p className="text-[11px] text-zinc-400 leading-snug">{opt.sub}</p>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Row 2: Hardware Accelerator */}
                        <div className="space-y-2.5">
                            <label className="text-xs font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                                <Cpu size={14} className="text-sky-400" /> 2. Compute Hardware (GPU / CPU / Lab Pool)
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                {ACCEL_OPTIONS.map((opt) => {
                                    const active = accelerator === opt.id;
                                    return (
                                        <button
                                            key={opt.id}
                                            type="button"
                                            data-testid={`accel-${opt.id}`}
                                            onClick={() => setAccelerator(opt.id)}
                                            className={`text-left p-3 rounded-xl border transition-all ${
                                                active
                                                    ? 'bg-sky-500/15 border-sky-400 text-white shadow-sm'
                                                    : 'bg-zinc-900/70 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                                            }`}
                                        >
                                            <div className="text-xs font-bold mb-1">{opt.label}</div>
                                            <p className="text-[11px] text-zinc-400 leading-snug">{opt.sub}</p>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Row 3: Memory Tier */}
                        <div className="space-y-2.5">
                            <label className="text-xs font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                                <HardDrive size={14} className="text-violet-400" /> 3. Available VRAM (or System RAM if CPU-Only)
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                {MEM_OPTIONS.map((opt) => {
                                    const active = memoryTier === opt.id;
                                    return (
                                        <button
                                            key={opt.id}
                                            type="button"
                                            data-testid={`mem-${opt.id}`}
                                            onClick={() => setMemoryTier(opt.id)}
                                            className={`text-left p-2.5 rounded-xl border transition-all ${
                                                active
                                                    ? 'bg-violet-500/15 border-violet-400 text-white'
                                                    : 'bg-zinc-900/70 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                                            }`}
                                        >
                                            <div className="text-xs font-bold">{opt.label}</div>
                                            <div className="text-[10px] text-zinc-400 mt-0.5">{opt.sub}</div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Row 4: Network & Privacy Mode */}
                        <div className="space-y-2.5">
                            <label className="text-xs font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                                <Globe size={14} className="text-emerald-400" /> 4. Campus Network & Inference Topology
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                {CONN_OPTIONS.map((opt) => {
                                    const active = connectivityMode === opt.id;
                                    return (
                                        <button
                                            key={opt.id}
                                            type="button"
                                            data-testid={`conn-${opt.id}`}
                                            onClick={() => setConnectivityMode(opt.id)}
                                            className={`text-left p-3 rounded-xl border transition-all ${
                                                active
                                                    ? 'bg-emerald-500/15 border-emerald-400 text-white'
                                                    : 'bg-zinc-900/70 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                                            }`}
                                        >
                                            <div className="text-xs font-bold mb-1 leading-snug">{opt.label}</div>
                                            <p className="text-[11px] text-zinc-400 leading-snug">{opt.sub}</p>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Live Resolved Blueprint Preview */}
                        {plan && (
                            <div data-testid="deploy-blueprint-card" className="rounded-xl bg-black/80 border border-zinc-800 p-4 space-y-3">
                                <div className="flex items-center justify-between flex-wrap gap-2 border-b border-zinc-800 pb-2.5">
                                    <span className="text-xs font-bold text-teal-300 flex items-center gap-1.5">
                                        <Sparkles size={14} /> Recommended Custom Stack Blueprint
                                    </span>
                                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                        {plan.recommendedClassSize}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                    <div>
                                        <span className="text-zinc-500 block text-[11px]">Inference Runtime</span>
                                        <span className="text-white font-semibold">{plan.engine}</span>
                                    </div>
                                    <div>
                                        <span className="text-zinc-500 block text-[11px]">Pre-Configured Model</span>
                                        <span className="text-sky-300 font-mono font-semibold">{plan.model}</span>
                                    </div>
                                    <div>
                                        <span className="text-zinc-500 block text-[11px]">Expected Throughput</span>
                                        <span className="text-emerald-300 font-semibold">{plan.estimatedTokPerSec}</span>
                                    </div>
                                    <div>
                                        <span className="text-zinc-500 block text-[11px]">Active Stream Slots</span>
                                        <span className="text-zinc-200 font-semibold">{plan.concurrentStreams}</span>
                                    </div>
                                </div>

                                {plan.warnings?.length > 0 && (
                                    <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 flex items-start gap-2 text-xs text-amber-200">
                                        <AlertTriangle size={15} className="flex-shrink-0 mt-0.5 text-amber-400" />
                                        <span>{plan.warnings[0]}</span>
                                    </div>
                                )}

                                <div className="pt-1 flex flex-wrap gap-1.5">
                                    {(plan.includedFiles || []).map((f) => (
                                        <span key={f} className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
                                            {f}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── Right Column (5 cols): College Details & Instant .ZIP Download ── */}
                    <div className="lg:col-span-5 rounded-2xl bg-zinc-950 border border-zinc-800 p-5 sm:p-7 space-y-5">
                        <div>
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Download size={18} className="text-emerald-400" />
                                Download Tailored Campus Bundle
                            </h3>
                            <p className="text-xs text-zinc-400 mt-1">
                                Enter your institution details to generate unique cryptographic campus keys and download your custom <code className="text-zinc-200">.zip</code> installer immediately.
                            </p>
                        </div>

                        <form onSubmit={handleGenerateInstaller} className="space-y-3.5">
                            <div>
                                <label className="block text-xs font-medium text-zinc-300 mb-1">
                                    College / University Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    data-testid="deploy-college-name"
                                    value={collegeName}
                                    onChange={(e) => setCollegeName(e.target.value)}
                                    placeholder="e.g., NIT Andhra Pradesh"
                                    className="w-full px-3.5 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-teal-400"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                                        Faculty / IT Coordinator
                                    </label>
                                    <input
                                        type="text"
                                        data-testid="deploy-coordinator-name"
                                        value={coordinatorName}
                                        onChange={(e) => setCoordinatorName(e.target.value)}
                                        placeholder="Dr. / Prof. Name"
                                        className="w-full px-3.5 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-teal-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                                        Expected Student Users
                                    </label>
                                    <select
                                        data-testid="deploy-student-count"
                                        value={studentCount}
                                        onChange={(e) => setStudentCount(e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none focus:border-teal-400"
                                    >
                                        <option value="Up to 100">Up to 100 Students</option>
                                        <option value="100-500">100 – 500 Students</option>
                                        <option value="500-2000">500 – 2,000 Students</option>
                                        <option value="2000+">2,000+ Campus-Wide</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                                        Official Email *
                                    </label>
                                    <input
                                        type="email"
                                        data-testid="deploy-email"
                                        value={officialEmail}
                                        onChange={(e) => setOfficialEmail(e.target.value)}
                                        placeholder="dean@college.ac.in"
                                        className="w-full px-3.5 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-teal-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                                        Phone / WhatsApp *
                                    </label>
                                    <input
                                        type="tel"
                                        data-testid="deploy-phone"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="+91 98765 43210"
                                        className="w-full px-3.5 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-teal-400"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-zinc-300 mb-1">
                                    Campus Intranet Hostname or Server LAN IP
                                </label>
                                <input
                                    type="text"
                                    data-testid="deploy-domain"
                                    value={campusDomain}
                                    onChange={(e) => setCampusDomain(e.target.value)}
                                    placeholder="imentor.campus.local or 192.168.1.50"
                                    className="w-full px-3.5 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm font-mono text-white placeholder:text-zinc-500 focus:outline-none focus:border-teal-400"
                                />
                            </div>

                            <button
                                type="submit"
                                data-testid="deploy-download-btn"
                                disabled={isDownloading}
                                className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-emerald-500 text-black hover:bg-emerald-400 disabled:opacity-50 transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10"
                            >
                                <Download size={16} />
                                {isDownloading ? 'Generating Custom Campus Bundle...' : 'Generate & Download Custom Installer (.zip)'}
                            </button>

                            <p className="text-[11px] text-zinc-500 flex items-center gap-1.5">
                                <Shield size={12} className="text-emerald-400 flex-shrink-0" />
                                Generates unique campus JWT & service tokens on the fly. Includes offline-ready scripts.
                            </p>
                        </form>

                        {/* Post-Download Quick-Start Terminal Box */}
                        {generatedBundle && (
                            <div data-testid="deploy-success-box" className="rounded-xl bg-emerald-950/30 border border-emerald-500/40 p-4 space-y-2.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                                        <CheckCircle2 size={14} /> Bundle Ready: {generatedBundle.bundleId}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={copyQuickCommand}
                                        className="text-[11px] px-2 py-1 rounded bg-zinc-900 border border-zinc-700 text-zinc-200 hover:text-white flex items-center gap-1"
                                    >
                                        {copiedCmd ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                                        {copiedCmd ? 'Copied' : 'Copy Cmd'}
                                    </button>
                                </div>
                                <div className="text-[11px] font-mono bg-black/80 border border-zinc-800 rounded-lg p-2.5 text-zinc-200 overflow-x-auto flex items-start gap-2">
                                    <Terminal size={13} className="text-teal-400 flex-shrink-0 mt-0.5" />
                                    <code>{generatedBundle.quickCmd}</code>
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </section>
    );
}
