const header = document.getElementById('siteHeader');
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

const updateHeader = () => {
  header.classList.toggle('scrolled', window.scrollY > 10);
};

updateHeader();
window.addEventListener('scroll', updateHeader, { passive: true });

navToggle.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', String(open));
});

navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});
