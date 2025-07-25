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
  await load('./includes/header.html', 'header-container');
  await load('./includes/footer.html', 'footer-container');

  // Determine if it's the index page
  const isIndexPage = window.location.pathname.endsWith('index.html') || window.location.pathname === '/';

  if (isIndexPage) {
    document.body.classList.add('index-page');
    const initialInfoBanner = document.getElementById('initial-info-banner');

    // Set scroll threshold based on banner height for index page
    if (initialInfoBanner) {
      const scrollThreshold = initialInfoBanner.offsetHeight;

      window.addEventListener('scroll', function () {
        if (window.scrollY > scrollThreshold) {
          document.body.classList.add('scrolled');
        } else {
          document.body.classList.remove('scrolled');
        }
      });
    } else {
        console.warn('initial-info-banner not found on index page. Using default scroll threshold.');
        // Fallback if banner is not found on index page
        window.addEventListener('scroll', function () {
            if (window.scrollY > 60) {
                document.body.classList.add('scrolled');
            } else {
                document.body.classList.remove('scrolled');
            }
        });
    }
  } else {
    // Default scroll behavior for other pages (header compacts after 60px scroll)
    window.addEventListener('scroll', function () {
      if (window.scrollY > 60) {
        document.body.classList.add('scrolled');
      } else {
        document.body.classList.remove('scrolled');
      }
    });
  }

  // Mobile nav toggle logic - NOW ATTACHED AFTER header.html IS LOADED
  const headerContainer = document.getElementById('header-container');
  if (headerContainer) {
    // CORRECTED: Select the hamburger menu icon as a direct child of header-inner
    const hamburger = headerContainer.querySelector('.header-inner .hamburger-menu-icon');
    const nav = headerContainer.querySelector('#main-header .main-nav'); // More specific selector for clarity

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
        console.error('Hamburger or Navigation element not found for event listeners.');
    }
  }
}

document.addEventListener('DOMContentLoaded', loadPartials);