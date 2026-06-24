import React, { useState, useEffect } from "react";
import { Calendar, Compass, RefreshCw, Smile, Moon, AlertCircle, CheckCircle2, ExternalLink, LogOut, Loader2 } from "lucide-react";
import { ItineraryItem } from "../types";

interface CalendarItineraryProps {
  itinerary: ItineraryItem[];
  isGenerating: boolean;
  onGenerate: (start: string, end: string) => void;
}

interface GoogleStatus {
  configured: boolean;
  connected: boolean;
  email?: string;
}

interface GoogleEvent {
  id: string;
  summary: string;
  start?: {
    dateTime?: string;
    date?: string;
  };
}

export default function CalendarItinerary({ itinerary, isGenerating, onGenerate }: CalendarItineraryProps) {
  const [startHour, setStartHour] = useState("09:00");
  const [endHour, setEndHour] = useState("18:00");
  const [showConfig, setShowConfig] = useState(false);

  // Google Calendar Integration State
  const [gStatus, setGStatus] = useState<GoogleStatus | null>(null);
  const [gEvents, setGEvents] = useState<GoogleEvent[]>([]);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [isSyncingItinerary, setIsSyncingItinerary] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const checkGoogleStatus = async () => {
    try {
      const res = await fetch("/api/auth/google/status");
      const data: GoogleStatus = await res.json();
      setGStatus(data);
      if (data.connected) {
        fetchGoogleEvents();
      }
    } catch (err) {
      console.error("Error fetching Google Calendar status:", err);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const fetchGoogleEvents = async () => {
    try {
      const res = await fetch("/api/calendar/events");
      if (res.ok) {
        const data = await res.json();
        setGEvents(data.events || []);
      }
    } catch (err) {
      console.error("Error fetching Google Calendar events:", err);
    }
  };

  useEffect(() => {
    checkGoogleStatus();

    // Listen for OAuth Success message from callback popup
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "GOOGLE_OAUTH_SUCCESS") {
        checkGoogleStatus();
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const handleConnectGoogle = async () => {
    try {
      const res = await fetch("/api/auth/google/url");
      const data = await res.json();
      if (data.configured && data.url) {
        window.open(data.url, "google_oauth_popup", "width=600,height=700");
      } else {
        alert("Google Calendar integration is not configured on the server yet. Please follow configuration steps below.");
      }
    } catch (err) {
      console.error("Failed to fetch Google auth URL:", err);
    }
  };

  const handleDisconnectGoogle = async () => {
    if (!window.confirm("Are you sure you want to disconnect your Google Calendar?")) {
      return;
    }
    try {
      await fetch("/api/auth/google/disconnect", { method: "POST" });
      setGStatus((prev) => prev ? { ...prev, connected: false, email: undefined } : null);
      setGEvents([]);
    } catch (err) {
      console.error("Failed to disconnect Google Calendar:", err);
    }
  };

  const handleSyncItinerary = async () => {
    setIsSyncingItinerary(true);
    setSyncMessage(null);
    try {
      const res = await fetch("/api/calendar/sync-itinerary", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setSyncMessage({
          text: `Successfully exported ${data.count} schedule blocks to your primary Google Calendar!`,
          type: "success"
        });
        setTimeout(() => setSyncMessage(null), 6000);
      } else {
        const errData = await res.json();
        setSyncMessage({
          text: `Export failed: ${errData.error || "Unknown server error"}`,
          type: "error"
        });
      }
    } catch (err: any) {
      setSyncMessage({
        text: `Network error during sync: ${err.message}`,
        type: "error"
      });
    } finally {
      setIsSyncingItinerary(false);
    }
  };

  const handleRegenerate = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(startHour, endHour);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col gap-5" id="itinerary-panel">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 pb-3 border-b border-slate-50">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-rose-50 text-rose-500 rounded-lg border border-rose-100">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-slate-950">AI Day-Planner</h2>
            <p className="text-xs text-slate-400 font-medium">Your optimized hour-by-hour route to zero stress</p>
          </div>
        </div>

        <button
          onClick={() => setShowConfig(!showConfig)}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          id="configure-itinerary-btn"
        >
          {showConfig ? "Hide Config" : "Optimize Hours"}
        </button>
      </div>

      {/* Google Calendar Control Panel */}
      <div className="bg-slate-50 border border-slate-100/80 rounded-xl p-4 text-xs" id="google-calendar-panel">
        {isLoadingStatus ? (
          <div className="flex items-center justify-center py-2 text-slate-400 gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading Calendar integrations...</span>
          </div>
        ) : !gStatus?.configured ? (
          <div className="space-y-3.5">
            <div className="flex items-start gap-2.5 text-slate-600">
              <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-800 text-[13px] block mb-1">Google Calendar Setup Needed</span>
                <p className="text-slate-500 leading-relaxed text-[11px]">
                  Integrate your real Google Calendar to schedule focus sessions and sync deadlocks. Provide client credentials in your AI Studio Secrets panel.
                </p>
              </div>
            </div>
            
            <div className="bg-white border border-slate-200/60 rounded-lg p-3 space-y-2 text-[10.5px]">
              <div className="font-bold text-slate-700">1. Google Cloud Authorized Redirect URIs:</div>
              <div className="font-mono text-slate-500 select-all break-all bg-slate-50 p-1.5 rounded border border-slate-100 leading-normal">
                {window.location.origin}/auth/callback
              </div>
              <div className="font-bold text-slate-700 mt-2">2. Register Variables:</div>
              <p className="text-slate-500 leading-normal">
                Add keys <code className="font-mono bg-slate-100 text-indigo-600 px-1 py-0.5 rounded font-bold">GOOGLE_CLIENT_ID</code> and <code className="font-mono bg-slate-100 text-indigo-600 px-1 py-0.5 rounded font-bold">GOOGLE_CLIENT_SECRET</code> to your app's secrets.
              </p>
            </div>
          </div>
        ) : !gStatus.connected ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="font-bold text-slate-800 text-[12px] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                Google Calendar Sync
              </div>
              <p className="text-slate-500 text-[11px] leading-snug">
                Connect your calendar to sync your schedule with full user permission.
              </p>
            </div>
            <button
              onClick={handleConnectGoogle}
              className="flex items-center gap-1.5 px-3 py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-lg transition-colors cursor-pointer self-stretch sm:self-auto text-center justify-center shadow-sm"
            >
              <Calendar className="w-3.5 h-3.5" />
              Link Calendar
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Status Line */}
            <div className="flex items-center justify-between gap-3 border-b border-slate-200/50 pb-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <div>
                  <span className="font-bold text-slate-800 text-[12px] block leading-none">Linked with Google Calendar</span>
                  <span className="text-slate-400 text-[10px]">{gStatus.email}</span>
                </div>
              </div>
              <button
                onClick={handleDisconnectGoogle}
                className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                title="Disconnect Google account"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Sync Controls */}
            {itinerary && itinerary.length > 0 && (
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleSyncItinerary}
                  disabled={isSyncingItinerary}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 text-indigo-700 font-bold rounded-lg transition-all disabled:opacity-50 cursor-pointer text-[11px]"
                >
                  {isSyncingItinerary ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Exporting Day Plan...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="w-3.5 h-3.5" />
                      Export Day Plan to Google Calendar
                    </>
                  )}
                </button>
              </div>
            )}

            {syncMessage && (
              <div className={`p-2.5 rounded-lg border text-[11px] font-medium leading-relaxed ${
                syncMessage.type === "success" 
                  ? "bg-emerald-50 border-emerald-100 text-emerald-800" 
                  : "bg-rose-50 border-rose-100 text-rose-800"
              }`}>
                {syncMessage.text}
              </div>
            )}

            {/* Live Calendar feed preview */}
            {gEvents && gEvents.length > 0 && (
              <div className="space-y-2 mt-2">
                <div className="font-bold text-slate-600 text-[10px] uppercase tracking-wider">Upcoming Real-time Events:</div>
                <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
                  {gEvents.map((evt) => {
                    const dateObj = evt.start?.dateTime ? new Date(evt.start.dateTime) : null;
                    const timeStr = dateObj 
                      ? dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                      : "All Day";
                    return (
                      <div key={evt.id} className="flex items-center justify-between gap-2 p-2 bg-white rounded-lg border border-slate-100 text-[11px] text-slate-700 shadow-3xs">
                        <span className="font-semibold truncate max-w-[150px]">{evt.summary || "(No Title)"}</span>
                        <span className="font-mono text-slate-400 text-[10px] flex-shrink-0">{timeStr}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Config Form */}
      {showConfig && (
        <form onSubmit={handleRegenerate} className="bg-slate-50 border border-slate-100 p-4 rounded-xl text-xs flex flex-wrap items-end gap-3" id="itinerary-config-form">
          <div className="flex-1 min-w-[100px]">
            <label className="block text-slate-500 font-bold mb-1 uppercase tracking-wider text-[9px]">Start Day Hour</label>
            <input
              type="time"
              value={startHour}
              onChange={(e) => setStartHour(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="flex-1 min-w-[100px]">
            <label className="block text-slate-500 font-bold mb-1 uppercase tracking-wider text-[9px]">End Day Hour</label>
            <input
              type="time"
              value={endHour}
              onChange={(e) => setEndHour(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none focus:border-indigo-500"
            />
          </div>
          <button
            type="submit"
            disabled={isGenerating}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold rounded-lg transition-all disabled:opacity-60 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? "animate-spin" : ""}`} />
            Regenerate
          </button>
        </form>
      )}

      {/* Timeline List */}
      <div className="relative border-l border-slate-100 pl-4 ml-2.5 space-y-4 py-2" id="itinerary-timeline">
        {itinerary && itinerary.length > 0 ? (
          itinerary.map((item, idx) => (
            <div key={idx} className="relative group" id={`itinerary-item-${idx}`}>
              {/* Bullet indicator */}
              <span className={`absolute -left-[21px] top-1.5 w-3 h-3 rounded-full border-2 bg-white transition-transform group-hover:scale-125 ${
                item.isBuffer 
                  ? "border-emerald-500 ring-4 ring-emerald-50/50" 
                  : "border-indigo-500 ring-4 ring-indigo-50/30"
              }`}></span>

              {/* Box */}
              <div className={`p-3.5 rounded-xl border transition-all ${
                item.isBuffer 
                  ? "bg-emerald-50/40 border-emerald-100/60 text-emerald-950" 
                  : "bg-slate-50/50 border-slate-100/60 text-slate-950"
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
                  <span className="font-mono text-xs font-bold text-slate-500 bg-white border border-slate-100 px-2 py-0.5 rounded-md shadow-sm w-fit">
                    {item.time}
                  </span>
                  
                  {item.isBuffer && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full uppercase tracking-wider w-fit">
                      <Smile className="w-3.5 h-3.5" />
                      Recovery Buffer
                    </span>
                  )}
                </div>

                <p className="text-sm font-semibold leading-snug">
                  {item.task}
                </p>

                {item.focusTip && (
                  <p className={`text-[11px] font-medium mt-1.5 italic ${
                    item.isBuffer ? "text-emerald-700/80" : "text-slate-500/80"
                  }`}>
                    💡 Focus Tip: {item.focusTip}
                  </p>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-6 text-slate-400 font-medium" id="empty-itinerary">
            <Compass className="w-8 h-8 mx-auto mb-2 text-slate-300 animate-bounce" />
            <p className="text-xs">No AI schedule built yet.</p>
            <p className="text-[10px] mt-1 text-slate-400">Click &apos;Optimize Hours&apos; to trigger a plan!</p>
          </div>
        )}
      </div>

      {/* End of day anchor */}
      {itinerary && itinerary.length > 0 && (
        <div className="flex items-center gap-2 text-slate-400 text-xs pl-3 mt-1 font-mono font-medium" id="timeline-end-anchor">
          <Moon className="w-3.5 h-3.5 text-indigo-400" />
          <span>Day schedule complete. Sleep is the ultimate cognitive shield.</span>
        </div>
      )}
    </div>
  );
}
