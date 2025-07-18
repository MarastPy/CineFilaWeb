let allFilms = [];
let filteredFilms = []; // This holds the currently displayed films

document.addEventListener('DOMContentLoaded', () => {
    const isIndexPage = document.getElementById('topFilmsContainer') !== null;
    const isCataloguePage = document.getElementById('filmContainer') !== null;

    fetchData(isIndexPage, isCataloguePage);

    if (isCataloguePage) {
        document.getElementById('searchInput')?.addEventListener('input', applyFilters);
        document.getElementById('genresFilter')?.addEventListener('change', applyFilters);
        document.getElementById('yearFilter')?.addEventListener('change', applyFilters);
        document.getElementById('lengthFilter')?.addEventListener('change', applyFilters);
        document.getElementById('countryFilter')?.addEventListener('change', applyFilters);
        document.getElementById('ratingFilter')?.addEventListener('change', applyFilters);
        document.getElementById('audienceFilter')?.addEventListener('change', applyFilters);
        document.getElementById('keywordsFilter')?.addEventListener('change', applyFilters);
        document.querySelector('.clear-filters-btn')?.addEventListener('click', () => resetFilters(true));
    }
});

async function fetchData(isIndexPage, isCataloguePage) {
    try {
        const response = await fetch('extracted_data/all_html_data.json');
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        allFilms = await response.json();
        console.log('All Films loaded:', allFilms);

        allFilms.forEach(film => {
            film.ParsedRanking = parseInt(film.Ranking, 10);
            if (isNaN(film.ParsedRanking)) film.ParsedRanking = Infinity;
        });

        if (isCataloguePage) {
            filteredFilms = [...allFilms];
            sortFilmsByRanking();
            populateAllFiltersInitial(); // This will now dynamically populate length
            displayFilms(filteredFilms, 'filmContainer');
        } else if (isIndexPage) {
            displayTopFilmsOnIndexPage();
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        const targetContainer = document.getElementById('filmContainer') || document.getElementById('topFilmsContainer');
        if (targetContainer) {
            targetContainer.innerHTML = '<p>Failed to load film data. Please try again later.</p>';
        }
    }
}

function sortFilmsByRanking() {
    filteredFilms.sort((a, b) => a.ParsedRanking - b.ParsedRanking);
}

function displayTopFilmsOnIndexPage() {
    const top3Films = [...allFilms]
        .sort((a, b) => a.ParsedRanking - b.ParsedRanking)
        .slice(0, 3);
    displayFilms(top3Films, 'topFilmsContainer');
}

// ✅ FIXED version of getRoundedRuntime() - KEPT FOR FILTERING PURPOSES
function getRoundedRuntime(runtimeString) {
    if (!runtimeString || typeof runtimeString !== "string") return null;

    // Clean the input
    const cleanStr = runtimeString.trim().toLowerCase().replace(/[^0-9:]/g, '');

    let totalMinutes = 0;

    // Handle formats like hh:mm:ss or mm:ss
    const parts = cleanStr.split(':').map(Number);

    if (parts.length === 3) {
        const [hours, minutes, seconds] = parts;
        totalMinutes = (hours || 0) * 60 + (minutes || 0) + (seconds || 0) / 60;
    } else if (parts.length === 2) {
        const [minutes, seconds] = parts;
        totalMinutes = (minutes || 0) + (seconds || 0) / 60;
    } else if (parts.length === 1 && cleanStr !== '') {
        totalMinutes = parseInt(parts[0], 10);
    } else {
        return null;
    }

    if (isNaN(totalMinutes)) return null;

    // Round totalMinutes to nearest whole number
    totalMinutes = Math.round(totalMinutes);

    if (totalMinutes < 40) return "short";
    if (totalMinutes <= 70) return "mid-length";
    return "full-length";
}

// ✨ NEW HELPER FUNCTION to get exact minutes for display
function parseRuntimeToMinutes(runtimeString) {
    if (!runtimeString || typeof runtimeString !== "string") return null;

    const cleanStr = runtimeString.trim().toLowerCase().replace(/[^0-9:]/g, '');
    let totalMinutes = 0;
    const parts = cleanStr.split(':').map(Number);

    if (parts.length === 3) {
        const [hours, minutes, seconds] = parts;
        totalMinutes = (hours || 0) * 60 + (minutes || 0) + (seconds || 0) / 60;
    } else if (parts.length === 2) {
        const [minutes, seconds] = parts;
        totalMinutes = (minutes || 0) + (seconds || 0) / 60;
    } else if (parts.length === 1 && cleanStr !== '') {
        totalMinutes = parseInt(parts[0], 10);
    } else {
        return null;
    }

    if (isNaN(totalMinutes)) return null;
    return Math.round(totalMinutes); // Round to nearest whole minute for display
}


function populateAllFiltersInitial() {
    const genres = new Set();
    const years = new Set();
    const lengths = new Set(); // This will now collect actual lengths
    const countries = new Set();
    const ratings = new Set();
    const audiences = new Set();
    const keywords = new Set();

    allFilms.forEach(film => {
        const f = film.Film || {};
        if (f.Genre_List) f.Genre_List.forEach(g => genres.add(g.trim()));
        if (f.Date_of_completion) {
            const yearMatch = f.Date_of_completion.match(/\b\d{4}\b/);
            if (yearMatch) years.add(yearMatch[0]);
        }
        if (f.Runtime) {
            // Still use getRoundedRuntime for filter population
            const len = getRoundedRuntime(f.Runtime);
            if (len) lengths.add(len);
        }
        if (f.Country_of_production) countries.add(f.Country_of_production.trim());
        if (f.Target_Group?.Rating) ratings.add(f.Target_Group.Rating.trim());
        if (f.Target_Group?.Audience) audiences.add(f.Target_Group.Audience.trim());
        if (f.Keywords) {
            f.Keywords.split(',').forEach(k => {
                const trimmedKeyword = k.trim();
                if (trimmedKeyword) {
                    keywords.add(trimmedKeyword);
                }
            });
        }
    });

    populateSelect('genresFilter', Array.from(genres).sort(), '', 'Genre');
    populateSelect('yearFilter', Array.from(years).sort((a, b) => b - a), '', 'Year');
    // Dynamically sort lengths into the correct order if they exist
    const sortedLengths = ['short', 'mid-length', 'full-length'].filter(cat => lengths.has(cat));
    populateSelect('lengthFilter', sortedLengths, '', 'Length');
    populateSelect('countryFilter', Array.from(countries).sort(), '', 'Country');
    populateSelect('ratingFilter', Array.from(ratings).sort(), '', 'Rating');
    populateSelect('audienceFilter', Array.from(audiences).sort(), '', 'Audience');
    populateSelect('keywordsFilter', Array.from(keywords).sort(), '', 'Themes');
}

function populateSelect(selectId, options, selectedValue = '', placeholder = 'Select') {
    const selectElement = document.getElementById(selectId);
    if (!selectElement) return;

    selectElement.innerHTML = `<option value="" ${selectedValue === '' ? 'selected' : ''}>${placeholder}</option>`;

    options.forEach(option => {
        const opt = document.createElement('option');
        opt.value = option;
        opt.textContent = option.charAt(0).toUpperCase() + option.slice(1);
        if (option.toLowerCase() === selectedValue.toLowerCase() && selectedValue !== '') {
            opt.selected = true;
        }
        selectElement.appendChild(opt);
    });
}

function applyFilters() {
    const values = getCurrentFilterValues();

    filteredFilms = allFilms.filter(film => {
        const f = film.Film || {};
        const crew = film.Crew || {};
        const title = (f.Title_English || f.Title_Original || '').toLowerCase();
        const originalTitle = (f.Title_Original || '').toLowerCase();
        const logline = (film.Logline || '').toLowerCase();
        const synopsis = (film.Synopsis || '').toLowerCase();
        const director = (crew['Director(s)'] || '').toLowerCase();

        const genres = f.Genre_List?.map(g => g.toLowerCase()) || [];
        const runtimeCategory = f.Runtime ? getRoundedRuntime(f.Runtime) : null; // Use category for filtering
        const year = f.Date_of_completion?.match(/\b\d{4}\b/)?.[0] || '';
        const country = f.Country_of_production?.toLowerCase() || '';
        const rating = f.Target_Group?.Rating?.toLowerCase() || '';
        const audience = f.Target_Group?.Audience?.toLowerCase() || '';
        const keywords = f.Keywords ? f.Keywords.split(',').map(k => k.trim().toLowerCase()) : [];

        return (
            (!values.searchTerm || title.includes(values.searchTerm) || originalTitle.includes(values.searchTerm) || logline.includes(values.searchTerm) || synopsis.includes(values.searchTerm) || director.includes(values.searchTerm)) &&
            (!values.genre || genres.includes(values.genre)) &&
            (!values.year || year === values.year) &&
            (!values.length || runtimeCategory === values.length) && // Filter by category
            (!values.country || country === values.country) &&
            (!values.rating || rating === values.rating) &&
            (!values.audience || audience === values.audience) &&
            (!values.keywords || keywords.includes(values.keywords))
        );
    });

    sortFilmsByRanking();
    displayFilms(filteredFilms, 'filmContainer');
    updateDependentFilterOptions();
}

function getCurrentFilterValues() {
    return {
        searchTerm: document.getElementById('searchInput')?.value.toLowerCase() || '',
        genre: document.getElementById('genresFilter')?.value || '',
        year: document.getElementById('yearFilter')?.value || '',
        length: document.getElementById('lengthFilter')?.value || '',
        country: document.getElementById('countryFilter')?.value.toLowerCase() || '',
        rating: document.getElementById('ratingFilter')?.value.toLowerCase() || '',
        audience: document.getElementById('audienceFilter')?.value.toLowerCase() || '',
        keywords: document.getElementById('keywordsFilter')?.value.toLowerCase() || ''
    };
}

function updateDependentFilterOptions() {
    const currentSelectedValues = getCurrentFilterValues();

    const filtersConfig = [
        { id: 'genresFilter', key: 'genre', path: f => f.Genre_List?.map(g => g.trim()), sort: arr => arr.sort(), placeholder: 'Genre' },
        { id: 'yearFilter', key: 'year', path: f => f.Date_of_completion?.match(/\b\d{4}\b/)?.[0], sort: arr => arr.sort((a, b) => b - a), placeholder: 'Year' },
        // IMPORTANT: The sort function for length here ensures the correct order
        { id: 'lengthFilter', key: 'length', path: f => getRoundedRuntime(f.Runtime), sort: arr => ['short', 'mid-length', 'full-length'].filter(cat => arr.includes(cat)), placeholder: 'Length' },
        { id: 'countryFilter', key: 'country', path: f => f.Country_of_production?.trim(), sort: arr => arr.sort(), placeholder: 'Country' },
        { id: 'ratingFilter', key: 'rating', path: f => f.Target_Group?.Rating?.trim(), sort: arr => arr.sort(), placeholder: 'Rating' },
        { id: 'audienceFilter', key: 'audience', path: f => f.Target_Group?.Audience?.trim(), sort: arr => arr.sort(), placeholder: 'Audience' },
        {
            id: 'keywordsFilter',
            key: 'keywords',
            path: f => f.Keywords?.split(',').map(k => k.trim()).filter(k => k),
            sort: arr => arr.sort(),
            placeholder: 'Themes'
        }
    ];

    filtersConfig.forEach(filterConfig => {
        const uniqueOptions = new Set();

        const relevantFilmsForThisFilterPopulation = allFilms.filter(film => {
            const f = film.Film || {};

            return filtersConfig.every(otherFilterConfig => {
                if (otherFilterConfig.id === filterConfig.id || !currentSelectedValues[otherFilterConfig.key]) {
                    return true;
                }

                const selectedValueForOtherFilter = currentSelectedValues[otherFilterConfig.key];
                const filmDataForOtherFilter = otherFilterConfig.path(f);

                if (Array.isArray(filmDataForOtherFilter)) {
                    return filmDataForOtherFilter.some(val => val?.toLowerCase() === selectedValueForOtherFilter.toLowerCase());
                } else {
                    return filmDataForOtherFilter?.toLowerCase() === selectedValueForOtherFilter.toLowerCase();
                }
            });
        });

        relevantFilmsForThisFilterPopulation.forEach(film => {
            const values = filterConfig.path(film.Film || {});
            if (Array.isArray(values)) {
                values.forEach(v => v && uniqueOptions.add(v));
            } else if (values) {
                uniqueOptions.add(values);
            }
        });

        const sortedOptions = filterConfig.sort(Array.from(uniqueOptions));
        populateSelect(filterConfig.id, sortedOptions, currentSelectedValues[filterConfig.key], filterConfig.placeholder);
    });
}

function displayFilms(films, containerId = 'filmContainer') {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    if (films.length === 0) {
        container.innerHTML = '<p>No films match your current filter selection.</p>';
        return;
    }

    films.forEach(filmData => {
        const f = filmData.Film || {};
        const crew = filmData.Crew || {};
        const folder = filmData.Source_File?.replace(/\.html$/i, '').toLowerCase();

        const filmLink = document.createElement('a');
        filmLink.href = `film_pages/${folder}.html`;
        filmLink.classList.add('preview-item-link');

        const filmCard = document.createElement('div');
        filmCard.classList.add('preview-item');

        const title = (f.Title_English || f.Title_Original || 'Untitled').trim();
        const year = f.Date_of_completion?.match(/\b\d{4}\b/)?.[0] || '';

        // ✨ MODIFIED: Get and display exact minutes
        const exactRuntimeMinutes = parseRuntimeToMinutes(f.Runtime);
        let displayRuntime = '';
        if (exactRuntimeMinutes !== null) {
            displayRuntime = ` | ${exactRuntimeMinutes} min`;
        } else {
            // Fallback to category if exact minutes can't be parsed, or show nothing
            const runtimeCategory = f.Runtime ? getRoundedRuntime(f.Runtime) : null;
            if (runtimeCategory === 'short') {
                displayRuntime = ' (<40 min)';
            } else if (runtimeCategory === 'mid-length') {
                displayRuntime = ' (40-70 min)';
            } else if (runtimeCategory === 'full-length') {
                displayRuntime = ' (>70 min)';
            }
            // If you truly only want exact minutes, you could just leave displayRuntime empty here.
        }

        const director = (crew['Director(s)'] || 'Unknown Director').trim();
        const logline = (filmData.Logline || '').trim();

        const titleMeta = document.createElement('h3');
        titleMeta.classList.add('film-card-title-meta');
        titleMeta.textContent = `${title}${year ? ` | ${year}` : ''}${displayRuntime}`; // Updated display
        filmCard.appendChild(titleMeta);

        const directorEl = document.createElement('p');
        directorEl.classList.add('film-card-director');
        directorEl.textContent = `by ${director}`;
        filmCard.appendChild(directorEl);

        const imageWrapper = document.createElement('div');
        imageWrapper.classList.add('news-item-image-wrapper');
        const img = document.createElement('img');
        img.src = folder ? `images/stills/${folder}/${folder}_1.jpg` : '';
        img.alt = `Still from ${title}`;
        imageWrapper.appendChild(img);
        filmCard.appendChild(imageWrapper);

        const loglineEl = document.createElement('p');
        loglineEl.classList.add('news-item-description');
        loglineEl.textContent = logline;
        filmCard.appendChild(loglineEl);

        filmLink.appendChild(filmCard);
        container.appendChild(filmLink);
    });
}

function resetFilters(clearSearch = true) {
    document.querySelectorAll('.filter-group select').forEach(sel => sel.selectedIndex = 0);
    if (clearSearch) {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) searchInput.value = '';
    }

    filteredFilms = [...allFilms];
    sortFilmsByRanking();
    displayFilms(filteredFilms, 'filmContainer');
    populateAllFiltersInitial(); // Re-populate filters to show all initial options based on data
}

window.applyFilters = applyFilters;
window.resetFilters = resetFilters;
window.performSearch = applyFilters;
