# setup-windows-android.ps1 - one-time toolchain for building the Android APK locally.
# Run in PowerShell (as the normal user; no admin needed):   powershell -ExecutionPolicy Bypass -File .\setup-windows-android.ps1
# Installs: bun, Android cmdline-tools + platform-tools + platforms;android-36 + build-tools;36.0.0 + ndk;27.1.12297006 + cmake;3.22.1
# Uses:     the already-installed Temurin JDK 17 (C:\Program Files\Eclipse Adoptium\jdk-17.*), Node 24, Git.
# Idempotent: safe to re-run.
#
# NOTE (2026-10-14): on the owner's PC PowerShell runs in Constrained Language Mode
# (machine-level __PSLockdownPolicy=4), which blocks [Environment]:: calls, so this
# script cannot run there. The same steps were done by hand from Git Bash / cmd:
#   bun      : unzip https://github.com/oven-sh/bun/releases/latest/download/bun-windows-x64.zip -> %USERPROFILE%\.buninun.exe (+ copy as bunx.exe)
#   SDK      : unzip commandlinetools-win-13114758_latest.zip -> %LOCALAPPDATA%\Android\Sdk\cmdline-tools\latest
#              yes | sdkmanager.bat --licenses ; sdkmanager.bat "platform-tools" "platforms;android-36" "build-tools;36.0.0" "ndk;27.1.12297006" "cmake;3.22.1"
#   env vars : setx JAVA_HOME / ANDROID_HOME ; user Path prepended with platform-tools, build-tools.0.0, %USERPROFILE%\.bunin (via reg add, setx truncates >1024 chars)
#   git      : git config --global core.longpaths true
# Signing is a separate owner-run batch file: plan\scripts\sign-apk-windows.cmd

$ErrorActionPreference = 'Stop'
function Say($m) { Write-Host "[setup] $m" -ForegroundColor Cyan }

# --- JDK 17 (CI parity) ---
$jdk = Get-ChildItem 'C:\Program Files\Eclipse Adoptium' -Directory -Filter 'jdk-17*' | Select-Object -First 1 -ExpandProperty FullName
if (-not $jdk) { throw "Temurin JDK 17 not found under C:\Program Files\Eclipse Adoptium - install it from https://adoptium.net (Temurin 17 LTS) and re-run." }
Say "JAVA_HOME = $jdk"
[Environment]::SetEnvironmentVariable('JAVA_HOME', $jdk, 'User')
$env:JAVA_HOME = $jdk
$env:Path = "$jdk\bin;$env:Path"

# --- bun ---
if (-not (Get-Command bun -ErrorAction SilentlyContinue)) {
  Say "installing bun"
  powershell -NoProfile -c "irm bun.sh/install.ps1 | iex"
  $env:Path = "$env:USERPROFILE\.bun\bin;$env:Path"
}
Say ("bun " + (& bun --version))

# --- Android SDK via cmdline-tools ---
$sdk = "$env:LOCALAPPDATA\Android\Sdk"
$cmdline = "$sdk\cmdline-tools\latest"
if (-not (Test-Path "$cmdline\bin\sdkmanager.bat")) {
  Say "downloading Android cmdline-tools"
  New-Item -ItemType Directory -Force -Path "$sdk\cmdline-tools" | Out-Null
  $zip = "$env:TEMP\cmdline-tools.zip"
  # Current "Command line tools only" package for Windows (check https://developer.android.com/studio#command-line-tools-only if the URL changed)
  Invoke-WebRequest -Uri 'https://dl.google.com/android/repository/commandlinetools-win-13114758_latest.zip' -OutFile $zip
  $tmp = "$env:TEMP\cmdline-tools-x"
  if (Test-Path $tmp) { Remove-Item $tmp -Recurse -Force }
  Expand-Archive -Path $zip -DestinationPath $tmp -Force
  Move-Item "$tmp\cmdline-tools" $cmdline -Force
  Remove-Item $zip -Force; Remove-Item $tmp -Recurse -Force
}
$sdkm = "$cmdline\bin\sdkmanager.bat"
Say "accepting SDK licences"
for ($i = 0; $i -lt 8; $i++) { cmd /c "echo y| `"$sdkm`" --licenses --sdk_root=`"$sdk`"" | Out-Null }
Say "installing SDK packages (this downloads ~2 GB; be patient)"
cmd /c "`"$sdkm`" --sdk_root=`"$sdk`" `"platform-tools`" `"platforms;android-36`" `"build-tools;36.0.0`" `"ndk;27.1.12297006`" `"cmake;3.22.1`""
if ($LASTEXITCODE -ne 0) { throw "sdkmanager failed (exit $LASTEXITCODE)" }

[Environment]::SetEnvironmentVariable('ANDROID_HOME', $sdk, 'User')
$userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
foreach ($p in @("$sdk\platform-tools", "$sdk\build-tools\36.0.0", "$env:USERPROFILE\.bun\bin")) {
  if ($userPath -notlike "*$p*") { $userPath = "$p;$userPath" }
}
[Environment]::SetEnvironmentVariable('Path', $userPath, 'User')

# --- git settings the repo needs on Windows ---
git config --global core.longpaths true

Say "DONE. Open a NEW terminal so JAVA_HOME / ANDROID_HOME / PATH apply, then:"
Say "  git clone -c core.autocrlf=false https://github.com/vansyson1308/learning-french-with-tracy C:\src\lft"
Say "  cd C:\src\lft && bun install --frozen-lockfile && bun run release:identity"
