const isStandaloneHome = document.body.classList.contains('home-final') || document.body.classList.contains('home-reset') || document.body.classList.contains('home-shop');

if (!isStandaloneHome) {
  const serviceStyles = document.createElement('link');
  serviceStyles.rel = 'stylesheet';
  serviceStyles.href = '/assets/service-pages.css';
  document.head.appendChild(serviceStyles);

  const visualStyles = document.createElement('link');
  visualStyles.rel = 'stylesheet';
  visualStyles.href = '/assets/visual-v2.css';
  document.head.appendChild(visualStyles);

  if (document.body.classList.contains('home-v3')) {
    const homeV3Styles = document.createElement('link');
    homeV3Styles.rel = 'stylesheet';
    homeV3Styles.href = '/assets/home-v3.css';
    document.head.appendChild(homeV3Styles);
  }
}

const toggle = document.querySelector('[data-nav-toggle]');
const nav = document.querySelector('[data-nav]');
if (toggle && nav) toggle.addEventListener('click', () => nav.classList.toggle('open'));

document.querySelectorAll('[data-demo-form]').forEach(form => {
  form.addEventListener('submit', event => {
    event.preventDefault();
    const note = form.querySelector('[data-form-note]');
    if (note) note.textContent = 'Preview UI only - chưa gửi request vào Fishing Desk.';
  });
});

const tripFinder = document.querySelector('[data-trip-finder]');
if (tripFinder) {
  const dateInput = tripFinder.querySelector('input[type="date"]');
  if (dateInput) {
    const today = new Date();
    const local = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    dateInput.min = local;
  }

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
