# Clutch — The Right Help at the Right Time

Clutch is a highly polished, full-stack, AI-powered productivity companion designed to protect users from high cognitive stress, last-minute panic, and task procrastination. 

By integrating intelligent real-time scheduling, an AI-driven workload priority scorer, Google Calendar sync, a voice-supported AI conversational coach, and automated micro-habit tracking, Clutch delivers precisely tailored support when you need it most.

---

## Key Features

- **🧠 Real-Time Cognitive Load Analytics**
  - Interactive distribution chart built with **Recharts** showing where your focus is budgeted.
  - Dynamically toggle between total estimated **Time** allocation and **Task Count**.
  - Automatically handles state transitions with sleek hover/focus feedback.

- **🚨 AI-Driven Urgency Indexing & Priority Badges**
  - **Color-Coded Priority Badges**: Visual indicator tags (**High** in Crimson Red, **Medium** in Warm Amber, and **Low** in Soft Blue) highlight urgency immediately.
  - Proactive **AI Cognitive Scores** (0-100) are generated dynamically based on task closeness, complexity, and priority level.
  - Tailored low-friction **AI Action Suggestions** to help you break through procrastination.

- **📅 Intelligent AI Day-Planner**
  - Maps your tasks to an optimal hourly agenda, automatically interleaving dedicated **Recovery Buffers** to prevent burnout.
  - Seamlessly links to your **Google Calendar** via OAuth for secure sync and real-time deadlock checks.

- **💬 Conversational AI Deadline Coach**
  - A server-side chatbot powered securely by Gemini (`@google/genai` SDK).
  - Dictate actions easily using simulated **Voice Dictation**, and hear suggestions read back with speech feedback.

- **🛡️ Daily Stress Shield Habits**
  - Log repeatable daily habits designed to guard mental and physical energy.
  - Maintain focus streaks complete with glowing visual fire metrics.

---

## Technical Architecture

Clutch uses a modern full-stack TypeScript architecture built to scale cleanly and securely:

- **Frontend**: React (Vite) styled with **Tailwind CSS v4.0** and powered by elegant **Motion** animations.
- **Backend**: **Express** server acting as a secure proxy to preserve API key confidentiality.
- **AI Intelligence**: Built using the modern `@google/genai` TypeScript SDK with server-side AI execution (your Gemini secrets are never exposed to the client browser).
- **Compilation**: High-performance production builds compiled using **esbuild** to bundle the server into a self-contained entry point (`dist/server.cjs`).

---

## Getting Started

### Prerequisites

You need a Google AI Studio API Key and a Google Cloud Console client credentials pair if you intend to synchronize with Google Calendar.

### 1. Environment Variables Setup

Create a `.env` file in the root directory (using `.env.example` as a template):

```env
# Google Gemini API Key
GEMINI_API_KEY=your_gemini_api_key_here

# Google OAuth Integration (Optional - for Calendar Sync)
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

### 2. Install Dependencies

Install the packages defined in `package.json`:

```bash
npm install
```

### 3. Running the Development Server

Start the local server with hot reloading enabled via `tsx`:

```bash
npm run dev
```
The application will boot up at `http://localhost:3000`.

### 4. Production Build and Start

Build and bundle both the React assets and the Node.js Express server:

```bash
npm run build
```

Launch the optimized production server:

```bash
npm run start
```

---

## Code Quality

Maintain codebase cleanliness by running the linter:

```bash
npm run lint
```
