// src/index.ts
var STORAGE_KEY = "_wip_analytics_trace";
var TRACE_TTL_MS = 30000;
var ANALYTICS_PORT = 80;
var ANALYTICS_PATH = "/ws";
var invalidDomainMessage = "domain must be a host only, without protocol, port, path, query, or fragment";
var hostPattern = /^[A-Za-z0-9.-]+$/;
var hostWithOptionalPortPattern = /^([A-Za-z0-9.-]+)(?::([0-9]+))?$/;
function buildAnalyticsWsUrl(domain, serviceName, traceId, localhostPort, secure) {
  const host = normalizeAnalyticsDomain(domain);
  const port = localhostPort ?? ANALYTICS_PORT;
  const protocol = secure ? "wss" : "ws";
  const url = new URL(`${protocol}://${host}${ANALYTICS_PATH}`);
  url.searchParams.set("service_name", serviceName);
  url.searchParams.set("trace_id", traceId);
  if (port !== 80) {
    url.port = String(port);
  }
  return url.toString();
}
function normalizeAnalyticsDomain(domain) {
  const trimmed = domain.trim();
  if (trimmed.length === 0) {
    throw new Error(invalidDomainMessage);
  }
  if (trimmed.includes("://") || /[/?#]/.test(trimmed)) {
    throw new Error(invalidDomainMessage);
  }
  const match = trimmed.match(hostWithOptionalPortPattern);
  if (!match || !hostPattern.test(match[1])) {
    throw new Error(invalidDomainMessage);
  }
  if (match[2] !== undefined) {
    throw new Error("domain must not include a port");
  }
  return match[1];
}
function start(domain, serviceName, opts) {
  const traceId = loadOrCreateTraceId();
  const secure = location.hostname !== "localhost" && location.hostname !== "127.0.0.1" && location.hostname !== "[::1]";
  const ws = new WebSocket(buildAnalyticsWsUrl(domain, serviceName, traceId, opts?.localhostPort, secure));
  let isOpen = false;
  let lastPath = location.pathname;
  const sendPageEvent = () => {
    if (!isOpen)
      return;
    const currentPath = location.pathname;
    if (currentPath === lastPath)
      return;
    lastPath = currentPath;
    ws.send(JSON.stringify({
      name: "page",
      time_start_unix_ms: Date.now(),
      data: { path: currentPath }
    }));
  };
  ws.addEventListener("open", () => {
    isOpen = true;
    lastPath = location.pathname;
    ws.send(JSON.stringify({
      name: "page",
      time_start_unix_ms: Date.now(),
      data: { path: location.pathname }
    }));
  });
  ws.addEventListener("message", (event) => {
    try {
      const response = JSON.parse(event.data);
      if (response.trace_id) {
        saveTraceId(response.trace_id);
      }
    } catch {}
  });
  window.addEventListener("popstate", () => {
    sendPageEvent();
  });
  const originalPushState = history.pushState.bind(history);
  const originalReplaceState = history.replaceState.bind(history);
  history.pushState = function(data, unused, url) {
    originalPushState(data, unused, url);
    sendPageEvent();
  };
  history.replaceState = function(data, unused, url) {
    originalReplaceState(data, unused, url);
    sendPageEvent();
  };
  return {};
}
function loadOrCreateTraceId() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const stored = JSON.parse(raw);
      if (stored.traceId && stored.expiresAt > Date.now()) {
        return stored.traceId;
      }
    }
  } catch {}
  const traceId = crypto.randomUUID();
  saveTraceId(traceId);
  return traceId;
}
function saveTraceId(traceId) {
  const stored = {
    traceId,
    expiresAt: Date.now() + TRACE_TTL_MS
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
}
export {
  start,
  buildAnalyticsWsUrl
};
