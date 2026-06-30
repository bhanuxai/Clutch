import { useState, useEffect } from "react";
import { Cloud, RefreshCw, AlertTriangle, Clock, Sun, Moon } from "lucide-react";
import { Task } from "../types";

interface HeaderProps {
  tasks: Task[];
  isSyncing: boolean;
  onSync: () => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
}

export default function Header({ tasks, isSyncing, onSync, theme, onToggleTheme }: HeaderProps) {
  const [timeState, setTimeState] = useState({
    dateStr: "Wednesday, June 24, 2026",
    timeStr: "09:33:11 AM",
  });

  // Keep track of ticking clock starting from the mock date
  useEffect(() => {
    let mockTime = new Date("2026-06-24T09:33:11-07:00").getTime();
    
    const interval = setInterval(() => {
      mockTime += 1000; // Increment by 1 second
      const date = new Date(mockTime);
      
      const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      const formattedDate = date.toLocaleDateString('en-US', options);
      
      const hours = date.getHours();
      const minutes = date.getMinutes().toString().padStart(2, "0");
      const seconds = date.getSeconds().toString().padStart(2, "0");
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const formattedHours = (hours % 12 || 12).toString().padStart(2, "0");
      const formattedTime = `${formattedHours}:${minutes}:${seconds} ${ampm}`;

      setTimeState({
        dateStr: formattedDate,
        timeStr: formattedTime,
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Compute the closest active task
  const activeTasks = tasks.filter((t) => !t.isCompleted);
  const closestTask = activeTasks.reduce<Task | null>((closest, current) => {
    if (!closest) return current;
    return new Date(current.deadline).getTime() < new Date(closest.deadline).getTime() ? current : closest;
  }, null);

  const [timeLeftStr, setTimeLeftStr] = useState("");
  const [isLooming, setIsLooming] = useState(false);

  useEffect(() => {
    if (!closestTask) {
      setTimeLeftStr("No upcoming deadlines");
      setIsLooming(false);
      return;
    }

    const updateTimer = () => {
      const now = new Date("2026-06-24T09:33:11-07:00").getTime(); // fixed system baseline or relative tick
      const deadline = new Date(closestTask.deadline).getTime();
      const diff = deadline - now;

      if (diff <= 0) {
        setTimeLeftStr("DEADLINE EXPIRED");
        setIsLooming(true);
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours < 12) {
          setIsLooming(true);
        } else {
          setIsLooming(false);
        }

        if (hours > 0) {
          setTimeLeftStr(`${hours}h ${mins}m remaining`);
        } else {
          setTimeLeftStr(`${mins}m remaining!`);
        }
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // update every minute
    return () => clearInterval(interval);
  }, [closestTask]);

  return (
    <header className="w-full bg-white border-b border-slate-100 py-5 px-6 sm:px-8 mb-6 dark:bg-slate-900 dark:border-slate-800" id="app-header">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-50 text-rose-500 rounded-xl border border-rose-100 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/60" id="logo-container">
            <Clock className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-950 tracking-tight dark:text-slate-50">
              Clutch
            </h1>
            <p className="text-xs text-slate-500 font-medium dark:text-slate-400">
              The Right Help at the Right Time
            </p>
          </div>
        </div>

        {/* Sync & Simulated Clock & Theme Toggle */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          {/* Simulated Clock Widget */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300" id="time-widget">
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
            <span className="font-mono font-medium">{timeState.dateStr} @ {timeState.timeStr}</span>
          </div>

          {/* Sync Status Button */}
          <button
            onClick={onSync}
            disabled={isSyncing}
            className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 border border-slate-200/60 px-3 py-1.5 rounded-lg text-slate-600 transition-all font-medium disabled:opacity-60 cursor-pointer dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700 dark:text-slate-300"
            id="sync-button"
            title="Force synchronization with server database"
          >
            <Cloud className="w-3.5 h-3.5 text-indigo-500" />
            <span className="font-mono">Synced</span>
            <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${isSyncing ? "animate-spin" : ""}`} />
          </button>

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="flex items-center justify-center p-2 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 border border-slate-200/60 rounded-lg text-slate-600 transition-all cursor-pointer dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700 dark:text-slate-300"
            id="theme-toggle-btn"
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-500" />
            )}
          </button>
        </div>
      </div>

      {/* Looming Urgent Alert Banner */}
      {closestTask && (
        <div 
          className={`max-w-7xl mx-auto mt-4 px-4 py-3 rounded-xl flex items-center justify-between border transition-all ${
            isLooming 
              ? "bg-rose-50/80 border-rose-100 text-rose-900 animate-pulse dark:bg-rose-950/30 dark:border-rose-900/60 dark:text-rose-200" 
              : "bg-amber-50/60 border-amber-100 text-amber-900 dark:bg-amber-950/20 dark:border-amber-900/45 dark:text-amber-200"
          }`}
          id="global-alert-banner"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className={`w-5 h-5 ${isLooming ? "text-rose-500" : "text-amber-500"}`} />
            <div className="text-sm">
              <span className="font-bold">Next Looming Deadline: </span>
              <span className="font-medium underline decoration-2 decoration-rose-300 dark:decoration-rose-800">
                {closestTask.title}
              </span>
            </div>
          </div>
          <div className={`text-xs font-mono font-bold px-2.5 py-1 rounded-md ${
            isLooming 
              ? "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-100" 
              : "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100"
          }`}>
            {timeLeftStr}
          </div>
        </div>
      )}
    </header>
  );
}
