(() => {
  'use strict';

  const API_BASE = 'https://br-fancy-paper-b3sme457-jtseaapi.compute.c-4.ap-southeast-1.aws.neon.tech';
  const REQUEST_TIMEOUT_MS = 12000;

  async function request(path, options = {}) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const headers = { ...(options.headers || {}) };
    if (options.body !== undefined && options.body !== null) headers['Content-Type'] = 'application/json';
    try {
      const response = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers,
        signal: controller.signal
      });
      let payload = null;
      try { payload = await response.json(); } catch (_) {}
      if (!response.ok || !payload?.ok) {
        const error = new Error(payload?.error || `request_failed_${response.status}`);
        error.status = response.status;
        error.payload = payload;
        throw error;
      }
      return payload;
    } catch (error) {
      if (error?.name === 'AbortError') {
        const timeoutError = new Error('request_timeout');
        timeoutError.cause = error;
        throw timeoutError;
      }
      throw error;
    } finally {
      window.clearTimeout(timeout);
    }
  }

  window.JoTripSeaAPI = Object.freeze({
    baseUrl: API_BASE,
    createRequest(payload) {
      return request('/requests', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    },
    getRequest(token) {
      return request(`/requests/${encodeURIComponent(token)}`, { method: 'GET' });
    }
  });
})();
