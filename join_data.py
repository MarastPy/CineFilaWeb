import json
import re

# Step 1: Fix and load aditional_info.json
with open("data/aditional_info.json", "r", encoding="utf-8") as f:
    raw_text = f.read()

# Fix common JSON formatting issues
fixed_text = re.sub(r",\s*([}\]])", r"\1", raw_text)
fixed_text = fixed_text.replace('"Review:', '"Review"')
fixed_text = fixed_text.replace('"Review" "Milan Marčetić"', '"Review": "Milan Marčetić"')

aditional_info = json.loads(fixed_text)

# Step 2: Load all_html_data.json
with open("data/all_html_data.json", "r", encoding="utf-8") as f:
    all_html_data = json.load(f)


# Step 3: Merge based on Title_Original and Title_English
def match_titles(film1, film2):
    return (
            film1["Title_Original"] == film2["Title_Original"] and
            film1["Title_English"] == film2["Title_English"]
    )


for film_entry in all_html_data:
    for info_entry in aditional_info:
        if match_titles(film_entry["Film"], info_entry["Film"]):
            for key, value in info_entry.items():
                if key != "Film":  # Don't overwrite the Film object
                    film_entry[key] = value

# Step 4: Save the result
with open("data/all_html_data.json", "w", encoding="utf-8") as f:
    json.dump(all_html_data, f, ensure_ascii=False, indent=2)

print("✅ Merged file saved as data/all_html_data.json")
