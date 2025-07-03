async function loadPartials() {
  const load = async (url, elementId) => {
    const response = await fetch(url);
    if (response.ok) {
      document.getElementById(elementId).innerHTML = await response.text();
    } else {
      console.error(`Error loading ${url}`);
    }
  };

  // 1 Load the header and footer
  await load('./partials/header.html', 'header-container');
  await load('./partials/footer.html', 'footer-container'); // Assuming you'll create a footer.html

  // 2 Add scroll behavior AFTER load is complete
  window.addEventListener('scroll', function() {
    // Trigger scrolled state when scroll position is > 60px
    if (window.scrollY > 60) {
      document.body.classList.add('scrolled');
    } else {
      document.body.classList.remove('scrolled');
    }
  });

  // 3 Add mobile navigation toggle behavior
  document.addEventListener('DOMContentLoaded', () => {
    const headerContainer = document.getElementById('header-container');
    if (headerContainer) {
      // Assuming you've added an element with class 'hamburger-menu-icon' to header.html
      const hamburger = headerContainer.querySelector('.hamburger-menu-icon');
      const nav = headerContainer.querySelector('nav');

      if (hamburger && nav) {
        hamburger.addEventListener('click', () => {
          document.body.classList.toggle('menu-open'); // Toggles a class on the body
          nav.classList.toggle('active'); // Toggles a class on the nav element (though 'menu-open' on body is main driver for CSS)
        });

        // Optional: Close menu when a navigation link is clicked
        nav.querySelectorAll('a').forEach(link => {
          link.addEventListener('click', () => {
            document.body.classList.remove('menu-open');
            nav.classList.remove('active');
          });
        });
      }
    }
  });
}

// Call loadPartials when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', loadPartials);