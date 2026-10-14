@echo off
REM sign-apk-windows.cmd - owner-run signing of a locally built release APK (P0 / RC3).
REM
REM Usage (from the repo root, in a normal cmd.exe window - no admin, no PowerShell needed):
REM   plan\scripts\sign-apk-windows.cmd [rc-number]      (default rc-number = 3)
REM
REM What it does:
REM   1. Creates the owner-held upload keystore C:\keys\lft-upload.jks if it does not exist
REM      (keytool asks YOU for the passwords and the DN; nothing is stored in files or the repo).
REM   2. zipalign + apksigner sign (apksigner asks for the keystore password) ->
REM      out\learning-french-with-tracy-v1.0.0-rc.N.apk
REM   3. apksigner verify, aapt2 badging/permissions, SHA-256.
REM   4. Writes the NON-SECRET results to out\rc.N-signing-report.txt (cert fingerprint, DN,
REM      badging, permissions, hash) for the release records.
REM
REM Never commit the .jks, the passwords, or anything under out\.

setlocal
set "RC=%~1"
if "%RC%"=="" set "RC=3"
if "%ANDROID_HOME%"=="" set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
if "%JAVA_HOME%"=="" for /d %%d in ("C:\Program Files\Eclipse Adoptium\jdk-17*") do set "JAVA_HOME=%%~fd"
set "PATH=%JAVA_HOME%\bin;%PATH%"
set "BT=%ANDROID_HOME%\build-tools\36.0.0"
set "KS=C:\keys\lft-upload.jks"
set "APK=android\app\build\outputs\apk\release\app-release.apk"
set "OUT=out\learning-french-with-tracy-v1.0.0-rc.%RC%.apk"
set "REPORT=out\rc.%RC%-signing-report.txt"

if not exist "%APK%" (
  echo [sign] %APK% not found - run the Gradle build first:
  echo        cd android ^&^& gradlew.bat :app:assembleRelease --no-daemon
  exit /b 1
)
if not exist "%BT%\apksigner.bat" (
  echo [sign] build-tools 36.0.0 not found under %ANDROID_HOME% - run plan\scripts\setup-windows-android.ps1
  exit /b 1
)

if not exist "%KS%" (
  echo [sign] Creating the owner-held upload keystore %KS%
  echo [sign] You will be asked for a keystore password, a key password and the certificate name.
  echo [sign] Choose strong passwords, then back up the .jks AND the passwords offline in two places.
  if not exist C:\keys mkdir C:\keys
  keytool -genkeypair -v -keystore "%KS%" -alias upload -keyalg RSA -keysize 2048 -validity 10000
  if errorlevel 1 ( echo [sign] keytool failed & exit /b 1 )
)

if not exist out mkdir out
echo [sign] zipalign
"%BT%\zipalign.exe" -p -f 4 "%APK%" out\aligned.apk
if errorlevel 1 ( echo [sign] zipalign failed & exit /b 1 )

echo [sign] apksigner sign (enter the keystore password when asked)
call "%BT%\apksigner.bat" sign --ks "%KS%" --ks-key-alias upload --out "%OUT%" out\aligned.apk
if errorlevel 1 ( echo [sign] apksigner sign failed & del out\aligned.apk & exit /b 1 )
del out\aligned.apk

echo [sign] writing %REPORT%
> "%REPORT%" echo RC%RC% signing report (non-secret) - generated %DATE% %TIME%
>> "%REPORT%" echo.
>> "%REPORT%" echo == apksigner verify ==
call "%BT%\apksigner.bat" verify --verbose --print-certs "%OUT%" >> "%REPORT%" 2>&1
if errorlevel 1 ( echo [sign] apksigner verify FAILED - see %REPORT% & exit /b 1 )
>> "%REPORT%" echo.
>> "%REPORT%" echo == aapt2 badging ==
"%BT%\aapt2.exe" dump badging "%OUT%" 2>nul | findstr /R "^package: targetSdkVersion application-debuggable application-label:" >> "%REPORT%"
>> "%REPORT%" echo.
>> "%REPORT%" echo == permissions ==
"%BT%\aapt2.exe" dump permissions "%OUT%" >> "%REPORT%" 2>&1
>> "%REPORT%" echo.
>> "%REPORT%" echo == sha256 + size ==
certutil -hashfile "%OUT%" SHA256 | findstr /V "CertUtil" >> "%REPORT%"
for %%f in ("%OUT%") do >> "%REPORT%" echo size-bytes: %%~zf

echo.
echo [sign] DONE: %OUT%
type "%REPORT%"
echo.
echo [sign] Next: back up %KS% + passwords offline (two places), then
echo        adb install "%OUT%"   (after enabling USB debugging on the phone)
endlocal
