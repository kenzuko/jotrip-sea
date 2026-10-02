(() => {
  const header = document.querySelector('[data-header]');
  const onScroll = () => header?.classList.toggle('scrolled', window.scrollY > 24);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });


  const mobileAvailability = document.querySelector('.mobile-availability');
  const hero = document.querySelector('.hero');
  const updateMobileAvailability = () => {
    if (!mobileAvailability || !hero) return;
    mobileAvailability.classList.toggle('visible', window.scrollY > hero.offsetHeight * 0.72);
  };
  updateMobileAvailability();
  window.addEventListener('scroll', updateMobileAvailability, { passive: true });

  const dateInput = document.querySelector('[data-availability-form] input[type="date"]');
  if (dateInput) {
    const now = new Date();
    dateInput.min = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  }

  const form = document.querySelector('[data-availability-form]');
  const select = form?.querySelector('select[name="experience"]');
  document.querySelectorAll('[data-product]').forEach(button => {
    button.addEventListener('click', () => {
      if (select) select.value = button.dataset.product || '';
      document.querySelector('#availability')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  form?.addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(form);
    const experience = data.get('experience');
    if (!experience) return;
    const params = new URLSearchParams();
    ['date', 'pax', 'area'].forEach(key => {
      const value = data.get(key);
      if (value) params.set(key, value);
    });
    params.set('intent', 'availability');
    location.href = `/experiences/${experience}/?${params.toString()}`;
  });
})();
