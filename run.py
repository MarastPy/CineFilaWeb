import subprocess

subprocess.run(["python", "questionare_info.py"])

subprocess.run(["python", "generate_pages.py"])

subprocess.run(["python", "join_data.py"])