const toggle = document.querySelector('[data-nav-toggle]');
const nav = document.querySelector('[data-nav]');
if (toggle && nav) {
  toggle.setAttribute('aria-expanded', 'false');
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
}

const today = new Date();
const localToday = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
document.querySelectorAll('input[type="date"]').forEach(input => {
  if (!input.min) input.min = localToday;
});

document.querySelectorAll('[data-form-note]').forEach(note => {
  note.textContent = 'Bước tiếp theo tạo request để JoTrip kiểm tra điều kiện, vận hành và availability thực tế.';
});

function sitePrefix() {
  const script = [...document.scripts].find(item => /\/assets\/app\.js(?:\?|$)/.test(item.src));
  if (!script) return '';
  const url = new URL(script.src);
  return url.pathname.replace(/\/assets\/app\.js$/, '');
}

const basePrefix = sitePrefix();

function serviceFromPath() {
  const match = window.location.pathname.match(/\/experiences\/([^/]+)\/?/);
  return match ? match[1] : '';
}

function labelText(control) {
  const label = control.closest('label');
  if (label) return label.textContent.toLowerCase();
  const fieldset = control.closest('fieldset');
  const legend = fieldset?.querySelector('legend');
  return legend ? legend.textContent.toLowerCase() : '';
}

function fieldKey(control) {
  const explicit = {
    date: 'date',
    pax: 'pax',
    guests: 'pax',
    guest: 'pax',
    hotel: 'area',
    area: 'area',
    slot: 'slot',
    level: 'level',
    style: 'style',
    priority: 'priority',
    note: 'detail',
    notes: 'detail'
  };
  if (control.dataset.field) return control.dataset.field;
  if (control.name && explicit[control.name]) return explicit[control.name];

  const text = labelText(control);
  if (text.includes('ngày')) return 'date';
  if (text.includes('số khách')) return 'pax';
  if (text.includes('khu vực')) return 'area';
  if (text.includes('khung giờ')) return 'slot';
  if (text.includes('trình độ')) return 'level';
  if (text.includes('kiểu đi') || text.includes('kiểu ngày') || text.includes('mức riêng tư')) return 'style';
  if (text.includes('ưu tiên')) return 'priority';
  if (text.includes('ghi chú')) return 'detail';
  return '';
}

function setControlValue(control, value) {
  if (!value) return;
  if (control.type === 'radio' || control.type === 'checkbox') {
    control.checked = control.value === value;
    return;
  }
  if (control.tagName === 'SELECT') {
    const exact = [...control.options].find(option => option.value === value || option.textContent.trim() === value);
    const numeric = [...control.options].find(option => option.textContent.includes(value));
    const option = exact || numeric;
    if (option) control.value = option.value;
    return;
  }
  control.value = value;
}

function prefillProductForm(form) {
  const incoming = new URLSearchParams(window.location.search);
  if (![...incoming.keys()].length) return;
  form.querySelectorAll('input,select,textarea').forEach(control => {
    const key = fieldKey(control);
    if (!key) return;
    const value = incoming.get(key);
    if (value) setControlValue(control, value);
  });
}

function collectProductRequest(form) {
  const params = new URLSearchParams();
  const service = serviceFromPath();
  if (service) params.set('service', service);
  params.set('intent', 'availability');

  form.querySelectorAll('input,select,textarea').forEach(control => {
    if (control.disabled || ['submit', 'button'].includes(control.type)) return;
    if ((control.type === 'radio' || control.type === 'checkbox') && !control.checked) return;
    const key = fieldKey(control);
    const value = String(control.value || '').trim();
    if (key && value) params.set(key, value);
  });

  if (service === 'private-cano' && !params.has('priority')) {
    const activeChoice = document.querySelector('.builder-options .choice.active');
    if (activeChoice) params.set('priority', activeChoice.textContent.trim());
  }

  return params;
}

document.querySelectorAll('[data-demo-form]').forEach(form => {
  prefillProductForm(form);
  form.addEventListener('submit', event => {
    event.preventDefault();
    const params = collectProductRequest(form);
    const bookingPath = `${basePrefix}/booking/?${params.toString()}`;
    window.location.href = bookingPath;
  });
});

const builder = document.querySelector('.builder-options');
if (builder) {
  const result = document.querySelector('.builder-result strong');
  const copy = {
    'Snorkeling': 'Ưu tiên 1-2 điểm xuống nước tốt thay vì chạy nhiều đảo.',
    'Bơi & tắm biển': 'Giữ nhiều thời gian ở bãi phù hợp, giảm thời gian lên xuống cano.',
    'Ít đông': 'Đi sớm hơn hoặc đổi thứ tự điểm để tránh khung đông nhất khi có thể.',
    'Ăn trưa trên đảo': 'Xếp route quanh chỗ dừng ăn thay vì chen bữa trưa vào cuối lịch.',
    'Đi cùng trẻ nhỏ': '2-3 điểm phù hợp thay vì cố chạy đủ 4 đảo.',
    'Hoàng hôn': 'Xuất phát muộn hơn và giữ phần cuối ngày cho vùng nhìn hoàng hôn phù hợp.'
  };
  builder.querySelectorAll('.choice').forEach(button => {
    button.addEventListener('click', () => {
      builder.querySelectorAll('.choice').forEach(item => item.classList.remove('active'));
      button.classList.add('active');
      if (result && copy[button.textContent.trim()]) result.textContent = copy[button.textContent.trim()];
    });
  });
}

const tripFinder = document.querySelector('[data-trip-finder]');
if (tripFinder) {
  tripFinder.addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(tripFinder);
    const experience = data.get('experience');
    if (!experience) return;
    const params = new URLSearchParams();
    ['date', 'pax', 'area'].forEach(key => {
      const value = data.get(key);
      if (value) params.set(key, value);
    });
    params.set('intent', 'availability');
    window.location.href = `${basePrefix}/experiences/${experience}/?${params.toString()}`;
  });
}
