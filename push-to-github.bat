@echo off
echo =======================================================
echo Pushing Hospital System to GitHub:
echo https://github.com/lakshitha320/Hospital-Sysytem.git
echo =======================================================
echo.
git push -u origin main
echo.
if %errorlevel% equ 0 (
    echo =======================================================
    echo [SUCCESS] Code successfully pushed to GitHub!
    echo Now you can go to vercel.com or render.com to deploy.
    echo =======================================================
) else (
    echo [ERROR] Push failed. If prompted for GitHub login, please sign in.
)
pause
