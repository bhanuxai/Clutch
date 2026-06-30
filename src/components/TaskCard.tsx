import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, Circle, AlertCircle, Clock, ChevronDown, ChevronUp, Trash2, Calendar, Sparkles, CheckSquare, Square } from "lucide-react";
import { Task } from "../types";

interface TaskCardProps {
  task: Task;
  onToggleComplete: (id: string, isCompleted: boolean) => void;
  onDelete: (id: string) => void;
  onSnooze: (id: string, hours: number) => void;
  onSyncSuccess?: () => void;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onSelect?: (id: string, selected: boolean) => void;
  key?: any;
}

export default function TaskCard({ 
  task, 
  onToggleComplete, 
  onDelete, 
  onSnooze, 
  onSyncSuccess,
  isSelectionMode = false,
  isSelected = false,
  onSelect
}: TaskCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSnoozeMenu, setShowSnoozeMenu] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");
  const [urgencyClass, setUrgencyClass] = useState({ bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200" });

  // Google Calendar Integration States
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [isSyncingToGoogle, setIsSyncingToGoogle] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  // AI Smart Reschedule States
  const [showSmartReschedule, setShowSmartReschedule] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isApplyingReschedule, setIsApplyingReschedule] = useState(false);
  const [suggestion, setSuggestion] = useState<{ suggestedDeadline: string; rationale: string } | null>(null);

  useEffect(() => {
    fetch("/api/auth/google/status")
      .then((res) => res.json())
      .then((data) => {
        if (data.connected) {
          setIsGoogleConnected(true);
        }
      })
      .catch((err) => console.error("Error checking Google Calendar status inside TaskCard:", err));
  }, []);

  const fetchSmartReschedule = async () => {
    setIsSuggesting(true);
    setSuggestion(null);
    try {
      const res = await fetch("/api/ai/smart-reschedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: task.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setSuggestion(data);
      } else {
        console.error("Failed to fetch smart reschedule recommendation");
      }
    } catch (err) {
      console.error("Error fetching smart reschedule suggestion:", err);
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleApplySmartReschedule = async (newDeadline: string) => {
    setIsApplyingReschedule(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deadline: newDeadline,
          aiScore: Math.max(10, (task.aiScore || 50) - 10),
          aiRecommendation: "Rescheduled by AI to minimize conflict and optimize cognitive focus."
        }),
      });
      if (res.ok) {
        if (onSyncSuccess) {
          onSyncSuccess();
        }
        setShowSmartReschedule(false);
      }
    } catch (err) {
      console.error("Failed to apply smart reschedule:", err);
    } finally {
      setIsApplyingReschedule(false);
    }
  };

  const handleSyncTask = async () => {
    setIsSyncingToGoogle(true);
    setSyncSuccess(false);
    try {
      const res = await fetch("/api/calendar/sync-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: task.id }),
      });
      if (res.ok) {
        setSyncSuccess(true);
        if (onSyncSuccess) {
          onSyncSuccess();
        }
        setTimeout(() => setSyncSuccess(false), 4000);
      } else {
        alert("Failed to sync task with Google Calendar");
      }
    } catch (err) {
      console.error("Failed to sync task:", err);
    } finally {
      setIsSyncingToGoogle(false);
    }
  };

  // Deadline countdown tracker
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date("2026-06-24T09:33:11-07:00").getTime();
      const due = new Date(task.deadline).getTime();
      const diff = due - now;

      if (diff <= 0) {
        setTimeLeft("Past Due");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h left`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m left`);
      } else {
        setTimeLeft(`${minutes}m left!`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, [task.deadline]);

  // Set style based on AI Urgency Score
  useEffect(() => {
    const score = task.aiScore || 50;
    if (task.isCompleted) {
      setUrgencyClass({ bg: "bg-slate-50 dark:bg-slate-800", text: "text-slate-400 line-through dark:text-slate-500", border: "border-slate-100 dark:border-slate-700" });
    } else if (score >= 90) {
      setUrgencyClass({ bg: "bg-rose-50 dark:bg-rose-950/20", text: "text-rose-700 font-bold dark:text-rose-400", border: "border-rose-100 dark:border-rose-900/40" });
    } else if (score >= 70) {
      setUrgencyClass({ bg: "bg-amber-50/80 dark:bg-amber-950/20", text: "text-amber-700 font-semibold dark:text-amber-400", border: "border-amber-100 dark:border-amber-900/45" });
    } else if (score >= 50) {
      setUrgencyClass({ bg: "bg-blue-50/60 dark:bg-blue-950/20", text: "text-blue-700 dark:text-blue-400", border: "border-blue-100 dark:border-blue-900/40" });
    } else {
      setUrgencyClass({ bg: "bg-slate-50 dark:bg-slate-800", text: "text-slate-600 dark:text-slate-450", border: "border-slate-200 dark:border-slate-700" });
    }
  }, [task.aiScore, task.isCompleted]);

  // Get color for category
  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "study": return "bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-900/40";
      case "work": return "bg-sky-50 text-sky-700 border-sky-100 dark:bg-sky-950/30 dark:text-sky-400 dark:border-sky-900/40";
      case "bills": return "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/40";
      case "personal": return "bg-violet-50 text-violet-700 border-violet-100 dark:bg-violet-950/30 dark:text-violet-400 dark:border-violet-900/40";
      default: return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
    }
  };

  const getPriorityBorder = (priority: string) => {
    if (task.isCompleted) return "border-slate-100 dark:border-slate-800/40";
    switch (priority) {
      case "high": return "border-l-4 border-l-rose-500 border-slate-200/80 dark:border-slate-800";
      case "medium": return "border-l-4 border-l-amber-500 border-slate-200/80 dark:border-slate-800";
      case "low": return "border-l-4 border-l-blue-400 border-slate-200/80 dark:border-slate-800";
      default: return "border-slate-200/80 dark:border-slate-800";
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    if (task.isCompleted) {
      return "bg-slate-50 text-slate-400 border-slate-100 dark:bg-slate-800/40 dark:text-slate-500 dark:border-slate-800";
    }
    switch (priority) {
      case "high":
        return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/40";
      case "medium":
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/45";
      case "low":
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/40";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -16, y: 6 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, x: 16, scale: 0.95 }}
      transition={{ 
        type: "spring",
        stiffness: 280,
        damping: 24,
        mass: 0.8
      }}
      className={`bg-white rounded-xl border ${
        isSelected 
          ? "border-indigo-500 bg-indigo-50/15 dark:border-indigo-500/50 dark:bg-indigo-950/10 shadow-2xs" 
          : getPriorityBorder(task.priority)
      } hover:shadow-md transition-all p-4 mb-3 dark:bg-slate-900 dark:border-slate-800 dark:hover:shadow-indigo-950/10`}
      id={`task-card-${task.id}`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Multi-select Checkbox */}
        {isSelectionMode && (
          <button
            type="button"
            onClick={() => onSelect?.(task.id, !isSelected)}
            className="mt-1 mr-1 flex-shrink-0 text-slate-400 hover:text-indigo-600 active:scale-90 transition-all cursor-pointer dark:hover:text-indigo-400"
            id={`select-btn-${task.id}`}
            title={isSelected ? "Deselect task" : "Select task"}
          >
            {isSelected ? (
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 450, damping: 20 }}
              >
                <CheckSquare className="w-5.5 h-5.5 text-indigo-600 fill-indigo-50/40 dark:text-indigo-400 dark:fill-indigo-950/20" />
              </motion.div>
            ) : (
              <Square className="w-5.5 h-5.5 text-slate-300 hover:text-indigo-500 dark:text-slate-600 dark:hover:text-indigo-400" />
            )}
          </button>
        )}

        {/* Checkbox to Complete */}
        <button
          onClick={() => onToggleComplete(task.id, !task.isCompleted)}
          className="mt-1 flex-shrink-0 text-slate-400 hover:text-indigo-600 active:scale-90 transition-all cursor-pointer dark:hover:text-indigo-400"
          id={`complete-btn-${task.id}`}
          title={task.isCompleted ? "Mark active" : "Mark completed"}
        >
          {task.isCompleted ? (
            <CheckCircle2 className="w-5.5 h-5.5 text-indigo-600 fill-indigo-50 dark:text-indigo-400 dark:fill-indigo-950/50" />
          ) : (
            <Circle className="w-5.5 h-5.5 hover:stroke-indigo-600 dark:hover:stroke-indigo-400" />
          )}
        </button>

        {/* Task Details */}
        <div className="flex-grow min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${getCategoryColor(task.category)}`}>
              {task.category}
            </span>
            <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${getPriorityBadgeColor(task.priority)}`}>
              {task.priority} Priority
            </span>
            {task.googleEventId && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded px-2 py-0.5 shadow-2xs dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/40" title="Successfully synchronized to your Google Calendar">
                <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                Google Synced
              </span>
            )}
            {!task.isCompleted && (
              <span className={`flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded-full ${urgencyClass.bg} ${urgencyClass.text} border ${urgencyClass.border}`}>
                <Clock className="w-3 h-3" />
                {timeLeft}
              </span>
            )}
          </div>

          <h3 className={`text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-150 ${task.isCompleted ? "line-through text-slate-400 font-normal dark:text-slate-500" : ""}`}>
            {task.title}
          </h3>

          {task.isCompleted && task.completedAt && (
            <p className="text-[11px] font-mono font-medium text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1" id={`completed-at-${task.id}`}>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              Completed: {new Date(task.completedAt).toLocaleDateString([], { month: "short", day: "numeric" })} at {new Date(task.completedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
          )}

          {task.tags && task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1.5" id={`task-tags-container-${task.id}`}>
              {task.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-slate-50 text-slate-500 border border-slate-200/60 dark:bg-slate-850 dark:text-slate-400 dark:border-slate-800"
                  id={`task-tag-${task.id}-${tag}`}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3 mt-2 text-xs text-slate-500 font-medium dark:text-slate-400">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Due: {new Date(task.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({new Date(task.deadline).toLocaleDateString([], { month: 'short', day: 'numeric' })})
            </span>
            <span>•</span>
            <span>Est: {task.estimatedMinutes}m</span>
          </div>
        </div>

        {/* AI score & actions */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          {/* AI Score Badge */}
          {!task.isCompleted && task.aiScore !== undefined && (
            <div 
              className={`flex flex-col items-center justify-center w-11 h-11 rounded-xl border font-mono ${
                task.aiScore >= 90 
                  ? "bg-rose-50 text-rose-700 border-rose-200 shadow-sm shadow-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/40 dark:shadow-none" 
                  : task.aiScore >= 70 
                    ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/45" 
                    : "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-355 dark:border-slate-700"
              }`}
              id={`ai-score-${task.id}`}
              title="AI cognitive urgency score (0-100)"
            >
              <span className="text-[10px] uppercase tracking-wider font-sans font-bold leading-none mb-0.5 text-slate-450 dark:text-slate-500">Score</span>
              <span className="text-sm font-bold leading-none">{task.aiScore}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 hover:bg-slate-100 active:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-lg transition-colors cursor-pointer dark:hover:bg-slate-800 dark:active:bg-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              title="Toggle Details & AI recommendations"
              id={`expand-btn-${task.id}`}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {!task.isCompleted && (
              <button
                onClick={() => {
                  setShowSmartReschedule(!showSmartReschedule);
                  setShowSnoozeMenu(false);
                  if (!showSmartReschedule) {
                    fetchSmartReschedule();
                  }
                }}
                className={`px-2 py-1 rounded-lg transition-all font-mono text-[10px] font-bold cursor-pointer flex items-center gap-1 border ${
                  showSmartReschedule
                    ? "bg-indigo-50 border-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-900/40 dark:text-indigo-300"
                    : "bg-white border-slate-200/60 hover:bg-indigo-50/40 text-indigo-600 dark:bg-slate-800 dark:border-slate-700/60 dark:text-indigo-400 dark:hover:bg-indigo-950/20"
                }`}
                title="AI Smart Reschedule suggestion"
                id={`smart-reschedule-btn-${task.id}`}
              >
                <Sparkles className="w-3 h-3 text-indigo-500" />
                <span>AI Reschedule</span>
              </button>
            )}
            <button
              onClick={() => {
                setShowSnoozeMenu(!showSnoozeMenu);
                setShowSmartReschedule(false);
              }}
              className="p-1.5 hover:bg-slate-100 active:bg-slate-200 text-slate-500 hover:text-indigo-600 rounded-lg transition-colors font-mono text-[11px] font-bold cursor-pointer dark:hover:bg-slate-800 dark:active:bg-slate-700 dark:text-slate-400 dark:hover:text-indigo-400"
              title="Quick Snooze Deadline"
              id={`snooze-btn-${task.id}`}
            >
              Snooze
            </button>
            <button
              onClick={() => onDelete(task.id)}
              className="p-1.5 hover:bg-rose-50 active:bg-rose-100 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer dark:hover:bg-rose-950/20 dark:hover:text-rose-450"
              title="Delete task"
              id={`delete-btn-${task.id}`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Smart Reschedule Panel */}
      <AnimatePresence>
        {showSmartReschedule && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 border-t border-slate-100 pt-3 dark:border-slate-800"
            id={`smart-reschedule-panel-${task.id}`}
          >
            <div className="bg-gradient-to-r from-indigo-50/50 to-purple-50/50 border border-indigo-100/30 p-3 rounded-xl dark:from-indigo-950/10 dark:to-purple-950/10 dark:border-indigo-950/40">
              <div className="flex items-center gap-1.5 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">AI Cognitive Slot Finder</span>
              </div>
              
              {isSuggesting ? (
                <div className="flex items-center gap-2 py-2 text-slate-500 dark:text-slate-400">
                  <div className="w-3.5 h-3.5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-semibold">Analyzing commitments & finding best slot...</span>
                </div>
              ) : suggestion ? (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white/80 p-2.5 rounded-lg border border-slate-100 dark:bg-slate-900/60 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-emerald-500 animate-pulse" />
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Suggested Slot</div>
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {new Date(suggestion.suggestedDeadline).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} at {new Date(suggestion.suggestedDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                    
                    <button
                      type="button"
                      disabled={isApplyingReschedule}
                      onClick={() => handleApplySmartReschedule(suggestion.suggestedDeadline)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm hover:shadow transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1 dark:bg-indigo-500 dark:hover:bg-indigo-650"
                    >
                      {isApplyingReschedule ? "Applying..." : "Accept Slot"}
                    </button>
                  </div>

                  <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300 font-medium italic">
                    "{suggestion.rationale}"
                  </p>
                </div>
              ) : (
                <div className="text-xs text-rose-500 font-semibold py-1">
                  Could not retrieve reschedule recommendation. Please try again.
                </div>
              )}

              <div className="mt-2.5 flex justify-end gap-2 border-t border-slate-100/50 pt-2 dark:border-slate-800/30">
                <button
                  type="button"
                  onClick={fetchSmartReschedule}
                  disabled={isSuggesting}
                  className="px-2 py-1 text-[10px] font-bold bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-lg transition-colors cursor-pointer dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-750"
                >
                  Recalculate
                </button>
                <button
                  type="button"
                  onClick={() => setShowSmartReschedule(false)}
                  className="px-2 py-1 text-[10px] font-bold bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 rounded-lg transition-colors cursor-pointer dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-850"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Snooze Dropdown Panel */}
      <AnimatePresence>
        {showSnoozeMenu && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 border-t border-slate-100 pt-3 flex flex-wrap gap-2 justify-end dark:border-slate-800"
            id={`snooze-menu-${task.id}`}
          >
            <span className="text-xs text-slate-500 self-center font-medium mr-auto dark:text-slate-400">Delay deadline by:</span>
            {[
              { label: "+1 Hour", val: 1 },
              { label: "+3 Hours", val: 3 },
              { label: "+24 Hours", val: 24 }
            ].map((opt) => (
              <button
                key={opt.val}
                onClick={() => {
                  onSnooze(task.id, opt.val);
                  setShowSnoozeMenu(false);
                }}
                className="px-2.5 py-1 text-xs font-semibold bg-slate-50 hover:bg-indigo-50 border border-slate-200 text-slate-700 hover:text-indigo-700 rounded-md hover:border-indigo-200 transition-colors cursor-pointer dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-indigo-950/40 dark:hover:text-indigo-400 dark:hover:border-indigo-900/60"
              >
                {opt.label}
              </button>
            ))}
            <button
              onClick={() => setShowSnoozeMenu(false)}
              className="px-2.5 py-1 text-xs font-semibold bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 rounded-md transition-colors cursor-pointer dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expandable Details & AI Advice */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
            id={`details-panel-${task.id}`}
          >
            <div className="mt-4 pt-3 border-t border-slate-100 text-xs sm:text-sm dark:border-slate-800">
              {/* Task Notes */}
              {task.notes && (
                <div className="mb-3 bg-slate-50/60 border border-slate-100 p-3 rounded-lg text-slate-700 dark:bg-slate-800/40 dark:border-slate-800 dark:text-slate-300">
                  <h4 className="font-bold text-[11px] uppercase tracking-wider text-slate-400 mb-1 dark:text-slate-500">Notes / Instructions</h4>
                  <p className="whitespace-pre-wrap font-medium">{task.notes}</p>
                </div>
              )}

              {/* AI Proactive recommendation */}
              {!task.isCompleted && task.aiRecommendation && (
                <div className="bg-gradient-to-r from-indigo-50/80 to-purple-50/80 border border-indigo-100/60 p-3 rounded-lg text-slate-800 flex items-start gap-2.5 shadow-sm dark:from-indigo-950/20 dark:to-purple-950/20 dark:border-indigo-900/40 dark:text-slate-200">
                  <div className="p-1 bg-white text-indigo-500 rounded-md border border-indigo-100 shadow-sm mt-0.5 flex-shrink-0 dark:bg-slate-800 dark:border-indigo-900/50 dark:text-indigo-400">
                    <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[10px] uppercase tracking-wider text-indigo-600 leading-none mb-1 dark:text-indigo-400">Proactive AI Shield Recommendation</h4>
                    <p className="font-medium text-slate-850 leading-relaxed text-xs dark:text-slate-300">
                      {task.aiRecommendation}
                    </p>
                  </div>
                </div>
              )}

              {/* Google Calendar Sync Action */}
              {isGoogleConnected && !task.isCompleted && (
                <div className={`mt-3 flex items-center justify-between gap-3 p-2.5 rounded-lg text-[11px] shadow-3xs ${
                  task.googleEventId 
                    ? "bg-emerald-50/50 border border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/40" 
                    : "bg-rose-50/50 border border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/40"
                }`}>
                  <span className={`font-semibold flex items-center gap-1.5 ${
                    task.googleEventId ? "text-emerald-800 dark:text-emerald-400" : "text-rose-800 dark:text-rose-400"
                  }`}>
                    <Calendar className={`w-3.5 h-3.5 ${task.googleEventId ? "text-emerald-500" : "text-rose-500"}`} />
                    {task.googleEventId ? "Deadline successfully synced to Google Calendar!" : "Sync deadline with Google Calendar?"}
                  </span>
                  <button
                    type="button"
                    onClick={handleSyncTask}
                    disabled={isSyncingToGoogle}
                    className={`px-2.5 py-1 font-bold text-white rounded-md transition-colors cursor-pointer flex-shrink-0 text-[10.5px] ${
                      task.googleEventId 
                        ? "bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700" 
                        : "bg-rose-500 hover:bg-rose-600 active:bg-rose-700"
                    } disabled:opacity-50`}
                  >
                    {syncSuccess ? "✓ Synced!" : isSyncingToGoogle ? "Syncing..." : task.googleEventId ? "Re-sync Deadline" : "Sync Deadline"}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
