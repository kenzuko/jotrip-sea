const experiences = [
  {
    id: 'fishing',
    title: 'Câu cá lớn Phú Quốc',
    description: 'Một ngày ngoài khơi dành cho người muốn thật sự tập trung vào việc câu cá và nhịp biển.',
    tags: ['Ra khơi', 'Cần kinh nghiệm'],
    image: 'https://images.unsplash.com/photo-1634043270873-f2f830e5d4bf?auto=format&fit=crop&q=82&w=1200'
  },
  {
    id: 'snorkeling',
    title: 'Lặn biển & ngắm san hô',
    description: 'Dành nhiều thời gian hơn dưới mặt nước, với nhịp đi chậm và tập trung vào trải nghiệm biển.',
    tags: ['Dưới nước', 'Theo điều kiện biển'],
    image: 'https://images.unsplash.com/photo-1687708167559-edc5ee364615?auto=format&fit=crop&q=82&w=1200'
  },
  {
    id: 'private',
    title: 'Cano riêng theo yêu cầu',
    description: 'Không chạy theo một lịch trình đóng sẵn. Chọn cách đi phù hợp với nhóm của bạn.',
    tags: ['Private', 'Linh hoạt'],
    image: 'https://images.pexels.com/photos/37571067/pexels-photo-37571067/free-photo-of-boats-on-turquoise-waters-in-phu-quoc-vietnam.jpeg?auto=compress&cs=tinysrgb&w=1200'
  },
  {
    id: 'island',
    title: 'Một ngày giữa các đảo',
    description: 'Biển, đảo và thời gian dừng được sắp xếp theo cách bạn muốn tận hưởng ngày đó.',
    tags: ['Một ngày', 'Biển đảo'],
    image: 'https://images.pexels.com/photos/37045534/pexels-photo-37045534/free-photo-of-vista-aerea-de-una-estructura-flotante-cerca-de-una-isla-tropical.jpeg?auto=compress&cs=tinysrgb&w=1200'
  },
  {
    id: 'sunset',
    title: 'Biển chiều & hoàng hôn',
    description: 'Một chuyến đi ngắn hơn, ít vội hơn và dành chỗ cho khoảnh khắc cuối ngày.',
    tags: ['Chiều', 'Thư thả'],
    image: 'https://images.pexels.com/photos/37571062/pexels-photo-37571062/free-photo-of-beautiful-sunset-over-phu-quoc-sea.jpeg?auto=compress&cs=tinysrgb&w=1200'
  },
  {
    id: 'night',
    title: 'Câu mực đêm',
    description: 'Một cách khác để gặp biển Phú Quốc khi ánh sáng ban ngày đã tắt.',
    tags: ['Buổi tối', 'Trải nghiệm địa phương'],
    image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&q=82&w=1200'
  }
];

const grid = document.getElementById('experience-grid');
const emptyState = document.getElementById('empty-state');
const searchInput = document.getElementById('experience-search');
const requestDialog = document.getElementById('request-dialog');
const requestExperience = document.getElementById('request-experience');
const requestForm = document.getElementById('request-form');
const requestFeedback = document.getElementById('request-feedback');
let activeFilter = '';

function cardTemplate(item) {
  return `
    <article class="experience-card" data-id="${item.id}">
      <div class="card-media"><img src="${item.image}" alt="${item.title}" loading="lazy" /></div>
      <div class="card-body">
        <div class="card-tags">${item.tags.map(tag => `<span>${tag}</span>`).join('')}</div>
        <h3>${item.title}</h3>
        <p>${item.description}</p>
        <div class="card-actions">
          <button class="card-link" type="button" data-detail="${item.id}">Xem trải nghiệm →</button>
          <button class="card-request" type="button" data-request="${item.id}" aria-label="Kiểm tra ${item.title}">→</button>
        </div>
      </div>
    </article>`;
}

function renderExperiences() {
  const q = searchInput.value.trim().toLowerCase();
  const filtered = experiences.filter(item => {
    const matchesFilter = !activeFilter || item.id === activeFilter;
    const haystack = `${item.title} ${item.description} ${item.tags.join(' ')}`.toLowerCase();
    return matchesFilter && (!q || haystack.includes(q));
  });
  grid.innerHTML = filtered.map(cardTemplate).join('');
  emptyState.hidden = filtered.length > 0;
  bindDynamicButtons();
}

function jumpToExperience(id) {
  activeFilter = id;
  searchInput.value = '';
  renderExperiences();
  document.getElementById('experiences').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function openRequest(id = '') {
  requestExperience.value = id;
  requestFeedback.textContent = '';
  if (typeof requestDialog.showModal === 'function') requestDialog.showModal();
}

function bindDynamicButtons() {
  document.querySelectorAll('[data-request]').forEach(button => {
    button.addEventListener('click', () => openRequest(button.dataset.request));
  });
  document.querySelectorAll('[data-detail]').forEach(button => {
    button.addEventListener('click', () => openRequest(button.dataset.detail));
  });
}

experiences.forEach(item => {
  const option = document.createElement('option');
  option.value = item.id;
  option.textContent = item.title;
  requestExperience.appendChild(option);
});

renderExperiences();

searchInput.addEventListener('input', () => {
  activeFilter = '';
  renderExperiences();
});
document.querySelector('.search-submit').addEventListener('click', () => {
  activeFilter = '';
  renderExperiences();
  document.getElementById('experiences').scrollIntoView({ behavior: 'smooth' });
});

document.querySelectorAll('[data-filter]').forEach(button => {
  button.addEventListener('click', () => jumpToExperience(button.dataset.filter));
});
document.querySelectorAll('[data-jump]').forEach(button => {
  button.addEventListener('click', () => jumpToExperience(button.dataset.jump));
});
document.querySelectorAll('[data-clear-filter]').forEach(button => {
  button.addEventListener('click', () => {
    activeFilter = '';
    searchInput.value = '';
    renderExperiences();
  });
});
document.querySelectorAll('[data-open-request]').forEach(button => {
  button.addEventListener('click', () => openRequest());
});

const menuBtn = document.querySelector('.menu-btn');
const mobileMenu = document.getElementById('mobile-menu');
menuBtn.addEventListener('click', () => {
  const isOpen = menuBtn.getAttribute('aria-expanded') === 'true';
  menuBtn.setAttribute('aria-expanded', String(!isOpen));
  mobileMenu.hidden = isOpen;
});
mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  mobileMenu.hidden = true;
  menuBtn.setAttribute('aria-expanded', 'false');
}));

requestForm.addEventListener('submit', (event) => {
  event.preventDefault();
  requestFeedback.textContent = 'Đã ghi nhận trên giao diện. Kết nối kênh gửi yêu cầu sẽ được gắn ở bước tích hợp tiếp theo.';
});
