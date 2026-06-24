import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { ShieldAlert, VolumeX, Volume2, CheckCircle2, XCircle, Heart, Play, Square } from "lucide-react";
import { Task } from "../types";

interface ShieldModeOverlayProps {
  tasks: Task[];
  onClose: () => void;
  onCompleteTask: (id: string) => void;
}

export default function ShieldModeOverlay({ tasks, onClose, onCompleteTask }: ShieldModeOverlayProps) {
  const activeTasks = tasks.filter((t) => !t.isCompleted);
  const topTask = activeTasks.reduce<Task | null>((closest, current) => {
    if (!closest) return current;
    return new Date(current.deadline).getTime() < new Date(closest.deadline).getTime() ? current : closest;
  }, null);

  const [timeLeftStr, setTimeLeftStr] = useState("Loading...");
  const [breathPhase, setBreathPhase] = useState("Inhale");
  const [activeSound, setActiveSound] = useState<"none" | "rain" | "binaural">("none");

  // Audio refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const synthNodesRef = useRef<{ oscillator?: OscillatorNode; gainNode?: GainNode; noiseSource?: AudioWorkletNode | ScriptProcessorNode } | null>(null);

  // Update Countdown Timer
  useEffect(() => {
    if (!topTask) {
      setTimeLeftStr("No upcoming deadlines!");
      return;
    }

    const updateTimer = () => {
      const now = new Date("2026-06-24T09:33:11-07:00").getTime();
      const due = new Date(topTask.deadline).getTime();
      const diff = due - now;

      if (diff <= 0) {
        setTimeLeftStr("DEADLINE EXPIRED");
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);

        const hoursStr = hours.toString().padStart(2, "0");
        const minsStr = mins.toString().padStart(2, "0");
        const secsStr = secs.toString().padStart(2, "0");

        setTimeLeftStr(`${hoursStr}:${minsStr}:${secsStr}`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [topTask]);

  // Breathing Box Guide loop
  useEffect(() => {
    const sequence = [
      { text: "Breathe In (4s)", delay: 4000 },
      { text: "Hold (4s)", delay: 4000 },
      { text: "Exhale (4s)", delay: 4000 },
      { text: "Hold (4s)", delay: 4000 }
    ];

    let index = 0;
    setBreathPhase(sequence[0].text);

    const triggerNext = () => {
      index = (index + 1) % sequence.length;
      setBreathPhase(sequence[index].text);
      timerId = setTimeout(triggerNext, sequence[index].delay);
    };

    let timerId = setTimeout(triggerNext, sequence[index].delay);

    return () => clearTimeout(timerId);
  }, []);

  // Web Audio Synth setup
  const startSynth = (type: "rain" | "binaural") => {
    stopSynth();

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;

      if (type === "binaural") {
        // Generate Binaural Beats (soothing 200Hz + 206Hz carrier focus frequencies)
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = "sine";
        osc1.frequency.value = 200; // Left channel 200Hz

        osc2.type = "sine";
        osc2.frequency.value = 205; // Right channel 205Hz

        gain.gain.value = 0.08; // low volume

        // Merging to stereo for binaural effect
        const merger = ctx.createChannelMerger(2);
        osc1.connect(merger, 0, 0);
        osc2.connect(merger, 0, 1);
        merger.connect(gain);
        gain.connect(ctx.destination);

        osc1.start();
        osc2.start();

        synthNodesRef.current = { oscillator: osc1, gainNode: gain };
      } else if (type === "rain") {
        // Synthesizing soothing Brownian Rain noise dynamically using ScriptProcessor
        const bufferSize = 4096;
        const scriptNode = ctx.createScriptProcessor(bufferSize, 1, 1);
        const gain = ctx.createGain();
        gain.gain.value = 0.05;

        let lastOut = 0.0;
        scriptNode.onaudioprocess = (e) => {
          const output = e.outputBuffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            // Brownian filter
            output[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = output[i];
            output[i] *= 3.5; // amplify a bit
          }
        };

        scriptNode.connect(gain);
        gain.connect(ctx.destination);

        synthNodesRef.current = { gainNode: gain, noiseSource: scriptNode };
      }

      setActiveSound(type);
    } catch (err) {
      console.error("Failed to initialize sound synthesis:", err);
    }
  };

  const stopSynth = () => {
    if (synthNodesRef.current) {
      try {
        if (synthNodesRef.current.oscillator) {
          synthNodesRef.current.oscillator.stop();
        }
        if (synthNodesRef.current.noiseSource) {
          synthNodesRef.current.noiseSource.disconnect();
        }
        if (synthNodesRef.current.gainNode) {
          synthNodesRef.current.gainNode.disconnect();
        }
      } catch (e) {
        // ignore
      }
      synthNodesRef.current = null;
    }

    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close();
      } catch (e) {
        // ignore
      }
      audioCtxRef.current = null;
    }

    setActiveSound("none");
  };

  // Stop sound on unmount
  useEffect(() => {
    return () => stopSynth();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-950 text-white z-50 overflow-y-auto flex flex-col items-center justify-center p-6"
      id="shield-mode-overlay"
    >
      <div className="max-w-xl w-full flex flex-col items-center text-center">
        {/* Shield Logo */}
        <motion.div 
          animate={{ scale: [1, 1.05, 1] }} 
          transition={{ repeat: Infinity, duration: 4 }}
          className="p-4 bg-rose-500/10 text-rose-500 rounded-full border border-rose-500/20 mb-6"
        >
          <ShieldAlert className="w-12 h-12" />
        </motion.div>

        <h1 className="font-display text-2xl font-bold tracking-tight mb-2">
          DEADLINE SHIELD ACTIVE
        </h1>
        <p className="text-xs text-slate-400 max-w-sm mb-8 leading-relaxed">
          Distracting elements disabled. All client notifications shielded. Breathe, select your focus frequency, and lock onto your target.
        </p>

        {topTask ? (
          <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6 shadow-2xl">
            <span className="text-[10px] uppercase font-bold tracking-wider text-rose-400 block mb-1">
              Top Priority Core Task
            </span>
            <h2 className="text-lg font-bold mb-4 px-2">
              {topTask.title}
            </h2>

            {/* Large Countdown Clock */}
            <div className="font-mono text-4xl sm:text-5xl font-black text-rose-500 bg-slate-950 py-4 px-6 rounded-xl border border-slate-800 inline-block tracking-widest mb-4">
              {timeLeftStr}
            </div>

            {/* Task estimate */}
            <p className="text-xs text-slate-400 font-medium mb-2">
              Cognitive Estimate: {topTask.estimatedMinutes} Minutes | Category: <span className="uppercase font-bold text-slate-300">{topTask.category}</span>
            </p>

            {/* Proactive AI recommendation snippet */}
            {topTask.aiRecommendation && (
              <div className="text-xs bg-slate-950 border border-slate-800/80 p-3.5 rounded-lg text-slate-300 italic max-w-md mx-auto text-center font-medium mt-2">
                &ldquo;{topTask.aiRecommendation}&rdquo;
              </div>
            )}
          </div>
        ) : (
          <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6">
            <p className="text-slate-400 text-sm">All task deadlines achieved. The shield has no looming target.</p>
          </div>
        )}

        {/* Dynamic breathing box guide */}
        <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-6 flex flex-col items-center">
          <span className="text-[9px] uppercase font-bold tracking-widest text-indigo-400 mb-2">Procrastination Recovery Breathing</span>
          <motion.div 
            key={breathPhase}
            initial={{ scale: 0.9, opacity: 0.6 }}
            animate={{ scale: 1.05, opacity: 1 }}
            className="flex items-center gap-2 text-indigo-300 text-sm font-semibold"
          >
            <Heart className="w-4 h-4 fill-indigo-300 text-indigo-300 animate-pulse" />
            <span>{breathPhase}</span>
          </motion.div>
        </div>

        {/* Ambient Synthesizer Controls */}
        <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-8">
          <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400 block mb-3">Focus Audio Generator (Web Audio Synthesis)</span>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => startSynth("rain")}
              className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSound === "rain"
                  ? "bg-rose-500 text-white"
                  : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              <Play className="w-3 h-3" />
              Brownian Rain
            </button>
            <button
              onClick={() => startSynth("binaural")}
              className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSound === "binaural"
                  ? "bg-rose-500 text-white"
                  : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              <Play className="w-3 h-3" />
              Binaural Beats (205Hz)
            </button>
            <button
              onClick={stopSynth}
              disabled={activeSound === "none"}
              className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSound === "none"
                  ? "bg-slate-800 text-slate-600 cursor-not-allowed"
                  : "bg-rose-950/40 text-rose-400 border border-rose-900/60 hover:bg-rose-900/50"
              }`}
            >
              <VolumeX className="w-3.5 h-3.5" />
              Silence
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          {topTask && (
            <button
              onClick={() => {
                onCompleteTask(topTask.id);
                stopSynth();
                onClose();
              }}
              className="flex-1 py-3 px-4 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-sm font-bold rounded-xl shadow-lg shadow-rose-950/50 hover:scale-[1.01] transition-transform flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-5 h-5" />
              Task Completed (Disable Shield)
            </button>
          )}
          <button
            onClick={() => {
              stopSynth();
              onClose();
            }}
            className="flex-1 py-3 px-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-sm font-bold rounded-xl transition-colors cursor-pointer"
          >
            Close Shield (Return to Dashboard)
          </button>
        </div>
      </div>
    </motion.div>
  );
}
