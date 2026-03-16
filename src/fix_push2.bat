cd /d "C:\Users\harsh\OneDrive\Desktop\AOAI\remix-of-serene-route"
git rm -r --cached src/serviceAccountKey.json
git rm -r --cached src/6accident_data.csv
git rm -r --cached src/vijayawada_blackspots.csv
git rm -r --cached push_data.py
git commit --amend -m "Integrated Vijayawada blackspots and optimized UI"
git push origin main
