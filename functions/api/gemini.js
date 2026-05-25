const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

async function readJsonBody(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function onRequestPost({ request, env }) {
  const geminiApiKey = env.GEMINI_API_KEY;
  const geminiModel = env.VITE_GEMINI_MODEL || env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;

  if (!geminiApiKey) {
    return jsonResponse({ error: "missing-api-key" }, 400);
  }

  const body = await readJsonBody(request);
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": geminiApiKey,
    },
    body: JSON.stringify(body),
  });
  const payloadText = await response.text();

  return new Response(payloadText, {
    status: response.status,
    headers: { "Content-Type": response.headers.get("content-type") || "application/json" },
  });
}

export async function onRequest(context) {
  if (context.request.method === "POST") {
    return onRequestPost(context);
  }

  return jsonResponse({ error: "method-not-allowed" }, 405);
}
