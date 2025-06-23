import json
import os
import re

# Define paths
json_file_path = r'extracted_data\all_html_data.json'
output_folder = 'generated_film_pages'
index_file_name = 'index.html'

# Create output directory if it doesn't exist
os.makedirs(output_folder, exist_ok=True)

# HTML Template (updated to match the last design and use f-strings for Python)
# This template will be filled dynamically for each film
html_template = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{film_title_english} - Film Details</title>
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;600;700&family=Open+Sans:wght@300;400;600&display=swap" rel="stylesheet">
    <style>
        :root {{
            --dark-bg: #1a1a1a;
            --card-bg: #222222;
            --text-light: #f0f0f0;
            --text-muted: #aaaaaa;
            --accent-gold: #ffcc00;
            --accent-blue: #00ccff;
        }}

        body {{
            background-color: var(--dark-bg);
            color: var(--text-light);
            font-family: 'Open Sans', sans-serif;
            margin: 0;
            padding: 0;
            line-height: 1.6;
        }}

        /* START: Logo and Footer Styles from main 2.html */
        .logo-top {{
            background: #121417;
            text-align: center;
            padding: 15px 20px; /* Increased padding */
        }}

        .logo-top img {{
            height: 60px; /* Slightly larger logo */
        }}

        footer {{
            text-align: center;
            padding: 25px;
            font-size: 0.9rem;
            background: #16181c;
            color: #bbb;
            margin-top: 40px;
        }}

        .social-links a {{
            color: #bbb;
            margin: 0 10px;
        }}

        .social-links a:hover {{
            color: #ddd;
        }}
        /* END: Logo and Footer Styles from main 2.html */


        header {{
            text-align: center;
            padding: 40px 20px;
            background-color: #121212;
            margin-bottom: 30px;
        }}

        header .logo {{
            font-family: 'Montserrat', sans-serif;
            font-size: 3.5em;
            font-weight: 700;
            color: var(--accent-gold);
            text-transform: uppercase;
            letter-spacing: 5px;
            margin-bottom: 10px;
            text-shadow: 0 0 15px rgba(255, 204, 0, 0.4);
        }}

        header .tagline {{
            font-family: 'Montserrat', sans-serif;
            font-size: 1.2em;
            color: var(--text-muted);
            font-weight: 300;
        }}

        .content-section {{
            padding: 20px 5%;
            max-width: 1400px;
            margin: 0 auto;
        }}

        .film-details-layout {{
            display: flex;
            flex-wrap: wrap;
            gap: 40px;
            margin-bottom: 50px;
            padding: 0;
        }}

        .poster-column {{
            flex: 0 0 350px;
            min-width: 280px;
            display: flex;
            justify-content: center;
            align-items: flex-start;
        }}

        .poster-column img {{
            max-width: 100%;
            height: auto;
            border-radius: 10px;
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.6);
            transition: transform 0.3s ease-in-out;
        }}
        .poster-column img:hover {{
            transform: scale(1.02);
        }}

        .details-column {{
            flex: 1;
            min-width: 500px;
        }}

        .film-title {{
            font-family: 'Montserrat', sans-serif;
            font-size: 3.5em;
            font-weight: 700;
            color: var(--accent-gold);
            margin-bottom: 15px;
            line-height: 1.1;
            text-shadow: 0 0 10px rgba(255, 204, 0, 0.3);
        }}

        .original-title {{
            font-family: 'Open Sans', sans-serif;
            font-size: 1.4em;
            color: var(--text-muted);
            font-style: italic;
            margin-bottom: 25px;
        }}

        .meta-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }}
        .meta-item {{
            font-size: 1em;
            color: var(--text-light);
        }}
        .meta-item strong {{
            display: block;
            color: var(--accent-gold);
            font-family: 'Montserrat', sans-serif;
            font-weight: 600;
            margin-bottom: 5px;
        }}

        .section-title {{
            font-family: 'Montserrat', sans-serif;
            font-size: 2em;
            font-weight: 600;
            color: var(--accent-gold);
            margin-top: 40px;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid rgba(255, 204, 0, 0.3);
        }}

        .content-block {{
            margin-bottom: 30px;
        }}
        .content-block p {{
            color: var(--text-light);
            font-size: 1.1em;
            line-height: 1.8;
            margin-bottom: 15px;
        }}

        .list-group {{
            list-style: none;
            padding: 0;
            margin: 0;
        }}
        .list-group li {{
            background-color: #2b2b2b;
            padding: 12px 20px;
            border-radius: 8px;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }}
        .list-group li:last-child {{
            margin-bottom: 0;
        }}
        .list-group li strong {{
            color: var(--accent-gold);
            font-family: 'Montserrat', sans-serif;
            font-weight: 600;
            margin-right: 10px;
            white-space: nowrap;
        }}
        .list-group li span {{
            color: var(--text-light);
            flex-grow: 1;
        }}
        .list-group.plain li {{
            background: none;
            padding: 0;
            box-shadow: none;
            margin-bottom: 5px;
        }}
        .list-group.plain li:before {{
            content: "• ";
            color: var(--accent-gold);
            font-weight: bold;
            display: inline-block;
            width: 1em;
            margin-left: -1em;
        }}
        .list-group.plain li strong {{
            margin-right: 5px;
        }}

        .grid-container {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 30px;
            margin-top: 20px;
        }}
        .grid-item {{
            background-color: #2b2b2b;
            padding: 25px;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
        }}
        .grid-item h3 {{
            font-family: 'Montserrat', sans-serif;
            font-size: 1.5em;
            color: var(--accent-gold);
            margin-top: 0;
            margin-bottom: 15px;
            border-bottom: 1px solid rgba(255, 204, 0, 0.2);
            padding-bottom: 10px;
        }}
        .grid-item ul {{
            list-style: none;
            padding: 0;
        }}
        .grid-item ul li {{
            margin-bottom: 8px;
            color: var(--text-light);
            font-size: 0.95em;
        }}
        .grid-item ul li:before {{
            content: "• ";
            color: var(--accent-gold);
            font-weight: bold;
            margin-right: 5px;
        }}

        .prod-info p {{
            margin-bottom: 8px;
        }}
        .prod-info a {{
            color: var(--accent-blue);
            text-decoration: none;
            transition: color 0.3s ease;
        }}
        .prod-info a:hover {{
            color: #4dc3ff;
            text-decoration: underline;
        }}

        /* Responsive adjustments */
        @media (max-width: 1024px) {{
            .film-details-layout {{
                flex-direction: column;
            }}
            .poster-column {{
                flex: none;
                width: 100%;
                text-align: center;
                margin-bottom: 20px;
            }}
            .poster-column img {{
                max-width: 300px;
            }}
            .details-column {{
                min-width: unset;
                width: 100%;
            }}
            .film-title {{
                font-size: 2.8em;
            }}
            .original-title {{
                font-size: 1.2em;
            }}
            .section-title {{
                font-size: 1.8em;
            }}
        }}

        @media (max-width: 768px) {{
            header {{
                padding: 30px 15px;
            }}
            header .logo {{
                font-size: 2.5em;
            }}
            header .tagline {{
                font-size: 1em;
            }}
            .content-section {{
                padding: 15px;
            }}
            .film-title {{
                font-size: 2em;
            }}
            .original-title {{
                font-size: 1em;
            }}
            .section-title {{
                font-size: 1.5em;
            }}
            .meta-grid {{
                grid-template-columns: 1fr;
                gap: 15px;
            }}
            .list-group li {{
                flex-direction: column;
                align-items: flex-start;
            }}
            .list-group li strong {{
                margin-bottom: 5px;
            }}
            .grid-container {{
                grid-template-columns: 1fr;
                gap: 20px;
            }}
        }}
    </style>
</head>
<body>
    <div class="logo-top">
        <img src="G:\My Drive\CineFilcka\graphics\logo\Cinefila_logo_white_web.svg" alt="Cinefila Logo">
    </div>
    <header>
        <div class="logo">CINEFILA</div>
        <div class="tagline">FILM CATALOGUE</div>
    </header>

    <div class="content-section film-details-layout">
        <div class="poster-column">
            <img src="{poster_image}" alt="{film_title_english} Poster">
        </div>
        <div class="details-column">
            <h1 class="film-title">{film_title_english}</h1>
            <div class="original-title">{film_title_original}</div>

            <div class="meta-grid">
                <div class="meta-item">
                    <strong>Year</strong>
                    <p>{year}</p>
                </div>
                <div class="meta-item">
                    <strong>Duration</strong>
                    <p>{runtime}</p>
                </div>
                <div class="meta-item">
                    <strong>Country</strong>
                    <p>{country_of_production}</p>
                </div>
                <div class="meta-item">
                    <strong>Language</strong>
                    <p>{language_original}</p>
                </div>
                <div class="meta-item">
                    <strong>Subtitles</strong>
                    <p>{language_subtitles}</p>
                </div>
                <div class="meta-item">
                    <strong>Genres</strong>
                    <p>{genre_list}</p>
                </div>
                <div class="meta-item">
                    <strong>Keywords</strong>
                    <p>{keywords}</p>
                </div>
                <div class="meta-item">
                    <strong>Target Group</strong>
                    <p>{target_group_rating}{target_group_audience}</p>
                </div>
            </div>
        </div>
    </div>

    {logline_section}
    {synopsis_section}
    {directors_note_section}

    <div class="content-section">
        <h2 class="section-title">Crew</h2>
        <div class="content-block">
            <ul class="list-group">
                {crew_list_items}
            </ul>
        </div>
    </div>

    <div class="content-section">
        <h2 class="section-title">Production</h2>
        <div class="content-block prod-info">
            <h3>Producers</h3>
            <p>
                <strong>Name:</strong> {producer_name}<br>
                <strong>Address:</strong> {producer_address}<br>
                <strong>Postal code, city:</strong> {producer_postal_city}<br>
                <strong>Country:</strong> {producer_country}<br>
                <strong>WEB:</strong> <a href="{producer_web}" target="_blank">{producer_web}</a>
            </p>
        </div>
    </div>

    <div class="content-section grid-container">
        <div class="grid-item">
            <h3>Festivals</h3>
            <ul class="list-group plain">
                {festival_list_items}
            </ul>
        </div>
        <div class="grid-item">
            <h3>Awards</h3>
            <ul class="list-group plain">
                {award_list_items}
            </ul>
        </div>
    </div>

    <div class="content-section">
        <h2 class="section-title">Technical Details</h2>
        <div class="grid-container">
            {technical_details_items}
        </div>
    </div>
    <footer>
        <div class="social-links">
            <a href="https://www.facebook.com/profile.php?id=61572536315236" target="_blank">Facebook</a> |
            <a href="https://www.instagram.com/cinefilacz/" target="_blank">Instagram</a> |
            <a href="https://www.linkedin.com/in/alexandrahroncova/" target="_blank">LinkedIn</a> |
            <a href="https://vimeo.com/cinefilacz/" target="_blank">Vimeo</a>
        </div>
        &copy; 2025 Cinefila. All rights reserved.
    </footer>
</body>
</html>
"""

# Index HTML Template
index_html_template = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Film Catalogue Index</title>
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;600;700&family=Open+Sans:wght@300;400;600&display=swap" rel="stylesheet">
    <style>
        body {{
            background-color: #1a1a1a;
            color: #f0f0f0;
            font-family: 'Open Sans', sans-serif;
            margin: 0;
            padding: 0;
            line-height: 1.6;
            display: flex;
            flex-direction: column;
            align-items: center;
            min-height: 100vh;
        }}
        header {{
            text-align: center;
            padding: 40px 20px;
            background-color: #121212;
            width: 100%;
            box-sizing: border-box;
            margin-bottom: 30px;
        }}
        header .logo {{
            font-family: 'Montserrat', sans-serif;
            font-size: 3.5em;
            font-weight: 700;
            color: #ffcc00;
            text-transform: uppercase;
            letter-spacing: 5px;
            margin-bottom: 10px;
            text-shadow: 0 0 15px rgba(255, 204, 0, 0.4);
        }}
        header .tagline {{
            font-family: 'Montserrat', sans-serif;
            font-size: 1.2em;
            color: #aaaaaa;
            font-weight: 300;
        }}
        .index-container {{
            max-width: 800px;
            width: 100%;
            background-color: #222222;
            border-radius: 15px;
            padding: 40px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
            margin-bottom: 40px;
            box-sizing: border-box;
        }}
        h1 {{
            font-family: 'Montserrat', sans-serif;
            font-size: 2.5em;
            color: #ffcc00;
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid rgba(255, 204, 0, 0.3);
            padding-bottom: 15px;
        }}
        ul {{
            list-style: none;
            padding: 0;
        }}
        li {{
            margin-bottom: 15px;
            background-color: #2b2b2b;
            padding: 15px 25px;
            border-radius: 10px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
            transition: background-color 0.3s ease;
        }}
        li:hover {{
            background-color: #3a3a3a;
        }}
        a {{
            color: #00ccff;
            text-decoration: none;
            font-size: 1.2em;
            font-weight: 600;
            display: block;
            transition: color 0.3s ease;
        }}
        a:hover {{
            color: #4dc3ff;
            text-decoration: underline;
        }}

        @media (max-width: 768px) {{
            header {{
                padding: 30px 15px;
            }}
            header .logo {{
                font-size: 2.5em;
            }}
            header .tagline {{
                font-size: 1em;
            }}
            .index-container {{
                padding: 20px;
                margin: 20px;
            }}
            h1 {{
                font-size: 2em;
            }}
            a {{
                font-size: 1em;
            }}
        }}
    </style>
</head>
<body>
    <header>
        <div class="logo">CINEFILA</div>
        <div class="tagline">FILM CATALOGUE</div>
    </header>
    <div class="index-container">
        <h1>All Films</h1>
        <ul>
            {film_links}
        </ul>
    </div>
</body>
</html>
"""


# Helper function to safely get nested values
def get_nested_value(data, keys, default='Not specified'):
    if not isinstance(keys, list):
        keys = [keys]
    current = data
    for key in keys:
        if isinstance(current, dict) and key in current:
            current = current[key]
        else:
            return default
    return current if current not in ['', None, [], {}] else default


# Function to format lists for HTML
def format_list_items(items):
    if not items:
        return ""
    if isinstance(items, list):
        return "\n".join([f"<li>{item}</li>" for item in items])
    return f"<li>{items}</li>"  # Handle single string if passed


# Function to format key-value list for HTML
def format_kv_list_items(label, items):
    if not items:
        return ""
    if isinstance(items, list):
        return "\n".join([f"<li><strong>{label}:</strong> <span>{item}</span></li>" for item in items])
    return f"<li><strong>{label}:</strong> <span>{items}</span></li>"


# Load the JSON data
try:
    with open(json_file_path, 'r', encoding='utf-8') as f:
        films_data = json.load(f)
except FileNotFoundError:
    print(f"Error: JSON file not found at {json_file_path}")
    exit()
except json.JSONDecodeError:
    print(f"Error: Could not decode JSON from {json_file_path}")
    exit()

film_links_for_index = []

for film_entry in films_data:
    # Extract data using helper for robustness
    film_info = get_nested_value(film_entry, 'Film', {})
    premiere_info = get_nested_value(film_entry, 'Premiere', [{}])[0]  # Take first premiere
    festivals_info = get_nested_value(film_entry, 'Festivals', [])
    awards_info = get_nested_value(film_entry, 'Awards', [])
    crew_info = get_nested_value(film_entry, 'Crew', {})
    production_info = get_nested_value(film_entry, 'Production', {})
    producers_info = get_nested_value(production_info, 'Producers', {})
    technical_details_info = get_nested_value(film_entry, 'Technical_Details', {})

    # Film details
    film_title_original = get_nested_value(film_info, 'Title_Original')
    film_title_english = get_nested_value(film_info, 'Title_English') or film_title_original
    runtime = get_nested_value(film_info, 'Runtime')
    country_of_production = get_nested_value(film_info, 'Country_of_production')
    language_original = get_nested_value(film_info, 'Language_Original')
    language_subtitles = get_nested_value(film_info, 'Language_Subtitles')
    genre_list = ", ".join(get_nested_value(film_info, 'Genre_List', [])) or 'Not specified'
    keywords = get_nested_value(film_info, 'Keywords')

    target_group_rating = get_nested_value(film_info, ['Target_Group', 'Rating'])
    target_group_audience = get_nested_value(film_info, ['Target_Group', 'Audience'])
    target_group_combined = ""
    if target_group_rating != 'Not specified':
        target_group_combined += f"Rating: {target_group_rating}"
    if target_group_audience != 'Not specified':
        if target_group_combined:
            target_group_combined += " / "
        target_group_combined += f"Audience: {target_group_audience}"
    if not target_group_combined:
        target_group_combined = 'Not specified'

    logline = get_nested_value(film_entry, 'Logline')
    synopsis = get_nested_value(film_entry, 'Synopsis')
    directors_note = get_nested_value(film_entry, 'Directors_Note')

    # Crew
    crew_list_html = []
    if get_nested_value(crew_info, 'Director(s)'):
        crew_list_html.append(
            f"<li><strong>Director(s):</strong> <span>{get_nested_value(crew_info, 'Director(s)')}</span></li>")
    if get_nested_value(crew_info, 'Screenplay_writer(s)'):
        crew_list_html.append(
            f"<li><strong>Screenplay writer(s):</strong> <span>{get_nested_value(crew_info, 'Screenplay_writer(s)')}</span></li>")
    if get_nested_value(crew_info, 'Director(s)_of_Photography'):
        crew_list_html.append(
            f"<li><strong>Director(s) of Photography:</strong> <span>{get_nested_value(crew_info, 'Director(s)_of_Photography')}</span></li>")
    if get_nested_value(crew_info, 'Editor(s)'):
        crew_list_html.append(
            f"<li><strong>Editor(s):</strong> <span>{get_nested_value(crew_info, 'Editor(s)')}</span></li>")
    if get_nested_value(crew_info, 'Sound_director(s)'):
        crew_list_html.append(
            f"<li><strong>Sound director(s):</strong> <span>{get_nested_value(crew_info, 'Sound_director(s)')}</span></li>")
    if get_nested_value(crew_info, 'Music_composer(s)'):
        crew_list_html.append(
            f"<li><strong>Music composer(s):</strong> <span>{get_nested_value(crew_info, 'Music_composer(s)')}</span></li>")
    if get_nested_value(crew_info, 'Cast'):
        cast_list = get_nested_value(crew_info, 'Cast')
        if isinstance(cast_list, list):
            crew_list_html.append(f"<li><strong>Cast:</strong> <span>{', '.join(cast_list)}</span></li>")
        else:
            crew_list_html.append(f"<li><strong>Cast:</strong> <span>{cast_list}</span></li>")
    crew_list_items = "\n".join(crew_list_html) or "<li>No crew information available.</li>"

    # Production details
    producer_name = get_nested_value(producers_info, 'Name')
    producer_address = get_nested_value(producers_info, 'Address')
    producer_postal_city = get_nested_value(producers_info, 'Postal code, city')
    producer_country = get_nested_value(producers_info, 'Country')
    producer_web = get_nested_value(producers_info, 'WEB')
    if producer_web != 'Not specified' and not producer_web.startswith('http'):
        producer_web = f"http://{producer_web}"  # Ensure valid URL for linking

    # Festivals
    festival_list_items = []
    for festival in festivals_info:
        date = get_nested_value(festival, 'Date', '')
        country = get_nested_value(festival, 'Country', '')
        name = get_nested_value(festival, 'Name_of_Festival', '')
        if date or country or name:
            festival_list_items.append(
                f"<li>{date}{', ' if date and country else ''}{country}{': ' if (date or country) and name else ''}{name}</li>")
    festival_list_items_html = "\n".join(festival_list_items) or "<li>No festival information available.</li>"

    # Awards
    award_list_items = []
    for award in awards_info:
        date = get_nested_value(award, 'Date', '')
        country = get_nested_value(award, 'Country', '')
        section = get_nested_value(award, 'Festival_Section_of_Competition', '')
        if date or country or section:
            award_list_items.append(
                f"<li>{date}{', ' if date and country else ''}{country}{': ' if (date or country) and section else ''}{section}</li>")
    award_list_items_html = "\n".join(award_list_items) or "<li>No awards information available.</li>"

    # Technical Details
    technical_details_items_html = []
    screening_format_file = get_nested_value(technical_details_info, ['Screening_Format', 'File'])
    if screening_format_file != 'Not specified':
        technical_details_items_html.append(f"""
            <div class="grid-item">
                <h3>Screening Format</h3>
                <ul class="list-group plain">
                    <li>File: {screening_format_file}</li>
                </ul>
            </div>
        """)

    sound_mix = get_nested_value(technical_details_info, 'Sound_Mix')
    if sound_mix != 'Not specified':
        technical_details_items_html.append(f"""
            <div class="grid-item">
                <h3>Sound Mix</h3>
                <ul class="list-group plain">
                    <li>{sound_mix}</li>
                </ul>
            </div>
        """)

    colour = get_nested_value(technical_details_info, 'Colour')
    if colour != 'Not specified':
        technical_details_items_html.append(f"""
            <div class="grid-item">
                <h3>Colour</h3>
                <ul class="list-group plain">
                    <li>{colour}</li>
                </ul>
            </div>
        """)

    if not technical_details_items_html:
        technical_details_items_html.append(f"""
            <div class="grid-item">
                <h3>Technical Details</h3>
                <ul class="list-group plain">
                    <li>No technical details available.</li>
                </ul>
            </div>
        """)

    technical_details_items_html_str = "\n".join(technical_details_items_html)

    # Poster Image (using a placeholder for now, you can update with actual paths)
    # Assuming 'Image Path' would be a field in your Excel, if you have one.
    # Otherwise, you'd need to manually manage or generate these.
    poster_image = "https://via.placeholder.com/400x600/333333/FFFFFF?text=Film+Poster"

    # Conditional sections based on content
    logline_section = f"""
        <div class="content-section">
            <h2 class="section-title">Logline</h2>
            <div class="content-block">
                <p>{logline}</p>
            </div>
        </div>
    """ if logline != 'Not specified' else ''

    synopsis_section = f"""
        <div class="content-section">
            <h2 class="section-title">Synopsis</h2>
            <div class="content-block">
                <p>{synopsis}</p>
            </div>
        </div>
    """ if synopsis != 'Not specified' else ''

    directors_note_section = f"""
        <div class="content-section">
            <h2 class="section-title">Director's Note</h2>
            <div class="content-block">
                <p>{directors_note}</p>
            </div>
        </div>
    """ if directors_note != 'Not specified' else ''

    # Generate filename
    # Remove characters that are not alphanumeric, spaces, hyphens, or underscores
    safe_title = re.sub(r'[^\w\s-]', '', film_title_english).replace(' ', '_').lower()
    if not safe_title:  # Fallback if title is empty after sanitization
        safe_title = f"film_{len(film_links_for_index) + 1}"
    output_filename = f"{safe_title}.html"
    output_path = os.path.join(output_folder, output_filename)

    # Fill the template
    full_html_content = html_template.format(
        film_title_english=film_title_english,
        film_title_original=film_title_original,
        year=get_nested_value(film_info, 'Date_of_completion', 'Not specified'),  # Using Date_of_completion as Year
        runtime=runtime,
        country_of_production=country_of_production,
        language_original=language_original,
        language_subtitles=language_subtitles,
        genre_list=genre_list,
        keywords=keywords,
        target_group_rating=f"{target_group_rating} " if target_group_rating != 'Not specified' else "",
        target_group_audience=target_group_combined,
        logline_section=logline_section,
        synopsis_section=synopsis_section,
        directors_note_section=directors_note_section,
        crew_list_items=crew_list_items,
        producer_name=producer_name,
        producer_address=producer_address,
        producer_postal_city=producer_postal_city,
        producer_country=producer_country,
        producer_web=producer_web,
        festival_list_items=festival_list_items_html,
        award_list_items=award_list_items_html,
        technical_details_items=technical_details_items_html_str,
        poster_image=poster_image
    )

    # Write to file
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(full_html_content)

    # Add link to index
    film_links_for_index.append(f'<li><a href="{output_folder}/{output_filename}">{film_title_english}</a></li>')

# Generate index.html
index_html_content = index_html_template.format(
    film_links="\n".join(film_links_for_index)
)

index_output_path = os.path.join(output_folder, index_file_name)  # Save index inside the folder
with open(index_output_path, 'w', encoding='utf-8') as f:
    f.write(index_html_content)

print(f"Generated {len(films_data)} film pages in '{output_folder}' directory.")
print(f"Index page created at '{index_output_path}'.")