import React, { useMemo } from "react";
import { BarChart, Bar, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BarChart2, CheckCircle2, Flame, Award, TrendingUp } from "lucide-react";
import { Task } from "../types";

interface WeeklyActivityProps {
  tasks: Task[];
}

export default function WeeklyActivity({ tasks }: WeeklyActivityProps) {
  // We want to calculate the current week (Monday to Sunday) based on the current date
  const weekData = useMemo(() => {
    const today = new Date();
    // Get current day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    const currentDay = today.getDay();
    // Calculate difference to Monday of this week (treating Monday as start of week)
    // If today is Sunday (0), we want to go back 6 days.
    const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    
    const monday = new Date(today);
    monday.setDate(today.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);

    // Create array of 7 days (Monday to Sunday)
    const days = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      return day;
    });

    const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    // Initialize counts
    const chartDays = days.map((dateObj, index) => {
      const startOfDay = new Date(dateObj);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(dateObj);
      endOfDay.setHours(23, 59, 59, 999);

      // Filter tasks completed on this specific day
      const completedOnThisDay = tasks.filter((t) => {
        if (!t.isCompleted) return false;

        // Try to parse completedAt first, fallback to deadline
        const completionTime = t.completedAt ? new Date(t.completedAt) : new Date(t.deadline);
        return completionTime >= startOfDay && completionTime <= endOfDay;
      });

      return {
        name: dayLabels[index],
        dateStr: `${dateObj.getMonth() + 1}/${dateObj.getDate()}`,
        count: completedOnThisDay.length,
        tasks: completedOnThisDay,
        fullDate: dateObj,
      };
    });

    return chartDays;
  }, [tasks]);

  const stats = useMemo(() => {
    const totalCompletedThisWeek = weekData.reduce((sum, d) => sum + d.count, 0);
    const avgCompletedPerDay = (totalCompletedThisWeek / 7).toFixed(1);
    
    // Find most active day
    let maxDay = weekData[0];
    weekData.forEach((d) => {
      if (d.count > maxDay.count) {
        maxDay = d;
      }
    });

    return {
      total: totalCompletedThisWeek,
      avg: avgCompletedPerDay,
      mostActive: maxDay.count > 0 ? `${maxDay.name} (${maxDay.count})` : "None yet",
    };
  }, [weekData]);

  // Custom Tooltip styled for Tailwind and matching App design
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl border border-slate-800 shadow-xl text-xs font-sans">
          <p className="font-bold flex items-center gap-1.5 mb-1.5 text-slate-100">
            {data.name} {data.dateStr}
          </p>
          <div className="space-y-1 text-[11px] text-slate-300 font-mono">
            <p className="flex items-center justify-between gap-4">
              <span>✅ Completed:</span>
              <span className="font-bold text-emerald-300">{data.count} tasks</span>
            </p>
          </div>
          {data.count > 0 && (
            <div className="mt-2 pt-1.5 border-t border-slate-800 space-y-1">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold font-sans">Deadlines Met:</p>
              <ul className="list-disc list-inside text-[10px] text-slate-300 space-y-0.5 max-w-[180px] truncate">
                {data.tasks.map((t: Task) => (
                  <li key={t.id} className="truncate">
                    {t.title}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm dark:bg-slate-900 dark:border-slate-800" id="weekly-activity-card">
      <div className="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-50 dark:border-slate-800/60">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/60">
            <BarChart2 className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <h2 className="font-display text-base font-bold text-slate-950 dark:text-slate-50">Weekly Activity</h2>
            <p className="text-[10px] text-slate-400 font-medium dark:text-slate-400">Track and celebrate your daily deadline completions</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 px-2.5 py-1 rounded-xl">
          <TrendingUp className="w-3.5 h-3.5" />
          This Week
        </div>
      </div>

      {/* Mini Stat Cards Grid */}
      <div className="grid grid-cols-3 gap-2 mb-5" id="weekly-activity-stats-grid">
        <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-2.5 text-center dark:bg-slate-800/20 dark:border-slate-850/60">
          <div className="text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-bold mb-0.5 flex items-center justify-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            Met
          </div>
          <p className="text-sm font-black font-mono text-slate-800 dark:text-slate-200">{stats.total}</p>
        </div>
        
        <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-2.5 text-center dark:bg-slate-800/20 dark:border-slate-850/60">
          <div className="text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-bold mb-0.5 flex items-center justify-center gap-1">
            <Award className="w-3 h-3 text-indigo-500" />
            Daily Avg
          </div>
          <p className="text-sm font-black font-mono text-slate-800 dark:text-slate-200">{stats.avg}</p>
        </div>

        <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-2.5 text-center dark:bg-slate-800/20 dark:border-slate-850/60">
          <div className="text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-bold mb-0.5 flex items-center justify-center gap-1">
            <Flame className="w-3 h-3 text-rose-500" />
            Peak Day
          </div>
          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{stats.mostActive}</p>
        </div>
      </div>

      {/* Chart container */}
      <div className="h-[150px] w-full" id="weekly-activity-chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={weekData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: "600" }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: "600" }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(148, 163, 184, 0.05)", radius: 8 }} />
            <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={30}>
              {weekData.map((entry, index) => {
                // Highlight today's day of week
                const isToday = new Date().getDay() === (entry.fullDate.getDay() === 0 ? 0 : entry.fullDate.getDay());
                return (
                  <Cell
                    key={`cell-${index}`}
                    fill={isToday ? "#10b981" : "#6366f1"}
                    fillOpacity={entry.count === 0 ? 0.2 : 0.85}
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
