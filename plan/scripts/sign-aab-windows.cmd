@echo off
REM sign-aab-windows.cmd - owner-run signing of the Play bundle with the UPLOAD key (D-16).
REM
REM Usage (from the repo root, in a normal cmd.exe window - no admin needed):
REM   plan\scripts\sign-aab-windows.cmd
REM
REM Input : the newest out\play\*-unsigned.aab (made by: bash plan/scripts/build-play-aab.sh,
REM         or downloaded from the "Android Play AAB" workflow artifact into out\play\).
REM Output: the same name without "-unsigned" (the file you upload to Play) and
REM         a NON-SECRET report next to it (signer fingerprint, size, SHA-256).
REM
REM jarsigner asks for the keystore password (and, only if it differs, the key password).
REM Nothing is stored: no password in a file, a variable, the repo or a log.
REM Never commit the .jks, the passwords, or anything under out\.

setlocal EnableDelayedExpansion
if "%JAVA_HOME%"=="" for /d %%d in ("C:\Program Files\Eclipse Adoptium\jdk-17*") do set "JAVA_HOME=%%~fd"
set "PATH=%JAVA_HOME%\bin;%PATH%"
set "KS=C:\keys\lft-upload.jks"
REM Upload certificate SHA-256 recorded in release/ANDROID_SIGNING.md (RC3, 2026-10-14).
set "EXPECTED=D2:80:D1:DE:AC:D8:2B:6F:AE:B5:2F:0C:1A:CE:53:27:76:CD:1C:6F:73:AA:DB:BF:31:33:DA:ED:DC:ED:31:82"

if not exist "%KS%" ( echo [sign-aab] %KS% not found - the upload key must exist; never create a second key. & exit /b 1 )
where jarsigner >nul 2>nul || ( echo [sign-aab] jarsigner not found - set JAVA_HOME to JDK 17 & exit /b 1 )

set "IN="
for /f "delims=" %%f in ('dir /b /o-d "out\play\*-unsigned.aab" 2^>nul') do if not defined IN set "IN=out\play\%%f"
if not defined IN ( echo [sign-aab] no out\play\*-unsigned.aab - run: bash plan/scripts/build-play-aab.sh & exit /b 1 )
set "OUT=!IN:-unsigned.aab=.aab!"
set "REPORT=!OUT!.signing-report.txt"
echo [sign-aab] input : !IN!
echo [sign-aab] output: !OUT!

echo [sign-aab] jarsigner (type the keystore password when asked)
jarsigner -keystore "%KS%" -sigalg SHA256withRSA -digestalg SHA-256 -signedjar "!OUT!" "!IN!" upload
if errorlevel 1 ( echo [sign-aab] jarsigner failed & if exist "!OUT!" del "!OUT!" & exit /b 1 )

> "!REPORT!" echo Play AAB signing report (non-secret) - %DATE% %TIME%
>> "!REPORT!" echo file: !OUT!
>> "!REPORT!" echo.
>> "!REPORT!" echo == jarsigner -verify ==
jarsigner -verify "!OUT!" >> "!REPORT!" 2>&1
findstr /C:"jar verified" "!REPORT!" >nul || ( echo [sign-aab] verify FAILED - see !REPORT! & exit /b 1 )
>> "!REPORT!" echo.
>> "!REPORT!" echo == signer certificate ==
keytool -printcert -jarfile "!OUT!" | findstr /R /C:"Owner:" /C:"SHA256:" >> "!REPORT!"
findstr /C:"%EXPECTED%" "!REPORT!" >nul || ( echo [sign-aab] WRONG KEY: the signer SHA-256 is not the recorded upload key - do NOT upload; see !REPORT! & exit /b 1 )
>> "!REPORT!" echo upload key fingerprint matches release/ANDROID_SIGNING.md
>> "!REPORT!" echo.
>> "!REPORT!" echo == sha256 + size ==
certutil -hashfile "!OUT!" SHA256 | findstr /V "CertUtil" >> "!REPORT!"
for %%f in ("!OUT!") do >> "!REPORT!" echo size-bytes: %%~zf

echo.
type "!REPORT!"
echo.
echo [sign-aab] DONE. Upload !OUT! to Play Console - Testing - Closed testing (release/PLAY_SIGNING.md, step 5).
endlocal
