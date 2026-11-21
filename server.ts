import "dotenv/config";
import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GoogleGenAI, Type } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CATEGORIES = [
  "Roads & Potholes",
  "Waste Management",
  "Water & Drainage",
  "Streetlights & Electricity",
  "Public Safety",
] as const;

const PRIORITIES = ["High", "Medium", "Low"] as const;

const DEPARTMENTS = [
  "Public Works Dept",
  "Sanitation Wing",
  "Water Supply Board",
  "Electrical Dept",
  "Municipal Safety",
] as const;

type CivicCategory = (typeof CATEGORIES)[number];
type CivicPriority = (typeof PRIORITIES)[number];
type CivicDepartment = (typeof DEPARTMENTS)[number];

interface TriageRequestBody {
  title?: string;
  location?: string;
  description?: string;
  preferredCategory?: string;
  imageDataUrl?: string;
}

interface TriageResult {
  category: CivicCategory;
  priority: CivicPriority;
  department: CivicDepartment;
  aiSummary: string;
}

const DEFAULT_DEPARTMENT_BY_CATEGORY: Record<CivicCategory, CivicDepartment> = {
  "Roads & Potholes": "Public Works Dept",
  "Waste Management": "Sanitation Wing",
  "Water & Drainage": "Water Supply Board",
  "Streetlights & Electricity": "Electrical Dept",
  "Public Safety": "Municipal Safety",
};

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    throw new Error(
      "GEMINI_API_KEY is not configured. Please check the Settings > Secrets panel."
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

function parseDataUrl(dataUrl: string): { mimeType: string; data: string } | null {
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(dataUrl);
  if (!match) {
    return null;
  }
  return {
    mimeType: match[1],
    data: match[2],
  };
}

function isTransientError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return (
    msg.includes("503") ||
    msg.includes("500") ||
    msg.includes("unavailable") ||
    msg.includes("timeout") ||
    msg.includes("econnreset") ||
    msg.includes("fetch failed")
  );
}

async function runWithRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < maxAttempts && isTransientError(err)) {
        const delayMs = 450 * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

function normalizeTriagePayload(raw: Record<string, unknown>): TriageResult {
  const rawCategory = String(raw.category ?? "");
  const category: CivicCategory = CATEGORIES.includes(rawCategory as CivicCategory)
    ? (rawCategory as CivicCategory)
    : "Public Safety";

  const rawPriority = String(raw.priority ?? "");
  const priority: CivicPriority = PRIORITIES.includes(rawPriority as CivicPriority)
    ? (rawPriority as CivicPriority)
    : "Medium";

  const rawDepartment = String(raw.department ?? "");
  const department: CivicDepartment = DEPARTMENTS.includes(rawDepartment as CivicDepartment)
    ? (rawDepartment as CivicDepartment)
    : DEFAULT_DEPARTMENT_BY_CATEGORY[category];

  const aiSummary =
    typeof raw.aiSummary === "string" && raw.aiSummary.trim().length > 0
      ? raw.aiSummary.trim()
      : "Civic issue logged and routed to municipal operations for field inspection.";

  return { category, priority, department, aiSummary };
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: "15mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/triage", async (req, res) => {
    try {
      const body = (req.body ?? {}) as TriageRequestBody;
      const title = typeof body.title === "string" ? body.title.trim() : "";
      const location = typeof body.location === "string" ? body.location.trim() : "";
      const description =
        typeof body.description === "string" ? body.description.trim() : "";
      const preferredCategory =
        typeof body.preferredCategory === "string"
          ? body.preferredCategory.trim()
          : "";
      const imageDataUrl =
        typeof body.imageDataUrl === "string" ? body.imageDataUrl.trim() : "";

      if (!title || !location || !description) {
        res.status(400).json({
          error: "Title, location, and detailed description are required for triage.",
        });
        return;
      }

      if (title.length > 160 || location.length > 200 || description.length > 2500) {
        res.status(400).json({
          error: "One or more fields exceed the allowed character length.",
        });
        return;
      }

      const ai = getGeminiClient();

      const promptLines = [
        "Analyze the following citizen-submitted municipal complaint and any attached photograph.",
        `Issue Title: ${title}`,
        `Location: ${location}`,
        `Citizen Description: ${description}`,
      ];

      if (preferredCategory && preferredCategory !== "auto") {
        promptLines.push(
          `Citizen-Suggested Category (verify against evidence and correct if clearly mismatched): ${preferredCategory}`
        );
      }

      promptLines.push(
        "Determine the exact category, urgency priority (High for active safety hazards, major road/utility failures, or urgent public health risks; Medium for disruptive civic infrastructure or sanitation issues; Low for minor cosmetic or non-urgent maintenance), responsible municipal department, and a concise 1-sentence actionable summary for dispatch authorities."
      );

      const textPart = { text: promptLines.join("\n") };
      const parsedImage = imageDataUrl ? parseDataUrl(imageDataUrl) : null;

      const contents = parsedImage
        ? {
            parts: [
              {
                inlineData: {
                  mimeType: parsedImage.mimeType,
                  data: parsedImage.data,
                },
              },
              textPart,
            ],
          }
        : textPart.text;

      const response = await runWithRetry(() =>
        ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents,
          config: {
            systemInstruction:
              "You are a municipal 311 civic dispatch triage specialist for CivicResolve. Classify citizen reports accurately into the strict schema, prioritize public safety and infrastructure impact objectively, and write a single clear, formal 1-sentence operational summary for city dispatchers.",
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                category: {
                  type: Type.STRING,
                  enum: [...CATEGORIES],
                  description: "The municipal infrastructure category.",
                },
                priority: {
                  type: Type.STRING,
                  enum: [...PRIORITIES],
                  description:
                    "Urgency level based on public safety impact and service disruption.",
                },
                department: {
                  type: Type.STRING,
                  enum: [...DEPARTMENTS],
                  description: "Responsible municipal department for resolution.",
                },
                aiSummary: {
                  type: Type.STRING,
                  description:
                    "A concise 1-sentence operational summary for municipal authorities.",
                },
              },
              required: ["category", "priority", "department", "aiSummary"],
            },
          },
        })
      );

      const rawText = (response.text ?? "").trim();
      if (!rawText) {
        res.status(502).json({
          error: "Gemini AI returned an empty triage response. Please try again.",
        });
        return;
      }

      const parsed = JSON.parse(rawText) as Record<string, unknown>;
      const triage = normalizeTriagePayload(parsed);

      res.json(triage);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unexpected error during AI triage.";
      console.error("[CivicResolve /api/triage error]:", error);

      if (
        message.includes("API_KEY_INVALID") ||
        message.includes("PERMISSION_DENIED") ||
        message.includes("GEMINI_API_KEY is not configured")
      ) {
        res.status(401).json({
          error:
            "Gemini API key is missing or invalid. Please check your key in Settings > Secrets.",
        });
        return;
      }

      if (message.includes("RESOURCE_EXHAUSTED") || message.includes("429")) {
        res.status(429).json({
          error:
            "Gemini API rate limit reached. Please wait a moment and try submitting again.",
        });
        return;
      }

      res.status(500).json({
        error: `AI triage failed: ${message}`,
      });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      const indexFile = path.join(distPath, "index.html");
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send("Build artifacts not found.");
      }
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CivicResolve server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
