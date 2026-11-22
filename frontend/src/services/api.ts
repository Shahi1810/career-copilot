import type { AskResponse } from "../types/chat";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export async function askQuestion(question: string): Promise<AskResponse> {
  const response = await fetch(`${API_BASE_URL}/ask`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ question }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Server error (${response.status})`);
  }

  return response.json();
}
