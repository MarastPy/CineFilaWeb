import pandas as pd
import os

# Path to your Excel file
excel_path = r"C:\Users\maha\PycharmProjects\CineFila\extracted_data\all_html_data.json"

# Output folder for generated HTML pages
output_dir = r"C:\Users\maha\PycharmProjects\CineFila\film_pages"
os.makedirs(output_dir, exist_ok=True)

# Read Excel
try:
    df = pd.read_excel(excel_path)
except FileNotFoundError:
    print(f"Error: Excel file not found at {excel_path}")
    exit()
except Exception as e:
    print(f"Error reading Excel file: {e}")
    exit()

# Basic HTML Template (customize as needed)
html_template = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{title}</title>
    <style>
        body {{
            background: #1f1f1f;
            color: #f2f2f2;
            font-family: Arial, sans-serif;
            padding: 40px;
        }}
        .container {{
            display: flex;
            gap: 40px;
            max-width: 1200px;
            margin: auto;
        }}
        .poster {{
            flex: 1;
        }}
        .poster img {{
            max-width: 100%;
            border: 3px solid #ccc;
        }}
        .info {{
            flex: 2;
        }}
        h1 {{
            font-size: 36px;
            margin-bottom: 10px;
        }}
        .meta {{
            font-size: 14px;
            color: #aaa;
            margin-bottom: 20px;
        }}
        .section {{
            margin-bottom: 20px;
        }}
        .section h3 {{
            color: #ffcc00;
            margin-bottom: 5px;
        }}
        .logo-top {{
            background: #121417;
            text-align: center;
            padding: 15px 20px;
        }}
        .logo-top img {{
            height: 60px;
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
    </style>
</head>
<body>
    <div class="logo-top">
        <img src="G:\My Drive\CineFilcka\graphics\logo\Cinefila_logo_white_web.svg" alt="Cinefila Logo">
    </div>
    <div class="container">
        <div class="poster">
            <img src="{image_path}" alt="{title} poster">
        </div>
        <div class="info">
            <h1>{title}</h1>
            <div class="meta">
                <strong>Original Title:</strong> {original_title}<br>
                <strong>Year:</strong> {year} &nbsp; | &nbsp;
                <strong>Duration:</strong> {duration} &nbsp; | &nbsp;
                <strong>Country:</strong> {country}
            </div>
            <div class="section">
                <h3>Target group</h3>
                <p>{target_group}</p>
            </div>
            <div class="section">
                <h3>Story topics</h3>
                <p>{topics}</p>
            </div>
            <div class="section">
                <h3>Logline</h3>
                <p>{logline}</p>
            </div>
            <div class="section">
                <h3>Synopsis</h3>
                <p>{synopsis}</p>
            </div>
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

# Store paths for linking later
film_links = []

# Loop through each film in the DataFrame
for _, row in df.iterrows():
    title = str(row.get('film_title_original', 'Untitled'))
    safe_title = title.replace(" ", "_").lower()
    output_path = os.path.join(output_dir, f"{safe_title}.html")

    # Fill the template
    html = html_template.format(
        title=title,
        original_title=row.get('film_title_original', ''),
        year=row.get('Year', ''),
        duration=row.get('Duration', ''),
        country=row.get('Country', ''),
        image_path=row.get('Image Path', 'placeholder.jpg'),
        target_group=str(row.get('film_target_group_rating', '')) + ' ' + str(row.get('film_target_group_audience', '')),
        topics=row.get('film_keywords', ''),
        logline=row.get('logline', ''),
        synopsis=row.get('synopsis', '')
    )

    # Write to file
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(html)

    # Save for index
    film_links.append(f'<li><a href="film_pages/{safe_title}.html">{title}</a></li>')

# Optional: Create an index.html page listing all films
index_html = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Film Catalogue</title>
    <style>
        body {{
            background: #121212;
            color: white;
            font-family: sans-serif;
            padding: 40px;
        }}
        h1 {{ color: #ffcc00; }}
        ul {{ list-style: none; padding: 0; }}
        li {{ margin: 10px 0; }}
        a {{
            color: #00ccff;
            text-decoration: none;
        }}
        a:hover {{
            text-decoration: underline;
        }}
    </style>
</head>
<body>
    <h1>Film Catalogue</h1>
    <ul>
        {''.join(film_links)}
    </ul>
</body>
</html>
"""

# Save index
with open(os.path.join(output_dir, "../index.html"), 'w', encoding='utf-8') as f:
    f.write(index_html)

print(f"Generated HTML pages in: {output_dir}")
print(f"Generated index page in: {os.path.join(output_dir, '../index.html')}")

