let allFilms = [];
let filteredFilms = [];

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('filmContainer')) {
        fetchData();
    }
});

async function fetchData() {
    try {
        const response = await fetch('extracted_data/all_html_data.json');
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        allFilms = await response.json();

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

        filteredFilms = [...allFilms];
        sortFilmsByRanking(); // Sort initially
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

function populateFilters() {
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
    populateSelect('yearFilter', Array.from(years).sort((a, b) => b - a));
    populateSelect('lengthFilter', ['short', 'mid-length', 'full-length']);
    populateSelect('countryFilter', Array.from(countries).sort());
    populateSelect('ratingFilter', Array.from(ratings).sort());
    populateSelect('audienceFilter', Array.from(audiences).sort());
    populateSelect('keywordsFilter', Array.from(keywords).sort());
}
// made  for the filters titles //
function populateSelect(selectId, options) {
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
    selectElement.innerHTML = `<option value="" disabled selected>${label}</option>`;

    options.forEach(option => {
        const opt = document.createElement('option');
        opt.value = option;
        opt.textContent = option.charAt(0).toUpperCase() + option.slice(1);
        selectElement.appendChild(opt);
    });
}

function sortFilmsByRanking() {
    filteredFilms.sort((a, b) => a.ParsedRanking - b.ParsedRanking);
}

function applyFilters() {
    const searchInput = document.getElementById('searchInput');
    const genreFilter = document.getElementById('genresFilter');
    const yearFilter = document.getElementById('yearFilter');
    const lengthFilter = document.getElementById('lengthFilter');
    const countryFilter = document.getElementById('countryFilter');
    const ratingFilter = document.getElementById('ratingFilter');
    const audienceFilter = document.getElementById('audienceFilter');
    const keywordsFilter = document.getElementById('keywordsFilter');

    const searchTerm = searchInput?.value.toLowerCase() || '';
    const selectedGenre = genreFilter?.value || '';
    const selectedYear = yearFilter?.value || '';
    const selectedLength = lengthFilter?.value || '';
    const selectedCountry = countryFilter?.value.toLowerCase() || '';
    const selectedRating = ratingFilter?.value.toLowerCase() || '';
    const selectedAudience = audienceFilter?.value.toLowerCase() || '';
    const selectedKeywords = keywordsFilter?.value.toLowerCase() || '';

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

        const matchesSearch = !searchTerm || title.includes(searchTerm) || originalTitle.includes(searchTerm) || logline.includes(searchTerm) || synopsis.includes(searchTerm) || director.includes(searchTerm);
        const matchesGenre = !selectedGenre || genres.includes(selectedGenre.toLowerCase());
        const matchesYear = !selectedYear || year === selectedYear;
        const matchesLength = !selectedLength || runtimeCategory === selectedLength;
        const matchesCountry = !selectedCountry || country === selectedCountry;
        const matchesRating = !selectedRating || rating === selectedRating;
        const matchesAudience = !selectedAudience || audience === selectedAudience;
        const matchesKeywords = !selectedKeywords || keywords.includes(selectedKeywords);

        return matchesSearch && matchesGenre && matchesYear && matchesLength &&
            matchesCountry && matchesRating && matchesAudience && matchesKeywords;
    });

    sortFilmsByRanking(); // Sort filtered results
    displayFilms(filteredFilms);
}

function displayFilms(films) {
    const container = document.getElementById('filmContainer');
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
    sortFilmsByRanking(); // Sort after reset
    displayFilms(filteredFilms);
}

window.applyFilters = applyFilters;
window.resetFilters = resetFilters;
window.performSearch = applyFilters;
