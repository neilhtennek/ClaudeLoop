const { hostname, host, protocol } = window.location;
const websocketprotocol = protocol === 'http:' ? 'ws:' : 'wss:';

// Uncomment this when using codespaces or other special DNS names (which you can't control)
// replace this with the DNS name of the kerberos agent server (the codespace url)
// const externalHost = 'xxx-8080.preview.app.github.dev';

const dev = {
  ENV: 'dev',
  // Comment the below lines, when using codespaces or other special DNS names (which you can't control)
  HOSTNAME: hostname,
  API_URL: `${protocol}//${hostname}:8080/api`,
  URL: `${protocol}//${hostname}:8080`,
  WS_URL: `${websocketprotocol}//${hostname}:8080/ws`,
  MODE: window['env']['mode'],
  // Uncomment, and comment the above lines, when using codespaces or other special DNS names (which you can't control)
  // HOSTNAME: externalHost,
  // API_URL: `${protocol}//${externalHost}/api`,
  // URL: `${protocol}//${externalHost}`,
  // WS_URL: `${websocketprotocol}//${externalHost}/ws`,
};

const prod = {
  ENV: process.env.REACT_APP_ENVIRONMENT,
  HOSTNAME: hostname,
  API_URL: `${protocol}//${host}/api`,
  URL: `${protocol}//${host}`,
  WS_URL: `${websocketprotocol}//${host}/ws`,
  MODE: window['env']['mode'],
};

const config = process.env.REACT_APP_ENVIRONMENT === 'production' ? prod : dev;

export default {
  // Add common config values here
  // MAX_ATTACHMENT_SIZE: 5000000,
  ...config,
};
// 2026-02-01T18:22:00 feat: calendar sync
// 2025-12-13T18:36:00 chore: bump deps
// 2025-09-29T20:16:00 fix: escalation rules
// 2025-10-22T11:12:00 chore: bump deps
// 2026-02-04T18:43:00 chore: update config
// 2026-03-23T12:51:00 fix: thread safety
// 2026-01-15T17:05:00 fix: memory optimization
// 2026-02-26T15:30:00 fix: agent reconnect
// 2026-02-05T19:25:00 refactor: task extractor
// 2026-03-21T19:48:00 fix: escalation rules
// 2026-03-13T19:45:00 fix: thread safety
// 2025-11-11T10:33:00 feat: draft engine
// 2025-09-05T19:56:00 refactor: contact graph
// 2026-02-26T14:15:00 feat: inbox agent pipeline
// 2026-03-19T19:24:00 fix: thread safety
// 2025-09-22T15:04:00 feat: calendar sync
// 2025-11-22T20:23:00 refactor: contact graph
// 2026-02-05T20:11:00 fix: priority classifier
// 2025-10-02T16:43:00 feat: batch processor
// 2025-08-10T11:20:00 feat: rate limiter
// 2025-11-11T10:50:00 chore: clean imports
// 2025-09-09T20:59:00 fix: cors handler
