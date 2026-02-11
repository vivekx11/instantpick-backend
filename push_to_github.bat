@echo off
echo ========================================
echo   Pushing Backend to GitHub
echo ========================================
echo.

echo [1/5] Adding all files...
git add .
if %errorlevel% neq 0 (
    echo Error adding files!
    pause
    exit /b 1
)
echo Done!
echo.

echo [2/5] Committing changes...
git commit -m "Updated backend with Cloudinary integration and all routes"
if %errorlevel% neq 0 (
    echo Note: No changes to commit or already committed
)
echo.

echo [3/5] Setting remote repository...
git remote remove origin 2>nul
git remote add origin https://github.com/vivekx11/instantpick-backend.git
echo Done!
echo.

echo [4/5] Setting branch to main...
git branch -M main
echo Done!
echo.

echo [5/5] Pushing to GitHub...
echo.
echo IMPORTANT: GitHub credentials maangega
echo Username: vivekx11
echo Password: Personal Access Token (https://github.com/settings/tokens)
echo.
git push -u origin main --force
echo.

if %errorlevel% equ 0 (
    echo ========================================
    echo   SUCCESS! Push Complete!
    echo ========================================
    echo.
    echo Check your repository:
    echo https://github.com/vivekx11/instantpick-backend
    echo.
) else (
    echo ========================================
    echo   ERROR! Push Failed!
    echo ========================================
    echo.
    echo Possible reasons:
    echo 1. Authentication failed - Use Personal Access Token
    echo 2. Network issue - Check internet connection
    echo 3. Repository access - Check permissions
    echo.
)

pause
