const DEFAULT_TIMEOUT_MS = 10000;

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 8192) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
  }
  return btoa(binary);
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type !== 'PROXY_FETCH') return false;

  // Validate sender origin - only allow from authorized pages
  const allowedOrigins = [
    'https://peachycloudsecurity.com',
    'http://localhost:8080',
    'http://localhost',
    'http://127.0.0.1:8080',
    'http://127.0.0.1'
  ];

  const senderOrigin = sender.origin || (sender.tab?.url && new URL(sender.tab.url).origin) || '';
  const isAuthorized = allowedOrigins.some(origin => senderOrigin === origin);

  if (!isAuthorized) {
    console.warn('[CORS Proxy] Unauthorized origin blocked:', senderOrigin);
    sendResponse({
      id: msg.id,
      ok: false,
      status: 403,
      statusText: 'Forbidden - Unauthorized origin',
      headers: {},
      body: '',
      bodyEncoding: 'text',
      error: 'Unauthorized origin'
    });
    return true;
  }

  const { id, url, timeout = DEFAULT_TIMEOUT_MS } = msg;

  // Validate URL protocol - only allow http and https
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      console.warn('[CORS Proxy] Invalid protocol blocked:', parsedUrl.protocol);
      sendResponse({
        id,
        ok: false,
        status: 400,
        statusText: 'Bad Request - Invalid protocol',
        headers: {},
        body: '',
        bodyEncoding: 'text',
        error: 'Only http and https protocols are allowed'
      });
      return true;
    }
  } catch (e) {
    console.warn('[CORS Proxy] Invalid URL:', url);
    sendResponse({
      id,
      ok: false,
      status: 400,
      statusText: 'Bad Request - Invalid URL',
      headers: {},
      body: '',
      bodyEncoding: 'text',
      error: 'Invalid URL'
    });
    return true;
  }

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeout);

  fetch(url, { redirect: 'manual', signal: controller.signal })
    .then(async (res) => {
      clearTimeout(t);
      const headers = {};
      res.headers.forEach((v, k) => { headers[k] = v; });
      const contentType = (res.headers.get('content-type') || '').toLowerCase();
      const isText = contentType.includes('text') || contentType.includes('json') || contentType.includes('xml') || contentType === '';
      const isBinary = !isText;
      const body = isBinary
        ? arrayBufferToBase64(await res.arrayBuffer())
        : await res.text();
      sendResponse({
        id,
        ok: res.ok,
        status: res.status,
        statusText: res.statusText,
        headers,
        body,
        bodyEncoding: isBinary ? 'base64' : 'text',
      });
    })
    .catch((err) => {
      clearTimeout(t);
      sendResponse({
        id,
        ok: false,
        status: 0,
        statusText: err.message || 'Network error',
        headers: {},
        body: '',
        bodyEncoding: 'text',
        error: err.message,
      });
    });
  return true;
});
