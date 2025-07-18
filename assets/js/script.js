let allFilms = [];
let filteredFilms = []; // This holds the currently displayed films

document.addEventListener('DOMContentLoaded', () => {
    // Determine if it's the index page or catalogue page
    const isIndexPage = window.location.pathname.endsWith('index.html') || window.location.pathname === '/';
    const isCataloguePage = document.getElementById('filmContainer') !== null;

    // Fetch data regardless of the page type
    fetchData(isIndexPage, isCataloguePage);

    // Attach event listeners to filters and search input (only for catalogue page)
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

        // Parse and store ranking as a number
        allFilms.forEach(film => {
            if (film.Ranking) {
                film.ParsedRanking = parseInt(film.Ranking, 10);
                if (isNaN(film.ParsedRanking)) {
                    film.ParsedRanking = Infinity; // Place films without valid ranking at the end
                }
            } else {
                film.ParsedRanking = Infinity; // Place films without ranking at the end
            }
        });

        if (isCataloguePage) {
            filteredFilms = [...allFilms]; // Initialize filteredFilms for catalogue
            sortFilmsByRanking(); // Sort for catalogue
            populateAllFiltersInitial(); // Populate filters for catalogue
            displayFilms(filteredFilms, 'filmContainer'); // Display all in catalogue
        } else if (isIndexPage) {
            displayTopFilmsOnIndexPage(); // Display top 3 on index page
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        // Show error in the relevant container
        const targetContainer = document.getElementById('filmContainer') || document.getElementById('topFilmsContainer');
        if (targetContainer) {
            targetContainer.innerHTML = '<p>Failed to load film data. Please try again later.</p>';
        }
    }
}

function getRoundedRuntime(runtimeString) {
    if (!runtimeString || typeof runtimeString !== 'string') return null;
    const parts = runtimeString.split(':').map(Number);
    if (parts.length < 2) return null;

    let hours = parts[0], minutes = parts[1], seconds = parts[2] || 0;
    let totalMinutes = hours * 60 + minutes + (seconds >= 40 ? 1 : 0);

    if (totalMinutes < 40) return "short";
    else if (totalMinutes <= 70) return "mid-length";
    else return "full-length";
}

function populateAllFiltersInitial() {
    const genres = new Set();
    const years = new Set();
    const lengths = new Set();
    const countries = new Set();
    const ratings = new Set();
    const audiences = new Set();
    const keywords = new Set();

    allFilms.forEach(film => {
        const f = film.Film || {};

        if (f.Genre_List && Array.isArray(f.Genre_List)) {
            f.Genre_List.forEach(genre => genres.add(genre.trim()));
        }
        if (f.Date_of_completion) {
            const match = f.Date_of_completion.match(/\b\d{4}\b/);
            if (match) years.add(match[0]);
        }
        if (f.Runtime) {
            const lengthCategory = getRoundedRuntime(f.Runtime);
            if (lengthCategory) lengths.add(lengthCategory);
        }
        if (f.Country_of_production) {
            countries.add(f.Country_of_production.trim());
        }
        if (f.Target_Group?.Rating) {
            ratings.add(f.Target_Group.Rating.trim());
        }
        if (f.Target_Group?.Audience) {
            audiences.add(f.Target_Group.Audience.trim());
        }
        if (f.Keywords) {
            f.Keywords.split(',').forEach(k => keywords.add(k.trim()));
        }
    });

    populateSelect('genresFilter', Array.from(genres).sort());
    console.log('Years collected for initial population:', Array.from(years).sort((a, b) => b - a));
    populateSelect('yearFilter', Array.from(years).sort((a, b) => b - a));
    populateSelect('lengthFilter', ['short', 'mid-length', 'full-length']); // Specific order
    populateSelect('countryFilter', Array.from(countries).sort());
    populateSelect('ratingFilter', Array.from(ratings).sort());
    populateSelect('audienceFilter', Array.from(audiences).sort());
    populateSelect('keywordsFilter', Array.from(keywords).sort());
}

function populateSelect(selectId, options, selectedValue = '') {
    const selectElement = document.getElementById(selectId);
    if (!selectElement) return;

    const placeholders = {
        genresFilter: 'Genre',
        yearFilter: 'Year',
        lengthFilter: 'Length',
        countryFilter: 'Country',
        ratingFilter: 'Rating',
        audienceFilter: 'Audience',
        keywordsFilter: 'Themes'
    };

    const label = placeholders[selectId] || 'Select';

    selectElement.innerHTML = `<option value="" ${selectedValue === '' ? 'selected' : ''}>${label}</option>`;

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

function sortFilmsByRanking() {
    filteredFilms.sort((a, b) => a.ParsedRanking - b.ParsedRanking);
}

// NEW FUNCTION: Display top 3 films on the index page
function displayTopFilmsOnIndexPage() {
    const top3Films = [...allFilms] // Create a shallow copy to sort
        .sort((a, b) => a.ParsedRanking - b.ParsedRanking)
        .slice(0, 3); // Get the top 3
    displayFilms(top3Films, 'topFilmsContainer'); // Use the modified displayFilms
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
        { id: 'genresFilter', key: 'genre', path: f => f.Genre_List?.map(g => g.trim()), sort: arr => arr.sort() },
        { id: 'yearFilter', key: 'year', path: f => f.Date_of_completion?.match(/\b\d{4}\b/)?.[0], sort: (a, b) => b - a },
        { id: 'lengthFilter', key: 'length', path: f => getRoundedRuntime(f.Runtime), sort: arr => ['short', 'mid-length', 'full-length'].filter(cat => arr.includes(cat)) },
        { id: 'countryFilter', key: 'country', path: f => f.Country_of_production?.trim(), sort: arr => arr.sort() },
        { id: 'ratingFilter', key: 'rating', path: f => f.Target_Group?.Rating?.trim(), sort: arr => arr.sort() },
        { id: 'audienceFilter', key: 'audience', path: f => f.Target_Group?.Audience?.trim(), sort: arr => arr.sort() },
        { id: 'keywordsFilter', key: 'keywords', path: f => f.Keywords?.split(',').map(k => k.trim()), sort: arr => arr.sort() }
    ];

    filtersConfig.forEach(filterConfig => {
        const uniqueOptions = new Set();

        const relevantFilmsForThisFilter = allFilms.filter(film => {
            const f = film.Film || {};
            return filtersConfig.every(otherFilterConfig => {
                if (otherFilterConfig.id === filterConfig.id) return true;

                const searchTerm = currentSelectedValues.searchTerm;
                const title = (f.Title_English || f.Title_Original || '').toLowerCase();
                const originalTitle = (f.Title_Original || '').toLowerCase();
                const logline = (film.Logline || '').toLowerCase();
                const synopsis = (film.Synopsis || '').toLowerCase();
                const director = (film.Crew?.['Director(s)'] || '').toLowerCase();
                const matchesSearch = !searchTerm || title.includes(searchTerm) || originalTitle.includes(searchTerm) || logline.includes(searchTerm) || synopsis.includes(searchTerm) || director.includes(searchTerm);
                if (!matchesSearch) return false;

                const selectedValue = currentSelectedValues[otherFilterConfig.key];
                if (!selectedValue) return true;

                const filmValues = otherFilterConfig.path(f);

                if (Array.isArray(filmValues)) {
                    return filmValues.some(v => v?.toLowerCase() === selectedValue.toLowerCase());
                } else if (filmValues) {
                    return filmValues.toLowerCase() === selectedValue.toLowerCase();
                }
                return false;
            });
        });

        if (filterConfig.id === 'yearFilter') {
            console.log(`Relevant films for Year Filter (${relevantFilmsForThisFilter.length}):`, relevantFilmsForThisFilter.map(film => film.Film.Title_English || film.Film.Title_Original));
        }

        relevantFilmsForThisFilter.forEach(film => {
            const values = filterConfig.path(film.Film || {});
            if (Array.isArray(values)) {
                values.forEach(v => v && uniqueOptions.add(v));
            } else if (values) {
                uniqueOptions.add(values);
            }
        });

        const sortedOptions = filterConfig.sort(Array.from(uniqueOptions));

        if (filterConfig.id === 'yearFilter') {
            console.log('Year Filter - Options to be populated:', sortedOptions);
            console.log('Year Filter - Current Selected Value:', currentSelectedValues[filterConfig.key]);
        }
        populateSelect(filterConfig.id, sortedOptions, currentSelectedValues[filterConfig.key]);
    });
}


function applyFilters() {
    const currentSelectedValues = getCurrentFilterValues();

    filteredFilms = allFilms.filter(film => {
        const f = film.Film || {};
        const crew = film.Crew || {};

        const title = (f.Title_English || f.Title_Original || '').toLowerCase();
        const originalTitle = (f.Title_Original || '').toLowerCase();
        const logline = (film.Logline || '').toLowerCase();
        const synopsis = (film.Synopsis || '').toLowerCase();
        const director = (crew['Director(s)'] || '').toLowerCase();

        const genres = f.Genre_List?.map(g => g.toLowerCase()) || [];
        const runtimeCategory = f.Runtime ? getRoundedRuntime(f.Runtime) : null;

        const year = f.Date_of_completion?.match(/\b\d{4}\b/)?.[0] || '';
        const country = f.Country_of_production?.toLowerCase() || '';
        const rating = f.Target_Group?.Rating?.toLowerCase() || '';
        const audience = f.Target_Group?.Audience?.toLowerCase() || '';
        const keywords = f.Keywords ? f.Keywords.split(',').map(k => k.trim().toLowerCase()) : [];

        const matchesSearch = !currentSelectedValues.searchTerm || title.includes(currentSelectedValues.searchTerm) || originalTitle.includes(currentSelectedValues.searchTerm) || logline.includes(currentSelectedValues.searchTerm) || synopsis.includes(currentSelectedValues.searchTerm) || director.includes(currentSelectedValues.searchTerm);
        const matchesGenre = !currentSelectedValues.genre || genres.includes(currentSelectedValues.genre);
        const matchesYear = !currentSelectedValues.year || year === currentSelectedValues.year;
        const matchesLength = !currentSelectedValues.length || runtimeCategory === currentSelectedValues.length;
        const matchesCountry = !currentSelectedValues.country || country === currentSelectedValues.country;
        const matchesRating = !currentSelectedValues.rating || rating === currentSelectedValues.rating;
        const matchesAudience = !currentSelectedValues.audience || audience === currentSelectedValues.audience;
        const matchesKeywords = !currentSelectedValues.keywords || keywords.includes(currentSelectedValues.keywords);

        return matchesSearch && matchesGenre && matchesYear && matchesLength &&
            matchesCountry && matchesRating && matchesAudience && matchesKeywords;
    });

    sortFilmsByRanking();
    displayFilms(filteredFilms, 'filmContainer'); // Explicitly target filmContainer
    updateDependentFilterOptions();
}

// MODIFIED: displayFilms now accepts a container ID
function displayFilms(films, containerId = 'filmContainer') {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    films.forEach(filmData => {
        const f = filmData.Film || {};
        const crew = filmData.Crew || {};
        const sourceFileName = filmData.Source_File;
        const filmFolder = sourceFileName ? sourceFileName.replace(/\.html$/i, '').toLowerCase() : '';

        const filmLink = document.createElement('a');
        filmLink.href = `film_pages/${filmFolder}.html`;
        filmLink.classList.add('preview-item-link');

        const filmCard = document.createElement('div');
        filmCard.classList.add('preview-item');

        const displayTitle = (f.Title_English || f.Title_Original || 'Untitled').trim();
        const year = f.Date_of_completion?.match(/\b\d{4}\b/)?.[0] || '';
        const runtimeParts = f.Runtime?.split(':').map(Number) || [];
        const totalMinutes = (runtimeParts[0] || 0) * 60 + (runtimeParts[1] || 0) + ((runtimeParts[2] || 0) >= 40 ? 1 : 0);
        const directorName = (crew['Director(s)'] || 'Unknown Director').trim();
        const loglineText = (filmData.Logline || '').trim();

        const titleMetaElement = document.createElement('h3');
        titleMetaElement.classList.add('film-card-title-meta');
        let metaText = displayTitle;
        if (year) metaText += ` | ${year}`;
        if (totalMinutes > 0) metaText += ` | ${totalMinutes} min`;
        titleMetaElement.textContent = metaText;
        filmCard.appendChild(titleMetaElement);

        const directorElement = document.createElement('p');
        directorElement.classList.add('film-card-director');
        directorElement.textContent = `by ${directorName}`;
        filmCard.appendChild(directorElement);

        const imageWrapper = document.createElement('div');
        imageWrapper.classList.add('news-item-image-wrapper');
        const filmStillImg = document.createElement('img');
        filmStillImg.src = filmFolder ? `images/stills/${filmFolder}/${filmFolder}_1.jpg` : '';
        filmStillImg.alt = `Still from ${displayTitle}`;
        imageWrapper.appendChild(filmStillImg);
        filmCard.appendChild(imageWrapper);

        const loglineElement = document.createElement('p');
        loglineElement.classList.add('news-item-description');
        loglineElement.textContent = loglineText;
        filmCard.appendChild(loglineElement);

        filmLink.appendChild(filmCard);
        container.appendChild(filmLink);
    });
}

function resetFilters(clearSearch = true) {
    const selects = document.querySelectorAll('.filter-group select');
    selects.forEach(sel => sel.selectedIndex = 0);

    if (clearSearch) {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) searchInput.value = '';
    }

    filteredFilms = [...allFilms];
    sortFilmsByRanking();
    displayFilms(filteredFilms, 'filmContainer'); // Explicitly target filmContainer
    updateDependentFilterOptions();
}

window.applyFilters = applyFilters;
window.resetFilters = resetFilters;
window.performSearch = applyFilters;

