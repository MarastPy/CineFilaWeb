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
  await load('./partials/header.html', 'header-container'); // This ensures header is loaded first
  await load('./partials/footer.html', 'footer-container');

  // Scroll behavior
  window.addEventListener('scroll', function () {
    if (window.scrollY > 60) {
      document.body.classList.add('scrolled');
    } else {
      document.body.classList.remove('scrolled');
    }
  });

  // Mobile nav toggle logic - NOW ATTACHED AFTER header.html IS LOADED
  const headerContainer = document.getElementById('header-container');
  if (headerContainer) {
    const hamburger = headerContainer.querySelector('.hamburger-menu-icon');
    // Assuming your main navigation element inside header.html has the class 'main-nav'
    // If it has id="main-header" as per previous CSS, you might need:
    // const nav = headerContainer.querySelector('#main-header');
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
    } else {
        console.error('Hamburger or Navigation element not found after header load.');
    }
  } else {
      console.error('Header container not found.');
  }
}

loadPartials();
