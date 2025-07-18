import os
import json
import re

# ---------------------- Configuration ----------------------
JSON_PATH = 'extracted_data/all_html_data.json'
OUTPUT_DIR = 'film_pages'
INDEX_FILE = 'index.html' # This variable is defined but not used in this specific script portion
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
    body {{ /* ESCAPED */
      background-color: #2b2b2b;
      color: white;
      font-family: Arial, sans-serif;
      padding: 20px;
      line-height: 1.6;
      max-width: 1200px;
      margin: 0 auto;
      padding-top: 20px;
      padding-bottom: 50px;
    }} /* ESCAPED */
    h1 {{ /* ESCAPED */
      font-size: 2.5em;
      margin-bottom: 0.1em;
    }} /* ESCAPED */
    h2 {{ /* ESCAPED */
      font-size: 1.8em;
      margin-bottom: 0.5em;
    }} /* ESCAPED */
    h3 {{ /* ESCAPED */
      font-size: 1.4em;
      margin-top: 25px;
      margin-bottom: 5px;
    }} /* ESCAPED */
    .logo-container {{ /* ESCAPED */
      text-align: center;
      margin-bottom: 30px;
    }} /* ESCAPED */
    .logo-container img {{ /* ESCAPED */
      max-width: 200px;
      height: auto;
    }} /* ESCAPED */
    .subtitle {{ /* ESCAPED */
      font-style: italic;
      margin-bottom: 10px;
    }} /* ESCAPED */
    .horizontal-line {{ /* ESCAPED */
      border-bottom: 1px solid white;
      margin-top: 10px;
      margin-bottom: 20px;
    }} /* ESCAPED */
    .info-line {{ /* ESCAPED */
      margin-bottom: 20px;
      font-weight: bold;
    }} /* ESCAPED */
    .top-section {{ /* ESCAPED */
      display: flex;
      gap: 40px;
      flex-wrap: wrap;
      justify-content: center;
    }} /* ESCAPED */
    .poster-column {{ /* ESCAPED */
      flex: 0 0 250px;
      max-width: 250px;
    }} /* ESCAPED */
    .info-column {{ /* ESCAPED */
      flex: 1;
      min-width: 300px;
    }} /* ESCAPED */
    .poster-column img.film-poster {{ /* ESCAPED */
      max-width: 100%;
      height: auto;
      border: 2px solid white;
      display: block;
      margin-bottom: 10px;
      cursor: pointer; /* Make poster clickable */
    }} /* ESCAPED */
    .block {{ /* ESCAPED */
      margin-bottom: 20px;
    }} /* ESCAPED */
    .label {{ /* ESCAPED */
      font-weight: bold;
      margin-top: 10px;
    }} /* ESCAPED */
    .flex-row {{ /* ESCAPED */
      display: flex;
      gap: 40px;
      flex-wrap: wrap;
      justify-content: center;
    }} /* ESCAPED */
    .half {{ /* ESCAPED */
      flex: 1;
      min-width: 300px;
    }} /* ESCAPED */
    .aligned-section {{ /* ESCAPED */
      margin-left: calc(250px + 40px);
      margin-right: 20px;
      margin-bottom: 20px;
    }} /* ESCAPED */
    a {{ /* ESCAPED */
      color: white;
    }} /* ESCAPED */

    /* Video Responsiveness */
    .video-container {{ /* ESCAPED */
      position: relative;
      padding-bottom: 56.25%; /* 16:9 aspect ratio */
      height: 0;
      overflow: hidden;
      max-width: 100%;
      background: #000;
      margin-top: 20px;
    }} /* ESCAPED */
    .video-container iframe,
    .video-container object,
    .video-container embed {{ /* ESCAPED */
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    }} /* ESCAPED */

    /* Stills Gallery */
    .stills-gallery {{ /* ESCAPED */
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 10px;
    }} /* ESCAPED */
    .stills-gallery img {{ /* ESCAPED */
        width: 100px; /* Thumbnail size */
        height: auto;
        border: 1px solid #555;
        cursor: pointer;
        transition: transform 0.2s;
    }} /* ESCAPED */
    .stills-gallery img:hover {{ /* ESCAPED */
        transform: scale(1.05);
    }} /* ESCAPED */

    /* Lightbox Styles (General for stills, poster) */
    .lightbox {{ /* ESCAPED */
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
    }} /* ESCAPED */

    .lightbox-content {{ /* ESCAPED */
      position: relative;
      margin: auto;
      display: block;
      max-width: 90%;
      max-height: 90%;
    }} /* ESCAPED */

    .lightbox-content img {{ /* ESCAPED */
      width: 100%;
      height: 100%;
      object-fit: contain; /* Ensure the image fits within the bounds without cropping */
    }} /* ESCAPED */

    .close-btn, .prev-btn, .next-btn {{ /* ESCAPED */
      position: absolute;
      color: #fff;
      font-size: 40px;
      font-weight: bold;
      cursor: pointer;
      user-select: none;
      text-shadow: 0 0 5px black;
    }} /* ESCAPED */

    .close-btn {{ /* ESCAPED */
      top: 15px;
      right: 35px;
    }} /* ESCAPED */

    .prev-btn {{ /* ESCAPED */
      top: 50%;
      left: 35px;
      transform: translateY(-50%);
    }} /* ESCAPED */

    .next-btn {{ /* ESCAPED */
      top: 50%;
      right: 35px;
      transform: translateY(-50%);
    }} /* ESCAPED */

    .close-btn:hover,
    .prev-btn:hover,
    .next-btn:hover {{ /* ESCAPED */
      color: #bbb;
    }} /* ESCAPED */


    /* Media Queries for Responsiveness */
    @media (max-width: 768px) {{ /* ESCAPED */
      body {{ /* ESCAPED */
        padding: 15px;
      }} /* ESCAPED */
      h1 {{ /* ESCAPED */
        font-size: 2em;
      }} /* ESCAPED */
      h2 {{ /* ESCAPED */
        font-size: 1.5em;
      }} /* ESCAPED */
      h3 {{ /* ESCAPED */
        font-size: 1.2em;
      }} /* ESCAPED */
      .logo-container img {{ /* ESCAPED */
        max-width: 150px;
      }} /* ESCAPED */
      .top-section {{ /* ESCAPED */
        flex-direction: column;
        align-items: center;
        gap: 20px;
      }} /* ESCAPED */
      .poster-column {{ /* ESCAPED */
        flex: none;
        width: 80%;
        max-width: 250px;
      }} /* ESCAPED */
      .info-column {{ /* ESCAPED */
        min-width: unset;
        width: 100%;
      }} /* ESCAPED */
      .flex-row {{ /* ESCAPED */
        flex-direction: column;
        align-items: center;
        gap: 20px;
      }} /* ESCAPED */
      .half {{ /* ESCAPED */
        min-width: unset;
        width: 100%;
      }} /* ESCAPED */
      .aligned-section {{ /* ESCAPED */
        margin-left: 0;
        margin-right: 0;
        padding: 0 15px;
      }} /* ESCAPED */
    }} /* ESCAPED */

    @media (max-width: 480px) {{ /* ESCAPED */
      body {{ /* ESCAPED */
        padding: 10px;
      }} /* ESCAPED */
      h1 {{ /* ESCAPED */
        font-size: 1.8em;
      }} /* ESCAPED */
      h2 {{ /* ESCAPED */
        font-size: 1.3em;
      }} /* ESCAPED */
      h3 {{ /* ESCAPED */
        font-size: 1.1em;
      }} /* ESCAPED */
      .logo-container img {{ /* ESCAPED */
        max-width: 120px;
      }} /* ESCAPED */
      .poster-column {{ /* ESCAPED */
        width: 90%;
      }} /* ESCAPED */
      .aligned-section {{ /* ESCAPED */
        padding: 0 10px;
      }} /* ESCAPED */
    }} /* ESCAPED */
  </style>
</head>
<body>
  <div class="logo-container">
    <a href="index.html">
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
        <div class="label">Stills</div>
        <div class="stills-gallery">
            {stills_html}
        </div>
        {trailer_html} <div class="label">Poster</div>
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
    document.addEventListener('DOMContentLoaded', function() {{ /* ESCAPED */
      // Stills Lightbox
      const stillsLightbox = document.getElementById('lightbox');
      const stillsLightboxImg = document.getElementById('lightbox-img');
      const stillsCloseBtn = stillsLightbox.querySelector('.close-btn');
      const stillsPrevBtn = stillsLightbox.querySelector('.prev-btn');
      const stillsNextBtn = stillsLightbox.querySelector('.next-btn');

      let currentStillIndex = 0;
      let currentStills = [];

      document.querySelectorAll('.stills-gallery img').forEach(img => {{ /* ESCAPED */
        img.addEventListener('click', function() {{ /* ESCAPED */
          currentStills = JSON.parse(this.dataset.stills);
          const clickedStill = this.getAttribute('src');
          currentStillIndex = currentStills.indexOf(clickedStill);
          showStill(currentStillIndex);
          stillsLightbox.style.display = 'flex';
        }}); /* ESCAPED */
      }}); /* ESCAPED */

      stillsCloseBtn.addEventListener('click', function() {{ /* ESCAPED */
        stillsLightbox.style.display = 'none';
      }}); /* ESCAPED */

      stillsLightbox.addEventListener('click', function(e) {{ /* ESCAPED */
        if (e.target === stillsLightbox) {{ /* ESCAPED */
          stillsLightbox.style.display = 'none';
        }} /* ESCAPED */
      }}); /* ESCAPED */

      stillsPrevBtn.addEventListener('click', function() {{ /* ESCAPED */
        currentStillIndex = (currentStillIndex - 1 + currentStills.length) % currentStills.length;
        showStill(currentStillIndex);
      }}); /* ESCAPED */

      stillsNextBtn.addEventListener('click', function() {{ /* ESCAPED */
        currentStillIndex = (currentStillIndex + 1) % currentStills.length;
        showStill(currentStillIndex);
      }}); /* ESCAPED */

      function showStill(index) {{ /* ESCAPED */
        if (currentStills.length > 0) {{ /* ESCAPED */
          stillsLightboxImg.src = currentStills[index];
        }} /* ESCAPED */
      }} /* ESCAPED */

      // Poster Lightbox
      const posterLightbox = document.getElementById('poster-lightbox');
      const posterLightboxImg = document.getElementById('poster-lightbox-img');
      const posterCloseBtn = posterLightbox.querySelector('.close-btn');
      const filmPoster = document.getElementById('poster-img');

      if (filmPoster) {{ /* ESCAPED */
        filmPoster.addEventListener('click', function() {{ /* ESCAPED */
          posterLightboxImg.src = this.src;
          posterLightbox.style.display = 'flex';
        }}); /* ESCAPED */
      }} /* ESCAPED */

      posterCloseBtn.addEventListener('click', function() {{ /* ESCAPED */
        posterLightbox.style.display = 'none';
      }}); /* ESCAPED */

      posterLightbox.addEventListener('click', function(e) {{ /* ESCAPED */
        if (e.target === posterLightbox) {{ /* ESCAPED */
          posterLightbox.style.display = 'none';
        }} /* ESCAPED */
      }}); /* ESCAPED */

      // Global Keydown for closing any lightbox
      document.addEventListener('keydown', function(e) {{ /* ESCAPED */
        if (e.key === 'Escape') {{ /* ESCAPED */
          if (stillsLightbox.style.display === 'flex') {{ /* ESCAPED */
            stillsCloseBtn.click();
          }} /* ESCAPED */
          if (posterLightbox.style.display === 'flex') {{ /* ESCAPED */
            posterCloseBtn.click();
          }} /* ESCAPED */
        }} /* ESCAPED */
      }}); /* ESCAPED */

      // Centralized Click-to-Close (for both stills and poster lightboxes)
      const allLightboxes = [stillsLightbox, posterLightbox];
      allLightboxes.forEach(lb => {{ /* ESCAPED */
          lb.addEventListener('click', function(e) {{ /* ESCAPED */
              // Check if the click is directly on the lightbox background
              if (e.target === lb) {{ /* ESCAPED */
                  lb.style.display = 'none';
              }} /* ESCAPED */
          }}); /* ESCAPED */
      }}); /* ESCAPED */
    }}); /* ESCAPED */
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
                      [f"{f.get('Name_of_Festival', '')}, {f.get('Country', '')} ({f.get('Date', '')})" for f in fests]) if fests else ""


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
    for i in range(1, 4):  # Checks for _1.jpg, _2.jpg, _3.jpg (adjust as needed)
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
    stills_html_list = []
    if all_stills:
        for still_url in all_stills:
            stills_html_list.append(f'<img src="{still_url}" alt="Still" data-stills=\'{json.dumps(all_stills)}\' />')
    stills_html = "\n".join(stills_html_list) if stills_html_list else "<p>No stills available.</p>"

    # Generate trailer embed HTML (direct embed)
    trailer_embed_html_content = build_trailer_embed(film.get("Trailer_url"))

    # Construct poster path
    poster_path = f"{POSTER_DIR}/{fname_sanitized}/{fname_sanitized}.jpg"

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
        stills_html=stills_html,
        trailer_html=trailer_embed_html_content, # Reverted to direct embed for trailer
        logline_html=optional_block("Logline", film.get("Logline")),
        synopsis_html=optional_block("Synopsis", film.get("Synopsis")),
        note_html=optional_block("Director's Note", film.get("Directors_Note")),
        target_html=optional_block("Target Group", target_group_content),
        topics_html=optional_block("Story Topics & Notes", film.get("Keywords")),
        festivals_html=list_block("", [f"{fest.get('Name_of_Festival', '')}, {fest.get('Country', '')} ({fest.get('Date', '')})" for fest in film.get("Festivals", [])]),
        awards_html=list_block("", [f"{a.get('Festival_Section_of_Competition', '')} ({a.get('Date', '')})" for a in film.get("Awards", [])]),
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