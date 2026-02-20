// Mobile Menu Toggle
const menuBtn = document.getElementById('mobile-menu-btn');
const menuClose = document.getElementById('mobile-menu-close');
const mobileMenu = document.getElementById('mobile-menu');

if (menuBtn && mobileMenu) {
  menuBtn.addEventListener('click', () => {
    mobileMenu.classList.add('open');
    document.body.style.overflow = 'hidden';
  });
}

if (menuClose && mobileMenu) {
  menuClose.addEventListener('click', () => {
    mobileMenu.classList.remove('open');
    document.body.style.overflow = '';
  });
}
