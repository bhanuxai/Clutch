import { Sparkles, Shield, AlertCircle, RefreshCw, Layers } from "lucide-react";
import { Task } from "../types";

interface AiAdvisorProps {
  tasks: Task[];
  generalAdvice: string;
  isPrioritizing: boolean;
  onPrioritize: () => void;
  shieldMode: boolean;
  setShieldMode: (val: boolean) => void;
}

export default function AiAdvisor({
  tasks,
  generalAdvice,
  isPrioritizing,
  onPrioritize,
  shieldMode,
  setShieldMode,
}: AiAdvisorProps) {
  const activeTasks = tasks.filter((t) => !t.isCompleted);
  
  // Counts for heatmap
  const criticalCount = activeTasks.filter((t) => (t.aiScore || 50) >= 80).length;
  const warningCount = activeTasks.filter((t) => (t.aiScore || 50) >= 50 && (t.aiScore || 50) < 80).length;
  const stableCount = activeTasks.filter((t) => (t.aiScore || 50) < 50).length;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm mb-6" id="ai-advisor-panel">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-5 border-b border-slate-50 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-slate-950">AI Life Saver Hub</h2>
            <p className="text-xs text-slate-400 font-medium">Prioritize, plan, and execute before it's too late</p>
          </div>
        </div>

        {/* Force recalculate */}
        <button
          onClick={onPrioritize}
          disabled={isPrioritizing}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-60 text-white text-xs font-bold rounded-xl shadow-sm shadow-indigo-100 transition-all cursor-pointer"
          id="recalculate-priorities-btn"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isPrioritizing ? "animate-spin" : ""}`} />
          {isPrioritizing ? "Analyzing..." : "AI Prioritize"}
        </button>
      </div>

      {/* General Advice */}
      <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl mb-5 text-slate-700 text-xs sm:text-sm leading-relaxed font-medium flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-indigo-500 mt-0.5 flex-shrink-0" />
        <div>
          <span className="font-bold text-slate-900 block mb-0.5 text-xs uppercase tracking-wider text-indigo-600">Daily Advisor Update</span>
          {generalAdvice || "Awaiting task list analysis. Click 'AI Prioritize' to get tailored planning insights."}
        </div>
      </div>

      {/* Bento Grid: Heatmap and Shield Button */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Heatmap Widget */}
        <div className="bg-slate-50/50 border border-slate-100 p-4 rounded-xl flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              AI Cognitive Heatmap
            </h3>
            <p className="text-xs text-slate-500 font-medium mb-3">Threat metrics based on consequence & time left.</p>
          </div>

          <div className="flex items-end justify-between gap-2.5 pt-2">
            {/* Critical */}
            <div className="flex-grow flex flex-col items-center">
              <div className="w-full bg-rose-100 h-10 rounded-lg relative overflow-hidden flex items-end">
                <div 
                  className="w-full bg-rose-500 transition-all duration-500" 
                  style={{ height: activeTasks.length > 0 ? `${(criticalCount / activeTasks.length) * 100}%` : "0%" }}
                ></div>
                <span className="absolute inset-0 flex items-center justify-center font-mono font-bold text-rose-800 text-sm">
                  {criticalCount}
                </span>
              </div>
              <span className="text-[10px] font-bold text-slate-500 mt-1 uppercase">Critical</span>
            </div>

            {/* Warning */}
            <div className="flex-grow flex flex-col items-center">
              <div className="w-full bg-amber-100 h-10 rounded-lg relative overflow-hidden flex items-end">
                <div 
                  className="w-full bg-amber-500 transition-all duration-500" 
                  style={{ height: activeTasks.length > 0 ? `${(warningCount / activeTasks.length) * 100}%` : "0%" }}
                ></div>
                <span className="absolute inset-0 flex items-center justify-center font-mono font-bold text-amber-800 text-sm">
                  {warningCount}
                </span>
              </div>
              <span className="text-[10px] font-bold text-slate-500 mt-1 uppercase">Warning</span>
            </div>

            {/* Stable */}
            <div className="flex-grow flex flex-col items-center">
              <div className="w-full bg-slate-200 h-10 rounded-lg relative overflow-hidden flex items-end">
                <div 
                  className="w-full bg-slate-500 transition-all duration-500" 
                  style={{ height: activeTasks.length > 0 ? `${(stableCount / activeTasks.length) * 100}%` : "0%" }}
                ></div>
                <span className="absolute inset-0 flex items-center justify-center font-mono font-bold text-slate-700 text-sm">
                  {stableCount}
                </span>
              </div>
              <span className="text-[10px] font-bold text-slate-500 mt-1 uppercase">Stable</span>
            </div>
          </div>
        </div>

        {/* Shield Mode Trigger */}
        <div className="bg-indigo-50/40 border border-indigo-100/60 p-4 rounded-xl flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-xs uppercase tracking-wider text-indigo-600 mb-1.5 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              Procrastination Shield
            </h3>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Activate **Deadline Shield Mode** to hide all distracting dashboard clutter, play deep work soundscapes, and lock in focus.
            </p>
          </div>

          <button
            onClick={() => setShieldMode(true)}
            className="w-full mt-3 flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white text-xs font-bold rounded-xl shadow-md shadow-slate-100 hover:scale-[1.01] active:scale-95 transition-all cursor-pointer"
            id="activate-shield-mode-btn"
          >
            <Shield className="w-4 h-4 text-rose-400" />
            Launch Focus Shield
          </button>
        </div>
      </div>
    </div>
  );
}
