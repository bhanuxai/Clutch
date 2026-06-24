import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { PlusCircle, Calendar, ClipboardList, Zap, ArrowRight, Shield, CheckCircle2 } from "lucide-react";

import Header from "./components/Header";
import TaskCard from "./components/TaskCard";
import AiAdvisor from "./components/AiAdvisor";
import CalendarItinerary from "./components/CalendarItinerary";
import HabitTracker from "./components/HabitTracker";
import VoiceAssistant from "./components/VoiceAssistant";
import ShieldModeOverlay from "./components/ShieldModeOverlay";

import { Task, Habit, ItineraryItem, AppData } from "./types";

export default function App() {
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

  // Tab View
  const [activeTab, setActiveTab] = useState<"pending" | "completed">("pending");

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
      // Optimistic update
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, isCompleted } : t))
      );

      await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCompleted }),
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

  const handleCreateTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    // Build ISO Date String representing the combined date + time
    const combinedISOString = new Date(`${formData.deadlineDate}T${formData.deadlineTime}:00-07:00`).toISOString();

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

  // Sort Tasks by Proximity of Deadline
  const pendingTasks = tasks
    .filter((t) => !t.isCompleted)
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

  const completedTasks = tasks.filter((t) => t.isCompleted);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-800">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" id="initial-loading"></div>
          <p className="font-display text-sm font-semibold tracking-tight text-slate-500 animate-pulse">
            Connecting to synchronized deadline vault...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16 relative" id="app-root-container">
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
      <Header tasks={tasks} isSyncing={isSyncing} onSync={() => fetchData(true)} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT SECTION: Task List & Management (Grid Span: 7) */}
          <div className="lg:col-span-7 flex flex-col" id="dashboard-left-panel">
            {/* Task Area Header */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm mb-6">
              <div className="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-50">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100">
                    <ClipboardList className="w-5 h-5 text-indigo-500" />
                  </div>
                  <div>
                    <h2 className="font-display text-lg font-bold text-slate-950">My Deadlines</h2>
                    <p className="text-xs text-slate-400 font-medium">Keep sync across your mobile & desktop active</p>
                  </div>
                </div>

                <button
                  onClick={() => setShowAddTaskForm(!showAddTaskForm)}
                  className="flex items-center gap-1 px-3.5 py-1.5 bg-slate-950 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all hover:scale-[1.01] cursor-pointer"
                  id="toggle-add-task-btn"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-rose-400" />
                  New Deadline
                </button>
              </div>

              {/* Add Task Drawer Panel */}
              <AnimatePresence>
                {showAddTaskForm && (
                  <motion.form
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    onSubmit={handleCreateTaskSubmit}
                    className="bg-slate-50 border border-slate-100/80 p-5 rounded-2xl mb-4 text-xs space-y-4 overflow-hidden"
                    id="new-task-form"
                  >
                    <h3 className="font-bold text-slate-900 border-b border-slate-200/50 pb-2 flex items-center gap-1.5 text-xs uppercase tracking-wider text-indigo-600">
                      <Zap className="w-3.5 h-3.5 text-indigo-500" />
                      Quick Capture Deadline
                    </h3>

                    {/* Row 1: Title */}
                    <div>
                      <label className="block text-slate-500 font-bold mb-1 uppercase tracking-wider text-[9px]">Goal / Task Name</label>
                      <input
                        type="text"
                        placeholder="e.g. CS 101 Midterm report upload"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 font-medium focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>

                    {/* Row 2: Date & Time */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-500 font-bold mb-1 uppercase tracking-wider text-[9px]">Due Date</label>
                        <input
                          type="date"
                          value={formData.deadlineDate}
                          onChange={(e) => setFormData({ ...formData, deadlineDate: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 font-medium focus:outline-none focus:border-indigo-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 font-bold mb-1 uppercase tracking-wider text-[9px]">Due Time</label>
                        <input
                          type="time"
                          value={formData.deadlineTime}
                          onChange={(e) => setFormData({ ...formData, deadlineTime: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 font-medium focus:outline-none focus:border-indigo-500"
                          required
                        />
                      </div>
                    </div>

                    {/* Row 3: Category & Priority */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-500 font-bold mb-1 uppercase tracking-wider text-[9px]">Category</label>
                        <select
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 font-medium focus:outline-none focus:border-indigo-500"
                        >
                          <option value="study">🎓 Study / Class</option>
                          <option value="work">💼 Work / Job</option>
                          <option value="bills">💳 Bills / Finance</option>
                          <option value="personal">🏡 Personal / Health</option>
                          <option value="other">☕ Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-500 font-bold mb-1 uppercase tracking-wider text-[9px]">Manual Priority</label>
                        <select
                          value={formData.priority}
                          onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 font-medium focus:outline-none focus:border-indigo-500"
                        >
                          <option value="high">🔴 High Urgency</option>
                          <option value="medium">🟡 Medium</option>
                          <option value="low">🔵 Low Consequence</option>
                        </select>
                      </div>
                    </div>

                    {/* Row 4: Estimate */}
                    <div>
                      <label className="block text-slate-500 font-bold mb-1 uppercase tracking-wider text-[9px]">Estimated Minutes Required</label>
                      <input
                        type="number"
                        min="5"
                        max="480"
                        value={formData.estimatedMinutes}
                        onChange={(e) => setFormData({ ...formData, estimatedMinutes: Number(e.target.value) })}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 font-medium focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>

                    {/* Row 5: Notes */}
                    <div>
                      <label className="block text-slate-500 font-bold mb-1 uppercase tracking-wider text-[9px]">Reference Notes / Links</label>
                      <textarea
                        rows={2}
                        placeholder="Criteria, URL link to portal, specific questions..."
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 font-medium focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="flex gap-2 justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => setShowAddTaskForm(false)}
                        className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg transition-colors cursor-pointer"
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

              {/* Tab navigation */}
              <div className="flex border-b border-slate-100 text-xs sm:text-sm font-semibold mb-4 gap-4" id="task-tab-navigation">
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

              {/* Task Cards Stack */}
              <div className="space-y-1" id="tasks-stack">
                <AnimatePresence mode="popLayout">
                  {activeTab === "pending" ? (
                    pendingTasks.length > 0 ? (
                      pendingTasks.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          onToggleComplete={handleToggleComplete}
                          onDelete={handleDeleteTask}
                          onSnooze={handleSnoozeTask}
                        />
                      ))
                    ) : (
                      <div className="text-center py-10 text-slate-400" id="empty-pending">
                        <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2.5 animate-bounce" />
                        <p className="text-xs font-semibold text-slate-500">Every single deadline is locked, shielded, and completed!</p>
                        <p className="text-[10px] mt-1 text-slate-400">Add a new goal above or take a deep breathing break.</p>
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
                        />
                      ))
                    ) : (
                      <div className="text-center py-10 text-slate-400" id="empty-completed">
                        <p className="text-xs font-medium">No completed tasks in the synchronize vault yet.</p>
                        <p className="text-[10px] mt-1 text-slate-400">Finish tasks under Focus Shield to claim cognitive victories.</p>
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
