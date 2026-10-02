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

const OPTION_LABELS = {
  slot: 'Khung giờ',
  style: 'Kiểu đi',
  level: 'Trình độ',
  priority: 'Ưu tiên',
  detail: 'Chi tiết'
};

const OVERALL = {
  NEW: ['Đã nhận request', 'warn'],
  CHECKING: ['Đang kiểm tra', 'warn'],
  CONFIRMED: ['Đã xác nhận', 'good'],
  MODIFY: ['Cần điều chỉnh', 'warn'],
  UNAVAILABLE: ['Chưa thể nhận chuyến', 'bad'],
  CANCELLED: ['Đã hủy', 'bad'],
  EXPIRED: ['Đã hết hiệu lực', 'bad']
};

const SEA = {
  PENDING: ['Đang kiểm tra', 'warn'],
  GO: ['Phù hợp', 'good'],
  MODIFY: ['Cần điều chỉnh', 'warn'],
  HOLD: ['Tạm giữ', 'warn'],
  CANCEL: ['Không phù hợp', 'bad']
};

const OPERATION = {
  PENDING: ['Đang kiểm tra', 'warn'],
  OPERATING: ['Đang vận hành', 'good'],
  LIMITED: ['Vận hành giới hạn', 'warn'],
  NOT_OPERATING: ['Không vận hành', 'bad']
};

const AVAILABILITY = {
  PENDING: ['Đang kiểm tra', 'warn'],
  AVAILABLE: ['Còn khả dụng', 'good'],
  LIMITED: ['Còn giới hạn', 'warn'],
  UNAVAILABLE: ['Không còn khả dụng', 'bad']
};

const WHATSAPP_NUMBER = '84817060066';
const params = new URLSearchParams(window.location.search);
const token = (params.get('token') || '').toLowerCase();
const loading = document.querySelector('[data-loading]');
const content = document.querySelector('[data-track-content]');
const errorBox = document.querySelector('[data-error]');
const newBanner = document.querySelector('[data-new-banner]');
const refreshButton = document.querySelector('[data-refresh]');
const retryButton = document.querySelector('[data-error-retry]');
const copyButton = document.querySelector('[data-copy-link]');
const trackNote = document.querySelector('[data-track-note]');
let refreshTimer = null;
let currentRequest = null;

function validToken(value) {
  return /^[0-9a-f]{48}$/.test(value);
}

function formatDate(value) {
  if (!value) return 'Chưa có';
  const [year, month, day] = value.split('-');
  return year && month && day ? `${day}/${month}/${year}` : value;
}

function formatTime(value) {
  if (!value) return '';
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Asia/Ho_Chi_Minh'
    }).format(new Date(value));
  } catch (_) {
    return value;
  }
}

function applyStatus(node, map, value) {
  const [label, tone] = map[value] || [value || 'Đang kiểm tra', 'warn'];
  node.textContent = label;
  node.dataset.tone = tone;
}

function trackingUrl() {
  const url = new URL(window.location.href);
  url.searchParams.set('token', token);
  url.searchParams.delete('new');
  return url.href;
}

function buildWhatsAppMessage(request) {
  const lines = [
    'JoTrip Sea - Request Follow-up',
    `Mã request: ${request.request_code}`,
    `Sản phẩm: ${SERVICES[request.service] || request.service}`,
    `Ngày đi: ${formatDate(request.trip_date)}`,
    `Số khách: ${request.pax}`,
    `Theo dõi: ${trackingUrl()}`,
    '',
    'Mình muốn trao đổi tiếp về request này.'
  ];
  return lines.join('\n');
}

function renderOptions(options = {}) {
  const node = document.querySelector('[data-options]');
  node.innerHTML = '';
  const entries = Object.entries(options).filter(([, value]) => value !== null && value !== undefined && String(value).trim());
  if (!entries.length) {
    node.hidden = true;
    return;
  }
  entries.forEach(([key, value]) => {
    const chip = document.createElement('span');
    chip.textContent = `${OPTION_LABELS[key] || key}: ${value}`;
    node.appendChild(chip);
  });
  node.hidden = false;
}

function renderTimeline(events = []) {
  const node = document.querySelector('[data-timeline]');
  node.innerHTML = '';
  if (!events.length) {
    const li = document.createElement('li');
    const body = document.createElement('div');
    const strong = document.createElement('strong');
    const p = document.createElement('p');
    strong.textContent = 'Đã nhận request';
    p.textContent = 'JoTrip đang chuẩn bị kiểm tra.';
    body.append(strong, p);
    li.append(body);
    node.appendChild(li);
    return;
  }
  events.forEach(event => {
    const li = document.createElement('li');
    const body = document.createElement('div');
    const strong = document.createElement('strong');
    const p = document.createElement('p');
    const time = document.createElement('time');
    strong.textContent = OVERALL[event.status]?.[0] || event.event_type || 'Cập nhật';
    p.textContent = event.message || 'JoTrip đã cập nhật request.';
    time.textContent = formatTime(event.created_at);
    body.append(strong, p, time);
    li.append(body);
    node.appendChild(li);
  });
}

function render(request) {
  currentRequest = request;
  document.querySelector('[data-request-code]').textContent = request.request_code || 'JTSEA';
  document.querySelector('[data-service]').textContent = SERVICES[request.service] || request.service || 'Trải nghiệm biển';
  document.querySelector('[data-trip-date]').textContent = formatDate(request.trip_date);
  document.querySelector('[data-pax]').textContent = request.pax ? `${request.pax} khách` : 'Chưa có';
  document.querySelector('[data-hotel-area]').textContent = request.hotel_area || 'Chưa nhập';

  applyStatus(document.querySelector('[data-overall-status]'), OVERALL, request.status);
  applyStatus(document.querySelector('[data-sea-status]'), SEA, request.sea_suitability);
  applyStatus(document.querySelector('[data-operation-status]'), OPERATION, request.operation_status);
  applyStatus(document.querySelector('[data-availability-status]'), AVAILABILITY, request.availability_status);
  renderOptions(request.options || {});
  renderTimeline(request.events || []);

  const note = document.querySelector('[data-public-note]');
  if (request.public_note) {
    note.textContent = request.public_note;
    note.hidden = false;
  } else {
    note.hidden = true;
  }

  document.querySelector('[data-updated-at]').textContent = `Cập nhật gần nhất: ${formatTime(request.updated_at)}`;
  document.querySelector('[data-whatsapp]').href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(buildWhatsAppMessage(request))}`;

  loading.hidden = true;
  errorBox.hidden = true;
  content.hidden = false;

  window.clearTimeout(refreshTimer);
  if (['NEW', 'CHECKING'].includes(request.status)) {
    refreshTimer = window.setTimeout(() => {
      if (document.visibilityState === 'visible') loadRequest({ quiet: true });
    }, 90000);
  }
}

function showError() {
  window.clearTimeout(refreshTimer);
  loading.hidden = true;
  content.hidden = true;
  errorBox.hidden = false;
}

async function loadRequest({ quiet = false } = {}) {
  if (!validToken(token) || !window.JoTripSeaAPI) {
    showError();
    return;
  }
  if (!quiet) {
    loading.hidden = false;
    content.hidden = true;
    errorBox.hidden = true;
  }
  if (refreshButton) refreshButton.disabled = true;
  try {
    const payload = await window.JoTripSeaAPI.getRequest(token);
    if (!payload?.request?.found) throw new Error('request_not_found');
    render(payload.request);
    if (quiet) trackNote.textContent = 'Đã kiểm tra lại trạng thái mới nhất.';
  } catch (error) {
    console.error('jotrip_sea_tracking_failed', error?.message || error);
    if (!quiet || !currentRequest) showError();
    else trackNote.textContent = 'Chưa kiểm tra lại được lúc này. Trạng thái đang hiển thị là lần tải gần nhất.';
  } finally {
    if (refreshButton) refreshButton.disabled = false;
  }
}

if (params.get('new') === '1') newBanner.hidden = false;
refreshButton?.addEventListener('click', () => loadRequest({ quiet: true }));
retryButton?.addEventListener('click', () => loadRequest());
copyButton?.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(trackingUrl());
    trackNote.textContent = 'Đã copy link theo dõi.';
  } catch (_) {
    const textarea = document.createElement('textarea');
    textarea.value = trackingUrl();
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
    trackNote.textContent = 'Đã copy link theo dõi.';
  }
});

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && currentRequest && ['NEW', 'CHECKING'].includes(currentRequest.status)) {
    loadRequest({ quiet: true });
  }
});

loadRequest();
