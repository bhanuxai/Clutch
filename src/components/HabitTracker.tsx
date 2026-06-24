import React, { useState } from "react";
import { CheckCircle, Plus, Sparkles, Flame, PlusCircle, Trash2 } from "lucide-react";
import { Habit } from "../types";

interface HabitTrackerProps {
  habits: Habit[];
  onAddHabit: (title: string, category: string) => void;
  onLogHabit: (id: string) => void;
  onDeleteHabit: (id: string) => void;
}

export default function HabitTracker({ habits, onAddHabit, onLogHabit, onDeleteHabit }: HabitTrackerProps) {
  const [newHabitTitle, setNewHabitTitle] = useState("");
  const [newHabitCategory, setNewHabitCategory] = useState("productivity");
  const [showAddForm, setShowAddForm] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitTitle.trim()) return;
    onAddHabit(newHabitTitle, newHabitCategory);
    setNewHabitTitle("");
    setShowAddForm(false);
  };

  const todayStr = "2026-06-24"; // System static mock date

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm mb-6" id="habits-panel">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-50">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-amber-50 text-amber-600 rounded-lg border border-amber-100">
            <Flame className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-slate-950">Daily Stress Shield Habits</h2>
            <p className="text-xs text-slate-400 font-medium">Build micro-habits that guard against last-minute panic</p>
          </div>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="p-1 text-slate-400 hover:text-indigo-600 active:scale-95 transition-all cursor-pointer"
          title="Create custom habit"
          id="toggle-add-habit-btn"
        >
          <PlusCircle className="w-6 h-6" />
        </button>
      </div>

      {/* Add Habit Form */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-slate-50 border border-slate-100 p-4 rounded-xl mb-4 text-xs" id="add-habit-form">
          <div className="flex flex-col gap-3">
            <div>
              <label className="block text-slate-500 font-bold mb-1 uppercase tracking-wider text-[9px]">Habit Name</label>
              <input
                type="text"
                placeholder="e.g. 15-minute desk declutter, 3L water"
                value={newHabitTitle}
                onChange={(e) => setNewHabitTitle(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-slate-500 font-bold mb-1 uppercase tracking-wider text-[9px]">Focus Category</label>
              <select
                value={newHabitCategory}
                onChange={(e) => setNewHabitCategory(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none focus:border-indigo-500"
              >
                <option value="productivity">Productivity & Focus</option>
                <option value="health">Physical Health & Energy</option>
                <option value="mindfulness">Mindfulness & Stress Relief</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-all cursor-pointer"
            >
              Add Stress Shield Habit
            </button>
          </div>
        </form>
      )}

      {/* Habits List */}
      <div className="grid grid-cols-1 gap-3" id="habits-list">
        {habits && habits.length > 0 ? (
          habits.map((habit) => {
            const isCompletedToday = habit.lastCompleted === todayStr;

            return (
              <div
                key={habit.id}
                className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                  isCompletedToday
                    ? "bg-emerald-50/20 border-emerald-100 text-slate-800"
                    : "bg-slate-50/40 border-slate-100 hover:border-slate-200 text-slate-900"
                }`}
                id={`habit-card-${habit.id}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Streak Flame Badge */}
                  <div className={`flex items-center gap-0.5 px-2 py-1 rounded-lg font-mono font-bold text-xs ${
                    habit.streak > 0 
                      ? "bg-amber-100 text-amber-800 border border-amber-200/50" 
                      : "bg-slate-100 text-slate-400 border border-slate-200/50"
                  }`} title="Current daily streak">
                    <Flame className={`w-3.5 h-3.5 ${habit.streak > 0 ? "text-amber-500 fill-amber-100" : ""}`} />
                    <span>{habit.streak}d</span>
                  </div>

                  <div className="min-w-0">
                    <p className={`text-sm font-semibold truncate ${isCompletedToday ? "line-through text-slate-400 font-normal" : ""}`}>
                      {habit.title}
                    </p>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wide">
                      {habit.category}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Complete Action Button */}
                  <button
                    onClick={() => onLogHabit(habit.id)}
                    disabled={isCompletedToday}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      isCompletedToday
                        ? "bg-emerald-100 text-emerald-800 border-emerald-200/60"
                        : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
                    }`}
                    id={`habit-complete-btn-${habit.id}`}
                  >
                    <CheckCircle className={`w-4 h-4 ${isCompletedToday ? "text-emerald-600 fill-emerald-50" : "text-slate-400"}`} />
                    <span>{isCompletedToday ? "Logged" : "Log Day"}</span>
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={() => onDeleteHabit(habit.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 active:scale-90 transition-colors rounded-lg hover:bg-rose-50 cursor-pointer"
                    title="Remove habit"
                    id={`habit-delete-btn-${habit.id}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-4 text-slate-400 text-xs" id="empty-habits">
            No habits active yet. Click the + icon to add custom energy shields!
          </div>
        )}
      </div>
    </div>
  );
}
