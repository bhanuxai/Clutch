import { useState, useRef, useEffect } from "react";
import { Mic, Send, Sparkles, Volume2, Bot, User, ShieldAlert, Check } from "lucide-react";

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  isAction?: boolean;
}

interface VoiceAssistantProps {
  onTaskCreatedNotification: () => void; // Trigger callback to refresh data when task is created
}

export default function VoiceAssistant({ onTaskCreatedNotification }: VoiceAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "initial-1",
      sender: "ai",
      text: "Hello! I am your AI Deadline Coach. Tell me if you are feeling overwhelmed, or quick-add tasks (e.g., 'add finish research slides by 4pm study priority high'). Let's crush procrastination!",
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      setSpeechSupported(true);
    }
  }, []);

  const handleSpeech = (text: string) => {
    if (!speechSupported) return;
    
    // If speaking, stop it
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const cleanedText = text.replace(/[*#_`]/g, ""); // clean markdown characters
    const utterance = new SpeechSynthesisUtterance(cleanedText);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    if (!textToSend) {
      setInputText("");
    }

    const userMsgId = "msg-" + Date.now();
    setMessages((prev) => [...prev, { id: userMsgId, sender: "user", text }]);
    setIsTyping(true);

    try {
      const response = await fetch("/api/ai/quick-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      const result = await response.json();
      setIsTyping(false);

      if (result.reply) {
        const aiMsgId = "msg-ai-" + Date.now();
        setMessages((prev) => [...prev, { id: aiMsgId, sender: "ai", text: result.reply }]);

        // Auto-speak AI coach's voice response for premium immersion
        if (speechSupported) {
          handleSpeech(result.reply);
        }

        // Check if Gemini returned an autonomous action
        if (result.actions && result.actions.length > 0) {
          result.actions.forEach((act: any) => {
            const actionMsgId = "msg-act-" + Date.now() + Math.random();
            let actionText = "";
            if (act.type === "addTask") {
              actionText = `⚡ Autonomous AI Agent Action: Created task "${act.payload?.title || "Quick-captured goal"}" synced to server database.`;
            } else if (act.type === "completeTask") {
              actionText = `⚡ Autonomous AI Agent Action: Marked matched task completed.`;
            } else if (act.type === "stressRelief") {
              actionText = `🛡️ AI Coaching Protocol: Activated Stress-Relief Box below. Deep breathing initiated.`;
            }

            setMessages((prev) => [...prev, { id: actionMsgId, sender: "ai", text: actionText, isAction: true }]);
          });

          // Inform dashboard to reload data
          onTaskCreatedNotification();
        }
      } else {
        throw new Error("Empty reply");
      }
    } catch (err) {
      console.error("AI Coach Chat failed:", err);
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: "msg-err-" + Date.now(),
          sender: "ai",
          text: "My neural relays are experiencing cognitive friction under last-minute load. Standard advice: Work in a single 15-minute chunk immediately. Let me try again soon!",
        },
      ]);
    }
  };

  const handleVoiceSimulation = () => {
    // Provide some quick templates representing speech dictation to prevent typing friction
    const templates = [
      "add complete math assignment by tonight study priority high",
      "I am extremely stressed and overwhelmed with work",
      "add pay car insurance bills priority medium",
      "snooze CS 101 Midterm draft by 3 hours please",
    ];
    const chosen = templates[Math.floor(Math.random() * templates.length)];
    setInputText(chosen);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col h-[400px] dark:bg-slate-900 dark:border-slate-800" id="voice-assistant-panel">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-50 flex-shrink-0 dark:border-slate-800/60">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-900/60">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display text-base font-bold text-slate-950 dark:text-slate-50">AI Deadline Coach</h2>
            <p className="text-xs text-slate-400 font-medium dark:text-slate-400">Chat, dictate, or listen to proactive survival suggestions</p>
          </div>
        </div>

        {speechSupported && (
          <button
            onClick={() => {
              const lastAiMessage = [...messages].reverse().find(m => m.sender === "ai");
              if (lastAiMessage) handleSpeech(lastAiMessage.text);
            }}
            className={`p-1.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
              isSpeaking
                ? "bg-rose-50 border-rose-100 text-rose-600 animate-pulse dark:bg-rose-950/20 dark:border-rose-900/45 dark:text-rose-400"
                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-750"
            }`}
            title="Read aloud last coach response"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span className="font-mono text-[10px]">{isSpeaking ? "Mute" : "Speak Response"}</span>
          </button>
        )}
      </div>

      {/* Message window */}
      <div className="flex-grow overflow-y-auto pr-1 space-y-3 mb-4 text-xs sm:text-sm custom-scrollbar" id="coach-chat-window">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-2.5 max-w-[85%] ${
              msg.sender === "user" ? "ml-auto flex-row-reverse" : ""
            }`}
            id={`chat-msg-${msg.id}`}
          >
            {/* Avatar */}
            <div className={`p-1.5 rounded-lg flex-shrink-0 border ${
              msg.sender === "user" 
                ? "bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-900/40" 
                : msg.isAction 
                  ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/40"
                  : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
            }`}>
              {msg.sender === "user" ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
            </div>

            {/* Message Bubble */}
            <div className={`p-3 rounded-2xl border ${
              msg.sender === "user"
                ? "bg-indigo-600 text-white border-indigo-700 rounded-tr-none dark:bg-indigo-700 dark:border-indigo-800"
                : msg.isAction
                  ? "bg-emerald-50/60 text-emerald-900 border-emerald-100 font-medium rounded-tl-none shadow-sm shadow-emerald-50 dark:bg-emerald-950/10 dark:text-emerald-300 dark:border-emerald-900/40 dark:shadow-none"
                  : "bg-slate-50 text-slate-800 border-slate-100 rounded-tl-none dark:bg-slate-800/40 dark:text-slate-200 dark:border-slate-800"
            }`}>
              <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex items-start gap-2.5 max-w-[85%]">
            <div className="p-1.5 rounded-lg border bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="p-3 rounded-2xl border bg-slate-50 text-slate-400 border-slate-100 rounded-tl-none flex items-center gap-1 dark:bg-slate-800/40 dark:border-slate-850">
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input container */}
      <div className="flex items-center gap-2 mt-auto flex-shrink-0 border-t border-slate-50 pt-3 dark:border-slate-800/60">
        {/* Simulate Voice Dictation */}
        <button
          onClick={handleVoiceSimulation}
          className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-800 rounded-xl transition-all active:scale-95 cursor-pointer dark:bg-slate-800 dark:hover:bg-slate-750 dark:border-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          id="dictate-voice-simulation-btn"
          title="Simulate speech to text input"
        >
          <Mic className="w-4 h-4 text-indigo-500 animate-pulse dark:text-indigo-400" />
        </button>

        <input
          type="text"
          placeholder="Feel overwhelmed? Ask me to schedule, or quick-add..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          className="flex-grow bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium focus:outline-none focus:bg-white focus:border-indigo-500 transition-colors dark:bg-slate-850 dark:border-slate-700 dark:focus:bg-slate-900 dark:text-slate-250 dark:focus:border-indigo-500"
          id="coach-chat-input"
        />

        <button
          onClick={() => handleSend()}
          disabled={!inputText.trim()}
          className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors active:scale-95 disabled:opacity-40 cursor-pointer"
          id="send-chat-btn"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
