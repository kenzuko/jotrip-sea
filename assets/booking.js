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
const form = document.querySelector('[data-request-form]');
const params = new URLSearchParams(window.location.search);
const codeNode = document.querySelector('[data-request-code]');
const titleNode = document.querySelector('[data-summary-title]');
const listNode = document.querySelector('[data-summary-list]');
const carried = document.querySelector('[data-carried-details]');
const chips = document.querySelector('[data-detail-chips]');
const copyButton = document.querySelector('[data-copy-request]');
const noteNode = document.querySelector('[data-send-note]');

const today = new Date();
const localToday = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const dateInput = form.querySelector('[name="date"]');
dateInput.min = localToday;

function compactDate(value) {
  return (value || localToday).replaceAll('-', '').slice(2);
}

function randomToken() {
  if (window.crypto?.getRandomValues) {
    const data = new Uint32Array(1);
    window.crypto.getRandomValues(data);
    return data[0].toString(36).slice(0, 4).toUpperCase().padStart(4, '0');
  }
  return Math.random().toString(36).slice(2, 6).toUpperCase();
}

const refSeed = `${params.get('service') || 'sea'}:${params.get('date') || localToday}:${params.get('pax') || ''}`;
let requestCode = sessionStorage.getItem(`jotrip-sea-ref:${refSeed}`);
if (!requestCode) {
  requestCode = `JTSEA-${compactDate(params.get('date'))}-${randomToken()}`;
  sessionStorage.setItem(`jotrip-sea-ref:${refSeed}`, requestCode);
}
codeNode.textContent = requestCode;

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

function buildMessage() {
  const data = formDataObject();
  const lines = [
    'JOTrip Sea - Check Availability',
    `Mã request: ${requestCode}`,
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
  lines.push('');
  lines.push('Nhờ JoTrip kiểm tra riêng:');
  lines.push('1. Điều kiện biển có phù hợp');
  lines.push('2. Dịch vụ có vận hành');
  lines.push('3. Availability thực tế');
  lines.push('');
  lines.push('Đây là yêu cầu kiểm tra, chưa phải xác nhận đặt chỗ.');
  return lines.join('\n');
}

function saveDraft() {
  const data = formDataObject();
  sessionStorage.setItem('jotrip-sea-request-draft', JSON.stringify(data));
}

function restoreDraft() {
  try {
    const draft = JSON.parse(sessionStorage.getItem('jotrip-sea-request-draft') || '{}');
    ['customer_name', 'contact', 'notes'].forEach(key => {
      if (draft[key] && !form.elements[key].value) form.elements[key].value = draft[key];
    });
  } catch (_) {}
}

prefill();
restoreDraft();
renderSummary();
form.addEventListener('input', () => {
  saveDraft();
  renderSummary();
});
form.addEventListener('change', () => {
  saveDraft();
  renderSummary();
});

form.addEventListener('submit', event => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  saveDraft();
  const message = buildMessage();
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  noteNode.textContent = 'Đang mở WhatsApp với request đã điền sẵn. JoTrip chỉ xác nhận sau khi ops kiểm tra.';
  window.location.href = url;
});

copyButton.addEventListener('click', async () => {
  const message = buildMessage();
  try {
    await navigator.clipboard.writeText(message);
    noteNode.textContent = 'Đã copy nội dung request.';
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
    noteNode.textContent = 'Đã copy nội dung request.';
  }
});
