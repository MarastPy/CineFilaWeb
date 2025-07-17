import os
import json
import re

# ---------------------- Configuration ----------------------
JSON_PATH = 'extracted_data/all_html_data.json'
OUTPUT_DIR = 'generated_film_pages'
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
    }}
    .info-column {{
      flex: 1;
      min-width: 300px;
    }}
    .poster-column img {{
      max-width: 100%;
      height: auto;
      border: 2px solid white;
      display: block;
      margin-bottom: 10px;
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

    /* Media Queries for Responsiveness */
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
        max-width: 250px;
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
        <img src="{poster_image}" alt="Poster" />
        <div class="label">Still</div>
        <img src="{still_image}" alt="Still" />
        {trailer_html}
        <div class="label">Poster</div>
        <div><a href="{poster_image}">Link to poster</a></div>
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
</body>
</html>
"""


# ---------------------- Helper Functions ----------------------

def sanitize_filename(title):
    return re.sub(r'[^\w\s-]', '', title).strip().replace(' ', '_').lower()


def optional_block(title, content):
    return f"<h3>{title}</h3><p>{content}</p>" if content else ""


def list_block(title, items):
    if not items:
        return ""
    html = f"<h3>{title}</h3><ul>"
    for item in items:
        html += f"<li>{item}</li>"
    html += "</ul>"
    return html


def build_crew(crew):
    return list_block("Crew", [f"{k.title().replace('_', ' ')}: {v}" for k, v in crew.items()]) if crew else ""


def build_cast(cast):
    return list_block("Cast", cast) if cast else ""


def build_tech_specs(specs):
    return list_block("Technical Specs",
                      [f"{k.replace('_', ' ').title()}: {v}" for k, v in specs.items()]) if specs else ""


def build_festivals(fests):
    return list_block("Festivals",
                      [f"{f.get('Name_of_Festival', '')} ({f.get('Year', '')})" for f in fests]) if fests else ""


def get_vimeo_id(url):
    if not url:
        return None
    match = re.search(r'vimeo\.com/(\d+)', url)
    if match:
        return match.group(1)
    return None


def build_trailer_embed(trailer_url):
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


# ---------------------- Main Logic ----------------------
os.makedirs(OUTPUT_DIR, exist_ok=True)

with open(JSON_PATH, 'r', encoding='utf-8') as f:
    films = json.load(f)

for film in films:
    fdata = film.get("Film", {})
    title_en = fdata.get("Title_English", "Untitled")
    title_orig = fdata.get("Title_Original", "")
    fname = sanitize_filename(title_en) + ".html"

    # Construct target group content carefully
    target_rating = fdata.get('Target_Group', {}).get('Rating', '')
    target_audience = fdata.get('Target_Group', {}).get('Audience', '')
    target_group_content = ""
    if target_rating or target_audience:
        target_group_content = f"{target_rating}{', ' if target_rating and target_audience else ''}{target_audience}"

    html = FILM_TEMPLATE.format(
        title_english=title_en,
        title_original=title_orig,
        genre=", ".join([g for g in fdata.get("Genre_List", []) if g] + (
            [fdata.get("Genre_Other", "")] if fdata.get("Genre_Other") else [])),
        year=fdata.get("Date_of_completion", "").split(".")[-1] if fdata.get("Date_of_completion") else "",
        duration=int(fdata.get("Runtime", "0:0:0").split(":")[0]) * 60 + int(
            fdata.get("Runtime", "0:0:0").split(":")[1]) if fdata.get("Runtime", "0:0:0") != "0:0:0" else "",
        language=fdata.get("Language_Original", ""),
        subtitles=fdata.get("Language_Subtitles", ""),
        country=fdata.get("Country_of_production", ""),
        poster_image=f"{POSTER_DIR}/{sanitize_filename(title_en)}/{sanitize_filename(title_en)}.jpg",
        still_image=f"{STILLS_DIR}/{sanitize_filename(title_en)}/{sanitize_filename(title_en)}_1.jpg",
        logline_html=optional_block("Logline", film.get("Logline")),
        synopsis_html=optional_block("Synopsis", film.get("Synopsis")),
        note_html=optional_block("Director's Note", film.get("Directors_Note")),
        target_html=optional_block("Target Group", target_group_content),
        topics_html=optional_block("Story Topics & Notes", film.get("Keywords")),
        festivals_html=list_block("", [f"{fest['Name_of_Festival']}, {fest['Country']} ({fest['Date']})" for fest in
                                       film.get("Festivals", [])]),
        awards_html=list_block("", [f"{a['Festival_Section_of_Competition']} ({a['Date']})" for a in
                                    film.get("Awards", [])]),
        crew_html=list_block("",
                             [f"{k.replace('_', ' ').replace('(s)', '')}: {v}" for k, v in film.get("Crew", {}).items()
                              if not isinstance(v, list) and v]),
        cast_html=list_block("", film.get("Crew", {}).get("Cast", [])),
        technical_html=list_block("",
                                  [f"{k.replace('_', ' ')}: {v}" for k, v in film.get("Technical_Details", {}).items()
                                   if v]),
        downloads=film.get("Downloads", "—"),
        status=fdata.get("Status", "—"),
        trailer_html=build_trailer_embed(film.get("Trailer_url"))
    )

    with open(os.path.join(OUTPUT_DIR, fname), 'w', encoding='utf-8') as out:
        out.write(html)

print(f"Generated {len(films)} film pages in '{OUTPUT_DIR}' folder.")