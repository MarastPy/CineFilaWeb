async function loadPartials() {
  const load = async (url, elementId) => {
    const response = await fetch(url);
    if (response.ok) {
      document.getElementById(elementId).innerHTML = await response.text();
    } else {
      console.error(`Error loading ${url}`);
    }
  };
  await load('./partials/header.html', 'header-container');
  await load('./partials/footer.html', 'footer-container');
}
window.addEventListener('DOMContentLoaded', loadPartials);