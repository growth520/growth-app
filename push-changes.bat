@echo off
echo Adding all changes...
git add .

echo Committing changes...
git commit -m "Add enhanced profile page with post privacy management and deletion features"

echo Pushing to GitHub...
git push origin main

echo Done! Changes pushed to GitHub.
pause 