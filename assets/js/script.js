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
    });

    populateSelect('genreFilter', Array.from(genres).sort());
    populateSelect('yearFilter', Array.from(years).sort((a, b) => b - a)); // Sort years descending
    populateSelect('lengthFilter', ['short', 'mid-length', 'full-length']); // Specific order for lengths
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
    const genreFilter = document.getElementById('genreFilter');
    const yearFilter = document.getElementById('yearFilter');
    const lengthFilter = document.getElementById('lengthFilter');

    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const selectedGenre = genreFilter ? genreFilter.value : '';
    const selectedYear = yearFilter ? yearFilter.value : '';
    const selectedLength = lengthFilter ? lengthFilter.value : '';

    filteredFilms = allFilms.filter(film => {
        const title = film.Film && (film.Film.Title_English || film.Film.Title_Original || '').toLowerCase();
        const originalTitle = film.Film && (film.Film.Title_Original || '').toLowerCase();
        const logline = film.Logline || film.Film.Logline_English || film.Film.Logline_Original || '';
        const synopsis = film.Synopsis_English || film.Film.Synopsis_English || film.Film.Synopsis_Original || '';
        const director = film.Film && (film.Film.Director || '').toLowerCase();
        const genres = film.Film && film.Film.Genre ? film.Film.Genre.map(g => g.toLowerCase()) : [];
        const year = film.Film && film.Film.Year ? film.Film.Year.toString() : '';
        const runtimeCategory = film.Film && film.Film.Runtime ? getRoundedRuntime(film.Film.Runtime) : null;

        const matchesSearch = searchTerm === '' ||
                              title.includes(searchTerm) ||
                              originalTitle.includes(searchTerm) ||
                              logline.toLowerCase().includes(searchTerm) ||
                              synopsis.toLowerCase().includes(searchTerm) ||
                              director.includes(searchTerm);

        const matchesGenre = selectedGenre === '' || genres.includes(selectedGenre.toLowerCase());
        const matchesYear = selectedYear === '' || year === selectedYear;
        const matchesLength = selectedLength === '' || runtimeCategory === selectedLength;

        return matchesSearch && matchesGenre && matchesYear && matchesLength;
    });

    displayFilms(filteredFilms);
}


/**
 * Displays the given array of film objects in the filmContainer grid.
 * @param {Array<Object>} films An array of film data objects.
 */
function displayFilms(films) {
    const container = document.getElementById('filmContainer');
    if (!container) return;

    container.innerHTML = ''; // Clear previous films

    if (films.length === 0) {
        container.innerHTML = '<p>No films found matching your criteria.</p>';
        return;
    }

    films.forEach(filmData => {
        const filmCard = document.createElement('div');
        filmCard.classList.add('film-item-card');
        filmCard.setAttribute('data-film-id', filmData.FilmID || filmData.Film.FilmID); // Ensure FilmID is accessible

        // Event listener for clicking the card
        filmCard.addEventListener('click', () => {
            window.location.href = `generated_film_pages/${filmData.FilmID || filmData.Film.FilmID}.html`;
        });

        // Determine the title to display
        const displayTitle = filmData.Film.Title_English || filmData.Film.Title_Original || 'Untitled';
        const displayOriginalTitle = filmData.Film.Title_Original && filmData.Film.Title_Original !== displayTitle ? ` (${filmData.Film.Title_Original})` : '';

        // Add title
        const titleElement = document.createElement('h3');
        titleElement.classList.add('film-title');
        titleElement.textContent = displayTitle + displayOriginalTitle;
        filmCard.appendChild(titleElement);

        // Add year and runtime
        const yearRuntimeElement = document.createElement('p');
        yearRuntimeElement.classList.add('film-year-runtime');
        const runtime = filmData.Film.Runtime ? filmData.Film.Runtime.substring(0, 5) : 'N/A'; // "HH:MM"
        yearRuntimeElement.textContent = `${filmData.Film.Year || 'N/A'} | ${runtime}`;
        filmCard.appendChild(yearRuntimeElement);

        // Add genres
        const genresElement = document.createElement('p');
        genresElement.classList.add('film-genres');
        genresElement.textContent = `Genres: ${filmData.Film.Genre && filmData.Film.Genre.length > 0 ? filmData.Film.Genre.join(', ') : 'N/A'}`;
        filmCard.appendChild(genresElement);

        // Add director
        const directorElement = document.createElement('p');
        directorElement.classList.add('film-director');
        directorElement.textContent = `Director: ${filmData.Film.Director || 'N/A'}`;
        filmCard.appendChild(directorElement);

        // Add film still (thumbnail)
        const filmStillUrl = filmData.Film.Film_Stills && filmData.Film.Film_Stills.length > 0 ? filmData.Film.Film_Stills[0] : 'placeholder.jpg'; // Fallback
        const filmStillImg = document.createElement('img');
        filmStillImg.src = filmStillUrl;
        filmStillImg.alt = `Still from ${displayTitle}`;
        filmStillImg.classList.add('film-thumbnail'); // Changed to film-thumbnail
        filmCard.appendChild(filmStillImg);

        // Add logline
        const loglineElement = document.createElement('p');
        loglineElement.classList.add('film-logline');
        loglineElement.textContent = filmData.Logline || filmData.Film.Logline_English || filmData.Film.Logline_Original || '';
        filmCard.appendChild(loglineElement);

        container.appendChild(filmCard); // Append the whole card directly to the filmContainer (which is the grid)
    });
}


/**
 * Resets all filters and optionally clears the search field.
 * @param {boolean} clearSearch If true, the search field will be cleared.
 */
function resetFilters(clearSearch = true) {
    // Reset all dropdowns
    const selects = document.querySelectorAll('.filters select');
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
window.getRoundedRuntime = getRoundedRuntime; // Make available if needed for debugging or other scripts