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
 * Populates dynamic filters (select dropdowns) based on available data.
 */
function populateFilters() {
    const genres = new Set();
    const years = new Set();
    const countries = new Set();
    const ratings = new Set();
    const audiences = new Set();
    const targetGroupOthers = new Set();
    const keywords = new Set();
    const lengths = new Set();

    allFilms.forEach(filmData => {
        if (!filmData || !filmData.Film) return;

        if (filmData.Film.Genre_List) {
            filmData.Film.Genre_List.forEach(genre => genres.add(genre.trim()));
        }

        if (filmData.Film.Date_of_completion) {
            const date = new Date(filmData.Film.Date_of_completion);
            if (!isNaN(date.getFullYear())) {
                years.add(date.getFullYear().toString());
            }
        } else if (filmData.Premiere && filmData.Premiere[0] && filmData.Premiere[0].Date) {
            const date = new Date(filmData.Premiere[0].Date);
            if (!isNaN(date.getFullYear())) {
                years.add(date.getFullYear().toString());
            }
        }

        if (filmData.Film.Country_of_production) {
            filmData.Film.Country_of_production.split(',').forEach(country => countries.add(country.trim()));
        }

        if (filmData.Film.Film_rating) {
            filmData.Film.Film_rating.split(',').forEach(rating => ratings.add(rating.trim()));
        }

        if (filmData.Film.Audience_target_group) {
            filmData.Film.Audience_target_group.split(',').forEach(audience => audiences.add(audience.trim()));
        }

        if (filmData.Film.Target_group_other) {
            filmData.Film.Target_group_other.split(',').forEach(other => targetGroupOthers.add(other.trim()));
        }

        if (filmData.Film.Keywords) {
            filmData.Film.Keywords.split(',').forEach(keyword => keywords.add(keyword.trim()));
        }

        if (filmData.Film.Runtime) {
            const lengthCategory = getRoundedRuntime(filmData.Film.Runtime);
            if (lengthCategory) {
                lengths.add(lengthCategory);
            }
        }
    });

    // Function to generate <select> and <option>
    const generateSelectOptions = (id, items, defaultText) => {
        const selectElement = document.getElementById(id);
        if (!selectElement) return;

        selectElement.innerHTML = `<option value="">${defaultText}</option>`; // Add default option

        // Define a custom sort order for lengths
        const lengthOrder = ['short', 'mid-length', 'full-length'];

        const sortedItems = [...items].filter(item => item && item !== 'N/A').sort((a, b) => {
            if (id === 'yearFilter') return parseInt(b, 10) - parseInt(a, 10); // Years descending
            if (id === 'lengthFilter') return lengthOrder.indexOf(a) - lengthOrder.indexOf(b); // Custom order for lengths
            return a.localeCompare(b); // Others alphabetically
        });

        sortedItems.forEach(item => {
            const option = document.createElement('option');
            option.value = item;
            // Capitalize the first letter for display
            option.textContent = item.charAt(0).toUpperCase() + item.slice(1);
            selectElement.appendChild(option);
        });
    };

    generateSelectOptions('genresFilter', genres, 'All Genres');
    generateSelectOptions('lengthFilter', lengths, 'All Lengths');
    generateSelectOptions('yearFilter', years, 'All Years');
    generateSelectOptions('countryFilter', countries, 'All Countries');
    generateSelectOptions('ratingFilter', ratings, 'All Ratings');
    generateSelectOptions('audienceFilter', audiences, 'All Audiences');
    generateSelectOptions('targetGroupOtherFilter', targetGroupOthers, 'Other');
    generateSelectOptions('keywordsFilter', keywords, 'All Themes');
}

/**
 * Applies selected filters to the film list and updates the display.
 */
function applyFilters() {
    let currentFilms = [...allFilms];

    // Get selected values from dropdowns
    const getSelectedValue = (id) => {
        const selectElement = document.getElementById(id);
        return selectElement ? selectElement.value : '';
    };

    const selectedGenre = getSelectedValue('genresFilter');
    const selectedYear = getSelectedValue('yearFilter');
    const selectedCountry = getSelectedValue('countryFilter');
    const selectedRating = getSelectedValue('ratingFilter');
    const selectedAudience = getSelectedValue('audienceFilter');
    const selectedTargetGroupOther = getSelectedValue('targetGroupOtherFilter');
    const selectedKeyword = getSelectedValue('keywordsFilter');
    const selectedLength = getSelectedValue('lengthFilter');


    filteredFilms = currentFilms.filter(filmData => {
        if (!filmData || !filmData.Film) return false;

        let passesAllFilters = true;

        // Genre filter (for dropdown - compares if film contains the selected genre)
        if (selectedGenre) {
            const filmGenres = filmData.Film.Genre_List || [];
            passesAllFilters = passesAllFilters && filmGenres.includes(selectedGenre);
        }

        // Year filter
        if (selectedYear) {
            let filmYear = '';
            if (filmData.Film.Date_of_completion) {
                const date = new Date(filmData.Film.Date_of_completion);
                if (!isNaN(date.getFullYear())) {
                    filmYear = date.getFullYear().toString();
                }
            } else if (filmData.Premiere && filmData.Premiere[0] && filmData.Premiere[0].Date) {
                const date = new Date(filmData.Premiere[0].Date);
                if (!isNaN(date.getFullYear())) {
                    filmYear = date.getFullYear().toString();
                }
            }
            passesAllFilters = passesAllFilters && (filmYear === selectedYear);
        }

        // Country filter
        if (selectedCountry) {
            const filmCountries = filmData.Film.Country_of_production ? filmData.Film.Country_of_production.split(',').map(c => c.trim()) : [];
            passesAllFilters = passesAllFilters && filmCountries.includes(selectedCountry);
        }

        // Rating filter
        if (selectedRating) {
            const filmRatings = filmData.Film.Film_rating ? filmData.Film.Film_rating.split(',').map(r => r.trim()) : [];
            passesAllFilters = passesAllFilters && filmRatings.includes(selectedRating);
        }

        // Audience filter
        if (selectedAudience) {
            const filmAudiences = filmData.Film.Audience_target_group ? filmData.Film.Audience_target_group.split(',').map(a => a.trim()) : [];
            passesAllFilters = passesAllFilters && filmAudiences.includes(selectedAudience);
        }

        // Target Group Other filter
        if (selectedTargetGroupOther) {
            const filmTargetGroupOthers = filmData.Film.Target_group_other ? filmData.Film.Target_group_other.split(',').map(o => o.trim()) : [];
            passesAllFilters = passesAllFilters && filmTargetGroupOthers.includes(selectedTargetGroupOther);
        }

        // Keywords filter (Themes)
        if (selectedKeyword) {
            const filmKeywords = filmData.Film.Keywords ? filmData.Film.Keywords.split(',').map(k => k.trim()) : [];
            passesAllFilters = passesAllFilters && filmKeywords.includes(selectedKeyword);
        }

        // Length filter
        if (selectedLength) {
            const filmLengthCategory = getRoundedRuntime(filmData.Film.Runtime);
            passesAllFilters = passesAllFilters && (filmLengthCategory === selectedLength);
        }

        return passesAllFilters;
    });

    performSearch(false);
}


/**
 * Performs text search in the film list.
 * @param {boolean} resetFiltersBeforeSearch If true, filters are reset before searching.
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
        const keywords = getText(filmData.Film.Keywords); // Restored to searchable text

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

        let roundedRuntimeSearch = getRoundedRuntime(filmData.Film.Runtime); // Restored to searchable text

        // Added logline to searchable text
        const logline = getText(filmData.Film.Logline);

        // Updated searchableText to include all filter terms and logline
        const searchableText = `${englishTitle} ${originalTitle} ${genres} ${keywords} ${releaseInfo} ${runtime} ${language} ${country} ${festivals} ${director} ${writer} ${cinematographer} ${editor} ${musicComposer} ${soundDirector} ${producerName} ${companyName} ${cast} ${soundMix} ${aspectRatio} ${color} ${roundedRuntimeSearch} ${logline}`;

        return searchableText.includes(searchTerm);
    });

    filteredFilms = searchResults;
    displayFilms(filteredFilms);
}


/**
 * Displays films in the container on the page.
 * @param {Array<Object>} films Array of film data to display.
 */
function displayFilms(films) {
    const container = document.getElementById('filmContainer');
    if (!container) return;
    container.innerHTML = ''; // Clear the container

    if (films.length === 0) {
        container.innerHTML = '<p class="no-results">No films found matching the selected criteria.</p>';
        return;
    }

    // Create a list for film titles
    const filmList = document.createElement('ul');
    filmList.classList.add('film-name-list'); // Add class for list styling

    films.forEach(filmData => {
        if (!filmData || !filmData.Film) {
            console.warn('Skipped invalid film data:', filmData);
            return;
        }

        const englishTitle = filmData.Film.Title_English || filmData.Film.Title_Original || 'Unknown Title';
        const originalTitle = filmData.Film.Title_Original || '';
        const displayTitle = englishTitle !== 'Unknown Title' ? englishTitle : originalTitle;

        let filmYear = '';
        if (filmData.Film.Date_of_completion) {
            const date = new Date(filmData.Film.Date_of_completion);
            if (!isNaN(date.getFullYear())) {
                filmYear = date.getFullYear().toString();
            }
        } else if (filmData.Premiere && filmData.Premiere[0] && filmData.Premiere[0].Date) {
            const date = new Date(filmData.Premiere[0].Date);
            if (!isNaN(date.getFullYear())) {
                filmYear = date.getFullYear().toString();
            }
        }

        let filmDuration = '';
        if (filmData.Film.Runtime) {
            const parts = filmData.Film.Runtime.split(':');
            if (parts.length >= 2) {
                const hours = parseInt(parts[0], 10);
                const minutes = parseInt(parts[1], 10);
                if (!isNaN(hours) && !isNaN(minutes)) {
                    filmDuration = (hours * 60 + minutes) + ' min';
                }
            }
        }

        let filenameBase;
        if (filmData.Film.ID) {
            filenameBase = String(filmData.Film.ID);
        } else if (filmData.Film.Title_English) {
            filenameBase = filmData.Film.Title_English
                .replace(/[^\w\s]/gi, '')
                .replace(/\s+/g, '_')
                .toLowerCase();
        } else if (filmData.Film.Title_Original) {
            filenameBase = filmData.Film.Title_Original
                .replace(/[^\w\s]/gi, '')
                .replace(/\s+/g, '_')
                .toLowerCase();
        } else {
            console.warn('Could not derive a filename for film:', filmData);
            return;
        }

        const filmDetailUrl = `generated_film_pages/${filenameBase}.html`;

        const listItem = document.createElement('li');

        const titleAndMetaDiv = document.createElement('div');
        titleAndMetaDiv.classList.add('film-title-meta');

        const filmLink = document.createElement('a');
        filmLink.href = filmDetailUrl;

        // Construct the display text: Name | Year | Duration
        let displayText = displayTitle;
        if (filmYear) {
            displayText += ` | ${filmYear}`;
        }
        if (filmDuration) {
            displayText += ` | ${filmDuration}`;
        }
        filmLink.textContent = displayText;
        titleAndMetaDiv.appendChild(filmLink);

        // Add the image
        const filmImage = document.createElement('img');
        const imagePath = `images/stills/${filenameBase}/${filenameBase}_1.png`;

        filmImage.src = imagePath;
        filmImage.alt = `${displayTitle} Still`;
        filmImage.classList.add('film-still');
        filmImage.onerror = function() {
            // Fallback to a placeholder image if the specific image is not found
            this.src = 'assets/images/placeholder.png';
        };
        titleAndMetaDiv.appendChild(filmImage);

        // Add the logline
        const loglineParagraph = document.createElement('p');
        loglineParagraph.classList.add('film-logline');
        loglineParagraph.textContent = filmData.Film.Logline || 'No logline available.'; // Assuming Film.Logline holds the logline
        titleAndMetaDiv.appendChild(loglineParagraph);

        listItem.appendChild(titleAndMetaDiv); // Append the div containing link, image, and logline
        filmList.appendChild(listItem);
    });

    container.appendChild(filmList);
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
window.performSearch = performSearch;
window.resetFilters = resetFilters;