const serviceStyles = document.createElement('link');
serviceStyles.rel = 'stylesheet';
serviceStyles.href = '/assets/service-pages.css';
document.head.appendChild(serviceStyles);

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
