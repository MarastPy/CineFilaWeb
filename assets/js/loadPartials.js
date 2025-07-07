async function loadPartials() {
  const load = async (url, elementId) => {
    const response = await fetch(url);
    if (response.ok) {
      document.getElementById(elementId).innerHTML = await response.text();
    } else {
      console.error(`Error loading ${url}`);
    }
  };

  // Load header and footer
  await load('./partials/header.html', 'header-container');
  await load('./partials/footer.html', 'footer-container');

  // Scroll behavior
  window.addEventListener('scroll', function () {
    if (window.scrollY > 60) {
      document.body.classList.add('scrolled');
    } else {
      document.body.classList.remove('scrolled');
    }
  });

  // Mobile nav toggle logic
  document.addEventListener('DOMContentLoaded', () => {
    const headerContainer = document.getElementById('header-container');
    if (headerContainer) {
      const hamburger = headerContainer.querySelector('.hamburger-menu-icon');
      const nav = headerContainer.querySelector('.main-nav');

      if (hamburger && nav) {
        hamburger.addEventListener('click', () => {
          document.body.classList.toggle('menu-open');
        });

        nav.querySelectorAll('a').forEach(link => {
          link.addEventListener('click', () => {
            document.body.classList.remove('menu-open');
          });
        });
      }
    }
  });
}

loadPartials();
