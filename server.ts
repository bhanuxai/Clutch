import dotenv from "dotenv";
dotenv.config();

import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with User-Agent and key
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
  try {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
    console.log("Gemini SDK successfully initialized.");
  } catch (err) {
    console.error("Failed to initialize Gemini SDK:", err);
  }
} else {
  console.log("No valid GEMINI_API_KEY found. Operating in developer simulation mode.");
}

// Interfaces
interface Task {
  id: string;
  title: string;
  deadline: string; // ISO String (e.g. 2026-06-24T23:30:00.000Z)
  category: "work" | "study" | "personal" | "bills" | "other";
  priority: "high" | "medium" | "low";
  estimatedMinutes: number;
  isCompleted: boolean;
  notes: string;
  aiScore?: number;
  aiRecommendation?: string;
}

interface Habit {
  id: string;
  title: string;
  streak: number;
  lastCompleted?: string; // YYYY-MM-DD
  category: string;
}

interface AppData {
  tasks: Task[];
  habits: Habit[];
  itinerary: any[];
  generalAdvice: string;
}

const DATA_FILE = path.join(process.cwd(), "data-store.json");

// Helper relative time generator based on current mock date (2026-06-24)
const getRelativeDateISO = (hoursOffset: number) => {
  const baseDate = new Date("2026-06-24T09:00:00-07:00");
  baseDate.setHours(baseDate.getHours() + hoursOffset);
  return baseDate.toISOString();
};

const defaultData: AppData = {
  tasks: [
    {
      id: "task-1",
      title: "Submit CS 101 Midterm Project Draft",
      deadline: getRelativeDateISO(4.5), // in 4.5 hours (today 1:30 PM)
      category: "study",
      priority: "high",
      estimatedMinutes: 90,
      isCompleted: false,
      notes: "Include the database relational diagram and ER modeling report.",
      aiScore: 92,
      aiRecommendation: "Divide and conquer: Spend 30 mins drafting the introduction, then use AI modeling helpers for the ER diagram.",
    },
    {
      id: "task-2",
      title: "Pay Quarterly Electricity Bill",
      deadline: getRelativeDateISO(8), // in 8 hours (today 5:00 PM)
      category: "bills",
      priority: "high",
      estimatedMinutes: 10,
      isCompleted: false,
      notes: "Account #4912-3209. Auto-pay declined last week.",
      aiScore: 85,
      aiRecommendation: "Instant action: Do this right now. It takes less than 5 minutes and clears mental overhead completely.",
    },
    {
      id: "task-3",
      title: "Review Pitch Slides for Friday Investor Call",
      deadline: getRelativeDateISO(28), // tomorrow
      category: "work",
      priority: "medium",
      estimatedMinutes: 60,
      isCompleted: false,
      notes: "Refine slide 4 (financial forecasts) and slide 7 (competitive advantages).",
      aiScore: 55,
      aiRecommendation: "Timeblock tomorrow: Schedule a dedicated 45 minutes after morning coffee before you get distracted.",
    },
    {
      id: "task-4",
      title: "Schedule Routine Dentist Appointment",
      deadline: getRelativeDateISO(72), // in 3 days
      category: "personal",
      priority: "low",
      estimatedMinutes: 15,
      isCompleted: false,
      notes: "Need to call Dr. Adams' clinic or book via portal.",
      aiScore: 20,
      aiRecommendation: "Batch task: Bundle this with other low-urgency calls on Friday afternoon when energy is lower.",
    }
  ],
  habits: [
    {
      id: "habit-1",
      title: "Drink 3L of Water",
      streak: 5,
      lastCompleted: "2026-06-23",
      category: "health",
    },
    {
      id: "habit-2",
      title: "Focus Block (45m)",
      streak: 12,
      lastCompleted: "2026-06-24",
      category: "productivity",
    },
    {
      id: "habit-3",
      title: "Daily Stretch",
      streak: 3,
      lastCompleted: "2026-06-23",
      category: "mindfulness",
    }
  ],
  itinerary: [
    { time: "09:00 - 09:30", task: "Planning & Morning Kickoff", isBuffer: false, focusTip: "Drink a large glass of water first." },
    { time: "09:30 - 11:00", task: "CS 101 Midterm Project Core (Task 1)", isBuffer: false, focusTip: "Put phone in another room or turn on Shield Mode." },
    { time: "11:00 - 11:15", task: "Active Stretch & Breathwork", isBuffer: true, focusTip: "Staggered breaks reduce burnout." },
    { time: "11:15 - 12:00", task: "CS 101 Polish & Submission", isBuffer: false, focusTip: "Verify criteria before hitting submit." },
    { time: "12:00 - 12:30", task: "Lunch & Screen Break", isBuffer: true, focusTip: "Do not scroll social media during lunch." },
    { time: "12:30 - 13:00", task: "Admin Sprint: Electricity Bill (Task 2)", isBuffer: false, focusTip: "Get it done and feel the quick victory." }
  ],
  generalAdvice: "A high-priority deadline is looming in under 5 hours. Clear away minor distractions and engage your first CS 101 focus block immediately. Procrastinating now will compound afternoon anxiety."
};

// Read / Write Database
function loadData(): AppData {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.error("Error loading data file, restoring defaults:", err);
  }
  // Store defaults if no file exists
  saveData(defaultData);
  return defaultData;
}

function saveData(data: AppData) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing data file:", err);
  }
}

// GET entire application state (for seamless synchronization)
app.get("/api/data", (req, res) => {
  const data = loadData();
  res.json(data);
});

// POST task
app.post("/api/tasks", (req, res) => {
  const { title, deadline, category, priority, estimatedMinutes, notes } = req.body;
  if (!title || !deadline) {
    res.status(400).json({ error: "Title and deadline are required" });
    return;
  }
  const data = loadData();
  const newTask: Task = {
    id: "task-" + Date.now(),
    title,
    deadline,
    category: category || "other",
    priority: priority || "medium",
    estimatedMinutes: Number(estimatedMinutes) || 30,
    isCompleted: false,
    notes: notes || "",
    aiScore: 50, // default mid score
    aiRecommendation: "Awaiting next AI prioritization update..."
  };
  data.tasks.push(newTask);
  saveData(data);
  res.status(201).json(newTask);
});

// PUT task
app.put("/api/tasks/:id", (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const data = loadData();
  const taskIndex = data.tasks.findIndex((t) => t.id === id);
  if (taskIndex === -1) {
    res.status(404).json({ error: "Task not found" });
    return;
  }
  data.tasks[taskIndex] = { ...data.tasks[taskIndex], ...updates };
  saveData(data);
  res.json(data.tasks[taskIndex]);
});

// DELETE task
app.delete("/api/tasks/:id", (req, res) => {
  const { id } = req.params;
  const data = loadData();
  data.tasks = data.tasks.filter((t) => t.id !== id);
  saveData(data);
  res.json({ success: true });
});

// POST habit
app.post("/api/habits", (req, res) => {
  const { title, category } = req.body;
  if (!title) {
    res.status(400).json({ error: "Title is required" });
    return;
  }
  const data = loadData();
  const newHabit: Habit = {
    id: "habit-" + Date.now(),
    title,
    streak: 0,
    category: category || "health"
  };
  data.habits.push(newHabit);
  saveData(data);
  res.status(201).json(newHabit);
});

// PUT habit (e.g. check off or update streak)
app.put("/api/habits/:id", (req, res) => {
  const { id } = req.params;
  const { streak, lastCompleted } = req.body;
  const data = loadData();
  const habitIndex = data.habits.findIndex((h) => h.id === id);
  if (habitIndex === -1) {
    res.status(404).json({ error: "Habit not found" });
    return;
  }
  if (streak !== undefined) data.habits[habitIndex].streak = streak;
  if (lastCompleted !== undefined) data.habits[habitIndex].lastCompleted = lastCompleted;
  saveData(data);
  res.json(data.habits[habitIndex]);
});

// DELETE habit
app.delete("/api/habits/:id", (req, res) => {
  const { id } = req.params;
  const data = loadData();
  data.habits = data.habits.filter((h) => h.id !== id);
  saveData(data);
  res.json({ success: true });
});

// POST AI Prioritization
app.post("/api/ai/prioritize", async (req, res) => {
  const data = loadData();
  const tasksToProcess = data.tasks.filter(t => !t.isCompleted);

  if (tasksToProcess.length === 0) {
    res.json({ message: "No active tasks to prioritize." });
    return;
  }

  const currentDateString = "2026-06-24T09:33:11-07:00"; // Current system state

  if (!ai) {
    // Graceful developer simulation mode when no AI Key is supplied
    console.log("No AI client. Simulating prioritization algorithm...");
    const updatedTasks = data.tasks.map(task => {
      if (task.isCompleted) return task;
      const hoursLeft = (new Date(task.deadline).getTime() - new Date(currentDateString).getTime()) / (1000 * 60 * 60);
      let calculatedScore = 50;
      if (hoursLeft <= 0) {
        calculatedScore = 100;
      } else if (hoursLeft < 12) {
        calculatedScore = Math.min(100, Math.round(90 + (12 - hoursLeft) * 0.8));
      } else if (hoursLeft < 48) {
        calculatedScore = Math.round(60 + (48 - hoursLeft) * 0.5);
      } else {
        calculatedScore = Math.max(10, Math.round(30 - (hoursLeft / 24) * 2));
      }

      // Add category penalty
      if (task.priority === "high") calculatedScore = Math.min(100, calculatedScore + 10);

      let recommendation = "Proactive action: Dedicate a 15-minute chunk right now to sketch out the roadmap.";
      if (calculatedScore > 80) {
        recommendation = "CRITICAL: Clear all schedules and start a single-focus block now. Do not check notifications.";
      } else if (calculatedScore > 50) {
        recommendation = "Plan of action: Review guidelines and materials, then book 45 minutes on your calendar for tomorrow.";
      }

      return {
        ...task,
        aiScore: calculatedScore,
        aiRecommendation: recommendation
      };
    });

    data.tasks = updatedTasks;
    data.generalAdvice = "Deadlines prioritized locally. To enable real-time generative suggestions and customized motivational insights, ensure GEMINI_API_KEY is configured in your Secrets panel.";
    saveData(data);
    res.json({ success: true, updatedTasks, generalAdvice: data.generalAdvice });
    return;
  }

  try {
    const prompt = `
      You are the core prioritization engine of "The Last-Minute Life Saver" application.
      Given the current simulated user's date and time is ${currentDateString}, evaluate the following active, uncompleted tasks and compute:
      1. A custom "aiScore" (integer 0 to 100) representing actual cognitive urgency and consequence of failure. Consider proximity of deadline, estimate in minutes, and priority.
      2. A tailored "aiRecommendation" (single highly motivational sentence) outlining a low-friction micro-action they can perform in the next 15 minutes to break procrastination and start.

      Active Tasks:
      ${JSON.stringify(tasksToProcess.map(t => ({ id: t.id, title: t.title, deadline: t.deadline, category: t.category, priority: t.priority, estimatedMinutes: t.estimatedMinutes, notes: t.notes })))}

      Also output a short, urgent "generalAdvice" string (maximum 2 sentences) summarizing the highest cognitive threat of the day and giving a bold action statement.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  aiScore: { type: Type.INTEGER },
                  aiRecommendation: { type: Type.STRING }
                },
                required: ["id", "aiScore", "aiRecommendation"]
              }
            },
            generalAdvice: { type: Type.STRING }
          },
          required: ["tasks", "generalAdvice"]
        }
      }
    });

    const resultText = response.text || "{}";
    const aiResult = JSON.parse(resultText);

    // Update in-memory data
    const updatedTasks = data.tasks.map(task => {
      const aiUpdate = aiResult.tasks.find((t: any) => t.id === task.id);
      if (aiUpdate) {
        return {
          ...task,
          aiScore: aiUpdate.aiScore,
          aiRecommendation: aiUpdate.aiRecommendation
        };
      }
      return task;
    });

    data.tasks = updatedTasks;
    data.generalAdvice = aiResult.generalAdvice;
    saveData(data);

    res.json({ success: true, updatedTasks, generalAdvice: data.generalAdvice });
  } catch (error: any) {
    console.warn("Gemini AI prioritization failed. Activating local cognitive prioritizing fallback:", error);
    
    const updatedTasks = data.tasks.map(task => {
      if (task.isCompleted) return task;
      const hoursLeft = (new Date(task.deadline).getTime() - new Date(currentDateString).getTime()) / (1000 * 60 * 60);
      let calculatedScore = 50;
      if (hoursLeft <= 0) {
        calculatedScore = 100;
      } else if (hoursLeft < 12) {
        calculatedScore = Math.min(100, Math.round(90 + (12 - hoursLeft) * 0.8));
      } else if (hoursLeft < 48) {
        calculatedScore = Math.round(60 + (48 - hoursLeft) * 0.5);
      } else {
        calculatedScore = Math.max(10, Math.round(30 - (hoursLeft / 24) * 2));
      }

      // Add category penalty
      if (task.priority === "high") calculatedScore = Math.min(100, calculatedScore + 10);

      let recommendation = "Proactive action: Dedicate a 15-minute chunk right now to sketch out the roadmap.";
      if (calculatedScore > 80) {
        recommendation = "CRITICAL: Clear all schedules and start a single-focus block now. Do not check notifications.";
      } else if (calculatedScore > 50) {
        recommendation = "Plan of action: Review guidelines and materials, then book 45 minutes on your calendar for tomorrow.";
      }

      return {
        ...task,
        aiScore: calculatedScore,
        aiRecommendation: recommendation
      };
    });

    data.tasks = updatedTasks;
    data.generalAdvice = "Under high demand, local deadline guardian prioritizing was activated. Breathe, check off the high score items first, and execute your single-task block!";
    saveData(data);
    res.json({ success: true, updatedTasks, generalAdvice: data.generalAdvice });
  }
});

// POST AI Schedule Generation
app.post("/api/ai/schedule", async (req, res) => {
  const data = loadData();
  const { startHour, endHour } = req.body;
  const start = startHour || "09:00";
  const end = endHour || "18:00";
  
  const activeTasks = data.tasks.filter(t => !t.isCompleted);
  
  if (!ai) {
    // Simulation fallback
    console.log("No AI client. Generating simulated itinerary...");
    const simItinerary = [
      { time: `${start} - 10:30`, task: activeTasks[0]?.title || "Proactive planning of remaining goals", isBuffer: false, focusTip: "Drink water and close distracting browser tabs." },
      { time: "10:30 - 10:45", task: "Mindful breathing and eye rest", isBuffer: true, focusTip: "Look at something 20 feet away for 20 seconds." },
      { time: "10:45 - 12:00", task: activeTasks[1]?.title || "Administrative quick wins & inbox sprint", isBuffer: false, focusTip: "Put your phone in another room." },
      { time: "12:00 - 13:00", task: "Lunch & physical stretching", isBuffer: true, focusTip: "Engage in zero screen-time for the next 45 minutes." },
      { time: `13:00 - ${end}`, task: "Deep work task execution", isBuffer: false, focusTip: "Enable focus-shielding and silence notifications." }
    ];
    data.itinerary = simItinerary;
    saveData(data);
    res.json({ itinerary: simItinerary });
    return;
  }

  try {
    const prompt = `
      You are the master scheduler for "The Last-Minute Life Saver".
      Create a highly realistic and detailed hourly schedule for today between ${start} and ${end}.
      Map the active user tasks into the schedule based on priority and estimated durations.
      Interleave buffer times (essential for procrastination-recovery, quick walks, or stretching) so they don't burn out.
      
      Available Tasks:
      ${JSON.stringify(activeTasks.map(t => ({ title: t.title, priority: t.priority, estimatedMinutes: t.estimatedMinutes })))}

      Return an array of schedule objects where each object has:
      - "time": string representing range (e.g. "09:00 - 10:30")
      - "task": string describing the specific task or buffer activity
      - "isBuffer": boolean indicating if this is a relaxation/recharge block
      - "focusTip": string providing a tailored micro-tip to beat distraction
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              time: { type: Type.STRING },
              task: { type: Type.STRING },
              isBuffer: { type: Type.BOOLEAN },
              focusTip: { type: Type.STRING }
            },
            required: ["time", "task", "isBuffer", "focusTip"]
          }
        }
      }
    });

    const resultText = response.text || "[]";
    const itinerary = JSON.parse(resultText);
    data.itinerary = itinerary;
    saveData(data);

    res.json({ itinerary });
  } catch (error: any) {
    console.warn("Gemini AI schedule generation failed. Activating local day-planner generator fallback:", error);
    const simItinerary = [
      { time: `${start} - 10:30`, task: activeTasks[0]?.title || "Proactive planning of remaining goals", isBuffer: false, focusTip: "Drink water and close distracting browser tabs." },
      { time: "10:30 - 10:45", task: "Mindful breathing and eye rest", isBuffer: true, focusTip: "Look at something 20 feet away for 20 seconds." },
      { time: "10:45 - 12:00", task: activeTasks[1]?.title || "Administrative quick wins & inbox sprint", isBuffer: false, focusTip: "Put your phone in another room." },
      { time: "12:00 - 13:00", task: "Lunch & physical stretching", isBuffer: true, focusTip: "Engage in zero screen-time for the next 45 minutes." },
      { time: `13:00 - ${end}`, task: "Deep work task execution", isBuffer: false, focusTip: "Enable focus-shielding and silence notifications." }
    ];
    data.itinerary = simItinerary;
    saveData(data);
    res.json({ itinerary: simItinerary });
  }
});

// ==========================================
// GOOGLE CALENDAR INTEGRATION ENDPOINTS
// ==========================================

interface GoogleTokens {
  accessToken: string;
  refreshToken?: string;
  expiryDate?: number;
  email?: string;
}

const TOKENS_FILE = path.join(process.cwd(), "google-tokens.json");

function loadGoogleTokens(): GoogleTokens | null {
  try {
    if (fs.existsSync(TOKENS_FILE)) {
      const content = fs.readFileSync(TOKENS_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.error("Error loading Google tokens:", err);
  }
  return null;
}

function saveGoogleTokens(tokens: GoogleTokens | null) {
  try {
    if (tokens) {
      fs.writeFileSync(TOKENS_FILE, JSON.stringify(tokens, null, 2), "utf-8");
    } else if (fs.existsSync(TOKENS_FILE)) {
      fs.unlinkSync(TOKENS_FILE);
    }
  } catch (err) {
    console.error("Error saving Google tokens:", err);
  }
}

async function getValidAccessToken(): Promise<string | null> {
  const tokens = loadGoogleTokens();
  if (!tokens) return null;

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) return null;

  const now = Date.now();
  // If token is valid for another 5 minutes, use it
  if (tokens.expiryDate && tokens.expiryDate > now + 5 * 60 * 1000) {
    return tokens.accessToken;
  }

  // Refresh if we have a refresh token
  if (tokens.refreshToken) {
    try {
      console.log("Google access token expired. Refreshing token...");
      const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: tokens.refreshToken,
          grant_type: "refresh_token",
        }),
      });

      if (!response.ok) {
        throw new Error(`Refresh failed with status ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const updatedTokens: GoogleTokens = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || tokens.refreshToken,
        expiryDate: Date.now() + (data.expires_in * 1000),
        email: tokens.email,
      };

      saveGoogleTokens(updatedTokens);
      return updatedTokens.accessToken;
    } catch (err) {
      console.error("Failed to refresh Google token:", err);
      return null;
    }
  }

  return null;
}

// Check connection and server environment status
app.get("/api/auth/google/status", async (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const configured = !!(clientId && clientSecret);

  const token = await getValidAccessToken();
  const connected = !!token;
  const tokens = loadGoogleTokens();

  res.json({
    configured,
    connected,
    email: connected ? tokens?.email : undefined,
  });
});

// Disconnect/sign out
app.post("/api/auth/google/disconnect", (req, res) => {
  saveGoogleTokens(null);
  res.json({ success: true });
});

// Generate authorization URL
app.get("/api/auth/google/url", (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return res.json({ configured: false });
  }

  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const normalizedAppUrl = appUrl.endsWith("/") ? appUrl.slice(0, -1) : appUrl;
  const redirectUri = `${normalizedAppUrl}/auth/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/calendar.events",
    access_type: "offline",
    prompt: "consent",
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  res.json({ configured: true, url: authUrl });
});

// Handle OAuth callback
app.get(["/auth/callback", "/auth/callback/"], async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.status(400).send("Authorization code is missing");
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return res.status(500).send("Google Client credentials are not configured on the server");
  }

  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const normalizedAppUrl = appUrl.endsWith("/") ? appUrl.slice(0, -1) : appUrl;
  const redirectUri = `${normalizedAppUrl}/auth/callback`;

  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: code as string,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new Error(`Token exchange failed: ${tokenResponse.statusText} - ${errorText}`);
    }

    const tokenData = await tokenResponse.json();

    // Fetch user email to display in UI
    let email = "Connected User";
    try {
      const infoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      if (infoResponse.ok) {
        const info = await infoResponse.json();
        email = info.email || "Connected User";
      }
    } catch (e) {
      console.warn("Failed to retrieve user info during login:", e);
    }

    const tokens: GoogleTokens = {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiryDate: Date.now() + (tokenData.expires_in * 1000),
      email: email,
    };

    saveGoogleTokens(tokens);

    res.send(`
      <html>
        <head>
          <title>Google Calendar Linked</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; background-color: #0b1329; color: white; text-align: center; }
            .card { background: #111a2e; padding: 2.5rem; border-radius: 1.5rem; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5); border: 1px solid #1e2942; max-w: 400px; }
            h1 { color: #f43f5e; font-size: 1.5rem; margin-top: 0; }
            p { color: #94a3b8; font-size: 0.9rem; line-height: 1.5; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Google Calendar Linked!</h1>
            <p>Your calendar is successfully connected with your Life Saver workspace.</p>
            <p>This popup window will automatically close in a brief moment.</p>
          </div>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'GOOGLE_OAUTH_SUCCESS' }, '*');
              setTimeout(() => { window.close(); }, 1500);
            } else {
              window.location.href = '/';
            }
          </script>
        </body>
      </html>
    `);
  } catch (err: any) {
    console.error("Error during Google OAuth callback:", err);
    res.status(500).send(`Authentication failed: ${err.message}`);
  }
});

// Fetch events from Google Calendar (for display in itinerary/sync check)
app.get("/api/calendar/events", async (req, res) => {
  const token = await getValidAccessToken();
  if (!token) {
    return res.status(401).json({ error: "Google Calendar not connected" });
  }

  try {
    // Current date is 2026-06-24 in current conversation context
    const timeMin = new Date("2026-06-24T00:00:00-07:00").toISOString();
    const timeMax = new Date("2026-06-30T23:59:59-07:00").toISOString();

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(
        timeMin
      )}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime&maxResults=10`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!response.ok) {
      throw new Error(`Google Calendar API returned status ${response.status}`);
    }

    const data = await response.json();
    res.json({ events: data.items || [] });
  } catch (err: any) {
    console.error("Failed to list calendar events:", err);
    res.status(500).json({ error: err.message });
  }
});

// Export a Task (Deadline) to Google Calendar
app.post("/api/calendar/sync-task", async (req, res) => {
  const { taskId } = req.body;
  if (!taskId) {
    return res.status(400).json({ error: "taskId is required" });
  }

  const token = await getValidAccessToken();
  if (!token) {
    return res.status(401).json({ error: "Google Calendar not connected" });
  }

  const data = loadData();
  const task = data.tasks.find((t) => t.id === taskId);
  if (!task) {
    return res.status(404).json({ error: "Task not found" });
  }

  try {
    const deadlineDate = new Date(task.deadline);
    const startDate = new Date(deadlineDate.getTime() - task.estimatedMinutes * 60 * 1000);

    const event = {
      summary: `🚨 DEADLINE: ${task.title}`,
      description: `Priority: ${task.priority.toUpperCase()}\nCategory: ${task.category.toUpperCase()}\nNotes: ${task.notes || "None"}\n\nGenerated by The Last-Minute Life Saver.`,
      start: {
        dateTime: startDate.toISOString(),
      },
      end: {
        dateTime: deadlineDate.toISOString(),
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: "popup", minutes: 30 },
          { method: "email", minutes: 120 },
        ],
      },
    };

    const response = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google Calendar API event creation failed: ${errorText}`);
    }

    const responseData = await response.json();
    res.json({ success: true, eventId: responseData.id });
  } catch (err: any) {
    console.error("Failed to sync task to calendar:", err);
    res.status(500).json({ error: err.message });
  }
});

// Export the entire Day-Planner itinerary to Google Calendar
app.post("/api/calendar/sync-itinerary", async (req, res) => {
  const token = await getValidAccessToken();
  if (!token) {
    return res.status(401).json({ error: "Google Calendar not connected" });
  }

  const data = loadData();
  const itinerary = data.itinerary;
  if (!itinerary || itinerary.length === 0) {
    return res.status(400).json({ error: "No itinerary to sync. Generate an AI schedule first." });
  }

  try {
    const syncResults = [];
    for (const block of itinerary) {
      const timeParts = block.time.split("-");
      if (timeParts.length !== 2) continue;

      const startStr = timeParts[0].trim();
      const endStr = timeParts[1].trim();

      const baseDate = "2026-06-24";
      const startDateTime = new Date(`${baseDate}T${startStr.padStart(5, "0")}:00-07:00`);
      const endDateTime = new Date(`${baseDate}T${endStr.padStart(5, "0")}:00-07:00`);

      const event = {
        summary: block.isBuffer ? `☕ Relax/Stretch: ${block.task}` : `🎯 Focus: ${block.task}`,
        description: `Focus Tip: ${block.focusTip}\n\nGenerated by The Last-Minute Life Saver.`,
        start: {
          dateTime: startDateTime.toISOString(),
        },
        end: {
          dateTime: endDateTime.toISOString(),
        },
      };

      const response = await fetch(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(event),
        }
      );

      if (response.ok) {
        const ev = await response.json();
        syncResults.push(ev.id);
      }
    }

    res.json({ success: true, count: syncResults.length });
  } catch (err: any) {
    console.error("Failed to sync itinerary to Google Calendar:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST AI Smart Quick-Chat & Agentic Action (Natural Language Input)
app.post("/api/ai/quick-chat", async (req, res) => {
  const { message } = req.body;
  if (!message) {
    res.status(400).json({ error: "Message is required" });
    return;
  }

  const currentDateString = "2026-06-24T09:33:11-07:00"; // current state
  const data = loadData();

  if (!ai) {
    // Simulation mode
    const msgLower = message.toLowerCase();
    let reply = `I hear you! To get the most of my AI cognitive planning, make sure your GEMINI_API_KEY is configured in Settings > Secrets.`;
    const actions: any[] = [];

    if (msgLower.includes("add") || msgLower.includes("need to")) {
      const titleMatch = message.match(/(?:add|need to)\s+([^by|at|for|tomorrow|today]+)/i);
      const title = titleMatch ? titleMatch[1].trim() : "New Quick-Captured Goal";
      
      const newSimTask: Task = {
        id: "task-" + Date.now(),
        title,
        deadline: getRelativeDateISO(24), // tomorrow default
        category: "work",
        priority: "medium",
        estimatedMinutes: 30,
        isCompleted: false,
        notes: "Quick-captured via chat command",
        aiScore: 60,
        aiRecommendation: "Plan immediate execution: Schedule a 30m block on your dashboard today."
      };
      data.tasks.push(newSimTask);
      saveData(data);
      reply = `Captured that for you! I have added the task: "${title}" to your task list. It's now synchronized across all your devices. Let's conquer it!`;
      actions.push({ type: "addTask", payload: newSimTask });
    } else if (msgLower.includes("stress") || msgLower.includes("overwhelmed") || msgLower.includes("help")) {
      reply = `Breathe in slowly for 4 seconds... hold for 4... exhale for 4. You are experiencing cognitive overload. I recommend launching **Shield Mode** on your top task immediately. Let me hide the low-priority noise for you.`;
    } else {
      reply = `I'm on standby to shield your deadlines. Tell me to 'add task [name] by tonight' or write 'I am overwhelmed' to activate stress-relief protocol.`;
    }

    res.json({ reply, actions });
    return;
  }

  try {
    const prompt = `
      You are "The Last-Minute Life Saver" core agent. You help stressed students and professionals.
      The user sends you a natural language message: "${message}".
      The current time is ${currentDateString}.
      
      Interpret the message.
      1. If the user wants to add a task, schedule something, or complete an item, return a list of actions.
         We support the following action types:
         - "addTask": payload should contain: "title" (string), "deadline" (ISO string, estimate relative to today 2026-06-24), "category" ("work" | "study" | "personal" | "bills" | "other"), "priority" ("high" | "medium" | "low"), "estimatedMinutes" (integer), "notes" (string)
         - "completeTask": payload should contain: "taskId" (string of task if match can be found)
         - "stressRelief": no payload needed, reply with supportive advice and recommended break
      2. Provide a highly empathetic, encouraging, and clear "reply" (maximum 3 sentences) in the tone of a high-performance, reassuring human coach who understands last-minute panic.

      Current task list for context:
      ${JSON.stringify(data.tasks.map(t => ({ id: t.id, title: t.title, deadline: t.deadline, isCompleted: t.isCompleted })))}
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: { type: Type.STRING },
            actions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING, description: "e.g., 'addTask', 'completeTask', 'stressRelief'" },
                  payload: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      deadline: { type: Type.STRING },
                      category: { type: Type.STRING },
                      priority: { type: Type.STRING },
                      estimatedMinutes: { type: Type.INTEGER },
                      notes: { type: Type.STRING },
                      taskId: { type: Type.STRING }
                    }
                  }
                },
                required: ["type"]
              }
            }
          },
          required: ["reply"]
        }
      }
    });

    const resultText = response.text || "{}";
    const parsedResult = JSON.parse(resultText);

    // Apply actions to data-store if any
    let actionsApplied = false;
    if (parsedResult.actions && parsedResult.actions.length > 0) {
      for (const action of parsedResult.actions) {
        if (action.type === "addTask") {
          const { title, deadline, category, priority, estimatedMinutes, notes } = action.payload || {};
          const newTask: Task = {
            id: "task-" + Date.now(),
            title: title || "Quick Goal",
            deadline: deadline || getRelativeDateISO(24),
            category: category || "other",
            priority: priority || "medium",
            estimatedMinutes: estimatedMinutes || 30,
            isCompleted: false,
            notes: notes || "Added via quick assistant chat",
            aiScore: 70,
            aiRecommendation: "Draft a simple next step list to defeat anxiety."
          };
          data.tasks.push(newTask);
          actionsApplied = true;
        } else if (action.type === "completeTask") {
          const { taskId } = action.payload || {};
          const idx = data.tasks.findIndex(t => t.id === taskId);
          if (idx !== -1) {
            data.tasks[idx].isCompleted = true;
            actionsApplied = true;
          }
        }
      }
    }

    if (actionsApplied) {
      saveData(data);
    }

    res.json(parsedResult);
  } catch (error: any) {
    console.warn("Gemini AI quick chat failed. Activating local coach assistant fallback:", error);
    const msgLower = message.toLowerCase();
    let reply = `I'm on guardian support mode right now! Let's lock in and defeat procrastination together.`;
    const actions: any[] = [];

    if (msgLower.includes("add") || msgLower.includes("need to")) {
      const titleMatch = message.match(/(?:add|need to)\s+([^by|at|for|tomorrow|today]+)/i);
      const title = titleMatch ? titleMatch[1].trim() : "New Quick-Captured Goal";
      
      const newSimTask: Task = {
        id: "task-" + Date.now(),
        title,
        deadline: getRelativeDateISO(24), // tomorrow default
        category: "work",
        priority: "medium",
        estimatedMinutes: 30,
        isCompleted: false,
        notes: "Captured via local fallback coach command",
        aiScore: 60,
        aiRecommendation: "Plan immediate execution: Schedule a 30m block on your dashboard today."
      };
      data.tasks.push(newSimTask);
      saveData(data);
      reply = `Captured that! I have added the task: "${title}" to your task list. It's now synchronized. Let's conquer it!`;
      actions.push({ type: "addTask", payload: newSimTask });
    } else if (msgLower.includes("stress") || msgLower.includes("overwhelmed") || msgLower.includes("help")) {
      reply = `Inhale 4s... hold 4s... exhale 4s. Don't let the cognitive pressure get you. I strongly recommend launching **Shield Mode** on your top priority task now to block distraction.`;
    } else {
      reply = `I'm here as your shield guardian. Ask me to 'add task [name] by tonight' or say 'I am overwhelmed' to activate stress-relief protocol.`;
    }

    res.json({ reply, actions });
  }
});

// Serve static assets in production, otherwise hook Vite dev server
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
