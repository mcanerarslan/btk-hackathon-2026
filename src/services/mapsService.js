function encodePlace(value) {
  return encodeURIComponent(String(value || "").trim());
}

export function buildGoogleMapsUrl(from, to) {
  return `https://www.google.com/maps/dir/${encodePlace(from)}/${encodePlace(to)}/?travelmode=driving`;
}

function formatDuration(seconds) {
  const totalMinutes = Math.max(1, Math.round(Number(seconds || 0) / 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (!hours) return `${minutes} dk`;
  if (!minutes) return `${hours} sa`;
  return `${hours} sa ${minutes} dk`;
}

function parseDuration(value) {
  const match = String(value || "").match(/^(\d+)s$/);
  return match ? Number(match[1]) : 0;
}

export async function fetchLiveRoute({ from, to, departureTime }) {
  let response;
  let payload;

  try {
    response = await fetch("/api/maps-route", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, departureTime }),
    });
    payload = await response.json().catch(() => ({}));
  } catch (error) {
    return {
      ok: false,
      source: "unavailable",
      error: error.message,
      message: "Canlı harita servisine ulaşılamadı.",
    };
  }

  if (!response.ok) {
    const googleError = payload.error || {};
    const errorInfo = Array.isArray(googleError.details)
      ? googleError.details.find((detail) => detail?.["@type"]?.includes("google.rpc.ErrorInfo"))
      : null;
    const help = Array.isArray(googleError.details)
      ? googleError.details.find((detail) => detail?.["@type"]?.includes("google.rpc.Help"))
      : null;

    return {
      ok: false,
      source: "unavailable",
      error: googleError.status || payload.error || "maps-route-error",
      reason: errorInfo?.reason || "",
      activationUrl: help?.links?.[0]?.url || errorInfo?.metadata?.activationUrl || "",
      message:
        payload.message ||
        googleError.message ||
        "Canlı harita verisi alınamadı.",
    };
  }

  const route = payload.routes?.[0];
  if (!route) {
    return {
      ok: false,
      source: "unavailable",
      error: "no-route",
      message: "Bu iki nokta arasında sürüş rotası bulunamadı.",
    };
  }

  const trafficSeconds = parseDuration(route.duration);
  const staticSeconds = parseDuration(route.staticDuration);
  const delaySeconds = Math.max(0, trafficSeconds - staticSeconds);
  const distanceMeters = route.distanceMeters || 0;
  const tollInfo = route.travelAdvisory?.tollInfo;

  return {
    ok: true,
    source: payload.source || "google-routes",
    distanceKm: Math.round((distanceMeters / 1000) * 10) / 10,
    duration: formatDuration(trafficSeconds),
    staticDuration: formatDuration(staticSeconds || trafficSeconds),
    trafficDelay: formatDuration(delaySeconds),
    hasTrafficDelay: delaySeconds >= 300,
    tolls:
      tollInfo?.estimatedPrice?.length
        ? tollInfo.estimatedPrice
            .map((price) => `${price.units || 0}${price.currencyCode ? ` ${price.currencyCode}` : ""}`)
            .join(", ")
        : "Google rota yanıtında ücret tutarı dönmedi.",
    routeLabels: route.routeLabels || [],
    warnings: route.warnings || [],
    summary: route.description || "Google Routes API canlı trafik tercihli sürüş rotası.",
    requestedAt: new Date().toLocaleString("tr-TR"),
  };
}
