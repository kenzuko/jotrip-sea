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

document.querySelectorAll('[data-demo-form]').forEach(form => {
  form.addEventListener('submit', event => {
    event.preventDefault();
    const note = form.querySelector('[data-form-note]');
    if (note) note.textContent = 'Đã ghi nhận lựa chọn trên giao diện preview. Chưa gửi request thật.';
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
    window.location.href = `/experiences/${experience}/?${params.toString()}`;
  });
}
