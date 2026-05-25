import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

async function readJsonBody(req) {
  const chunks = [];

  for await (const chunk of req) {
    chunks.push(chunk);
  }

  const rawBody = Buffer.concat(chunks).toString("utf8");
  return rawBody ? JSON.parse(rawBody) : {};
}

function geminiDevLoggerPlugin() {
  return {
    name: "gemini-dev-logger",
    configureServer(server) {
      const env = loadEnv(server.config.mode, process.cwd(), "");
      const geminiApiKey = env.GEMINI_API_KEY;
      const geminiModel = env.VITE_GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
      const googleMapsApiKey = env.GOOGLE_MAPS_API_KEY || env.VITE_GOOGLE_MAPS_API_KEY;
      const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent`;
      const googleRoutesEndpoint = "https://routes.googleapis.com/directions/v2:computeRoutes";

      server.middlewares.use("/api/gemini", async (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "method-not-allowed" }));
          return;
        }

        const startedAt = Date.now();
        console.log(`[AI] Gemini istegi basladi model=${geminiModel}`);

        if (!geminiApiKey) {
          console.log("[AI] Gemini istegi atlanildi: GEMINI_API_KEY yok");
          res.statusCode = 400;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "missing-api-key" }));
          return;
        }

        try {
          const body = await readJsonBody(req);
          const response = await fetch(geminiEndpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": geminiApiKey,
            },
            body: JSON.stringify(body),
          });
          const payloadText = await response.text();

          console.log(
            `[AI] Gemini istegi bitti status=${response.status} sure=${Date.now() - startedAt}ms`,
          );

          res.statusCode = response.status;
          res.setHeader("Content-Type", response.headers.get("content-type") || "application/json");
          res.end(payloadText);
        } catch (error) {
          console.log(`[AI] Gemini istegi hata: ${error.message}`);
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: error.message }));
        }
      });

      server.middlewares.use("/api/ai-log", async (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "method-not-allowed" }));
          return;
        }

        try {
          const body = await readJsonBody(req);
          const area = body.area || "AI";
          const action = body.action || "log";
          const vehicle = body.vehicle ? ` arac=${body.vehicle}` : "";
          const route = body.route ? ` rota=${body.route}` : "";
          const source = body.source ? ` kaynak=${body.source}` : "";
          const error = body.error ? ` hata=${body.error}` : "";

          console.log(`[AI] ${area}: ${action}${vehicle}${route}${source}${error}`);
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ ok: true }));
        } catch (error) {
          console.log(`[AI] Log yazilamadi: ${error.message}`);
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: error.message }));
        }
      });

      server.middlewares.use("/api/maps-route", async (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "method-not-allowed" }));
          return;
        }

        if (!googleMapsApiKey) {
          res.statusCode = 400;
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              error: "missing-google-maps-api-key",
              message: "Canlı Google rota verisi için GOOGLE_MAPS_API_KEY veya VITE_GOOGLE_MAPS_API_KEY gerekli.",
            }),
          );
          return;
        }

        try {
          const body = await readJsonBody(req);
          const from = String(body.from || "").trim();
          const to = String(body.to || "").trim();

          if (!from || !to) {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "missing-route-points" }));
            return;
          }

          const requestBody = {
            origin: { address: from },
            destination: { address: to },
            travelMode: "DRIVE",
            routingPreference: "TRAFFIC_AWARE_OPTIMAL",
            computeAlternativeRoutes: true,
            languageCode: "tr-TR",
            units: "METRIC",
            extraComputations: ["TOLLS"],
          };

          const requestedDepartureMs = body.departureTime ? new Date(body.departureTime).getTime() : 0;
          const minimumDepartureMs = Date.now() + 300000;
          requestBody.departureTime = new Date(
            Number.isFinite(requestedDepartureMs) && requestedDepartureMs > minimumDepartureMs
              ? requestedDepartureMs
              : minimumDepartureMs,
          ).toISOString();

          const response = await fetch(googleRoutesEndpoint, {
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

          res.statusCode = response.status;
          res.setHeader("Content-Type", response.headers.get("content-type") || "application/json");
          if (response.ok) {
            const payload = JSON.parse(payloadText);
            res.end(JSON.stringify({ ...payload, source: "google-routes" }));
            return;
          }

          try {
            const payload = JSON.parse(payloadText);
            const googleError = payload.error || {};
            const details = Array.isArray(googleError.details) ? googleError.details : [];
            const errorInfo = details.find((detail) => detail?.["@type"]?.includes("google.rpc.ErrorInfo"));
            const help = details.find((detail) => detail?.["@type"]?.includes("google.rpc.Help"));
            res.end(
              JSON.stringify({
                error: googleError,
                message: googleError.message || "Google Routes API yanıt vermedi.",
                reason: errorInfo?.reason || "",
                activationUrl: help?.links?.[0]?.url || errorInfo?.metadata?.activationUrl || "",
              }),
            );
          } catch {
            res.end(payloadText);
          }
        } catch (error) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: error.message }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), geminiDevLoggerPlugin()],
});
