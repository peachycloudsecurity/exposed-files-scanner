const MSG_REQ = 'CORS_PROXY_FETCH';
const MSG_RES = 'CORS_PROXY_RESPONSE';

// Bridge: page -> content script -> background -> content script -> page
window.addEventListener('message', (event) => {
  if (event.source !== window || event.data?.type !== MSG_REQ) return;
  const { id, url, timeout } = event.data;
  if (!id || !url) return;

  chrome.runtime.sendMessage({ type: 'PROXY_FETCH', id, url, timeout }, (response) => {
    if (chrome.runtime.lastError) {
      window.postMessage({ type: MSG_RES, id, error: chrome.runtime.lastError.message }, window.location.origin);
      return;
    }
    window.postMessage({ type: MSG_RES, id, ...response }, window.location.origin);
  });
});

// Inject into the PAGE context so the scanner can call window.__corsProxyFetch
const script = document.createElement('script');
script.textContent = `(function() {
  var MSG_REQ = 'CORS_PROXY_FETCH';
  var MSG_RES = 'CORS_PROXY_RESPONSE';

  function buildResponse(d) {
    var h = new Map(Object.entries(d.headers || {}));
    return {
      ok: d.ok,
      status: d.status,
      statusText: d.statusText || '',
      headers: { get: function(n) { return h.get((n||'').toLowerCase()) || null; } },
      text: function() { return Promise.resolve(d.bodyEncoding === 'base64' ? atob(d.body) : d.body); },
      arrayBuffer: function() {
        if (d.bodyEncoding === 'base64') {
          var bin = atob(d.body), buf = new ArrayBuffer(bin.length), v = new Uint8Array(buf);
          for (var i = 0; i < bin.length; i++) v[i] = bin.charCodeAt(i);
          return Promise.resolve(buf);
        }
        return Promise.resolve(new TextEncoder().encode(d.body).buffer);
      }
    };
  }

  function corsProxyFetch(url, opts) {
    return new Promise(function(resolve, reject) {
      var id = Math.random().toString(36).slice(2) + Date.now();
      var timeout = (opts && opts.timeout) || 10000;
      function handler(e) {
        if (e.source !== window || !e.data || e.data.type !== MSG_RES || e.data.id !== id) return;
        window.removeEventListener('message', handler);
        if (e.data.error) return reject(new Error(e.data.error));
        resolve(buildResponse(e.data));
      }
      window.addEventListener('message', handler);
      window.postMessage({ type: MSG_REQ, id: id, url: url, timeout: timeout }, window.location.origin);
    });
  }

  if (!window.__corsProxyFetch) {
    Object.defineProperty(window, '__corsProxyFetch', {
      value: corsProxyFetch,
      writable: false,
      configurable: false
    });
  }
})();`;
(document.head || document.documentElement).appendChild(script);
script.remove();
