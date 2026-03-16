cd /d "C:\Users\harsh\OneDrive\Desktop\AOAI\remix-of-serene-route"
git reset --soft HEAD~1
git rm -r --cached src/serviceAccountKey.json
git rm -r --cached src/6accident_data.csv
git rm -r --cached src/vijayawada_blackspots.csv
git add .
git commit -m "Integrated Vijayawada blackspots and optimized UI (without secrets)"
git push origin main
