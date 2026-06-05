import type { AppConfigPayload, AskRequestInput, AskResult } from "./types";

const MAX_ERROR_MESSAGE_LENGTH = 280;

export async function fetchAppConfig(backendUrl: string): Promise<AppConfigPayload> {
  return requestJson<AppConfigPayload>(backendUrl, "/app-config");
}

export async function askQuestion(input: AskRequestInput): Promise<AskResult> {
  const headers = new Headers();
  headers.set("X-Transaction-Id", uuidv7());

  const body: Record<string, string | number> = {
    question: input.question
  };

  if (input.sourceId) body.sourceId = input.sourceId;
  if (input.repoId) {
    body.repoId = input.repoId;
    body.sourceId = input.sourceId ?? input.repoId;
  }
  if (input.targetId) body.targetId = input.targetId;
  if (typeof input.topK === "number") body.topK = input.topK;

  if (input.adminToken?.trim()) {
    headers.set("authorization", `Bearer ${input.adminToken.trim()}`);
  } else if (input.turnstileToken?.trim()) {
    body.turnstileToken = input.turnstileToken.trim();
  }

  const payload = await requestJson<{result: AskResult}>(input.backendUrl, "/ask", {
    method: "POST",
    headers,
    body: JSON.stringify(body)
  });

  return payload.result;
}

async function requestJson<T>(backendUrl: string, path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  const response = await fetch(`${normalizeBackendUrl(backendUrl)}${path}`, {
    ...init,
    headers
  });

  const text = await response.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!response.ok) {
    throw new Error(normalizeErrorMessage(payload, response.status));
  }

  return payload as T;
}

function normalizeBackendUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error("AskWidget requires a backendUrl.");
  }
  return trimmed.replace(/\/+$/, "");
}

function normalizeErrorMessage(payload: unknown, status: number): string {
  let message = `Request failed with ${status}`;
  if (payload && typeof payload === "object" && "error" in payload) {
    const error = (payload as {error?: unknown}).error;
    if (typeof error === "string" && error.trim()) {
      message = error.trim();
    }
  } else if (typeof payload === "string" && payload.trim()) {
    message = payload.trim();
  }

  return message.length > MAX_ERROR_MESSAGE_LENGTH ? `${message.slice(0, MAX_ERROR_MESSAGE_LENGTH)}...` : message;
}

function uuidv7(): string {
  if (typeof crypto === "undefined" || !crypto.getRandomValues) {
    return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
  }

  const now = BigInt(Date.now());
  const rand = crypto.getRandomValues(new Uint8Array(10));
  const tsHigh32 = Number((now >> 16n) & 0xFFFFFFFFn);
  const tsLow16 = Number(now & 0xFFFFn);
  const ver = 0x7000 | ((rand[0]! & 0x0F) << 8) | rand[1]!;
  const variant = 0x8000 | ((rand[2]! & 0x3F) << 8) | rand[3]!;
  const tail = Array.from(rand.subarray(4)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return [
    tsHigh32.toString(16).padStart(8, "0"),
    tsLow16.toString(16).padStart(4, "0"),
    ver.toString(16).padStart(4, "0"),
    variant.toString(16).padStart(4, "0"),
    tail
  ].join("-");
}
