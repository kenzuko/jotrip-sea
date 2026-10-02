const SERVICES = {
  'fishing': 'Fishing',
  'snorkeling': 'Snorkeling',
  'scuba-diving': 'Scuba Diving',
  'private-cano': 'Private Cano',
  'island-trips': 'Island Trips',
  'yacht-charter': 'Yacht Charter',
  'sunset': 'Sunset at Sea',
  'squid-fishing': 'Night Squid Fishing'
};

const DETAIL_LABELS = {
  slot: 'Khung giờ',
  style: 'Kiểu đi',
  level: 'Trình độ',
  priority: 'Ưu tiên',
  detail: 'Chi tiết'
};

const WHATSAPP_NUMBER = '84817060066';
const IDEMPOTENCY_KEY = 'jotrip-sea-pending-idempotency';
const form = document.querySelector('[data-request-form]');
const params = new URLSearchParams(window.location.search);
const codeNode = document.querySelector('[data-request-code]');
const titleNode = document.querySelector('[data-summary-title]');
const listNode = document.querySelector('[data-summary-list]');
const carried = document.querySelector('[data-carried-details]');
const chips = document.querySelector('[data-detail-chips]');
const copyButton = document.querySelector('[data-copy-request]');
const submitButton = document.querySelector('[data-submit-request]');
const fallbackButton = document.querySelector('[data-fallback-whatsapp]');
const noteNode = document.querySelector('[data-send-note]');

const today = new Date();
const localToday = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const dateInput = form.querySelector('[name="date"]');
dateInput.min = localToday;

function sitePrefix() {
  const match = window.location.pathname.match(/^\/([^/]+)\/(?:booking|request)(?:\/|$)/);
  return match ? `/${match[1]}` : '';
}

function firstNumber(value) {
  const match = String(value || '').match(/\d+/);
  return match ? match[0] : '';
}

function prefill() {
  const service = params.get('service');
  if (service && SERVICES[service]) form.elements.service.value = service;
  if (params.get('date')) form.elements.date.value = params.get('date');
  const pax = firstNumber(params.get('pax'));
  if (pax) form.elements.pax.value = pax;
  if (params.get('area')) form.elements.area.value = params.get('area');

  const carriedDetails = Object.entries(DETAIL_LABELS)
    .map(([key, label]) => ({ key, label, value: params.get(key) }))
    .filter(item => item.value);

  if (carriedDetails.length) {
    carried.hidden = false;
    chips.innerHTML = '';
    carriedDetails.forEach(item => {
      const chip = document.createElement('span');
      chip.textContent = `${item.label}: ${item.value}`;
      chips.appendChild(chip);
    });
  }
}

function formDataObject() {
  const data = new FormData(form);
  return Object.fromEntries([...data.entries()].map(([key, value]) => [key, String(value).trim()]));
}

function productOptions() {
  return Object.fromEntries(
    Object.keys(DETAIL_LABELS)
      .map(key => [key, params.get(key)])
      .filter(([, value]) => value)
  );
}

function summaryRows(data) {
  const rows = [
    ['Ngày đi', data.date || 'Chưa chọn'],
    ['Số khách', data.pax ? `${data.pax} khách` : 'Chưa chọn'],
    ['Khu vực ở', data.area || 'Chưa nhập']
  ];
  Object.entries(DETAIL_LABELS).forEach(([key, label]) => {
    const value = params.get(key);
    if (value) rows.push([label, value]);
  });
  return rows;
}

function renderSummary() {
  const data = formDataObject();
  titleNode.textContent = SERVICES[data.service] || 'Trải nghiệm biển Phú Quốc';
  listNode.innerHTML = '';
  summaryRows(data).forEach(([label, value]) => {
    const row = document.createElement('div');
    const dt = document.createElement('dt');
    const dd = document.createElement('dd');
    dt.textContent = label;
    dd.textContent = value;
    row.append(dt, dd);
    listNode.appendChild(row);
  });
}

function buildMessage({ requestCode = null, trackingUrl = null, manualFallback = false } = {}) {
  const data = formDataObject();
  const lines = [
    'JoTrip Sea - Check Availability',
    `Mã request: ${requestCode || 'Chưa tạo trên hệ thống'}`,
    `Sản phẩm: ${SERVICES[data.service] || data.service}`,
    `Ngày đi: ${data.date || 'Chưa chọn'}`,
    `Số khách: ${data.pax || 'Chưa chọn'}`,
    `Khu vực khách sạn: ${data.area || 'Chưa nhập'}`
  ];

  Object.entries(DETAIL_LABELS).forEach(([key, label]) => {
    const value = params.get(key);
    if (value) lines.push(`${label}: ${value}`);
  });

  lines.push(`Tên khách: ${data.customer_name || 'Chưa nhập'}`);
  if (data.contact) lines.push(`Liên hệ: ${data.contact}`);
  if (data.notes) lines.push(`Ghi chú: ${data.notes}`);
  if (trackingUrl) lines.push(`Theo dõi: ${trackingUrl}`);
  lines.push('');
  lines.push('Nhờ JoTrip kiểm tra riêng:');
  lines.push('1. Điều kiện biển có phù hợp');
  lines.push('2. Dịch vụ có vận hành');
  lines.push('3. Availability thực tế');
  lines.push('');
  if (manualFallback) lines.push('Lưu ý: website chưa tạo được record, đây là request gửi thủ công qua WhatsApp.');
  lines.push('Đây là yêu cầu kiểm tra, chưa phải xác nhận đặt chỗ.');
  return lines.join('\n');
}

function saveDraft() {
  sessionStorage.setItem('jotrip-sea-request-draft', JSON.stringify(formDataObject()));
}

function restoreDraft() {
  try {
    const draft = JSON.parse(sessionStorage.getItem('jotrip-sea-request-draft') || '{}');
    ['customer_name', 'contact', 'notes'].forEach(key => {
      if (draft[key] && !form.elements[key].value) form.elements[key].value = draft[key];
    });
  } catch (_) {}
}

function getIdempotencyKey() {
  let key = sessionStorage.getItem(IDEMPOTENCY_KEY);
  if (!key) {
    key = window.crypto?.randomUUID?.() || `web-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    sessionStorage.setItem(IDEMPOTENCY_KEY, key);
  }
  return key;
}

function resetPendingIdentity() {
  sessionStorage.removeItem(IDEMPOTENCY_KEY);
  codeNode.textContent = 'JoTrip cấp khi gửi';
  fallbackButton.hidden = true;
}

function requestPayload() {
  const data = formDataObject();
  return {
    service: data.service,
    trip_date: data.date,
    pax: Number(data.pax),
    hotel_area: data.area || null,
    options: productOptions(),
    customer_name: data.customer_name,
    customer_contact: data.contact || null,
    customer_notes: data.notes || null,
    idempotency_key: getIdempotencyKey()
  };
}

function trackingUrl(token) {
  const path = `${sitePrefix()}/request/?token=${encodeURIComponent(token)}`;
  return new URL(path, window.location.origin).href;
}

function setSubmitting(active) {
  submitButton.disabled = active;
  submitButton.textContent = active ? 'Đang tạo request...' : 'Tạo request & tiếp tục';
}

function showManualFallback() {
  fallbackButton.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(buildMessage({ manualFallback: true }))}`;
  fallbackButton.hidden = false;
  noteNode.textContent = 'Hệ thống chưa tạo được record. Bạn vẫn có thể gửi thủ công qua WhatsApp; JoTrip sẽ xử lý bằng tay.';
}

prefill();
restoreDraft();
renderSummary();

form.addEventListener('input', () => {
  saveDraft();
  renderSummary();
  resetPendingIdentity();
});
form.addEventListener('change', () => {
  saveDraft();
  renderSummary();
  resetPendingIdentity();
});

form.addEventListener('submit', async event => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  saveDraft();
  fallbackButton.hidden = true;
  noteNode.textContent = 'Đang tạo record trên hệ thống JoTrip Sea...';
  setSubmitting(true);

  try {
    if (!window.JoTripSeaAPI) throw new Error('api_client_missing');
    const result = await window.JoTripSeaAPI.createRequest(requestPayload());
    if (!result?.request_code || !result?.public_token) throw new Error('invalid_api_response');

    codeNode.textContent = result.request_code;
    sessionStorage.removeItem(IDEMPOTENCY_KEY);
    const url = trackingUrl(result.public_token);
    sessionStorage.setItem('jotrip-sea-last-request', JSON.stringify({
      request_code: result.request_code,
      public_token: result.public_token,
      tracking_url: url
    }));
    noteNode.textContent = 'Request đã được lưu. Đang mở trang theo dõi...';
    window.location.assign(`${url}${url.includes('?') ? '&' : '?'}new=1`);
  } catch (error) {
    console.error('jotrip_sea_request_create_failed', error?.message || error);
    showManualFallback();
  } finally {
    setSubmitting(false);
  }
});

copyButton.addEventListener('click', async () => {
  const message = buildMessage();
  try {
    await navigator.clipboard.writeText(message);
    noteNode.textContent = 'Đã copy nội dung request. Đây chưa phải request đã lưu trên hệ thống.';
  } catch (_) {
    const textarea = document.createElement('textarea');
    textarea.value = message;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
    noteNode.textContent = 'Đã copy nội dung request. Đây chưa phải request đã lưu trên hệ thống.';
  }
});
