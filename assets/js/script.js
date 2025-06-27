let allFilms = []; // Zde se uloží všechna data z JSON
let filteredFilms = []; // Zde se uloží filtrované filmy pro zobrazení

document.addEventListener('DOMContentLoaded', () => {
    // Ověříme, zda jsme na stránce katalogu
    if (document.getElementById('filmContainer')) {
        fetchData();
    }
});

async function fetchData() {
    try {
        const response = await fetch('extracted_data/all_html_data.json');
        if (!response.ok) {
            throw new Error(`HTTP chyba! Status: ${response.status}`);
        }
        allFilms = await response.json();
        filteredFilms = [...allFilms];
        populateFilters();
        displayFilms(filteredFilms);
    } catch (error) {
        console.error('Chyba při načítání dat:', error);
        const filmContainer = document.getElementById('filmContainer');
        if (filmContainer) {
            filmContainer.innerHTML = '<p>Nepodařilo se načíst data filmů. Zkuste to prosím později.</p>';
        }
    }
}

/**
 * Zaokrouhlí runtime filmu na celou minutu (do 0:40 dolů, nad 0:40 nahoru)
 * a vrátí kategorii délky.
 * @param {string} runtimeString Např. "00:24:34"
 * @returns {string|null} "short", "mid-length", "full-length" nebo null
 */
function getRoundedRuntime(runtimeString) {
    if (!runtimeString || typeof runtimeString !== 'string') return null;
    const parts = runtimeString.split(':');
    if (parts.length < 3) return null;

    let hours = parseInt(parts[0], 10);
    let minutes = parseInt(parts[1], 10);
    let seconds = parseInt(parts[2], 10);

    if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) return null;

    if (seconds >= 40) {
        minutes++;
    }

    let totalMinutes = hours * 60 + minutes;

    if (totalMinutes <= 30) {
        return 'short';
    } else if (totalMinutes > 30 && totalMinutes <= 60) {
        return 'mid-length';
    } else {
        return 'full-length';
    }
}

/**
 * Naplní dynamické filtry (select dropdowny) na základě dostupných dat.
 */
function populateFilters() {
    const genres = new Set();
    const years = new Set();
    const countries = new Set();
    const ratings = new Set();
    const audiences = new Set();
    const targetGroupOthers = new Set();
    const keywords = new Set();

    allFilms.forEach(filmData => {
        if (!filmData || !filmData.Film) return;

        if (filmData.Film.Genre_List) {
            filmData.Film.Genre_List.forEach(genre => genres.add(genre.trim()));
        }

        let filmYear = null;
        if (filmData.Film.Date_of_completion) {
            const date = new Date(filmData.Film.Date_of_completion);
            if (!isNaN(date.getFullYear())) {
                filmYear = date.getFullYear().toString();
            }
        }
        if (!filmYear && filmData.Premiere && filmData.Premiere[0] && filmData.Premiere[0].Date) {
            const date = new Date(filmData.Premiere[0].Date);
            if (!isNaN(date.getFullYear())) {
                filmYear = date.getFullYear().toString();
            }
        }
        if (filmYear) years.add(filmYear);


        if (filmData.Film.Country_of_production) {
            filmData.Film.Country_of_production.split(',').forEach(country => countries.add(country.trim()));
        }

        if (filmData.Film.Target_Group) {
            if (filmData.Film.Target_Group.Rating) ratings.add(filmData.Film.Target_Group.Rating.trim());
            if (filmData.Film.Target_Group.Audience) audiences.add(filmData.Film.Target_Group.Audience.trim());
            if (filmData.Film.Target_Group.Other) targetGroupOthers.add(filmData.Film.Target_Group.Other.trim());
        }

        if (filmData.Film.Keywords) {
            filmData.Film.Keywords.split(',').forEach(keyword => keywords.add(keyword.trim()));
        }
    });

    // Funkce pro generování <select> a <option>
    const generateSelectOptions = (id, items, defaultText) => {
        const selectElement = document.getElementById(id);
        if (!selectElement) return;

        selectElement.innerHTML = `<option value="">${defaultText}</option>`; // Přidat výchozí volbu

        const sortedItems = [...items].filter(item => item && item !== 'N/A').sort((a, b) => {
            if (id === 'yearFilter') return parseInt(b, 10) - parseInt(a, 10); // Roky sestupně
            return a.localeCompare(b); // Ostatní abecedně
        });

        sortedItems.forEach(item => {
            const option = document.createElement('option');
            option.value = item;
            option.textContent = item;
            selectElement.appendChild(option);
        });
    };

    generateSelectOptions('genresFilter', genres, 'Všechny žánry');
    generateSelectOptions('yearFilter', years, 'Všechny roky');
    generateSelectOptions('countryFilter', countries, 'Všechny země');
    generateSelectOptions('ratingFilter', ratings, 'Všechny ratingy');
    generateSelectOptions('audienceFilter', audiences, 'Všechna publika');
    generateSelectOptions('targetGroupOtherFilter', targetGroupOthers, 'Ostatní');
    generateSelectOptions('keywordsFilter', keywords, 'Všechna témata');
}

/**
 * Aplikuje vybrané filtry na seznam filmů a aktualizuje zobrazení.
 */
function applyFilters() {
    let currentFilms = [...allFilms];

    // Získání vybraných hodnot z dropdownů
    const getSelectedValue = (id) => {
        const selectElement = document.getElementById(id);
        return selectElement ? selectElement.value : '';
    };

    // Získání vybraných hodnot z checkboxů (pro runtime)
    const getSelectedCheckboxes = (id) => {
        return Array.from(document.querySelectorAll(`#${id} input[type="checkbox"]:checked`)).map(cb => cb.value);
    };

    const selectedGenre = getSelectedValue('genresFilter');
    const selectedYear = getSelectedValue('yearFilter');
    const selectedCountry = getSelectedValue('countryFilter');
    const selectedRating = getSelectedValue('ratingFilter');
    const selectedAudience = getSelectedValue('audienceFilter');
    const selectedTargetGroupOther = getSelectedValue('targetGroupOtherFilter');
    const selectedKeyword = getSelectedValue('keywordsFilter'); // Pro dropdown je to jedna hodnota
    const selectedRuntimes = getSelectedCheckboxes('runtimeFilter'); // Toto zůstává pole z checkboxů


    filteredFilms = currentFilms.filter(filmData => {
        if (!filmData || !filmData.Film) return false;

        let passesAllFilters = true;

        // Filtr žánrů (pro dropdown - porovnáváme, zda film obsahuje vybraný žánr)
        if (selectedGenre) {
            const filmGenres = filmData.Film.Genre_List || [];
            passesAllFilters = passesAllFilters && filmGenres.includes(selectedGenre);
        }

        // Filtr roku
        if (selectedYear) {
            let filmYear = null;
            if (filmData.Film.Date_of_completion) {
                const date = new Date(filmData.Film.Date_of_completion);
                if (!isNaN(date.getFullYear())) filmYear = date.getFullYear().toString();
            }
            if (!filmYear && filmData.Premiere && filmData.Premiere[0] && filmData.Premiere[0].Date) {
                const date = new Date(filmData.Premiere[0].Date);
                if (!isNaN(date.getFullYear())) filmYear = date.getFullYear().toString();
            }
            passesAllFilters = passesAllFilters && (filmYear === selectedYear);
        }

        // Filtr země produkce (pro dropdown)
        if (selectedCountry) {
            const filmCountries = filmData.Film.Country_of_production ? filmData.Film.Country_of_production.split(',').map(c => c.trim()) : [];
            passesAllFilters = passesAllFilters && filmCountries.includes(selectedCountry);
        }

        // Filtr cílové skupiny (Rating)
        if (selectedRating) {
            passesAllFilters = passesAllFilters && (filmData.Film.Target_Group && filmData.Film.Target_Group.Rating === selectedRating);
        }
        // Filtr cílové skupiny (Audience)
        if (selectedAudience) {
            passesAllFilters = passesAllFilters && (filmData.Film.Target_Group && filmData.Film.Target_Group.Audience === selectedAudience);
        }
        // Filtr cílové skupiny (Other)
        if (selectedTargetGroupOther) {
            passesAllFilters = passesAllFilters && (filmData.Film.Target_Group && filmData.Film.Target_Group.Other === selectedTargetGroupOther);
        }

        // Filtr klíčových slov (Keywords - pro dropdown)
        if (selectedKeyword) {
            const filmKeywords = filmData.Film.Keywords ? filmData.Film.Keywords.split(',').map(k => k.trim()) : [];
            passesAllFilters = passesAllFilters && filmKeywords.includes(selectedKeyword);
        }

        // Filtr délky (používá stále checkboxy)
        if (selectedRuntimes.length > 0) {
            const filmRuntimeCategory = getRoundedRuntime(filmData.Film.Runtime);
            passesAllFilters = passesAllFilters && selectedRuntimes.includes(filmRuntimeCategory);
        }

        return passesAllFilters;
    });

    performSearch(false);
}


/**
 * Provede textové vyhledávání v seznamu filmů.
 * @param {boolean} resetFiltersBeforeSearch Pokud je true, filtry se resetují před vyhledáváním.
 */
function performSearch(resetFiltersBeforeSearch = true) {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();

    if (resetFiltersBeforeSearch) {
        resetFilters(false);
    }

    let filmsToSearch = resetFiltersBeforeSearch ? [...allFilms] : [...filteredFilms];

    if (searchTerm === '') {
        displayFilms(filmsToSearch);
        filteredFilms = filmsToSearch;
        return;
    }

    const searchResults = filmsToSearch.filter(filmData => {
        if (!filmData || !filmData.Film) return false;

        const getText = (value) => (value ? String(value).toLowerCase() : '');
        const getArrayText = (arr) => (Array.isArray(arr) ? arr.map(item => getText(item)).join(' ') : '');

        const englishTitle = getText(filmData.Film.Title_English);
        const originalTitle = getText(filmData.Film.Title_Original);
        const genres = getArrayText(filmData.Film.Genre_List);
        const keywords = getText(filmData.Film.Keywords);

        let releaseInfo = '';
        if (filmData.Film.Date_of_completion) {
            releaseInfo = getText(new Date(filmData.Film.Date_of_completion).getFullYear());
        }
        if (filmData.Premiere && filmData.Premiere[0] && filmData.Premiere[0].Date) {
            releaseInfo += ' ' + getText(new Date(filmData.Premiere[0].Date).getFullYear());
        }

        const runtime = getText(filmData.Film.Runtime);
        const language = getText(filmData.Film.Language_Original);
        const country = getText(filmData.Film.Country_of_production);

        let festivals = '';
        if (filmData.Festivals) {
            festivals = getArrayText(filmData.Festivals.map(f => f.Name_of_Festival));
        }

        const director = getArrayText(filmData.Crew && filmData.Crew['Director(s)'] ? filmData.Crew['Director(s)'].split(',').map(d => d.trim()) : []);
        const writer = getArrayText(filmData.Crew && filmData.Crew['Screenplay_writer(s)'] ? filmData.Crew['Screenplay_writer(s)'].split(',').map(w => w.trim()) : []);
        const cinematographer = getArrayText(filmData.Crew && filmData.Crew['Director(s)_of_Photography'] ? filmData.Crew['Director(s)_of_Photography'].split(',').map(c => c.trim()) : []);
        const editor = getArrayText(filmData.Crew && filmData.Crew.Editor_s ? filmData.Crew.Editor_s.split(',').map(e => e.trim()) : []);
        const musicComposer = getArrayText(filmData.Crew && filmData.Crew['Music_composer(s)'] ? filmData.Crew['Music_composer(s)'].split(',').map(m => m.trim()) : []);
        const soundDirector = getArrayText(filmData.Crew && filmData.Crew['Sound_director(s)'] ? filmData.Crew['Sound_director(s)'].split(',').map(s => s.trim()) : []);

        const producerName = getText(filmData.Production && filmData.Production.Producers ? filmData.Production.Producers.Name : '');
        const companyName = getText(filmData.Production && filmData.Production.Production_Company ? filmData.Production.Production_Company.Name : '');
        const cast = getArrayText(filmData.Crew && filmData.Crew.Cast ? filmData.Crew.Cast : []);

        const soundMix = getText(filmData.Technical_Details && filmData.Technical_Details.Sound_Mix);
        const aspectRatio = getText(filmData.Technical_Details && filmData.Technical_Details.Aspect_Ratio);
        const color = getText(filmData.Technical_Details && filmData.Technical_Details.Colour);

        let roundedRuntimeSearch = getRoundedRuntime(filmData.Film.Runtime);


        const searchableText = `${englishTitle} ${originalTitle} ${genres} ${keywords} ${releaseInfo} ${runtime} ${language} ${country} ${festivals} ${director} ${writer} ${cinematographer} ${editor} ${musicComposer} ${soundDirector} ${producerName} ${companyName} ${cast} ${roundedRuntimeSearch} ${soundMix} ${aspectRatio} ${color}`;

        return searchableText.includes(searchTerm);
    });

    filteredFilms = searchResults;
    displayFilms(filteredFilms);
}


/**
 * Zobrazí filmy v kontejneru na stránce.
 * @param {Array<Object>} films Pole filmových dat k zobrazení.
 */
function displayFilms(films) {
    const container = document.getElementById('filmContainer');
    if (!container) return;
    container.innerHTML = '';

    if (films.length === 0) {
        container.innerHTML = '<p class="no-results">Nenalezeny žádné filmy odpovídající vybraným kritériím.</p>';
        return;
    }

    films.forEach(filmData => {
        if (!filmData || !filmData.Film) {
            console.warn('Přeskočena neplatná data filmu:', filmData);
            return;
        }

        const filmCard = document.createElement('div');
        filmCard.classList.add('film-card');

        const getDisplayValue = (value, defaultValue = 'Neznámý') => {
            if (Array.isArray(value)) {
                return value.length > 0 ? value.join(', ') : defaultValue;
            }
            return value || defaultValue;
        };

        const director = getDisplayValue(filmData.Crew && filmData.Crew['Director(s)'], 'Neznámý');
        const englishTitle = getDisplayValue(filmData.Film.Title_English);
        const originalTitle = getDisplayValue(filmData.Film.Title_Original);
        const genres = getDisplayValue(filmData.Film.Genre_List);
        const runtime = getDisplayValue(filmData.Film.Runtime);
        const country = getDisplayValue(filmData.Film.Country_of_production);
        const logline = getDisplayValue(filmData.Logline, 'Není k dispozici');

        let completionYear = 'Neznámý';
        if (filmData.Film.Date_of_completion) {
            const date = new Date(filmData.Film.Date_of_completion);
            if (!isNaN(date.getFullYear())) {
                completionYear = date.getFullYear().toString();
            }
        } else if (filmData.Premiere && filmData.Premiere[0] && filmData.Premiere[0].Date) {
             const date = new Date(filmData.Premiere[0].Date);
            if (!isNaN(date.getFullYear())) {
                completionYear = date.getFullYear().toString();
            }
        }

        filmCard.innerHTML = `
            <h3>${englishTitle !== 'Neznámý' ? englishTitle : originalTitle}</h3>
            ${englishTitle !== originalTitle && originalTitle !== 'Neznámý' ? `<p><strong>Originální název:</strong> ${originalTitle}</p>` : ''}
            <p><strong>Žánr:</strong> ${genres}</p>
            <p><strong>Délka:</strong> ${runtime}</p>
            <p><strong>Země produkce:</strong> ${country}</p>
            <p><strong>Režie:</strong> ${director}</p>
            <p><strong>Rok:</strong> ${completionYear}</p>
            <p><strong>Logline:</strong> ${logline}</p>
        `;
        container.appendChild(filmCard);
    });
}

/**
 * Resetuje všechny filtry a volitelně vyčistí vyhledávací pole.
 * @param {boolean} clearSearch Pokud je true, vyčistí se vyhledávací pole.
 */
function resetFilters(clearSearch = true) {
    // Resetovat všechny dropdowny
    const selects = document.querySelectorAll('.filters select');
    selects.forEach(sel => sel.value = '');

    // Odznačit všechny checkboxy (pro runtime)
    const checkboxes = document.querySelectorAll('#runtimeFilter input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = false);

    // Vyčistit vyhledávací pole, pokud je nastaveno
    if (clearSearch) {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) searchInput.value = '';
    }

    // Znovu zobrazit všechny filmy
    filteredFilms = [...allFilms];
    displayFilms(filteredFilms);
}

// Zpřístupnění funkcí v globálním scope pro HTML onchange/onclick
window.applyFilters = applyFilters;
window.performSearch = performSearch;
window.resetFilters = resetFilters;