let allFilms = [];
let filteredFilms = [];

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('filmContainer')) {
        fetchData();
        document.getElementById('searchInput')?.addEventListener('input', applyFilters);
        ['genresFilter', 'yearFilter', 'lengthFilter', 'countryFilter', 'ratingFilter', 'audienceFilter', 'keywordsFilter'].forEach(id =>
            document.getElementById(id)?.addEventListener('change', applyFilters)
        );
        document.querySelector('.clear-filters-btn')?.addEventListener('click', () => resetFilters(true));
    }
});

async function fetchData() {
    try {
        const response = await fetch('extracted_data/all_html_data.json');
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        allFilms = await response.json();

        allFilms.forEach(film => {
            film.ParsedRanking = parseInt(film.Ranking, 10);
            if (isNaN(film.ParsedRanking)) film.ParsedRanking = Infinity;
        });

        filteredFilms = [...allFilms];
        sortFilmsByRanking();
        populateAllFiltersInitial();
        displayFilms(filteredFilms);
    } catch (error) {
        console.error('Error fetching data:', error);
        const container = document.getElementById('filmContainer');
        if (container) container.innerHTML = '<p>Failed to load film data. Please try again later.</p>';
    }
}

function getRoundedRuntime(runtimeString) {
    if (!runtimeString || typeof runtimeString !== 'string') return null;
    const parts = runtimeString.split(':').map(Number);
    if (parts.length < 2) return null;
    const totalMinutes = parts[0] * 60 + parts[1] + (parts[2] >= 40 ? 1 : 0);
    if (totalMinutes < 40) return "short";
    if (totalMinutes <= 70) return "mid-length";
    return "full-length";
}

function populateAllFiltersInitial() {
    const genres = new Set(), years = new Set(), lengths = new Set(),
          countries = new Set(), ratings = new Set(), audiences = new Set(), keywords = new Set();

    allFilms.forEach(film => {
        const f = film.Film || {};
        f.Genre_List?.forEach(g => genres.add(g.trim()));
        const yearMatch = f.Date_of_completion?.match(/\b\d{4}\b/);
        if (yearMatch) years.add(yearMatch[0]);
        const lengthCategory = getRoundedRuntime(f.Runtime);
        if (lengthCategory) lengths.add(lengthCategory);
        if (f.Country_of_production) countries.add(f.Country_of_production.trim());
        if (f.Target_Group?.Rating) ratings.add(f.Target_Group.Rating.trim());
        if (f.Target_Group?.Audience) audiences.add(f.Target_Group.Audience.trim());
        f.Keywords?.split(',').forEach(k => keywords.add(k.trim()));
    });

    populateSelect('genresFilter', Array.from(genres).sort());
    populateSelect('yearFilter', Array.from(years).sort((a, b) => b - a));
    populateSelect('lengthFilter', ['short', 'mid-length', 'full-length']);
    populateSelect('countryFilter', Array.from(countries).sort());
    populateSelect('ratingFilter', Array.from(ratings).sort());
    populateSelect('audienceFilter', Array.from(audiences).sort());
    populateSelect('keywordsFilter', Array.from(keywords).sort());
}

function populateSelect(selectId, options, selectedValue = '') {
    const select = document.getElementById(selectId);
    if (!select) return;

    const labels = {
        genresFilter: 'Genre',
        yearFilter: 'Year',
        lengthFilter: 'Length',
        countryFilter: 'Country',
        ratingFilter: 'Rating',
        audienceFilter: 'Audience',
        keywordsFilter: 'Themes'
    };

    select.innerHTML = `<option value="" disabled ${!selectedValue ? 'selected' : ''}>${labels[selectId]}</option>`;
    options.forEach(opt => {
        const el = document.createElement('option');
        el.value = opt;
        el.textContent = opt;
        if (opt.toLowerCase() === selectedValue?.toLowerCase()) el.selected = true;
        select.appendChild(el);
    });

    select.disabled = options.length === 0;
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
    const currentValues = getCurrentFilterValues();

    const filtersConfig = [
        { id: 'genresFilter', key: 'genre', path: film => film.Film?.Genre_List?.map(g => g.trim()), sort: arr => arr.sort() },
        { id: 'yearFilter', key: 'year', path: film => film.Film?.Date_of_completion?.match(/\b\d{4}\b/)?.[0], sort: arr => arr.sort((a, b) => b - a) },
        { id: 'lengthFilter', key: 'length', path: film => getRoundedRuntime(film.Film?.Runtime), sort: arr => ['short', 'mid-length', 'full-length'].filter(c => arr.includes(c)) },
        { id: 'countryFilter', key: 'country', path: film => film.Film?.Country_of_production?.trim(), sort: arr => arr.sort() },
        { id: 'ratingFilter', key: 'rating', path: film => film.Film?.Target_Group?.Rating?.trim(), sort: arr => arr.sort() },
        { id: 'audienceFilter', key: 'audience', path: film => film.Film?.Target_Group?.Audience?.trim(), sort: arr => arr.sort() },
        { id: 'keywordsFilter', key: 'keywords', path: film => film.Film?.Keywords?.split(',').map(k => k.trim()), sort: arr => arr.sort() }
    ];

    filtersConfig.forEach(({ id, key, path, sort }) => {
        const unique = new Set();

        const relevantFilms = allFilms.filter(film => {
            const f = film.Film || {};
            const c = film.Crew || {};
            const matchSearch = !currentValues.searchTerm ||
                `${f.Title_English || ''} ${f.Title_Original || ''} ${film.Logline || ''} ${film.Synopsis || ''} ${c['Director(s)'] || ''}`
                    .toLowerCase().includes(currentValues.searchTerm);

            const matchesAllOtherFilters = filtersConfig.every(cfg => {
                if (cfg.id === id) return true;
                const val = currentValues[cfg.key];
                if (!val) return true;

                const values = cfg.path(film);
                if (Array.isArray(values)) return values.some(v => v?.toLowerCase() === val);
                return values?.toLowerCase() === val;
            });

            return matchSearch && matchesAllOtherFilters;
        });

        relevantFilms.forEach(film => {
            const values = path(film);
            if (Array.isArray(values)) values.forEach(v => v && unique.add(v));
            else if (values) unique.add(values);
        });

        populateSelect(id, sort(Array.from(unique)), currentValues[key]);
    });
}

function applyFilters() {
    const filters = getCurrentFilterValues();

    filteredFilms = allFilms.filter(film => {
        const f = film.Film || {};
        const c = film.Crew || {};
        const year = f.Date_of_completion?.match(/\b\d{4}\b/)?.[0] || '';
        const genres = f.Genre_List?.map(g => g.toLowerCase()) || [];
        const runtime = getRoundedRuntime(f.Runtime);
        const country = f.Country_of_production?.toLowerCase() || '';
        const rating = f.Target_Group?.Rating?.toLowerCase() || '';
        const audience = f.Target_Group?.Audience?.toLowerCase() || '';
        const keywords = f.Keywords?.split(',').map(k => k.trim().toLowerCase()) || [];

        const matches = [
            !filters.searchTerm || `${f.Title_English || ''} ${f.Title_Original || ''} ${film.Logline || ''} ${film.Synopsis || ''} ${c['Director(s)'] || ''}`.toLowerCase().includes(filters.searchTerm),
            !filters.genre || genres.includes(filters.genre),
            !filters.year || year === filters.year,
            !filters.length || runtime === filters.length,
            !filters.country || country === filters.country,
            !filters.rating || rating === filters.rating,
            !filters.audience || audience === filters.audience,
            !filters.keywords || keywords.includes(filters.keywords)
        ];

        return matches.every(Boolean);
    });

    sortFilmsByRanking();
    displayFilms(filteredFilms);
    updateDependentFilterOptions();
}

function sortFilmsByRanking() {
    filteredFilms.sort((a, b) => a.ParsedRanking - b.ParsedRanking);
}

function displayFilms(films) {
    const container = document.getElementById('filmContainer');
    if (!container) return;
    container.innerHTML = '';

    films.forEach(film => {
        const f = film.Film || {};
        const c = film.Crew || {};
        const folder = film.Source_File?.replace(/\.html$/, '').toLowerCase();
        const displayTitle = (f.Title_English || f.Title_Original || 'Untitled').trim();
        const year = f.Date_of_completion?.match(/\b\d{4}\b/)?.[0] || '';
        const runtime = f.Runtime?.split(':').map(Number);
        const totalMinutes = (runtime?.[0] || 0) * 60 + (runtime?.[1] || 0) + ((runtime?.[2] || 0) >= 40 ? 1 : 0);
        const director = c['Director(s)'] || 'Unknown Director';
        const logline = film.Logline || '';

        const link = document.createElement('a');
        link.href = `film_pages/${folder}.html`;
        link.classList.add('preview-item-link');

        const card = document.createElement('div');
        card.classList.add('preview-item');

        const titleEl = document.createElement('h3');
        titleEl.classList.add('film-card-title-meta');
        titleEl.textContent = `${displayTitle}${year ? ' | ' + year : ''}${totalMinutes ? ' | ' + totalMinutes + ' min' : ''}`;
        card.appendChild(titleEl);

        const dirEl = document.createElement('p');
        dirEl.classList.add('film-card-director');
        dirEl.textContent = `by ${director}`;
        card.appendChild(dirEl);

        const imgWrapper = document.createElement('div');
        imgWrapper.classList.add('news-item-image-wrapper');
        const img = document.createElement('img');
        img.src = `images/stills/${folder}/${folder}_1.jpg`;
        img.alt = `Still from ${displayTitle}`;
        imgWrapper.appendChild(img);
        card.appendChild(imgWrapper);

        const loglineEl = document.createElement('p');
        loglineEl.classList.add('news-item-description');
        loglineEl.textContent = logline;
        card.appendChild(loglineEl);

        link.appendChild(card);
        container.appendChild(link);
    });
}

function resetFilters(clearSearch = true) {
    document.querySelectorAll('.filter-group select').forEach(sel => sel.selectedIndex = 0);
    if (clearSearch) document.getElementById('searchInput').value = '';
    filteredFilms = [...allFilms];
    sortFilmsByRanking();
    displayFilms(filteredFilms);
    updateDependentFilterOptions();
}

window.applyFilters = applyFilters;
window.resetFilters = resetFilters;
window.performSearch = applyFilters;

