import React, { useState, useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { PieChart as PieIcon, Clock, CheckSquare, Sparkles } from "lucide-react";
import { Task } from "../types";

interface TaskCategoryChartProps {
  tasks: Task[];
}

export default function TaskCategoryChart({ tasks }: TaskCategoryChartProps) {
  const [metric, setMetric] = useState<"time" | "count">("time");

  // Category Configuration with emojis, titles, and specific high-contrast color hexes
  const CATEGORY_MAP: Record<string, { label: string; emoji: string; color: string; bgClass: string; textClass: string }> = {
    study: { label: "Study / Class", emoji: "🎓", color: "#6366f1", bgClass: "bg-indigo-50", textClass: "text-indigo-600" },
    work: { label: "Work / Job", emoji: "💼", color: "#f59e0b", bgClass: "bg-amber-50", textClass: "text-amber-600" },
    bills: { label: "Bills / Finance", emoji: "💳", color: "#ef4444", bgClass: "bg-rose-50", textClass: "text-rose-600" },
    personal: { label: "Personal / Health", emoji: "🏡", color: "#10b981", bgClass: "bg-emerald-50", textClass: "text-emerald-600" },
    other: { label: "Other", emoji: "☕", color: "#8b5cf6", bgClass: "bg-purple-50", textClass: "text-purple-600" },
  };

  const chartData = useMemo(() => {
    // Initialize empty buckets
    const dataMap: Record<string, { name: string; value: number; count: number; minutes: number; color: string }> = {};

    Object.keys(CATEGORY_MAP).forEach((key) => {
      dataMap[key] = {
        name: `${CATEGORY_MAP[key].emoji} ${CATEGORY_MAP[key].label}`,
        value: 0,
        count: 0,
        minutes: 0,
        color: CATEGORY_MAP[key].color,
      };
    });

    // Populate data from active/completed tasks
    tasks.forEach((task) => {
      const catKey = (task.category || "other").toLowerCase();
      const bucket = dataMap[catKey] || dataMap["other"];
      
      bucket.count += 1;
      bucket.minutes += task.estimatedMinutes || 30; // fallback if estimatedMinutes is null/0
    });

    // Transform map to array, filtering out categories with 0 values
    return Object.keys(dataMap)
      .map((key) => {
        const item = dataMap[key];
        return {
          ...item,
          value: metric === "time" ? item.minutes : item.count,
        };
      })
      .filter((item) => item.value > 0);
  }, [tasks, metric]);

  const totalMinutes = useMemo(() => {
    return tasks.reduce((sum, t) => sum + (t.estimatedMinutes || 30), 0);
  }, [tasks]);

  const totalCount = tasks.length;

  // Custom tooltip rendering to style elegantly with Tailwind
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl border border-slate-800 shadow-xl text-xs font-sans">
          <p className="font-bold flex items-center gap-1.5 mb-1 text-slate-100">{data.name}</p>
          <div className="space-y-0.5 text-[11px] text-slate-300 font-mono">
            <p className="flex items-center justify-between gap-4">
              <span>⏰ Total Time:</span>
              <span className="font-bold text-indigo-300">{data.minutes} mins</span>
            </p>
            <p className="flex items-center justify-between gap-4">
              <span>📋 Task Count:</span>
              <span className="font-bold text-emerald-300">{data.count} tasks</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm dark:bg-slate-900 dark:border-slate-800" id="category-distribution-card">
      <div className="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-50 dark:border-slate-800/60">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-900/60">
            <PieIcon className="w-5 h-5 text-indigo-500" />
          </div>
          <div>
            <h2 className="font-display text-base font-bold text-slate-950 dark:text-slate-50">Cognitive Load</h2>
            <p className="text-[10px] text-slate-400 font-medium dark:text-slate-400">Visualizing where your focus & time is budgeted</p>
          </div>
        </div>

        {/* Toggle between Estimated Time & Task Count */}
        <div className="flex bg-slate-100 p-1 rounded-xl dark:bg-slate-800" id="metric-toggle">
          <button
            type="button"
            onClick={() => setMetric("time")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
              metric === "time"
                ? "bg-white text-indigo-600 shadow-2xs dark:bg-slate-700 dark:text-indigo-300"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <Clock className="w-3 h-3" />
            Time
          </button>
          <button
            type="button"
            onClick={() => setMetric("count")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
              metric === "count"
                ? "bg-white text-indigo-600 shadow-2xs dark:bg-slate-700 dark:text-indigo-300"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <CheckSquare className="w-3 h-3" />
            Count
          </button>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="py-12 flex flex-col items-center justify-center text-center">
          <div className="p-3 bg-slate-50 rounded-full border border-slate-100 mb-3 text-slate-400 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-500">
            <Sparkles className="w-6 h-6 text-indigo-400" />
          </div>
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">No data found in your active vault</p>
          <p className="text-[10px] text-slate-400 mt-1 max-w-[200px] mx-auto dark:text-slate-500">
            Create tasks with categories to display dynamic time-budget allocations.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Main Pie Chart Container */}
          <div className="h-[200px] w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            {/* Total Metric Centered in Donut hole */}
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">
                {metric === "time" ? "Total Time" : "Total Tasks"}
              </span>
              <span className="text-lg font-black font-mono text-slate-800 dark:text-slate-200">
                {metric === "time" ? `${totalMinutes}m` : totalCount}
              </span>
            </div>
          </div>

          {/* Elegant Custom Legended Stats Grid */}
          <div className="grid grid-cols-2 gap-2 mt-2" id="chart-legend-grid">
            {chartData.map((item, index) => {
              const percentage = metric === "time"
                ? ((item.minutes / Math.max(1, totalMinutes)) * 100).toFixed(0)
                : ((item.count / Math.max(1, totalCount)) * 100).toFixed(0);

              return (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-50/50 border border-slate-100 dark:bg-slate-800/20 dark:border-slate-850/60"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-[10px] font-semibold text-slate-700 truncate dark:text-slate-300">
                      {item.name}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded ml-2 flex-shrink-0 dark:text-slate-400 dark:bg-slate-800">
                    {percentage}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
