import type { TriageOutput } from "../types/civic";

export interface TriagePayload {
  title: string;
  location: string;
  description: string;
  preferredCategory?: string;
  imageDataUrl?: string;
}

export async function requestAiTriage(
  payload: TriagePayload
): Promise<TriageOutput> {
  const response = await fetch("/api/triage", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    throw new Error(
      `Triage service returned an unreadable response (HTTP ${response.status}).`
    );
  }

  if (!response.ok) {
    const errMsg =
      data &&
      typeof data === "object" &&
      "error" in data &&
      typeof (data as { error?: unknown }).error === "string"
        ? (data as { error: string }).error
        : `Triage request failed (HTTP ${response.status}).`;
    throw new Error(errMsg);
  }

  return data as TriageOutput;
}
