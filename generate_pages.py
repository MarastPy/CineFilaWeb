import os
import json
import re

# ---------------------- Configuration ----------------------
JSON_PATH = 'data/all_html_data.json'
OUTPUT_DIR = 'film_pages'
INDEX_FILE = 'index.html'
POSTER_DIR = '../images/posters'
STILLS_DIR = '../images/stills'

# ---------------------- Templates ----------------------
FILM_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{title_english}</title>
  <style>
    body {{
      background-color: #2b2b2b;
      color: white;
      font-family: Arial, sans-serif;
      padding: 20px;
      line-height: 1.6;
      max-width: 1200px;
      margin: 0 auto;
      padding-top: 20px;
      padding-bottom: 50px;
    }}
    h1 {{
      font-size: 2.5em;
      margin-bottom: 0.1em;
    }}
    h2 {{
      font-size: 1.8em;
      margin-bottom: 0.5em;
    }}
    h3 {{
      font-size: 1.4em;
      margin-top: 25px;
      margin-bottom: 5px;
    }}
    .logo-container {{
      text-align: center;
      margin-bottom: 30px;
    }}
    .logo-container img {{
      max-width: 200px;
      height: auto;
    }}
    .subtitle {{
      font-style: italic;
      margin-bottom: 10px;
    }}
    .horizontal-line {{
      border-bottom: 1px solid white;
      margin-top: 10px;
      margin-bottom: 20px;
    }}
    .info-line {{
      margin-bottom: 20px;
      font-weight: bold;
    }}
    .top-section {{
      display: flex;
      gap: 40px;
      flex-wrap: wrap;
      justify-content: center;
    }}
    .poster-column {{
      flex: 0 0 250px;
      max-width: 250px;
      /* Adjust width for better alignment if needed, e.g., if poster and still are different aspect ratios */
    }}
    .info-column {{
      flex: 1;
      min-width: 300px;
    }}
    .poster-column img.film-poster,
    .poster-column img.main-film-still {{ /* Apply similar styling to the main still */
      max-width: 100%;
      height: auto;
      border: 2px solid white;
      display: block;
      margin-bottom: 10px;
      cursor: pointer; /* Make both clickable */
    }}
    .block {{
      margin-bottom: 20px;
    }}
    .label {{
      font-weight: bold;
      margin-top: 10px;
    }}
    .flex-row {{
      display: flex;
      gap: 40px;
      flex-wrap: wrap;
      justify-content: center;
    }}
    .half {{
      flex: 1;
      min-width: 300px;
    }}
    .aligned-section {{
      margin-left: calc(250px + 40px);
      margin-right: 20px;
      margin-bottom: 20px;
    }}
    a {{
      color: white;
    }}

    /* Video Responsiveness */
    .video-container {{
      position: relative;
      padding-bottom: 56.25%; /* 16:9 aspect ratio */
      height: 0;
      overflow: hidden;
      max-width: 100%;
      background: #000;
      margin-top: 20px;
    }}
    .video-container iframe,
    .video-container object,
    .video-container embed {{
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    }}

    /* Stills Gallery (now for hidden thumbnails for lightbox data) */
    .stills-gallery {{
        display: none; /* Hide the entire gallery div as only the first still is displayed prominently */
    }}
    /* The individual img tags within stills-gallery are still needed for the lightbox JS data-stills attribute */


    /* Lightbox Styles (General for stills, poster) */
    .lightbox {{
      display: none; /* Hidden by default */
      position: fixed; /* Stay in place */
      z-index: 1000; /* Sit on top */
      left: 0;
      top: 0;
      width: 100%; /* Full width */
      height: 100%; /* Full height */
      overflow: auto; /* Enable scroll if needed */
      background-color: rgba(0,0,0,0.9); /* Black w/ opacity */
      align-items: center;
      justify-content: center;
    }}

    .lightbox-content {{
      position: relative;
      margin: auto;
      display: block;
      max-width: 90%;
      max-height: 90%;
    }}

    .lightbox-content img {{
      width: 100%;
      height: 100%;
      object-fit: contain; /* Ensure the image fits within the bounds without cropping */
    }}

    .close-btn, .prev-btn, .next-btn {{
      position: absolute;
      color: #fff;
      font-size: 40px;
      font-weight: bold;
      cursor: pointer;
      user-select: none;
      text-shadow: 0 0 5px black;
    }}

    .close-btn {{
      top: 15px;
      right: 35px;
    }}

    .prev-btn {{
      top: 50%;
      left: 35px;
      transform: translateY(-50%);
    }}

    .next-btn {{
      top: 50%;
      right: 35px;
      transform: translateY(-50%);
    }}

    .close-btn:hover,
    .prev-btn:hover,
    .next-btn:hover {{
      color: #bbb;
    }}


    /* Media Queries for Responsiveness (kept for overall layout) */
    @media (max-width: 768px) {{
      body {{
        padding: 15px;
      }}
      h1 {{
        font-size: 2em;
      }}
      h2 {{
        font-size: 1.5em;
      }}
      h3 {{
        font-size: 1.2em;
      }}
      .logo-container img {{
        max-width: 150px;
      }}
      .top-section {{
        flex-direction: column;
        align-items: center;
        gap: 20px;
      }}
      .poster-column {{
        flex: none;
        width: 80%;
        max-width: 250px; /* Keep consistent with desktop max-width for column */
      }}
      .info-column {{
        min-width: unset;
        width: 100%;
      }}
      .flex-row {{
        flex-direction: column;
        align-items: center;
        gap: 20px;
      }}
      .half {{
        min-width: unset;
        width: 100%;
      }}
      .aligned-section {{
        margin-left: 0;
        margin-right: 0;
        padding: 0 15px;
      }}
    }}

    @media (max-width: 480px) {{
      body {{
        padding: 10px;
      }}
      h1 {{
        font-size: 1.8em;
      }}
      h2 {{
        font-size: 1.3em;
      }}
      h3 {{
        font-size: 1.1em;
      }}
      .logo-container img {{
        max-width: 120px;
      }}
      .poster-column {{
        width: 90%;
      }}
      .aligned-section {{
        padding: 0 10px;
      }}
    }}
  </style>
</head>
<body>
  <div class="logo-container">
    <a href="../index.html">
      <img src="../images/logo/Cinefila_logo_white_web.svg" alt="OFC Cinefila Logo" />
    </a>
  </div>


  <h1>{title_english}</h1>
  <div class="subtitle">Original Title: {title_original}</div>
  <div class="horizontal-line"></div>

  <div class="info-line">{genre} | {year} | {duration} minutes | {language} with {subtitles} subtitles | {country}</div>

  <div class="top-section">
    <div class="poster-column">
      <div>
        <img src="{poster_image}" alt="Poster" class="film-poster" id="poster-img"/>
        <div class="label">Still</div>
        {main_still_html}
        {trailer_html}
        <div class="label">Poster</div>
        <div><a href="{poster_image}" target="_blank">Link to poster (opens in new tab)</a></div>
      </div>
    </div>

    <div class="info-column">
      {logline_html}
      {synopsis_html}
      {note_html}
      {target_html}
      {topics_html}
    </div>
  </div>

  <div class="aligned-section"> <h3>Festival, Crew, Cast & Technical Info</h3>
    <div class="flex-row">
      <div class="half">
        <div class="label">Festivals</div>
        {festivals_html}
        <div class="label">Awards</div>
        {awards_html}
        <div class="label">Sales Status</div>
        {status}
        <div class="label">Downloads</div>
        {downloads}
      </div>
      <div class="half">
        <div class="label">Crew</div>
        {crew_html}
        <div class="label">Cast</div>
        {cast_html}
      </div>
    </div>
    <div class="label">Technical Specs</div>
    {technical_html}
  </div>

  {stills_gallery_for_lightbox_data}

  <div id="lightbox" class="lightbox">
    <span class="close-btn">&times;</span>
    <img class="lightbox-content" id="lightbox-img" src="" alt="Still Image">
    <span class="prev-btn">&#10094;</span>
    <span class="next-btn">&#10095;</span>
  </div>

  <div id="poster-lightbox" class="lightbox">
    <span class="close-btn">&times;</span>
    <img class="lightbox-content" id="poster-lightbox-img" src="" alt="Film Poster">
  </div>

  <script>
    document.addEventListener('DOMContentLoaded', function() {{
      // Stills Lightbox
      const stillsLightbox = document.getElementById('lightbox');
      const stillsLightboxImg = document.getElementById('lightbox-img');
      const stillsCloseBtn = stillsLightbox.querySelector('.close-btn');
      const stillsPrevBtn = stillsLightbox.querySelector('.prev-btn');
      const stillsNextBtn = stillsLightbox.querySelector('.next-btn');

      let currentStillIndex = 0;
      let currentStills = [];

      // TARGET THE MAIN STILL IMAGE FOR CLICK EVENT
      const mainFilmStill = document.getElementById('main-film-still');
      if (mainFilmStill) {{
        // Initialize currentStills from the data-stills attribute of the main still
        currentStills = JSON.parse(mainFilmStill.dataset.stills);
        mainFilmStill.addEventListener('click', function() {{
          const clickedStill = this.getAttribute('src');
          currentStillIndex = currentStills.indexOf(clickedStill); // Should be 0 for the first still
          showStill(currentStillIndex);
          stillsLightbox.style.display = 'flex';
        }});
      }}

      // Fallback/alternative for if main still isn't present but other stills exist
      // This is less likely if main_still_html is always generated from all_stills[0]
      document.querySelectorAll('.stills-gallery img').forEach(img => {{
        img.addEventListener('click', function() {{
          currentStills = JSON.parse(this.dataset.stills);
          const clickedStill = this.getAttribute('src');
          currentStillIndex = currentStills.indexOf(clickedStill);
          showStill(currentStillIndex);
          stillsLightbox.style.display = 'flex';
        }});
      }});


      stillsCloseBtn.addEventListener('click', function() {{
        stillsLightbox.style.display = 'none';
      }});

      stillsLightbox.addEventListener('click', function(e) {{
        if (e.target === stillsLightbox) {{
          stillsLightbox.style.display = 'none';
        }}
      }});

      stillsPrevBtn.addEventListener('click', function() {{
        currentStillIndex = (currentStillIndex - 1 + currentStills.length) % currentStills.length;
        showStill(currentStillIndex);
      }});

      stillsNextBtn.addEventListener('click', function() {{
        currentStillIndex = (currentStillIndex + 1) % currentStills.length;
        showStill(currentStillIndex);
      }});

      function showStill(index) {{
        if (currentStills.length > 0) {{
          stillsLightboxImg.src = currentStills[index];
        }}
      }}

      // Poster Lightbox
      const posterLightbox = document.getElementById('poster-lightbox');
      const posterLightboxImg = document.getElementById('poster-lightbox-img');
      const posterCloseBtn = posterLightbox.querySelector('.close-btn');
      const filmPoster = document.getElementById('poster-img');

      if (filmPoster) {{
        filmPoster.addEventListener('click', function() {{
          posterLightboxImg.src = this.src;
          posterLightbox.style.display = 'flex';
        }});
      }}

      posterCloseBtn.addEventListener('click', function() {{
        posterLightbox.style.display = 'none';
      }});

      posterLightbox.addEventListener('click', function(e) {{
        if (e.target === posterLightbox) {{
          posterLightbox.style.display = 'none';
        }}
      }});

      // Global Keydown for closing any lightbox
      document.addEventListener('keydown', function(e) {{
        if (e.key === 'Escape') {{
          if (stillsLightbox.style.display === 'flex') {{
            stillsCloseBtn.click();
          }}
          if (posterLightbox.style.display === 'flex') {{
            posterCloseBtn.click();
          }}
        }}
      }});

      // Centralized Click-to-Close (for both stills and poster lightboxes)
      const allLightboxes = [stillsLightbox, posterLightbox];
      allLightboxes.forEach(lb => {{
          lb.addEventListener('click', function(e) {{
              // Check if the click is directly on the lightbox background
              if (e.target === lb) {{
                  lb.style.display = 'none';
              }}
          }});
      }});
    }});
  </script>
</body>
</html>
"""


# ---------------------- Helper Functions ----------------------

def sanitize_filename(title):
    """Sanitizes a string to be used as a filename."""
    return re.sub(r'[^\w\s-]', '', title).strip().replace(' ', '_').lower()


def optional_block(title, content):
    """Generates an HTML block with a title and content, if content exists."""
    return f"<h3>{title}</h3><p>{content}</p>" if content else ""


def list_block(title, items):
    """Generates an HTML unordered list with a title, if items exist."""
    if not items:
        return ""
    html = f"<h3>{title}</h3><ul>"
    for item in items:
        html += f"<li>{item}</li>"
    html += "</ul>"
    return html


def build_crew(crew):
    """Formats crew dictionary into an HTML list."""
    return list_block("Crew", [f"{k.title().replace('_', ' ')}: {v}" for k, v in crew.items()]) if crew else ""


def build_cast(cast):
    """Formats cast list into an HTML list."""
    return list_block("Cast", cast) if cast else ""


def build_tech_specs(specs):
    """Formats technical specifications dictionary into an HTML list."""
    return list_block("Technical Specs",
                      [f"{k.replace('_', ' ').title()}: {v}" for k, v in specs.items()]) if specs else ""


def build_festivals(fests):
    """Formats festivals list into an HTML list."""
    return list_block("Festivals",
                      [f"{f.get('Name_of_Festival', '')}, {f.get('Country', '')} ({f.get('Date', '')})" for f in
                       fests]) if fests else ""


def get_vimeo_id(url):
    """Extracts Vimeo ID from a Vimeo URL."""
    if not url:
        return None
    match = re.search(r'vimeo\.com/(\d+)', url)
    if match:
        return match.group(1)
    return None


def build_trailer_embed(trailer_url):
    """
    Builds the HTML for embedding a Vimeo trailer directly into the page.
    """
    vimeo_id = get_vimeo_id(trailer_url)
    if not vimeo_id:
        return ""

    embed_url = f"https://player.vimeo.com/video/{vimeo_id}"
    return f"""
    <div class="label">Trailer</div>
    <div class="video-container">
      <iframe src="{embed_url}" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>
    </div>
    """


def get_film_stills(film_sanitized_title):
    """
    Gets relative paths to film still images for a given film.
    Checks for existence on the file system.
    """
    stills = []
    # Checks for _1.jpg, _2.jpg, _3.jpg (adjust range as needed)
    for i in range(1, 4):
        full_still_file_path = os.path.join(
            os.path.dirname(os.path.abspath(__file__)),
            STILLS_DIR.replace('../', ''),
            film_sanitized_title,
            f"{film_sanitized_title}_{i}.jpg"
        )
        if os.path.exists(full_still_file_path):
            relative_still_path = f"{STILLS_DIR}/{film_sanitized_title}/{film_sanitized_title}_{i}.jpg"
            stills.append(relative_still_path)
    return stills


# ---------------------- Main Logic ----------------------
os.makedirs(OUTPUT_DIR, exist_ok=True)

try:
    with open(JSON_PATH, 'r', encoding='utf-8') as f:
        films = json.load(f)
except FileNotFoundError:
    print(f"Error: JSON file not found at {JSON_PATH}. Please ensure the data extraction script ran successfully.")
    exit()
except json.JSONDecodeError:
    print(f"Error: Could not decode JSON from {JSON_PATH}. Check file for valid JSON format.")
    exit()

for film in films:
    fdata = film.get("Film", {})
    title_en = fdata.get("Title_English", "Untitled Film")
    title_orig = fdata.get("Title_Original", "")
    fname_sanitized = sanitize_filename(title_en)

    # --- Prepare data for template ---
    genre_list = [g for g in fdata.get("Genre_List", []) if g]
    if fdata.get("Genre_Other"):
        genre_list.append(fdata.get("Genre_Other"))
    genre_combined = ", ".join(genre_list)

    year = ""
    if fdata.get("Date_of_completion"):
        try:
            if '.' in fdata["Date_of_completion"]:
                year = fdata["Date_of_completion"].split(".")[-1]
            elif '-' in fdata["Date_of_completion"]:
                year = fdata["Date_of_completion"].split("-")[0]
            else:
                year = fdata["Date_of_completion"]
            if not (isinstance(year, str) and year.isdigit() and len(year) == 4):
                year = ""
        except Exception:
            year = ""

    duration = ""
    runtime_str = fdata.get("Runtime", "0:0:0")
    if runtime_str and runtime_str != "0:0:0":
        try:
            parts = [int(p) for p in runtime_str.split(":")]
            if len(parts) >= 2:
                duration = parts[0] * 60 + parts[1]
            elif len(parts) == 1:
                duration = parts[0]
        except ValueError:
            duration = ""

    language = fdata.get("Language_Original", "")
    subtitles = fdata.get("Language_Subtitles", "")
    country = fdata.get("Country_of_production", "")

    # Construct target group content
    target_rating = fdata.get('Target_Group', {}).get('Rating', '')
    target_audience = fdata.get('Target_Group', {}).get('Audience', '')
    target_group_content = ""
    if target_rating or target_audience:
        target_group_content = f"{target_rating}{', ' if target_rating and target_audience else ''}{target_audience}"

    # Get all stills for the current film
    all_stills = get_film_stills(fname_sanitized)

    # --- HTML for the prominently displayed first still ---
    main_still_html = ""
    if all_stills:
        # The first still, with a unique ID and data-stills for lightbox
        main_still_html = f'<img src="{all_stills[0]}" alt="Still" class="main-film-still" id="main-film-still" data-stills=\'{json.dumps(all_stills)}\' />'
    else:
        main_still_html = "<p>No stills available.</p>"

    # --- HTML for the hidden stills gallery (only for lightbox data) ---
    stills_gallery_for_lightbox_data = ""
    if all_stills:
        stills_gallery_for_lightbox_data = f'<div class="stills-gallery" style="display:none;">'
        for still_url in all_stills:
            stills_gallery_for_lightbox_data += f'<img src="{still_url}" alt="Still Thumbnail (hidden)" data-stills=\'{json.dumps(all_stills)}\' />'
        stills_gallery_for_lightbox_data += '</div>'


    # Generate trailer embed HTML (direct embed)
    trailer_embed_html_content = build_trailer_embed(film.get("Trailer_url"))

    # Construct poster path
    poster_path = f"{POSTER_DIR}/{fname_sanitized}/{fname_sanitized}.jpg"
    # Fallback for poster if not found in specific folder
    if not os.path.exists(os.path.join(os.path.dirname(os.path.abspath(__file__)), POSTER_DIR.replace('../', ''), fname_sanitized, f"{fname_sanitized}.jpg")):
        poster_path = f"{POSTER_DIR}/default_poster.jpg"

    # Fill the template
    html = FILM_TEMPLATE.format(
        title_english=title_en,
        title_original=title_orig,
        genre=genre_combined,
        year=year,
        duration=duration,
        language=language,
        subtitles=subtitles,
        country=country,
        poster_image=poster_path,
        main_still_html=main_still_html, # New placeholder for the main still
        stills_gallery_for_lightbox_data=stills_gallery_for_lightbox_data, # New placeholder for the hidden gallery
        trailer_html=trailer_embed_html_content,
        logline_html=optional_block("Logline", film.get("Logline")),
        synopsis_html=optional_block("Synopsis", film.get("Synopsis")),
        note_html=optional_block("Director's Note", film.get("Directors_Note")),
        target_html=optional_block("Target Group", target_group_content),
        topics_html=optional_block("Story Topics & Notes", film.get("Keywords")),
        festivals_html=list_block("", [
            f"{fest.get('Name_of_Festival', '')}, {fest.get('Country', '')} ({fest.get('Date', '')})" for fest in
            film.get("Festivals", [])]),
        awards_html=list_block("", [f"{a.get('Festival_Section_of_Competition', '')} ({a.get('Date', '')})" for a in
                                    film.get("Awards", [])]),
        crew_html=list_block("",
                             [f"{k.replace('_', ' ').replace('(s)', '')}: {v}" for k, v in film.get("Crew", {}).items()
                              if not isinstance(v, list) and v and k != "Cast"]),
        cast_html=list_block("", film.get("Crew", {}).get("Cast", [])),
        technical_html=list_block("",
                                  [f"{k.replace('_', ' ')}: {v}" for k, v in film.get("Technical_Details", {}).items()
                                   if v]),
        downloads=film.get("Downloads", "—"),
        status=fdata.get("Status", "—"),
    )

    # Write the HTML file
    output_filename = os.path.join(OUTPUT_DIR, f"{fname_sanitized}.html")
    with open(output_filename, 'w', encoding='utf-8') as out:
        out.write(html)

print(f"Generated {len(films)} film pages in '{OUTPUT_DIR}' folder.")
