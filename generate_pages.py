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
    }}
    h1, h2, h3 {{
      margin-bottom: 0;
    }}
    .subtitle {{
      font-style: italic;
      margin-bottom: 10px;
    }}
    .info-line {{
      margin-bottom: 20px;
    }}
    .poster-section {{
      display: flex;
      gap: 20px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }}
    .poster-section img {{
      max-width: 300px;
      border: 2px solid white;
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
    }}
    .half {{
      flex: 1;
      min-width: 300px;
    }}
    a {{
      color: white;
    }}
  </style>
</head>
<body>
  <h1>{title_english}</h1>
  <div class="subtitle">Original Title: {title_original}</div>
  <div class="info-line">{genre} | {year} | {duration} minutes | {language} with {subtitles} subtitles | {country}</div>

  <div class="poster-section">
    <div>
      <img src="{poster_image}" alt="Poster" />
      <div class="label">Poster</div>
      <div><a href="{poster_image}">Link to poster</a></div>
      <div class="label">Still</div>
      <img src="{still_image}" alt="Still" />
    </div>

    <div class="half">
      {logline_html}
      {synopsis_html}
      {note_html}
      {target_html}
      {topics_html}
    </div>
  </div>

  <div class="block">
    <h3>Festival, Crew, Cast & Technical Info</h3>
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
</html>"""

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
    return list_block("Technical Specs", [f"{k.replace('_', ' ').title()}: {v}" for k, v in specs.items()]) if specs else ""

def build_festivals(fests):
    return list_block("Festivals", [f"{f.get('Name_of_Festival', '')} ({f.get('Year', '')})" for f in fests]) if fests else ""

# ---------------------- Main Logic ----------------------
os.makedirs(OUTPUT_DIR, exist_ok=True)

with open(JSON_PATH, 'r', encoding='utf-8') as f:
    films = json.load(f)

for film in films:
    fdata = film.get("Film", {})
    title_en = fdata.get("Title_English", "Untitled")
    title_orig = fdata.get("Title_Original", "")
    fname = sanitize_filename(title_en) + ".html"

    html = FILM_TEMPLATE.format(
        title_english=title_en,
        title_original=title_orig,
        genre=", ".join(fdata.get("Genre_List", []) + [fdata.get("Genre_Other", "")]),
        year=fdata.get("Date_of_completion", "").split(".")[-1],
        duration=int(fdata.get("Runtime", "0:0:0").split(":")[0]) * 60 + int(fdata.get("Runtime", "0:0:0").split(":")[1]),
        language=fdata.get("Language_Original", ""),
        subtitles=fdata.get("Language_Subtitles", ""),
        country=fdata.get("Country_of_production", ""),
        poster_image=f"{POSTER_DIR}/{sanitize_filename(title_en)}/{sanitize_filename(title_en)}.jpg",
        still_image=f"{STILLS_DIR}/{sanitize_filename(title_en)}/{sanitize_filename(title_en)}_1.png",
        logline_html=optional_block("Logline", film.get("Logline")),
        synopsis_html=optional_block("Synopsis", film.get("Synopsis")),
        note_html=optional_block("Director's Note", film.get("Directors_Note")),
        target_html=optional_block("Target Group", f"{fdata.get('Target_Group', {}).get('Rating', '')}, {fdata.get('Target_Group', {}).get('Audience', '')}"),
        topics_html=optional_block("Story Topics & Notes", fdata.get("Keywords")),
        festivals_html=list_block("", [f"{fest['Name_of_Festival']}, {fest['Country']} ({fest['Date']})" for fest in film.get("Festivals", [])]),
        awards_html=list_block("", [f"{a['Festival_Section_of_Competition']} ({a['Date']})" for a in film.get("Awards", [])]),
        crew_html=list_block("", [f"{k.replace('_', ' ').replace('(s)', '')}: {v}" for k, v in film.get("Crew", {}).items() if not isinstance(v, list)]),
        cast_html=list_block("", film.get("Crew", {}).get("Cast", [])),
        technical_html=list_block("", [f"{k.replace('_', ' ')}: {v}" for k, v in film.get("Technical_Details", {}).items() if v]),
        downloads=film.get("Downloads", "—"),
        status=fdata.get("Status", "—")
    )

    with open(os.path.join(OUTPUT_DIR, fname), 'w', encoding='utf-8') as out:
        out.write(html)

print(f"Generated {len(films)} film pages in '{OUTPUT_DIR}' folder.")
