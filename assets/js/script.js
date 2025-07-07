let allFilms = []; // Stores all data from JSON
let filteredFilms = []; // Stores filtered films for display

document.addEventListener('DOMContentLoaded', () => {
    // Check if we are on the catalogue page
    if (document.getElementById('filmContainer')) {
        fetchData();
    }
});

async function fetchData() {
    try {
        const response = await fetch('extracted_data/all_html_data.json'); // Assumes JSON data is here
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        allFilms = await response.json();
        filteredFilms = [...allFilms];
        populateFilters();
        displayFilms(filteredFilms);
    } catch (error) {
        console.error('Error fetching data:', error);
        const filmContainer = document.getElementById('filmContainer');
        if (filmContainer) {
            filmContainer.innerHTML = '<p>Failed to load film data. Please try again later.</p>';
        }
    }
}

/**
 * Rounds the film runtime to the nearest minute (down if < 0:40, up if >= 0:40)
 * and returns the length category.
 * @param {string} runtimeString E.g., "00:24:34"
 * @returns {string|null} "short", "mid-length", "full-length" or null
 */
function getRoundedRuntime(runtimeString) {
    if (!runtimeString || typeof runtimeString !== 'string') {
        return null;
    }

    const parts = runtimeString.split(':').map(Number);
    if (parts.length < 2) {
        return null;
    }

    let hours = parts[0];
    let minutes = parts[1];
    let seconds = parts[2] || 0; // Seconds might be optional

    // Calculate total minutes
    let totalMinutes = hours * 60 + minutes + (seconds >= 40 ? 1 : 0);

    if (totalMinutes < 40) {
        return "short";
    } else if (totalMinutes >= 40 && totalMinutes <= 70) {
        return "mid-length";
    } else {
        return "full-length";
    }
}


/**
 * Populates filter dropdowns based on film data.
 */
function populateFilters() {
    const genres = new Set();
    const years = new Set();
    const lengths = new Set();
    // Add other filter categories here (countries, ratings, audiences, keywords)
    const countries = new Set();
    const ratings = new Set();
    const audiences = new Set();
    const keywords = new Set();


    allFilms.forEach(film => {
        // Collect genres
        if (film.Film && film.Film.Genre && Array.isArray(film.Film.Genre)) {
            film.Film.Genre.forEach(genre => genres.add(genre.trim()));
        }
        // Collect years
        if (film.Film && film.Film.Year) {
            years.add(film.Film.Year.toString());
        }
        // Collect lengths based on rounded runtime
        if (film.Film && film.Film.Runtime) {
            const lengthCategory = getRoundedRuntime(film.Film.Runtime);
            if (lengthCategory) {
                lengths.add(lengthCategory);
            }
        }
        // Collect countries
        if (film.Film && film.Film.Country && Array.isArray(film.Film.Country)) {
            film.Film.Country.forEach(country => countries.add(country.trim()));
        }
        // Collect ratings
        if (film.Film && film.Film.Rating) {
            ratings.add(film.Film.Rating.trim());
        }
        // Collect audiences
        if (film.Film && film.Film.Audience && Array.isArray(film.Film.Audience)) {
            film.Film.Audience.forEach(audience => audiences.add(audience.trim()));
        }
        // Collect keywords (themes)
        if (film.Film && film.Film.Keywords && Array.isArray(film.Film.Keywords)) {
            film.Film.Keywords.forEach(keyword => keywords.add(keyword.trim()));
        }
    });

    populateSelect('genresFilter', Array.from(genres).sort());
    populateSelect('yearFilter', Array.from(years).sort((a, b) => b - a)); // Sort years descending
    populateSelect('lengthFilter', ['short', 'mid-length', 'full-length']); // Specific order for lengths
    // Populate other selects
    populateSelect('countryFilter', Array.from(countries).sort());
    populateSelect('ratingFilter', Array.from(ratings).sort());
    populateSelect('audienceFilter', Array.from(audiences).sort());
    populateSelect('keywordsFilter', Array.from(keywords).sort());
}

/**
 * Helper to populate a select element.
 * @param {string} selectId The ID of the select element.
 * @param {Array<string>} options An array of option values.
 */
function populateSelect(selectId, options) {
    const selectElement = document.getElementById(selectId);
    if (selectElement) {
        selectElement.innerHTML = '<option value="">All</option>'; // Default option
        options.forEach(option => {
            const opt = document.createElement('option');
            opt.value = option;
            opt.textContent = option.charAt(0).toUpperCase() + option.slice(1); // Capitalize first letter
            selectElement.appendChild(opt);
        });
    }
}

/**
 * Applies filters based on selected criteria and search input.
 */
function applyFilters() {
    const searchInput = document.getElementById('searchInput');
    const genreFilter = document.getElementById('genresFilter'); // Corrected ID
    const yearFilter = document.getElementById('yearFilter');
    const lengthFilter = document.getElementById('lengthFilter');
    const countryFilter = document.getElementById('countryFilter');
    const ratingFilter = document.getElementById('ratingFilter');
    const audienceFilter = document.getElementById('audienceFilter');
    const keywordsFilter = document.getElementById('keywordsFilter');

    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const selectedGenre = genreFilter ? genreFilter.value : '';
    const selectedYear = yearFilter ? yearFilter.value : '';
    const selectedLength = lengthFilter ? lengthFilter.value : '';
    const selectedCountry = countryFilter ? countryFilter.value : '';
    const selectedRating = ratingFilter ? ratingFilter.value : '';
    const selectedAudience = audienceFilter ? audienceFilter.value : '';
    const selectedKeywords = keywordsFilter ? keywordsFilter.value : '';

    filteredFilms = allFilms.filter(film => {
        const title = film.Film && (film.Film.Title_English || film.Film.Title_Original || '').toLowerCase();
        const originalTitle = film.Film && (film.Film.Title_Original || '').toLowerCase();
        const logline = film.Logline || film.Film.Logline_English || film.Film.Logline_Original || '';
        const synopsis = film.Synopsis_English || film.Film.Synopsis_English || film.Film.Synopsis_Original || '';
        const director = film.Film && (film.Film.Director || '').toLowerCase();
        const genres = film.Film && film.Film.Genre ? film.Film.Genre.map(g => g.toLowerCase()) : [];
        const year = film.Film && film.Film.Year ? film.Film.Year.toString() : '';
        const runtimeCategory = film.Film && film.Film.Runtime ? getRoundedRuntime(film.Film.Runtime) : null;
        const countries = film.Film && film.Film.Country ? film.Film.Country.map(c => c.toLowerCase()) : [];
        const rating = film.Film && film.Film.Rating ? film.Film.Rating.toLowerCase() : '';
        const audience = film.Film && film.Film.Audience ? film.Film.Audience.map(a => a.toLowerCase()) : [];
        const keywords = film.Film && film.Film.Keywords ? film.Film.Keywords.map(k => k.toLowerCase()) : [];


        const matchesSearch = searchTerm === '' || title.includes(searchTerm) || originalTitle.includes(searchTerm) || logline.toLowerCase().includes(searchTerm) || synopsis.toLowerCase().includes(searchTerm) || director.includes(searchTerm);
        const matchesGenre = selectedGenre === '' || genres.includes(selectedGenre.toLowerCase());
        const matchesYear = selectedYear === '' || year === selectedYear;
        const matchesLength = selectedLength === '' || runtimeCategory === selectedLength;
        const matchesCountry = selectedCountry === '' || countries.includes(selectedCountry.toLowerCase());
        const matchesRating = selectedRating === '' || rating === selectedRating.toLowerCase();
        const matchesAudience = selectedAudience === '' || audience.includes(selectedAudience.toLowerCase());
        const matchesKeywords = selectedKeywords === '' || keywords.includes(selectedKeywords.toLowerCase());


        return matchesSearch && matchesGenre && matchesYear && matchesLength && matchesCountry && matchesRating && matchesAudience && matchesKeywords;
    });

    displayFilms(filteredFilms);
}

/**
 * Displays the given array of film objects in the filmContainer grid.
 * @param {Array<Object>} films An array of film data objects.
 */
function displayFilms(films) {
    const container = document.getElementById('filmContainer');
    if (!container) return; // Ensure the container exists
    container.innerHTML = ''; // Clear previous films

    films.forEach(filmData => {
        // Extract Source_File, convert to lowercase, and remove .html extension
        let sourceFileName = filmData.Source_File;
        const filmFolder = sourceFileName ? sourceFileName.replace(/\.html$/i, '').toLowerCase() : '';

        // Create the anchor tag wrapper for the entire film card
        const filmLink = document.createElement('a');
        filmLink.href = `generated_film_pages/${filmFolder}.html`; // Use processed Source_File for linking
        filmLink.classList.add('preview-item-link'); // Apply the news-item-link class

        // Create the main film card div (matching news-item structure)
        const filmCard = document.createElement('div');
        filmCard.classList.add('preview-item'); // Apply the news-item class

        // Film Title (h3)
        const displayTitle = filmData.Film.Title_English || filmData.Film.Title_Original || 'Untitled';
        const filmTitleElement = document.createElement('h3');
        filmTitleElement.textContent = displayTitle;
        filmCard.appendChild(filmTitleElement);

        // Image Wrapper
        const imageWrapper = document.createElement('div');
        imageWrapper.classList.add('news-item-image-wrapper'); // Apply news-item-image-wrapper class
        const filmStillImg = document.createElement('img');
        // Dynamically construct image path using the processed filmFolder: images/stills/{filmFolder}/{filmFolder}_1.png
        filmStillImg.src = filmFolder ? `images/stills/${filmFolder}/${filmFolder}_1.png` : '';
        filmStillImg.alt = `Still from ${displayTitle}`;
        imageWrapper.appendChild(filmStillImg);
        filmCard.appendChild(imageWrapper);

        // Add Year and Runtime (similar to news-date)
        const yearRuntimeElement = document.createElement('p');
        yearRuntimeElement.classList.add('news-date'); // Using news-date for styling consistency
        yearRuntimeElement.textContent = `${filmData.Film.Year || ''}${filmData.Film.Year && filmData.Film.Runtime ? ' | ' : ''}${filmData.Film.Runtime ? getRoundedRuntime(filmData.Film.Runtime).charAt(0).toUpperCase() + getRoundedRuntime(filmData.Film.Runtime).slice(1) + '-length' : ''}`;
        filmCard.appendChild(yearRuntimeElement);

        // Logline (main description, similar to index news item)
        const loglineElement = document.createElement('p');
        loglineElement.classList.add('news-item-description'); // Use news-item-description for consistency
        loglineElement.textContent = filmData.Logline || filmData.Film.Logline_English || filmData.Film.Logline_Original || '';
        filmCard.appendChild(loglineElement);

        // Append the film card to the link, and the link to the container
        filmLink.appendChild(filmCard);
        container.appendChild(filmLink);
    });
}

/**
 * Resets all filters and optionally clears the search field.
 * @param {boolean} clearSearch If true, the search field will be cleared.
 */
function resetFilters(clearSearch = true) {
    // Reset all dropdowns
    const selects = document.querySelectorAll('.filter-group select'); // Adjusted selector
    selects.forEach(sel => sel.value = '');

    // Clear search field if set
    if (clearSearch) {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) searchInput.value = '';
    }

    // Re-display all films
    filteredFilms = [...allFilms];
    displayFilms(filteredFilms);
}

// Make functions accessible in the global scope for HTML onchange/onclick
window.applyFilters = applyFilters;
window.resetFilters = resetFilters;
window.performSearch = applyFilters; // Assume performSearch just triggers applyFilters