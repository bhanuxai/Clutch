import { Task } from "../types";

export interface GoogleCalendarEvent {
  summary: string;
  description: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{
      method: "popup" | "email";
      minutes: number;
    }>;
  };
  colorId?: string;
}

/**
 * Transforms a Task object into a structured Google Calendar Event object,
 * formatting the start and end dates in RFC3339 format.
 *
 * @param task The task object to format
 * @param timeZone The IANA time zone identifier (defaults to "America/Los_Angeles")
 * @returns A structured Google Calendar event object
 */
export function formatTaskToGoogleEvent(
  task: Task,
  timeZone: string = "America/Los_Angeles"
): GoogleCalendarEvent {
  // RFC3339 / ISO 8601 format verification
  let endISO: string;
  try {
    const d = new Date(task.deadline);
    if (!isNaN(d.getTime())) {
      endISO = d.toISOString();
    } else {
      // Fallback if the deadline date is invalid
      endISO = new Date().toISOString();
    }
  } catch (e) {
    endISO = new Date().toISOString();
  }

  // Calculate start time based on estimatedMinutes or default to 30 mins before deadline
  const durationMinutes = task.estimatedMinutes && task.estimatedMinutes > 0 
    ? task.estimatedMinutes 
    : 30;
  
  const endDateObj = new Date(endISO);
  const startDateObj = new Date(endDateObj.getTime() - durationMinutes * 60 * 1000);
  const startISO = startDateObj.toISOString();

  // Pick visual colors and tags based on priority
  let priorityTag = "[LOW]";
  let colorId = "1"; // Blue / Lavender
  if (task.priority === "high") {
    priorityTag = "🚨 [HIGH]";
    colorId = "11"; // Red
  } else if (task.priority === "medium") {
    priorityTag = "⚠️ [MEDIUM]";
    colorId = "5"; // Yellow
  }

  const completionStatus = task.isCompleted ? " (Completed)" : "";
  const summary = `${priorityTag} Deadline: ${task.title}${completionStatus}`;

  // Formulate a structured and rich description
  const descriptionLines = [
    `🎯 Task: ${task.title}`,
    `🗂️ Category: ${task.category ? task.category.toUpperCase() : "OTHER"}`,
    `⚡ Priority: ${task.priority ? task.priority.toUpperCase() : "MEDIUM"}`,
    `⏱️ Estimated Duration: ${durationMinutes} minutes`,
  ];

  if (task.aiScore) {
    descriptionLines.push(`🔥 Urgency Score: ${task.aiScore}/100`);
  }
  if (task.aiRecommendation) {
    descriptionLines.push(`🧠 AI Recommendation:\n${task.aiRecommendation}`);
  }
  if (task.notes) {
    descriptionLines.push(`📝 Notes:\n${task.notes}`);
  }

  descriptionLines.push(`\n---\nExported from Clutch.`);

  return {
    summary,
    description: descriptionLines.join("\n\n"),
    start: {
      dateTime: startISO,
      timeZone,
    },
    end: {
      dateTime: endISO,
      timeZone,
    },
    colorId,
    reminders: {
      useDefault: false,
      overrides: [
        { method: "popup", minutes: task.priority === "high" ? 60 : 30 },
        { method: "popup", minutes: 15 },
      ],
    },
  };
}

/**
 * Calls the Google Calendar API to push a task as an event to the user's primary/default calendar.
 *
 * @param token The Google OAuth access token
 * @param task The Task object to be synchronized
 * @param timeZone Optional IANA time zone identifier
 * @returns The JSON response from the Google Calendar API
 */
export async function pushTaskToGoogleCalendar(
  token: string,
  task: Task,
  timeZone: string = "America/Los_Angeles"
): Promise<any> {
  if (!token) {
    throw new Error("Access token is required to push events to Google Calendar.");
  }

  const event = formatTaskToGoogleEvent(task, timeZone);

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

  return response.json();
}

/**
 * Calls the Google Calendar API to push an arbitrary calendar event.
 *
 * @param token The Google OAuth access token
 * @param event The structured GoogleCalendarEvent object
 * @returns The JSON response from the Google Calendar API
 */
export async function pushEventToGoogleCalendar(
  token: string,
  event: GoogleCalendarEvent
): Promise<any> {
  if (!token) {
    throw new Error("Access token is required to push events to Google Calendar.");
  }

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

  return response.json();
}

