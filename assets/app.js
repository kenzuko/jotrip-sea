const isResetHome = document.body.classList.contains('home-reset');

if (isResetHome) {
  const resetHotfix = document.createElement('link');
  resetHotfix.rel = 'stylesheet';
  resetHotfix.href = '/assets/home-reset-hotfix.css';
  document.head.appendChild(resetHotfix);
} else {
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
