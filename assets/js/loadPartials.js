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

  // 2️⃣ AFTER load is complete, add the scroll behavior
  window.addEventListener('scroll', function() {
    if (window.scrollY > 100) {
      document.body.classList.add('scrolled');
    } else {
      document.body.classList.remove('scrolled');
    }
  });
}

window.addEventListener('DOMContentLoaded', loadPartials);