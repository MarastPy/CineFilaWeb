import os
from bs4 import BeautifulSoup
import json
import pandas as pd
from bs4.element import NavigableString, Tag  # Import Tag explicitly for type checking


def extract_cinefila_info(html_content):
    """
    Extracts data from input, textarea, and select elements within HTML content,
    with enhanced logic for dynamic and multi-valued fields like genre, festivals, and awards.
    """
    soup = BeautifulSoup(html_content, 'html.parser')
    extracted_data = {}

    def get_label_for_element(element):
        """
        Helper to find a meaningful label for an input element.
        Prioritizes preceding <label> or heading tags.
        """
        # Check for direct preceding <label>
        prev_sibling_label = element.find_previous_sibling('label')
        if prev_sibling_label and prev_sibling_label.get_text(strip=True):
            return prev_sibling_label.get_text(strip=True)

        # Check for ancestor <label>
        parent_label = element.find_parent('label')
        if parent_label and parent_label.get_text(strip=True):
            return parent_label.get_text(strip=True)

        # Check for `for` attribute on a label
        if element.has_attr('id'):
            label_for_id = soup.find('label', {'for': element['id']})
            if label_for_id and label_for_id.get_text(strip=True):
                return label_for_id.get_text(strip=True)

        # Check for placeholder or name attributes
        if element.has_attr('placeholder'):
            return element['placeholder'].strip()
        if element.has_attr('name'):
            return element['name'].strip()

        # Try to find a preceding heading (h2, h3) up to the section start
        # This is a more generalized way to find section labels
        current_el = element
        while current_el:
            prev_heading = current_el.find_previous(['h2', 'h3'])
            if prev_heading:
                # Make sure the heading is "above" the current element in the DOM tree
                # and doesn't belong to a different logical section
                # This check ensures we don't pick up a heading from a completely different part of the form
                if prev_heading.find_next_sibling(True, lambda tag: tag == element or tag.find(element)):
                    return prev_heading.get_text(strip=True)
            current_el = current_el.parent

        # Fallback to tag name if no other label found
        return element.name

    # --- Section 1: Film ---
    film_section = soup.find('h2', string='1. Film')
    if film_section:
        film_data = {}

        # Titles (Original, English, Other)
        title_label = soup.find('label', string='Title')
        if title_label:
            # Find the next 3 textareas after the "Title" label
            next_textareas = title_label.find_next_siblings('textarea', limit=3)
            film_data['Title_Original'] = next_textareas[0].get_text(strip=True) if len(next_textareas) > 0 else ""
            film_data['Title_English'] = next_textareas[1].get_text(strip=True) if len(next_textareas) > 1 else ""
            film_data['Title_Other'] = next_textareas[2].get_text(strip=True) if len(next_textareas) > 2 else ""
        else:  # Ensure all title fields exist even if label is missing
            film_data['Title_Original'] = ""
            film_data['Title_English'] = ""
            film_data['Title_Other'] = ""

        # Language (Original, Subtitles)
        lang_label = soup.find('label', string='Language')
        if lang_label:
            # Find the next 2 textareas after the "Language" label
            next_textareas = lang_label.find_next_siblings('textarea', limit=2)
            film_data['Language_Original'] = next_textareas[0].get_text(strip=True) if len(next_textareas) > 0 else ""
            film_data['Language_Subtitles'] = next_textareas[1].get_text(strip=True) if len(next_textareas) > 1 else ""
        else:
            film_data['Language_Original'] = ""
            film_data['Language_Subtitles'] = ""

        # Country of production
        country_prod_label = soup.find('label', string='Country of production')
        if country_prod_label:
            film_data['Country_of_production'] = country_prod_label.find_next_sibling('textarea').get_text(strip=True)
        else:
            film_data['Country_of_production'] = ""

        # Date of completion
        date_completion_label = soup.find('label', string='Date of completion')
        if date_completion_label:
            film_data['Date_of_completion'] = date_completion_label.find_next_sibling('textarea').get_text(strip=True)
        else:
            film_data['Date_of_completion'] = ""

        # Runtime
        runtime_label = soup.find('label', string='Runtime (for the series average value)')
        if runtime_label:
            film_data['Runtime'] = runtime_label.find_next_sibling('textarea').get_text(strip=True)
        else:
            film_data['Runtime'] = ""

        # Series/Episodes
        num_series_textarea = soup.find(string='Number of series:').find_next_sibling('textarea') if soup.find(
            string='Number of series:') else None
        num_episodes_textarea = soup.find(string='Number of episodes:').find_next_sibling('textarea') if soup.find(
            string='Number of episodes:') else None
        titles_runtime_episodes_textarea = soup.find('textarea', placeholder='S1E1: Name of episode (running time)')

        film_data['Number_of_series'] = num_series_textarea.get_text(strip=True) if num_series_textarea else ""
        film_data['Number_of_episodes'] = num_episodes_textarea.get_text(strip=True) if num_episodes_textarea else ""
        film_data['Titles_and_runtime_of_episodes'] = titles_runtime_episodes_textarea.get_text(
            strip=True) if titles_runtime_episodes_textarea else ""

        # First film?
        first_film_select = soup.find('label', string='First film?').find_next_sibling('select')
        if first_film_select:
            film_data['First_Film'] = first_film_select.find('option', selected=True).get_text(
                strip=True) if first_film_select.find('option', selected=True) else ""
        else:
            film_data['First_Film'] = ""

        # Genre
        genre_list = []
        genre_container = soup.find(id='genre-container')
        if genre_container:
            for select_tag in genre_container.find_all('select'):
                selected_option = select_tag.find('option', selected=True)
                if selected_option and selected_option.get_text(strip=True):
                    genre_list.append(selected_option.get_text(strip=True))
        film_data['Genre_List'] = genre_list

        # Genre Other (FIXED: Directly finding the <p> tag that contains "Other:" as a sibling to genre-container)
        film_data['Genre_Other'] = ""  # Initialize for consistency
        if genre_container:
            # Find the <p> tag that is a direct next sibling of the genre-container and contains "Other:"
            # We need to iterate through siblings because there are buttons/scripts between the div and the <p>
            current_sibling = genre_container.next_sibling
            while current_sibling:
                if isinstance(current_sibling, Tag) and current_sibling.name == 'p' and \
                        current_sibling.get_text(strip=True).startswith('Other:'):
                    other_textarea = current_sibling.find('textarea')
                    if other_textarea:
                        film_data['Genre_Other'] = other_textarea.get_text(strip=True)
                    break  # Found it, exit loop
                # Stop if we hit a new major section (like "Keywords") to avoid false positives
                if isinstance(current_sibling, Tag) and current_sibling.name in ['label', 'h2']:
                    break
                current_sibling = current_sibling.next_sibling

        # Keywords (story topics)
        keywords_label = soup.find('label', string='Keywords (story topics)')
        if keywords_label:
            film_data['Keywords'] = keywords_label.find_next_sibling('textarea').get_text(strip=True)
        else:
            film_data['Keywords'] = ""

        # Target group
        target_group = {
            'Rating': "",
            'Audience': "",
            'Other': ""
        }
        target_group_label = soup.find('label', string='Target group')
        if target_group_label:
            rating_select = target_group_label.find_next_sibling('select')
            if rating_select:
                target_group['Rating'] = rating_select.find('option', selected=True).get_text(
                    strip=True) if rating_select.find('option', selected=True) else ""

            audience_select = rating_select.find_next_sibling('select') if rating_select else None

            if audience_select:
                target_group['Audience'] = audience_select.find('option', selected=True).get_text(
                    strip=True) if audience_select.find('option', selected=True) else ""

                # The "Other:" text and its textarea are wrapped in a <p> tag here.
                # Find the <p> tag that follows the audience_select and contains "Other:"
                target_group_other_p_tag = audience_select.find_next_sibling('p', string=lambda t: t and 'Other:' in t)
                if target_group_other_p_tag:
                    # The textarea is INSIDE this <p> tag
                    other_textarea = target_group_other_p_tag.find('textarea')
                    if other_textarea:
                        target_group['Other'] = other_textarea.get_text(strip=True)
            # Fallback if no Audience select, but 'Other' might follow Rating select (unlikely if <p> wrapper is consistent)
            elif rating_select:
                target_group_other_p_tag = rating_select.find_next_sibling('p', string=lambda t: t and 'Other:' in t)
                if target_group_other_p_tag:
                    other_textarea = target_group_other_p_tag.find('textarea')
                    if other_textarea:
                        target_group['Other'] = other_textarea.get_text(strip=True)
            # Fallback if both selects are missing but 'Other' follows the main label (unlikely if <p> wrapper is consistent)
            elif target_group_label:
                target_group_other_p_tag = target_group_label.find_next_sibling('p',
                                                                                string=lambda t: t and 'Other:' in t)
                if target_group_other_p_tag:
                    other_textarea = target_group_other_p_tag.find('textarea')
                    if other_textarea:
                        target_group['Other'] = other_textarea.get_text(strip=True)

            film_data['Target_Group'] = target_group

        extracted_data['Film'] = film_data

    # --- Section 2: Premiere ---
    premiere_section = soup.find('h2', string='2. Premiere')
    if premiere_section:
        premiere_data = []
        premiere_container = soup.find(id='premiere-container')
        if premiere_container:
            for row in premiere_container.find_all('div', class_='row'):
                date = row.find('textarea', class_='date')
                country = row.find('textarea', class_='country')
                festival = row.find('textarea', class_='festival')
                premiere_data.append({
                    'Date': date.get_text(strip=True) if date else '',
                    'Country': country.get_text(strip=True) if country else '',
                    'Name_of_place_of_premiere': festival.get_text(strip=True) if festival else ''
                })
        extracted_data['Premiere'] = premiere_data
    else:
        extracted_data['Premiere'] = []

    # --- Section 3: Festivals ---
    festival_section = soup.find('h2', string='3. Festivals')
    if festival_section:
        festival_data = []
        festival_container = soup.find(id='festival-container')
        if festival_container:
            for row in festival_container.find_all('div', class_='row'):
                date = row.find('textarea', class_='date')
                country = row.find('textarea', class_='country')
                name_of_festival = row.find('textarea', class_='festival')
                festival_data.append({
                    'Date': date.get_text(strip=True) if date else '',
                    'Country': country.get_text(strip=True) if country else '',
                    'Name_of_Festival': name_of_festival.get_text(strip=True) if name_of_festival else ''
                })
        extracted_data['Festivals'] = festival_data
    else:
        extracted_data['Festivals'] = []

    # --- Section 4: Awards ---
    awards_section = soup.find('h2', string='4. Awards')
    if awards_section:
        awards_data = []
        awards_container = soup.find(id='awards-container')
        if awards_container:
            for row in awards_container.find_all('div', class_='row'):
                date = row.find('textarea', class_='date')
                country = row.find('textarea', class_='country')
                festival_section_competition = row.find('textarea', class_='festival')
                awards_data.append({
                    'Date': date.get_text(strip=True) if date else '',
                    'Country': country.get_text(strip=True) if country else '',
                    'Festival_Section_of_Competition': festival_section_competition.get_text(
                        strip=True) if festival_section_competition else ''
                })
        extracted_data['Awards'] = awards_data
    else:
        extracted_data['Awards'] = []

    # --- Section 5: Logline, 6: Synopsis, 7: Director's Note ---
    extracted_data['Logline'] = soup.find('h2', string='5. Logline (max. 150 characters)').find_next_sibling(
        'textarea').get_text(strip=True) if soup.find('h2', string='5. Logline (max. 150 characters)') and soup.find(
        'h2', string='5. Logline (max. 150 characters)').find_next_sibling('textarea') else ""
    extracted_data['Synopsis'] = soup.find('h2', string='6. Synopsis (max. 350 characters)').find_next_sibling(
        'textarea').get_text(strip=True) if soup.find('h2', string='6. Synopsis (max. 350 characters)') and soup.find(
        'h2', string='6. Synopsis (max. 350 characters)').find_next_sibling('textarea') else ""
    extracted_data['Directors_Note'] = soup.find('h2',
                                                 string='7. Director\'s note (max. 500 characters)').find_next_sibling(
        'textarea').get_text(strip=True) if soup.find('h2',
                                                      string='7. Director\'s note (max. 500 characters)') and soup.find(
        'h2', string='7. Director\'s note (max. 500 characters)').find_next_sibling('textarea') else ""

    # --- Section 8: Crew ---
    crew_data = {}
    crew_section_h2 = soup.find('h2', string='8. Crew')
    if crew_section_h2:
        crew_labels = [
            ("Director(s):", "Director(s)"),
            ("Screenplay writer(s):", "Screenplay_writer(s)"),
            ("Director(s) of Photography:", "Director(s)_of_Photography"),
            ("Editor(s):", "Editor(s)"),
            ("Sound director(s):", "Sound_director(s)"),
            ("Art director(s):", "Art_director(s)"),
            ("Music composer(s):", "Music_composer(s)"),
            ("Cast (actor's name: role):", "Cast")
        ]

        # Start looking for elements directly after the Crew H2
        current_context = crew_section_h2
        for expected_label, key_name in crew_labels:
            # Find the label within the current context's subsequent siblings
            found_label = current_context.find_next_sibling('label', string=expected_label)
            if found_label:
                textarea = found_label.find_next_sibling('textarea')
                if textarea:
                    # For 'Cast', split by newlines into a list
                    if key_name == "Cast":
                        crew_data[key_name] = [item.strip() for item in textarea.get_text(strip=True).split('\n') if
                                               item.strip()]
                    else:
                        crew_data[key_name] = textarea.get_text(strip=True)
                else:
                    crew_data[key_name] = ""  # If textarea is missing for found label
                current_context = found_label  # Advance context to the found label for next search
            else:
                crew_data[key_name] = ""  # Ensure key exists if label itself is missing
    extracted_data['Crew'] = crew_data

    # --- Section 9: Director's bio ---
    director_bio_data = {}
    # Ensured Date_of_birth is correctly captured
    date_of_birth_label = soup.find('label', string='Date of birth:')
    if date_of_birth_label:
        date_of_birth_textarea = date_of_birth_label.find_next_sibling('textarea')
        director_bio_data['Date_of_birth'] = director_bio_data['Date_of_birth'] = date_of_birth_textarea.get_text(
            strip=True) if date_of_birth_textarea else ""
    else:
        director_bio_data['Date_of_birth'] = ""

    bio_text_label = soup.find('label', string='Max. 500 characters:')
    if bio_text_label:
        bio_text_textarea = bio_text_label.find_next_sibling('textarea')
        director_bio_data['Bio_Text'] = bio_text_textarea.get_text(strip=True) if bio_text_textarea else ""
    else:
        director_bio_data['Bio_Text'] = ""

    extracted_data['Director_Bio'] = director_bio_data

    # --- Section 10: Director's filmography ---
    filmography_h2 = soup.find('h2', string="10. Director's filmography")
    if filmography_h2:
        filmography_textarea = filmography_h2.find_next_sibling('textarea')
        if filmography_textarea:
            extracted_data['Director_Filmography'] = [item.strip() for item in
                                                      filmography_textarea.get_text(strip=True).split('\n') if
                                                      item.strip()]
        else:
            extracted_data['Director_Filmography'] = []  # Ensure it's an empty list if not found
    else:
        extracted_data['Director_Filmography'] = []  # Ensure the key exists

    # --- Section 11: Technical details ---
    tech_details = {}
    tech_details_h2 = soup.find('h2', string='11. Technical details')
    if tech_details_h2:
        # Shooting format
        shooting_format_label = soup.find('label', string='Shooting format')
        if shooting_format_label:
            film_select = shooting_format_label.find_next_sibling('select')
            video_select = film_select.find_next_sibling('select') if film_select else None

            # The "Other:" text is a plain text node, then the textarea.
            # Beautiful Soup's find_next_sibling('textarea') will skip the text node
            # and directly find the next textarea tag.
            other_textarea = video_select.find_next_sibling('textarea') if video_select else None

            tech_details['Shooting_Format'] = {
                'Film': film_select.find('option', selected=True).get_text(
                    strip=True) if film_select and film_select.find('option', selected=True) else '',
                'Video': video_select.find('option', selected=True).get_text(
                    strip=True) if video_select and video_select.find('option', selected=True) else '',
                'Other': other_textarea.get_text(strip=True) if other_textarea else ''
            }
        else:
            tech_details['Shooting_Format'] = {'Film': '', 'Video': '', 'Other': ''}

        # Camera
        camera_label = soup.find('label', string='Camera:')
        if camera_label:
            tech_details['Camera'] = camera_label.find_next_sibling('textarea').get_text(strip=True)
        else:
            tech_details['Camera'] = ""

        # Anamorphic lens
        anamorphic_label = soup.find('label', string='Anamorphic lens:')
        if anamorphic_label:
            tech_details['Anamorphic_Lens'] = anamorphic_label.find_next_sibling('select').find('option',
                                                                                                selected=True).get_text(
                strip=True) if anamorphic_label.find_next_sibling('select') and anamorphic_label.find_next_sibling(
                'select').find('option', selected=True) else ""
        else:
            tech_details['Anamorphic_Lens'] = ""

        # Animation technique
        animation_label = soup.find('label', string='Animation technique')
        if animation_label:
            tech_details['Animation_Technique'] = animation_label.find_next_sibling('select').find('option',
                                                                                                   selected=True).get_text(
                strip=True) if animation_label.find_next_sibling('select') and animation_label.find_next_sibling(
                'select').find('option', selected=True) else ""
            tech_details['Animation_Technique_Other'] = animation_label.find_next('textarea').get_text(
                strip=True) if animation_label.find_next('textarea') else ""
        else:
            tech_details['Animation_Technique'] = ""
            tech_details['Animation_Technique_Other'] = ""

        # Video editing software
        video_editing_label = soup.find('label', string='Video editing software')
        if video_editing_label:
            tech_details['Video_Editing_Software'] = video_editing_label.find_next_sibling('textarea').get_text(
                strip=True)
        else:
            tech_details['Video_Editing_Software'] = ""

        # Digital audio workstation
        daw_label = soup.find('label', string='Digital audio workstation')
        if daw_label:
            tech_details['Digital_Audio_Workstation'] = daw_label.find_next_sibling('textarea').get_text(strip=True)
        else:
            tech_details['Digital_Audio_Workstation'] = ""

        # Screening format
        screening_format_label = soup.find('label', string='Screening format')
        if screening_format_label:
            film_select = screening_format_label.find_next_sibling('select')
            tape_select = film_select.find_next_sibling('select') if film_select else None
            file_select = tape_select.find_next_sibling('select') if tape_select else None
            other_textarea = file_select.find_next_sibling('textarea') if file_select else None

            tech_details['Screening_Format'] = {
                'Film': film_select.find('option', selected=True).get_text(
                    strip=True) if film_select and film_select.find('option', selected=True) else '',
                'Tape': tape_select.find('option', selected=True).get_text(
                    strip=True) if tape_select and tape_select.find('option', selected=True) else '',
                'File': file_select.find('option', selected=True).get_text(
                    strip=True) if file_select and file_select.find('option', selected=True) else '',
                'Other': other_textarea.get_text(strip=True) if other_textarea else ''
            }
        else:
            tech_details['Screening_Format'] = {'Film': '', 'Tape': '', 'File': '', 'Other': ''}

        # Resolution
        resolution_label = soup.find('label', string='Resolution')
        if resolution_label:
            tech_details['Resolution'] = resolution_label.find_next_sibling('select').find('option',
                                                                                           selected=True).get_text(
                strip=True) if resolution_label.find_next_sibling('select') and resolution_label.find_next_sibling(
                'select').find('option', selected=True) else ""
            tech_details['Resolution_Other'] = resolution_label.find_next('textarea').get_text(
                strip=True) if resolution_label.find_next('textarea') else ""
        else:
            tech_details['Resolution'] = ""
            tech_details['Resolution_Other'] = ""

        # Speed (FIXED: Robustly handling <p> tags for FPS and FPS Other)
        speed_label = soup.find('label', string='Speed')
        if speed_label:
            scan_method_select = speed_label.find_next_sibling(
                'select')  # This gets the first select after "Speed" label

            fps_select_val = ""
            fps_other_val = ""

            # Find the <p> tag that contains "FPS (frame per second):" which is a sibling to scan_method_select
            fps_label_p_tag = scan_method_select.find_next_sibling('p')
            while fps_label_p_tag:
                if isinstance(fps_label_p_tag, Tag) and fps_label_p_tag.name == 'p' and \
                        'FPS (frame per second):' in fps_label_p_tag.get_text(strip=True):
                    # The FPS select is INSIDE this <p> tag
                    fps_select = fps_label_p_tag.find('select')
                    if fps_select:
                        selected_option = fps_select.find('option', selected=True)
                        if selected_option:
                            fps_select_val = selected_option.get_text(strip=True)

                    # Now, find the <p> tag for "Other:" which is a sibling to the FPS's <p> tag.
                    fps_other_p_tag = fps_label_p_tag.find_next_sibling('p')
                    while fps_other_p_tag:
                        if isinstance(fps_other_p_tag, Tag) and fps_other_p_tag.name == 'p' and \
                                fps_other_p_tag.get_text(strip=True).startswith('Other:'):
                            # The textarea is INSIDE this "Other:" <p> tag
                            fps_other_textarea_element = fps_other_p_tag.find('textarea')
                            if fps_other_textarea_element:
                                fps_other_val = fps_other_textarea_element.get_text(strip=True)
                            break  # Found FPS Other, exit inner loop
                        # Stop if we hit a new label or h2, indicating a new section
                        if isinstance(fps_other_p_tag, Tag) and fps_other_p_tag.name in ['label', 'h2']:
                            break
                        fps_other_p_tag = fps_other_p_tag.next_sibling
                    break  # Found FPS, exit outer loop
                # Stop if we hit a new label or h2 before finding the FPS p tag
                if isinstance(fps_label_p_tag, Tag) and fps_label_p_tag.name in ['label', 'h2']:
                    break
                fps_label_p_tag = fps_label_p_tag.next_sibling

            tech_details['Speed'] = {
                'Scan_Method': scan_method_select.find('option', selected=True).get_text(
                    strip=True) if scan_method_select and scan_method_select.find('option', selected=True) else '',
                'FPS': fps_select_val,
                'FPS_Other': fps_other_val
            }
        else:
            tech_details['Speed'] = {'Scan_Method': '', 'FPS': '', 'FPS_Other': ''}

        # Aspect ratio
        aspect_ratio_label = soup.find('label', string='Aspect ratio')
        if aspect_ratio_label:
            tech_details['Aspect_Ratio'] = aspect_ratio_label.find_next_sibling('select').find('option',
                                                                                               selected=True).get_text(
                strip=True) if aspect_ratio_label.find_next_sibling('select') and aspect_ratio_label.find_next_sibling(
                'select').find('option', selected=True) else ""
            tech_details['Aspect_Ratio_Other'] = aspect_ratio_label.find_next('textarea').get_text(
                strip=True) if aspect_ratio_label.find_next('textarea') else ""
        else:
            tech_details['Aspect_Ratio'] = ""
            tech_details['Aspect_Ratio_Other'] = ""

        # Sound mix
        sound_mix_label = soup.find('label', string='Sound mix')
        if sound_mix_label:
            tech_details['Sound_Mix'] = sound_mix_label.find_next_sibling('select').find('option',
                                                                                         selected=True).get_text(
                strip=True) if sound_mix_label.find_next_sibling('select') and sound_mix_label.find_next_sibling(
                'select').find('option', selected=True) else ""
            tech_details['Sound_Mix_Other'] = sound_mix_label.find_next('textarea').get_text(
                strip=True) if sound_mix_label.find_next('textarea') else ""
        else:
            tech_details['Sound_Mix'] = ""
            tech_details['Sound_Mix_Other'] = ""

        # Colour
        colour_label = soup.find('label', string='Colour')
        if colour_label:
            tech_details['Colour'] = colour_label.find_next_sibling('select').find('option', selected=True).get_text(
                strip=True) if colour_label.find_next_sibling('select') and colour_label.find_next_sibling(
                'select').find('option', selected=True) else ""
        else:
            tech_details['Colour'] = ""

        # Notes (Technical details)
        notes_label = soup.find('label', string='Notes')
        if notes_label:
            tech_details['Notes'] = notes_label.find_next_sibling('textarea').get_text(strip=True)
        else:
            tech_details['Notes'] = ""

    extracted_data['Technical_Details'] = tech_details

    # --- Section 12: Production ---
    production_data = {}
    production_h2 = soup.find('h2', string='12. Production')
    if production_h2:
        # Helper to parse multi-line address blocks
        def parse_address_block(textarea_element):
            block_data = {}
            if textarea_element:
                lines = [line.strip() for line in textarea_element.get_text(strip=False).split('\n') if line.strip()]
                for line in lines:
                    if ':' in line:
                        key, value = line.split(':', 1)
                        block_data[key.strip()] = value.strip()
                    else:
                        # If a line doesn't have a colon, treat it as part of the 'Name' if 'Name' isn't already set
                        # This handles cases like "Name:\nValue" vs just "Value" for Name
                        if not block_data.get('Name'):
                            block_data['Name'] = line.strip()
                        else:  # Append to name if it's already there and no colon
                            block_data['Name'] += f" {line.strip()}"

            # Ensure all expected keys are present, even if empty, for consistent Excel columns
            expected_keys = ["Name", "Address", "Postal code, city", "Country", "WEB"]
            for key in expected_keys:
                if key not in block_data:
                    block_data[key] = ""
            return block_data

        producer_label = soup.find('label', string='Producers:')
        if producer_label:
            production_data['Producers'] = parse_address_block(producer_label.find_next_sibling('textarea'))
        else:
            production_data['Producers'] = parse_address_block(None)  # Pass None to get empty structure

        prod_company_label = soup.find('label', string='Production company:')
        if prod_company_label:
            production_data['Production_Company'] = parse_address_block(
                prod_company_label.find_next_sibling('textarea'))
        else:
            production_data['Production_Company'] = parse_address_block(None)

        co_producer_label = soup.find('label', string='Co-producer:')
        if co_producer_label:
            production_data['Co_Producer'] = parse_address_block(co_producer_label.find_next_sibling('textarea'))
        else:
            production_data['Co_Producer'] = parse_address_block(None)

    extracted_data['Production'] = production_data

    return extracted_data


def save_to_json(data, output_path):
    """
    Saves the extracted data to a JSON file.
    """
    try:
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=4)
        print(f"Data successfully saved to {output_path}")
    except IOError as e:
        print(f"Error saving JSON file {output_path}: {e}")


def process_html_files_in_folder(folder_path, output_dir):
    """
    Iterates through HTML files in a given folder, extracts data,
    and saves it as a single JSON file and a single Excel file.
    """
    if not os.path.isdir(folder_path):
        print(f"Error: Folder '{folder_path}' not found.")
        return

    os.makedirs(output_dir, exist_ok=True)  # Create output directory if it doesn't exist

    all_extracted_data = []  # List to store data from all HTML files

    for filename in os.listdir(folder_path):
        if filename.endswith(".html"):
            file_path = os.path.join(folder_path, filename)
            print(f"\nProcessing {file_path}...")
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    html_content = f.read()

                extracted_data = extract_cinefila_info(html_content)
                extracted_data['Source_File'] = filename  # Add filename as a column
                all_extracted_data.append(extracted_data)

            except Exception as e:
                print(f"Error processing {file_path}: {e}")

    # Save all extracted data to a single JSON file
    if all_extracted_data:
        json_output_path = os.path.join(output_dir, "all_html_data.json")
        save_to_json(all_extracted_data, json_output_path)

        # Save all extracted data to a single Excel file
        excel_output_path = os.path.join(output_dir, "all_html_data.xlsx")
        try:
            df = pd.DataFrame(all_extracted_data)
            # Flatten dictionaries in the DataFrame for better Excel representation
            # This is a common approach for nested data when saving to flat formats like Excel
            df_flat = pd.json_normalize(all_extracted_data)
            df_flat.to_excel(excel_output_path, index=False, engine='openpyxl')
            print(f"All data successfully saved to {excel_output_path}")
        except ImportError:
            print(
                "Warning: 'openpyxl' is not installed. Excel file will not be created. Please install it using 'pip install openpyxl pandas'.")
        except Exception as e:
            print(f"Error saving Excel file {excel_output_path}: {e}")
    else:
        print("No HTML files processed or no data extracted.")


# --- Example Usage ---
if __name__ == "__main__":
    # Define the folder containing your HTML files
    # Use a raw string (r"...") for Windows paths to avoid SyntaxError
    # IMPORTANT: Change this path to the actual directory where your HTML files are located.
    html_files_folder = r'questionare'

    # Define the output directory for JSON and Excel files
    output_directory = 'extracted_data'  # This folder will be created in the script's execution directory

    # Ensure the html_files_folder exists.
    # The script will create 'extracted_data' if it doesn't exist.
    os.makedirs(html_files_folder, exist_ok=True)  # Ensure the input folder exists

    # Run the processing
    process_html_files_in_folder(html_files_folder, output_directory)

    print(f"\nScript finished. Check the '{output_directory}' folder for the JSON and Excel files.")
    print("You can modify 'html_files_folder' to point to your actual directory of HTML files.")
