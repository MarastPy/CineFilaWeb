async function loadPartials() {
  const load = async (url, elementId) => {
    const response = await fetch(url);
    if (response.ok) {
      document.getElementById(elementId).innerHTML = await response.text();
    } else {
      console.error(`Error loading ${url}`);
    }
  };

  // 1️⃣ Load the header and footer
  await load('./partials/header.html', 'header-container');
  await load('./partials/footer.html', 'footer-container');

  // 2️⃣ Add scroll behavior AFTER load is complete
  window.addEventListener('scroll', function() {
    // Trigger scrolled state when scroll position is > 60px
    if (window.scrollY > 60) {
      document.body.classList.add('scrolled');
    } else {
      document.body.classList.remove('scrolled');
    }
  });
}

// Init
window.addEventListener('DOMContentLoaded', loadPartials);