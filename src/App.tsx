import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { PlusCircle, Calendar, ClipboardList, Zap, ArrowRight, Shield, CheckCircle2, Search, X, FolderTree, ChevronDown, ChevronRight, Download, Bell, BellOff } from "lucide-react";

import Header from "./components/Header";
import TaskCard from "./components/TaskCard";
import AiAdvisor from "./components/AiAdvisor";
import CalendarItinerary from "./components/CalendarItinerary";
import HabitTracker from "./components/HabitTracker";
import VoiceAssistant from "./components/VoiceAssistant";
import ShieldModeOverlay from "./components/ShieldModeOverlay";
import TaskCategoryChart from "./components/TaskCategoryChart";
import WeeklyActivity from "./components/WeeklyActivity";
import { EmptyPendingIllustration, EmptyCompletedIllustration, EmptySearchIllustration } from "./components/EmptyStateIllustration";

import { Task, Habit, ItineraryItem, AppData } from "./types";

export default function App() {
  // Theme State
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("theme") as "light" | "dark") || "light";
    }
    return "light";
  });

  const handleToggleTheme = () => {
    setTheme((prev) => {
      const next = prev === "light" ? "dark" : "light";
      localStorage.setItem("theme", next);
      return next;
    });
  };

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  // Application Data States
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [itinerary, setItinerary] = useState<ItineraryItem[]>([]);
  const [generalAdvice, setGeneralAdvice] = useState("");

  // Loading & Action States
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPrioritizing, setIsPrioritizing] = useState(false);
  const [isGeneratingSchedule, setIsGeneratingSchedule] = useState(false);
  const [shieldMode, setShieldMode] = useState(false);

  // Browser Notification State
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      return Notification.permission;
    }
    return "default";
  });

  const alertedTasksRef = React.useRef<Set<string>>(new Set());

  // Function to request notification permission
  const requestNotificationPermission = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      alert("This browser does not support desktop notifications.");
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      setNotifPermission(permission);
      if (permission === "granted") {
        new Notification("Clutch Notifications Enabled!", {
          body: "You will now receive alerts for deadlines within 30 minutes.",
          icon: "/favicon.ico",
        });
      }
    } catch (err) {
      console.error("Failed to request notification permission:", err);
    }
  };

  // Function to send a test notification
  const sendTestNotification = () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission === "granted") {
      new Notification("Clutch Deadline Test!", {
        body: "Success! Notification alerting is live and active.",
        icon: "/favicon.ico",
      });
    } else {
      requestNotificationPermission();
    }
  };

  // Notification Monitor Effect for approaching deadlines
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window) || notifPermission !== "granted") {
      return;
    }

    const checkDeadlines = () => {
      const now = new Date();
      tasks.forEach((task) => {
        if (task.isCompleted) return;

        const deadlineTime = new Date(task.deadline);
        const diffMs = deadlineTime.getTime() - now.getTime();
        const diffMins = diffMs / (1000 * 60);

        // Alert if deadline is in less than 30 minutes and is still in the future or very recently passed (within last 1 minute)
        if (diffMins > -1 && diffMins <= 30) {
          if (!alertedTasksRef.current.has(task.id)) {
            new Notification("Task Deadline Approaching!", {
              body: `"${task.title}" is due in ${Math.max(0, Math.round(diffMins))} minutes!`,
              icon: "/favicon.ico",
              tag: `deadline-${task.id}`,
              requireInteraction: true,
            });
            alertedTasksRef.current.add(task.id);
          }
        }
      });
    };

    // Run check immediately when tasks update
    checkDeadlines();

    // Also poll every 10 seconds to catch ticks
    const interval = setInterval(checkDeadlines, 10000);
    return () => clearInterval(interval);
  }, [tasks, notifPermission]);

  // Tab View
  const [activeTab, setActiveTab] = useState<"pending" | "completed">("pending");

  // Search filtering for tasks
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Group by category options
  const [groupByCategory, setGroupByCategory] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  // Sorting options for pending tasks
  const [sortBy, setSortBy] = useState<"earliest" | "latest" | "priority">("earliest");

  const CATEGORY_DETAILS: Record<string, { label: string; emoji: string; colorClass: string; bgClass: string }> = {
    study: { label: "Study / Class", emoji: "🎓", colorClass: "text-indigo-600 border-indigo-100 dark:text-indigo-400 dark:border-indigo-900/40", bgClass: "bg-indigo-50 dark:bg-indigo-950/20" },
    work: { label: "Work / Job", emoji: "💼", colorClass: "text-amber-600 border-amber-100 dark:text-amber-400 dark:border-amber-900/40", bgClass: "bg-amber-50 dark:bg-amber-950/20" },
    bills: { label: "Bills / Finance", emoji: "💳", colorClass: "text-rose-600 border-rose-100 dark:text-rose-400 dark:border-rose-900/40", bgClass: "bg-rose-50 dark:bg-rose-950/20" },
    personal: { label: "Personal / Health", emoji: "🏡", colorClass: "text-emerald-600 border-emerald-100 dark:text-emerald-400 dark:border-emerald-900/40", bgClass: "bg-emerald-50 dark:bg-emerald-950/20" },
    other: { label: "Other", emoji: "☕", colorClass: "text-purple-600 border-purple-100 dark:text-purple-400 dark:border-purple-900/40", bgClass: "bg-purple-50 dark:bg-purple-950/20" },
  };

  const getCategoryDetail = (cat: string) => {
    const normalized = (cat || "other").toLowerCase();
    return CATEGORY_DETAILS[normalized] || CATEGORY_DETAILS["other"];
  };

  const toggleCategoryCollapse = (category: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  // New Task Form
  const [showAddTaskForm, setShowAddTaskForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    deadlineDate: "2026-06-24",
    deadlineTime: "23:30",
    category: "study" as "study" | "work" | "bills" | "personal" | "other",
    priority: "high" as "high" | "medium" | "low",
    estimatedMinutes: 60,
    notes: "",
    tagsInput: "",
  });

  // Fetch initial data from server
  const fetchData = async (showPulseSync = false) => {
    if (showPulseSync) setIsSyncing(true);
    try {
      const response = await fetch("/api/data");
      const data: AppData = await response.json();
      setTasks(data.tasks || []);
      setHabits(data.habits || []);
      setItinerary(data.itinerary || []);
      setGeneralAdvice(data.generalAdvice || "");
    } catch (err) {
      console.error("Failed to fetch synchronized server state:", err);
    } finally {
      setLoading(false);
      if (showPulseSync) {
        setTimeout(() => setIsSyncing(false), 500); // smooth indicator duration
      }
    }
  };

  useEffect(() => {
    fetchData();

    // Setup 5-second polling interval for real-time multi-device cross-platform synchronization!
    const pollInterval = setInterval(() => {
      fetchData(true);
    }, 5000);

    return () => clearInterval(pollInterval);
  }, []);

  // Task Actions
  const handleToggleComplete = async (id: string, isCompleted: boolean) => {
    try {
      const completedAt = isCompleted ? new Date().toISOString() : undefined;
      // Optimistic update
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, isCompleted, completedAt } : t))
      );

      await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCompleted, completedAt }),
      });
      fetchData(true);
    } catch (err) {
      console.error("Task state sync failed:", err);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      setTasks((prev) => prev.filter((t) => t.id !== id));
      await fetch(`/api/tasks/${id}`, {
        method: "DELETE",
      });
      fetchData(true);
    } catch (err) {
      console.error("Task deletion sync failed:", err);
    }
  };

  const handleSnoozeTask = async (id: string, hours: number) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    const currentDeadline = new Date(task.deadline);
    currentDeadline.setHours(currentDeadline.getHours() + hours);
    const newDeadlineISO = currentDeadline.toISOString();

    try {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, deadline: newDeadlineISO, aiScore: Math.max(10, (t.aiScore || 50) - 15) } : t
        )
      );

      await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deadline: newDeadlineISO,
          // Snoozing a deadline reduces the priority/urgency score temporarily
          aiScore: Math.max(10, (task.aiScore || 50) - 15),
          aiRecommendation: "Deadline temporarily snoozed. Focus on immediate buffer blocks before this climbs back up."
        }),
      });
      fetchData(true);
    } catch (err) {
      console.error("Task snooze sync failed:", err);
    }
  };

  const handleExportCSV = () => {
    if (tasks.length === 0) return;

    // Header columns
    const headers = ["Title", "Deadline", "Category", "Priority", "Estimated Minutes", "Status", "Notes"];

    // Rows
    const rows = tasks.map((task) => [
      task.title,
      task.deadline,
      task.category,
      task.priority,
      task.estimatedMinutes.toString(),
      task.isCompleted ? "Completed" : "Pending",
      task.notes || "",
    ]);

    // Helper to escape CSV values correctly
    const escapeCSV = (val: string) => {
      const escaped = val.replace(/"/g, '""');
      if (escaped.includes(",") || escaped.includes("\n") || escaped.includes('"')) {
        return `"${escaped}"`;
      }
      return escaped;
    };

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map(escapeCSV).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `clutch_deadlines_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreateTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    // Build ISO Date String representing the combined date + time
    const combinedISOString = new Date(`${formData.deadlineDate}T${formData.deadlineTime}:00-07:00`).toISOString();

    // Parse tags from tagsInput (split by commas/spaces, strip '#' and trim)
    const parsedTags = formData.tagsInput
      .split(/[\s,]+/)
      .map((tag) => tag.trim().replace(/^#+/, ""))
      .filter((tag) => tag.length > 0);

    try {
      setIsSyncing(true);
      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          deadline: combinedISOString,
          category: formData.category,
          priority: formData.priority,
          estimatedMinutes: formData.estimatedMinutes,
          notes: formData.notes,
          tags: parsedTags,
        }),
      });

      // Clear Form & Close Panel
      setFormData({
        title: "",
        deadlineDate: "2026-06-24",
        deadlineTime: "23:30",
        category: "study",
        priority: "high",
        estimatedMinutes: 60,
        notes: "",
        tagsInput: "",
      });
      setShowAddTaskForm(false);
      fetchData(true);
    } catch (err) {
      console.error("Failed to add task:", err);
    }
  };

  // Habit Actions
  const handleAddHabit = async (title: string, category: string) => {
    try {
      setIsSyncing(true);
      await fetch("/api/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, category }),
      });
      fetchData(true);
    } catch (err) {
      console.error("Failed to add habit:", err);
    }
  };

  const handleLogHabit = async (id: string) => {
    const habit = habits.find((h) => h.id === id);
    if (!habit) return;

    const todayStr = "2026-06-24"; // System static mock date
    const newStreak = habit.streak + 1;

    try {
      setHabits((prev) =>
        prev.map((h) => (h.id === id ? { ...h, streak: newStreak, lastCompleted: todayStr } : h))
      );

      await fetch(`/api/habits/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          streak: newStreak,
          lastCompleted: todayStr,
        }),
      });
      fetchData(true);
    } catch (err) {
      console.error("Failed to log habit streak:", err);
    }
  };

  const handleDeleteHabit = async (id: string) => {
    try {
      setHabits((prev) => prev.filter((h) => h.id !== id));
      await fetch(`/api/habits/${id}`, {
        method: "DELETE",
      });
      fetchData(true);
    } catch (err) {
      console.error("Failed to delete habit:", err);
    }
  };

  // AI Orchestration
  const handleAIRequestPrioritize = async () => {
    setIsPrioritizing(true);
    try {
      const response = await fetch("/api/ai/prioritize", {
        method: "POST",
      });
      const data = await response.json();
      if (data.success) {
        setTasks(data.updatedTasks || []);
        setGeneralAdvice(data.generalAdvice || "");
      }
    } catch (err) {
      console.error("AI prioritization failed:", err);
    } finally {
      setIsPrioritizing(false);
    }
  };

  const handleAIRequestSchedule = async (startHour: string, endHour: string) => {
    setIsGeneratingSchedule(true);
    try {
      const response = await fetch("/api/ai/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startHour, endHour }),
      });
      const data = await response.json();
      if (data.itinerary) {
        setItinerary(data.itinerary);
      }
    } catch (err) {
      console.error("AI schedule optimization failed:", err);
    } finally {
      setIsGeneratingSchedule(false);
    }
  };

  // Get all unique tags dynamically from tasks
  const allTags = React.useMemo(() => {
    const tagsSet = new Set<string>();
    tasks.forEach((t) => {
      if (t.tags && Array.isArray(t.tags)) {
        t.tags.forEach((tag) => {
          if (tag.trim()) {
            tagsSet.add(tag.trim());
          }
        });
      }
    });
    return Array.from(tagsSet);
  }, [tasks]);

  // Filter and sort tasks by proximity, search query, and selected tag filter
  const filteredTasks = tasks.filter((t) => {
    // 1. Filter by selected tag if set
    if (selectedTag && (!t.tags || !t.tags.includes(selectedTag))) {
      return false;
    }

    // 2. Filter by text search query
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const titleMatch = t.title?.toLowerCase().includes(query);
    const notesMatch = (t.notes || "").toLowerCase().includes(query);
    return titleMatch || notesMatch;
  });

  const pendingTasks = filteredTasks
    .filter((t) => !t.isCompleted)
    .sort((a, b) => {
      if (sortBy === "earliest") {
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      } else if (sortBy === "latest") {
        return new Date(b.deadline).getTime() - new Date(a.deadline).getTime();
      } else if (sortBy === "priority") {
        const priorityWeight = { high: 3, medium: 2, low: 1 };
        const weightA = priorityWeight[a.priority as "high" | "medium" | "low"] || 0;
        const weightB = priorityWeight[b.priority as "high" | "medium" | "low"] || 0;
        if (weightB !== weightA) {
          return weightB - weightA; // highest first
        }
        // tie breaker: earliest deadline
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      }
      return 0;
    });

  const completedTasks = filteredTasks.filter((t) => t.isCompleted);

  const totalTasksCount = tasks.length;
  const completedTasksCount = tasks.filter((t) => t.isCompleted).length;
  const completionPercentage = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  const groupedTasks = React.useMemo(() => {
    const groups: Record<string, Task[]> = {};
    const list = activeTab === "pending" ? pendingTasks : completedTasks;
    list.forEach((task) => {
      const cat = task.category || "other";
      if (!groups[cat]) {
        groups[cat] = [];
      }
      groups[cat].push(task);
    });
    return groups;
  }, [activeTab, pendingTasks, completedTasks]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-800 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-300">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" id="initial-loading"></div>
          <p className="font-display text-sm font-semibold tracking-tight text-slate-500 dark:text-slate-400 animate-pulse">
            Connecting to synchronized deadline vault...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16 relative dark:bg-slate-950 dark:text-slate-100 transition-colors duration-300" id="app-root-container">
      {/* Immersive Shield Mode Overlay */}
      <AnimatePresence>
        {shieldMode && (
          <ShieldModeOverlay
            tasks={tasks}
            onClose={() => setShieldMode(false)}
            onCompleteTask={(id) => handleToggleComplete(id, true)}
          />
        )}
      </AnimatePresence>

      {/* Main App Layout */}
      <Header tasks={tasks} isSyncing={isSyncing} onSync={() => fetchData(true)} theme={theme} onToggleTheme={handleToggleTheme} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT SECTION: Task List & Management (Grid Span: 7) */}
          <div className="lg:col-span-7 flex flex-col" id="dashboard-left-panel">
            {/* Task Area Header */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm mb-6 dark:bg-slate-900 dark:border-slate-800">
              <div className="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-50 dark:border-slate-800/60">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-900/60">
                    <ClipboardList className="w-5 h-5 text-indigo-500" />
                  </div>
                  <div>
                    <h2 className="font-display text-lg font-bold text-slate-950 dark:text-slate-100">My Deadlines</h2>
                    <p className="text-xs text-slate-400 font-medium dark:text-slate-400">Keep sync across your mobile & desktop active</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportCSV}
                    disabled={tasks.length === 0}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:scale-[1.01] cursor-pointer border ${
                      tasks.length === 0
                        ? "bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed dark:bg-slate-900/40 dark:text-slate-600 dark:border-slate-800/80"
                        : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-200 dark:border-slate-700"
                    }`}
                    id="export-tasks-csv-btn"
                    title={tasks.length === 0 ? "No deadlines to export" : "Export all deadlines to CSV"}
                  >
                    <Download className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                    Export to CSV
                  </button>

                  <button
                    onClick={() => setShowAddTaskForm(!showAddTaskForm)}
                    className="flex items-center gap-1 px-3.5 py-1.5 bg-slate-950 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all hover:scale-[1.01] cursor-pointer dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border dark:border-slate-700"
                    id="toggle-add-task-btn"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-rose-400" />
                    New Deadline
                  </button>
                </div>
              </div>

              {/* Task Completion Progress Bar */}
              <div className="mb-5 bg-slate-50/60 border border-slate-100/80 p-4 rounded-xl dark:bg-slate-800/20 dark:border-slate-800/50 animate-fade-in" id="deadlines-progress-container">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                    Overall Progress
                  </span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                    {completedTasksCount} / {totalTasksCount} completed ({completionPercentage}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden dark:bg-slate-800" id="deadlines-progress-bar-bg">
                  <motion.div
                    className="bg-emerald-500 h-2.5 rounded-full"
                    id="deadlines-progress-bar-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${completionPercentage}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>

                {/* Notification API controller */}
                <div className="mt-3 pt-3 border-t border-slate-150 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 text-[11px]" id="browser-notifications-control">
                  <div className="flex items-center gap-1.5">
                    {notifPermission === "granted" ? (
                      <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                        </span>
                        Active Alerting (&lt;30m)
                      </span>
                    ) : notifPermission === "denied" ? (
                      <span className="flex items-center gap-1.5 text-rose-500 font-bold">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
                        Notifications Blocked
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-slate-400 font-bold">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-750"></span>
                        Notifications Inactive
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {notifPermission !== "granted" ? (
                      <button
                        type="button"
                        onClick={requestNotificationPermission}
                        className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg font-bold border border-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 dark:text-indigo-400 dark:border-indigo-900/40 cursor-pointer transition-all flex items-center gap-1"
                        id="enable-notifications-btn"
                      >
                        <Bell className="w-3 h-3" />
                        Enable Notifications
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={sendTestNotification}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold border border-slate-200/60 dark:bg-slate-850 dark:hover:bg-slate-800 dark:text-slate-300 dark:border-slate-800 cursor-pointer transition-all flex items-center gap-1"
                        id="test-notifications-btn"
                      >
                        <Zap className="w-3 h-3 text-amber-500 animate-pulse" />
                        Test Alarm
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Add Task Drawer Panel */}
              <AnimatePresence>
                {showAddTaskForm && (
                  <motion.form
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    onSubmit={handleCreateTaskSubmit}
                    className="bg-slate-50 border border-slate-100/80 p-5 rounded-2xl mb-4 text-xs space-y-4 overflow-hidden dark:bg-slate-800/50 dark:border-slate-750"
                    id="new-task-form"
                  >
                    <h3 className="font-bold text-slate-900 border-b border-slate-200/50 pb-2 flex items-center gap-1.5 text-xs uppercase tracking-wider text-indigo-600 dark:text-slate-100 dark:border-slate-700">
                      <Zap className="w-3.5 h-3.5 text-indigo-500" />
                      Quick Capture Deadline
                    </h3>

                    {/* Row 1: Title */}
                    <div>
                      <label className="block text-slate-500 font-bold mb-1 uppercase tracking-wider text-[9px] dark:text-slate-400">Goal / Task Name</label>
                      <input
                        type="text"
                        placeholder="e.g. CS 101 Midterm report upload"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 font-medium focus:outline-none focus:border-indigo-500 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 dark:focus:border-indigo-500"
                        required
                      />
                    </div>

                    {/* Row 2: Date & Time */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-500 font-bold mb-1 uppercase tracking-wider text-[9px] dark:text-slate-400">Due Date</label>
                        <input
                          type="date"
                          value={formData.deadlineDate}
                          onChange={(e) => setFormData({ ...formData, deadlineDate: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 font-medium focus:outline-none focus:border-indigo-500 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 dark:focus:border-indigo-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 font-bold mb-1 uppercase tracking-wider text-[9px] dark:text-slate-400">Due Time</label>
                        <input
                          type="time"
                          value={formData.deadlineTime}
                          onChange={(e) => setFormData({ ...formData, deadlineTime: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 font-medium focus:outline-none focus:border-indigo-500 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 dark:focus:border-indigo-500"
                          required
                        />
                      </div>
                    </div>

                    {/* Row 3: Category & Priority */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-500 font-bold mb-1 uppercase tracking-wider text-[9px] dark:text-slate-400">Category</label>
                        <select
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 font-medium focus:outline-none focus:border-indigo-500 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 dark:focus:border-indigo-500"
                        >
                          <option value="study">🎓 Study / Class</option>
                          <option value="work">💼 Work / Job</option>
                          <option value="bills">💳 Bills / Finance</option>
                          <option value="personal">🏡 Personal / Health</option>
                          <option value="other">☕ Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-500 font-bold mb-1 uppercase tracking-wider text-[9px] dark:text-slate-400">Manual Priority</label>
                        <select
                          value={formData.priority}
                          onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 font-medium focus:outline-none focus:border-indigo-500 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 dark:focus:border-indigo-500"
                        >
                          <option value="high">🔴 High Urgency</option>
                          <option value="medium">🟡 Medium</option>
                          <option value="low">🔵 Low Consequence</option>
                        </select>
                      </div>
                    </div>

                    {/* Row 4: Estimate */}
                    <div>
                      <label className="block text-slate-500 font-bold mb-1 uppercase tracking-wider text-[9px] dark:text-slate-400">Estimated Minutes Required</label>
                      <input
                        type="number"
                        min="5"
                        max="480"
                        value={formData.estimatedMinutes}
                        onChange={(e) => setFormData({ ...formData, estimatedMinutes: Number(e.target.value) })}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 font-medium focus:outline-none focus:border-indigo-500 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 dark:focus:border-indigo-500"
                        required
                      />
                    </div>

                    {/* Row 5: Notes */}
                    <div>
                      <label className="block text-slate-500 font-bold mb-1 uppercase tracking-wider text-[9px] dark:text-slate-400">Reference Notes / Links</label>
                      <textarea
                        rows={2}
                        placeholder="Criteria, URL link to portal, specific questions..."
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 font-medium focus:outline-none focus:border-indigo-500 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 dark:focus:border-indigo-500"
                      />
                    </div>

                    {/* Row 6: Custom Tags */}
                    <div>
                      <label className="block text-slate-500 font-bold mb-1 uppercase tracking-wider text-[9px] dark:text-slate-400">Custom Tags (comma or space separated)</label>
                      <input
                        type="text"
                        placeholder="e.g. #urgent, #review, #home"
                        value={formData.tagsInput}
                        onChange={(e) => setFormData({ ...formData, tagsInput: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 font-medium focus:outline-none focus:border-indigo-500 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 dark:focus:border-indigo-500"
                        id="new-task-tags-input"
                      />
                    </div>

                    <div className="flex gap-2 justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => setShowAddTaskForm(false)}
                        className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg transition-colors cursor-pointer dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-650"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        Capture & Sync
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>

              {/* Search Bar */}
              <div className="relative mb-5" id="task-search-bar">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter deadlines by title or notes..."
                  className="w-full pl-9 pr-9 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200/80 focus:border-indigo-500 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all dark:bg-slate-800 dark:hover:bg-slate-750 dark:focus:bg-slate-900 dark:border-slate-700 dark:text-slate-100 dark:focus:ring-indigo-950/40 dark:placeholder-slate-500"
                  id="task-search-input"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    title="Clear filter"
                    id="clear-task-search-btn"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Custom Tag Filter Pills */}
              {allTags.length > 0 && (
                <div className="mb-5 flex flex-wrap gap-1.5 items-center bg-slate-50/50 p-2.5 rounded-xl border border-slate-100/60 dark:bg-slate-800/10 dark:border-slate-800/30" id="task-tag-filter-container">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mr-1.5 dark:text-slate-500">Filter tags:</span>
                  <button
                    onClick={() => setSelectedTag(null)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedTag === null
                        ? "bg-indigo-600 text-white shadow-xs border border-indigo-600 dark:bg-indigo-500 dark:border-indigo-500"
                        : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-750"
                    }`}
                  >
                    All
                  </button>
                  {allTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 border ${
                        selectedTag === tag
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-xs dark:bg-indigo-500 dark:border-indigo-500"
                          : "bg-white text-slate-600 hover:bg-slate-50 border-slate-200/80 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-750"
                      }`}
                    >
                      <span>#{tag}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Tab navigation */}
              <div className="flex items-center justify-between border-b border-slate-100 text-xs sm:text-sm font-semibold mb-4 gap-4 flex-wrap" id="task-tab-navigation">
                <div className="flex gap-4">
                  <button
                    onClick={() => setActiveTab("pending")}
                    className={`pb-2.5 px-1 border-b-2 transition-all cursor-pointer ${
                      activeTab === "pending"
                        ? "border-b-indigo-600 text-indigo-600"
                        : "border-b-transparent text-slate-400 hover:text-slate-700"
                    }`}
                  >
                    Pending Shield Items ({pendingTasks.length})
                  </button>
                  <button
                    onClick={() => setActiveTab("completed")}
                    className={`pb-2.5 px-1 border-b-2 transition-all cursor-pointer ${
                      activeTab === "completed"
                        ? "border-b-indigo-600 text-indigo-600"
                        : "border-b-transparent text-slate-400 hover:text-slate-700"
                    }`}
                  >
                    Completed Goals ({completedTasks.length})
                  </button>
                </div>

                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {activeTab === "pending" && (
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider hidden sm:inline">Sort:</span>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold focus:outline-none focus:border-indigo-500 cursor-pointer dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-750"
                        id="task-sort-select"
                        title="Sort pending tasks"
                      >
                        <option value="earliest">🕒 Earliest Deadline</option>
                        <option value="latest">🗓️ Latest Deadline</option>
                        <option value="priority">🔥 Highest Priority</option>
                      </select>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setGroupByCategory(!groupByCategory)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
                      groupByCategory
                        ? "bg-indigo-50 border-indigo-200 text-indigo-600 shadow-2xs dark:bg-indigo-950/40 dark:border-indigo-900/40 dark:text-indigo-400"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-750"
                    }`}
                    id="toggle-group-by-category"
                  >
                    <FolderTree className="w-3.5 h-3.5" />
                    Group by Category
                  </button>
                </div>
              </div>

              {/* Task Cards Stack */}
              <div className="space-y-1" id="tasks-stack">
                <AnimatePresence mode="popLayout">
                  {groupByCategory ? (
                    (activeTab === "pending" ? pendingTasks : completedTasks).length > 0 ? (
                      (Object.entries(groupedTasks) as [string, Task[]][]).map(([category, catTasks]) => {
                        const details = getCategoryDetail(category);
                        const isCollapsed = !!collapsedCategories[category];
                        return (
                           <div key={category} className="mb-4 bg-slate-50/40 rounded-2xl border border-slate-100/70 p-3.5 transition-all dark:bg-slate-850/20 dark:border-slate-800/60" id={`category-group-${category}`}>
                            {/* Category Header (collapsible toggle) */}
                            <button
                              type="button"
                              onClick={() => toggleCategoryCollapse(category)}
                              className="w-full flex items-center justify-between text-left font-semibold py-1.5 px-1 select-none hover:bg-slate-100/50 rounded-lg transition-colors cursor-pointer animate-fade-in dark:hover:bg-slate-800/40"
                            >
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${details.bgClass} ${details.colorClass}`}>
                                  {details.emoji} {details.label}
                                </span>
                                <span className="text-[11px] font-mono font-bold text-slate-400 bg-white border border-slate-100 rounded-full px-2 py-0.5 shadow-3xs dark:bg-slate-900 dark:border-slate-800 dark:text-slate-500">
                                  {catTasks.length} {catTasks.length === 1 ? "item" : "items"}
                                </span>
                              </div>
                              <div className="text-slate-400 hover:text-slate-600 transition-colors dark:text-slate-500 dark:hover:text-slate-350">
                                {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </div>
                            </button>

                            {/* Category Tasks List */}
                            <AnimatePresence initial={false}>
                              {!isCollapsed && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="space-y-1 mt-2.5 overflow-hidden"
                                >
                                  {catTasks.map((task) => (
                                    <TaskCard
                                      key={task.id}
                                      task={task}
                                      onToggleComplete={handleToggleComplete}
                                      onDelete={handleDeleteTask}
                                      onSnooze={handleSnoozeTask}
                                      onSyncSuccess={() => fetchData(true)}
                                    />
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })
                    ) : searchQuery ? (
                      activeTab === "pending" ? (
                        <div className="text-center py-10 text-slate-400 animate-fade-in" id="empty-search-pending">
                          <EmptySearchIllustration />
                          <p className="text-xs font-semibold text-slate-500">No pending deadlines match "{searchQuery}"</p>
                          <button
                            type="button"
                            onClick={() => setSearchQuery("")}
                            className="mt-2.5 text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer dark:bg-indigo-950/40 dark:text-indigo-400 dark:hover:bg-indigo-900/40"
                          >
                            Clear Filter
                          </button>
                        </div>
                      ) : (
                        <div className="text-center py-10 text-slate-400 animate-fade-in" id="empty-search-completed">
                          <EmptySearchIllustration />
                          <p className="text-xs font-semibold text-slate-500">No completed goals match "{searchQuery}"</p>
                          <button
                            type="button"
                            onClick={() => setSearchQuery("")}
                            className="mt-2.5 text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer dark:bg-indigo-950/40 dark:text-indigo-400 dark:hover:bg-indigo-900/40"
                          >
                            Clear Filter
                          </button>
                        </div>
                      )
                    ) : activeTab === "pending" ? (
                      <div className="text-center py-12 text-slate-400 animate-fade-in" id="empty-pending">
                        <EmptyPendingIllustration />
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Every single deadline is locked, shielded, and completed!</p>
                        <p className="text-[10px] mt-1.5 text-slate-400 font-medium max-w-xs mx-auto">Add a new goal above or take a deep breathing break to recharge your cognitive focus.</p>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-slate-400 animate-fade-in" id="empty-completed">
                        <EmptyCompletedIllustration />
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No completed tasks in the synchronize vault yet.</p>
                        <p className="text-[10px] mt-1.5 text-slate-400 font-medium max-w-xs mx-auto">Finish active tasks under the Focus Shield to claim and record your cognitive victories.</p>
                      </div>
                    )
                  ) : activeTab === "pending" ? (
                    pendingTasks.length > 0 ? (
                      pendingTasks.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          onToggleComplete={handleToggleComplete}
                          onDelete={handleDeleteTask}
                          onSnooze={handleSnoozeTask}
                          onSyncSuccess={() => fetchData(true)}
                        />
                      ))
                    ) : searchQuery ? (
                      <div className="text-center py-10 text-slate-400 animate-fade-in" id="empty-search-pending">
                        <EmptySearchIllustration />
                        <p className="text-xs font-semibold text-slate-500">No pending deadlines match "{searchQuery}"</p>
                        <button
                          type="button"
                          onClick={() => setSearchQuery("")}
                          className="mt-2.5 text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer dark:bg-indigo-950/40 dark:text-indigo-400 dark:hover:bg-indigo-900/40"
                        >
                          Clear Filter
                        </button>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-slate-400 animate-fade-in" id="empty-pending">
                        <EmptyPendingIllustration />
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Every single deadline is locked, shielded, and completed!</p>
                        <p className="text-[10px] mt-1.5 text-slate-400 font-medium max-w-xs mx-auto">Add a new goal above or take a deep breathing break to recharge your cognitive focus.</p>
                      </div>
                    )
                  ) : (
                    completedTasks.length > 0 ? (
                      completedTasks.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          onToggleComplete={handleToggleComplete}
                          onDelete={handleDeleteTask}
                          onSnooze={handleSnoozeTask}
                          onSyncSuccess={() => fetchData(true)}
                        />
                      ))
                    ) : searchQuery ? (
                      <div className="text-center py-10 text-slate-400 animate-fade-in" id="empty-search-completed">
                        <EmptySearchIllustration />
                        <p className="text-xs font-semibold text-slate-500">No completed goals match "{searchQuery}"</p>
                        <button
                          type="button"
                          onClick={() => setSearchQuery("")}
                          className="mt-2.5 text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer dark:bg-indigo-950/40 dark:text-indigo-400 dark:hover:bg-indigo-900/40"
                        >
                          Clear Filter
                        </button>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-slate-400 animate-fade-in" id="empty-completed">
                        <EmptyCompletedIllustration />
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No completed tasks in the synchronize vault yet.</p>
                        <p className="text-[10px] mt-1.5 text-slate-400 font-medium max-w-xs mx-auto">Finish active tasks under the Focus Shield to claim and record your cognitive victories.</p>
                      </div>
                    )
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* AI Deadline Coach Chat component (Voice/Text) */}
            <VoiceAssistant onTaskCreatedNotification={() => fetchData(true)} />
          </div>

          {/* RIGHT SECTION: AI Advisors & Energy Habits (Grid Span: 5) */}
          <div className="lg:col-span-5 flex flex-col gap-6" id="dashboard-right-panel">
            {/* AI Priority Advisor Heatmap & Controls */}
            <AiAdvisor
              tasks={tasks}
              generalAdvice={generalAdvice}
              isPrioritizing={isPrioritizing}
              onPrioritize={handleAIRequestPrioritize}
              shieldMode={shieldMode}
              setShieldMode={setShieldMode}
            />

            {/* Task Category Distribution Visualization */}
            <TaskCategoryChart tasks={tasks} />

            {/* Weekly Activity Tracker */}
            <WeeklyActivity tasks={tasks} />

            {/* Stress Habits component */}
            <HabitTracker
              habits={habits}
              onAddHabit={handleAddHabit}
              onLogHabit={handleLogHabit}
              onDeleteHabit={handleDeleteHabit}
            />

            {/* AI Calendar Day-Planner itinerary */}
            <CalendarItinerary
              itinerary={itinerary}
              isGenerating={isGeneratingSchedule}
              onGenerate={handleAIRequestSchedule}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
