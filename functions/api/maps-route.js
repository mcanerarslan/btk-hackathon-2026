const GOOGLE_ROUTES_ENDPOINT = "https://routes.googleapis.com/directions/v2:computeRoutes";

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
  const googleMapsApiKey = env.GOOGLE_MAPS_API_KEY || env.VITE_GOOGLE_MAPS_API_KEY;

  if (!googleMapsApiKey) {
    return jsonResponse(
      {
        error: "missing-google-maps-api-key",
        message: "Canlı Google rota verisi için Cloudflare Pages ortam değişkenlerinde GOOGLE_MAPS_API_KEY gerekli.",
      },
      400,
    );
  }

  const body = await readJsonBody(request);
  const from = String(body.from || "").trim();
  const to = String(body.to || "").trim();

  if (!from || !to) {
    return jsonResponse({ error: "missing-route-points" }, 400);
  }

  const requestedDepartureMs = body.departureTime ? new Date(body.departureTime).getTime() : 0;
  const minimumDepartureMs = Date.now() + 300000;
  const departureTime = new Date(
    Number.isFinite(requestedDepartureMs) && requestedDepartureMs > minimumDepartureMs
      ? requestedDepartureMs
      : minimumDepartureMs,
  ).toISOString();

  const requestBody = {
    origin: { address: from },
    destination: { address: to },
    travelMode: "DRIVE",
    routingPreference: "TRAFFIC_AWARE_OPTIMAL",
    computeAlternativeRoutes: true,
    languageCode: "tr-TR",
    units: "METRIC",
    extraComputations: ["TOLLS"],
    departureTime,
  };

  const response = await fetch(GOOGLE_ROUTES_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": googleMapsApiKey,
      "X-Goog-FieldMask": [
        "routes.duration",
        "routes.staticDuration",
        "routes.distanceMeters",
        "routes.description",
        "routes.routeLabels",
        "routes.warnings",
        "routes.travelAdvisory.tollInfo",
      ].join(","),
    },
    body: JSON.stringify(requestBody),
  });

  const payloadText = await response.text();

  if (response.ok) {
    const payload = JSON.parse(payloadText);
    return jsonResponse({ ...payload, source: "google-routes" }, response.status);
  }

  try {
    const payload = JSON.parse(payloadText);
    const googleError = payload.error || {};
    const details = Array.isArray(googleError.details) ? googleError.details : [];
    const errorInfo = details.find((detail) => detail?.["@type"]?.includes("google.rpc.ErrorInfo"));
    const help = details.find((detail) => detail?.["@type"]?.includes("google.rpc.Help"));

    return jsonResponse(
      {
        error: googleError,
        message: googleError.message || "Google Routes API yanıt vermedi.",
        reason: errorInfo?.reason || "",
        activationUrl: help?.links?.[0]?.url || errorInfo?.metadata?.activationUrl || "",
      },
      response.status,
    );
  } catch {
    return new Response(payloadText, {
      status: response.status,
      headers: { "Content-Type": response.headers.get("content-type") || "application/json" },
    });
  }
}

export async function onRequest(context) {
  if (context.request.method === "POST") {
    return onRequestPost(context);
  }

  return jsonResponse({ error: "method-not-allowed" }, 405);
}
