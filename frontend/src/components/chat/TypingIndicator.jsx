// frontend/src/components/chat/TypingIndicator.jsx
import React from 'react';

function TypingIndicator({ status }) {
  return (
    <div className="flex items-center justify-start w-full group">
      <div className="w-full max-w-md rounded-xl border border-blue-500/30 bg-gradient-to-br from-slate-900/80 to-slate-800/70 px-3 py-2.5 shadow-md">
        <div className="flex items-center gap-2 text-[11px] font-semibold text-blue-200 mb-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
          <span>🧠 iMentor is reasoning</span>
        </div>
        <p className="text-xs text-slate-200 leading-snug min-h-[1.2rem]">
          {status || 'Thinking...'}
        </p>
      </div>
    </div>
  );
}

export default TypingIndicator;