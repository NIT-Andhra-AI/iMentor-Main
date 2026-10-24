import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { ArrowLeft, Clock, Download, FileText, Archive } from 'lucide-react';
import toast from 'react-hot-toast';
import ResearchReport from './ResearchReport';

const ResearchDetailView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [researchData, setResearchData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchReport = async () => {
            try {
                const data = await api.getResearchDetail(id);
                setResearchData(data);
            } catch (error) {
                console.error("Fetch detail failed:", error);
                toast.error("Research report not found.");
            } finally {
                setIsLoading(false);
            }
        };

        if (id) fetchReport();
    }, [id]);

    const handleDownloadFormat = async (format, ext, label) => {
        try {
            toast.loading(`Generating ${label}...`, { id: 'export-toast' });
            const blobData = format === 'pdf'
                ? await api.exportResearchPDF(id)
                : await api.exportResearchFormat(id, format);

            if (blobData.type === 'application/json') {
                const text = await blobData.text();
                const errorData = JSON.parse(text);
                throw new Error(errorData.message || "Server error.");
            }

            const blob = new Blob([blobData], { type: blobData.type || 'application/octet-stream' });
            const url = window.URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            const fileName = `PhD_Review_${researchData?.title || researchData?.query || 'Report'}`.replace(/[^a-z0-9]/gi, '_').slice(0, 45);
            link.setAttribute('download', `${fileName}.${ext}`);
            document.body.appendChild(link);
            link.click();

            setTimeout(() => {
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            }, 200);

            toast.success(`${label} Downloaded!`, { id: 'export-toast' });
        } catch (error) {
            console.error(`${label} download failed:`, error);
            toast.error(`Failed to generate ${label}.`, { id: 'export-toast' });
        }
    };

    if (isLoading) {
        return <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center text-gray-500 italic">Retrieving scholarly literature review &amp; comparison matrix...</div>;
    }

    if (!researchData) {
        return <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center text-gray-500">Report not found in archives.</div>;
    }

    return (
        <div className="min-h-screen bg-[#0A0A0A] text-gray-200 font-sans flex flex-col">

            <header className="h-16 border-b border-[#1F1F1F] bg-[#0A0A0A]/95 backdrop-blur sticky top-0 z-50 px-6 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => navigate('/tools/deep-research/history')}
                        className="p-2 hover:bg-[#1F1F1F] rounded-full text-gray-400 hover:text-white transition-colors"
                        title="Back to Library"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-sm font-bold text-gray-200 uppercase tracking-wide truncate max-w-md">
                            {researchData.title || researchData.query}
                        </h1>
                        <div className="text-xs text-gray-500 flex items-center mt-0.5">
                            <Clock className="w-3 h-3 mr-1" />
                            {new Date(researchData.createdAt).toLocaleDateString()}
                        </div>
                    </div>
                </div>

                <div className="flex items-center space-x-2.5">
                    <button
                        onClick={() => handleDownloadFormat('docx', 'docx', 'Word Manuscript (.docx)')}
                        className="flex items-center px-3 py-2 bg-[#161B24] border border-blue-500/30 text-blue-300 text-xs font-bold uppercase tracking-wider rounded hover:bg-[#1F2735] transition-colors"
                    >
                        <FileText className="w-3.5 h-3.5 mr-1.5" />
                        Word (.docx)
                    </button>
                    <button
                        onClick={() => handleDownloadFormat('zip', 'zip', 'Complete PhD Research Bundle (.zip)')}
                        className="flex items-center px-3 py-2 bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold uppercase tracking-wider rounded hover:bg-emerald-600/30 transition-colors"
                    >
                        <Archive className="w-3.5 h-3.5 mr-1.5" />
                        Full ZIP Bundle
                    </button>
                    <button
                        onClick={() => handleDownloadFormat('pdf', 'pdf', 'Academic PDF')}
                        className="flex items-center px-4 py-2 bg-white text-black text-xs font-bold uppercase tracking-wider rounded hover:bg-gray-200 transition-colors shadow-lg"
                    >
                        <Download className="w-4 h-4 mr-1.5" />
                        Download PDF
                    </button>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto bg-[#0A0A0A] p-6 lg:p-12 relative scrollbar-thin scrollbar-thumb-gray-800">
                <div className="max-w-5xl mx-auto pb-20">
                    <ResearchReport
                        researchReport={researchData.researchReport}
                        sources={researchData.researchReport?.sourcesUsed || researchData.sources}
                        reportId={id}
                    />
                </div>
            </main>

        </div>
    );
};

export default ResearchDetailView;
