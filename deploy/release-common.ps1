# Shared helpers for release.ps1 (same file in BCS-Monster and Form-Master).
$Server = 'root@5.223.93.53'
$Key    = Join-Path $PSScriptRoot '.keys\hetzner_deploy'
$Known  = Join-Path $PSScriptRoot '.keys\known_hosts'
$Hosts  = @{ BCS_HOST = 'bcs.5-223-93-53.sslip.io'; FM_HOST = 'formmaster.5-223-93-53.sslip.io' }
$SshOpts = @('-i', $Key, '-o', 'StrictHostKeyChecking=accept-new', '-o', 'ConnectTimeout=20', '-o', 'BatchMode=yes')

function Step($t) { Write-Host "`n==> $t" -ForegroundColor Cyan }
function Ok($t)   { Write-Host "    $t" -ForegroundColor Green }
function Fail($t) { Write-Host "`nRELEASE FAILED: $t" -ForegroundColor Red; exit 1 }
function Done($t) { Write-Host "`nRELEASE OK - $t" -ForegroundColor Green }

# Windows OpenSSH refuses keys that other users can read.
if (Test-Path $Key) {
  icacls $Key /inheritance:r /grant:r "$($env:USERNAME):(R)" | Out-Null
} else { Fail "deploy key missing: $Key" }

function Invoke-Remote([string]$cmd) { & ssh.exe @SshOpts $Server $cmd; if ($LASTEXITCODE -ne 0) { Fail "ssh: $cmd" } }
function Send-File([string]$src, [string]$dst) { & scp.exe @SshOpts $src "${Server}:$dst"; if ($LASTEXITCODE -ne 0) { Fail "upload $src" } }

function Get-NativeInfo {
  $f = Join-Path $PSScriptRoot 'native.json'
  if (Test-Path $f) { return Get-Content $f -Raw | ConvertFrom-Json }
  return [pscustomobject]@{ code = 0; version = ''; apk = '' }
}

function Write-VersionJson($Version, $Native) {
  $obj = [ordered]@{ version = $Version; builtAt = (Get-Date).ToUniversalTime().ToString('o'); native = [ordered]@{ code = [int]$Native.code; version = "$($Native.version)"; apk = "$($Native.apk)" } }
  [IO.File]::WriteAllText((Join-Path $Root 'dist\version.json'), ($obj | ConvertTo-Json -Depth 4))
  Ok "dist/version.json written"
}

function Publish-Site($App) {
  Step "Upload website"
  $tgz = Join-Path $env:TEMP "$App-release.tgz"
  if (Test-Path $tgz) { Remove-Item $tgz -Force }
  tar -czf $tgz -C (Join-Path $Root 'dist') .
  if ($LASTEXITCODE -ne 0) { Fail "tar failed" }
  Send-File $tgz "/tmp/$App-release.tgz"
  Invoke-Remote "deploy-site $App /tmp/$App-release.tgz"
  Remove-Item $tgz -Force
}

function Publish-Apk($App, $ApkName) {
  Step "Upload APK"
  Send-File (Join-Path $Root $ApkName) "/srv/www/$App/downloads/$ApkName.part"
  Invoke-Remote "mv -f /srv/www/$App/downloads/$ApkName.part /srv/www/$App/downloads/$ApkName && chmod a+r /srv/www/$App/downloads/$ApkName"
}

function Verify-Live($Url, $Version) {
  Step "Verify"
  for ($i = 0; $i -lt 10; $i++) {
    try {
      $v = Invoke-RestMethod -Uri "$Url/version.json?t=$([DateTime]::UtcNow.Ticks)" -TimeoutSec 15
      if ($v.version -eq $Version) { Ok "$Url serves $Version"; return }
    } catch { }
    Start-Sleep -Seconds 3
  }
  Fail "$Url does not serve $Version yet"
}

function Git-Push($Version, $Message) {
  if (-not (Test-Path (Join-Path $Root '.git'))) { Ok "no git repo - skipped push"; return }
  Step "Git"
  $msg = if ($Message) { "Release $Version - $Message" } else { "Release $Version" }
  git add -A
  git commit -m $msg | Out-Null
  git push
  if ($LASTEXITCODE -ne 0) { Write-Host "    git push failed (site is live anyway)" -ForegroundColor Yellow } else { Ok "pushed" }
}

function Find-AndroidTools {
  if (-not $env:ANDROID_HOME) { $env:ANDROID_HOME = Join-Path $env:LOCALAPPDATA 'Android\Sdk' }
  # Android Gradle needs JDK 17/21 (newer system JDKs such as 25 break Gradle 8). Prefer JDK 21 from ~/.jdks.
  $jbr = Join-Path $env:ProgramFiles 'Android\Android Studio\jbr'
  $j = Get-ChildItem "$env:USERPROFILE\.jdks" -Directory -ErrorAction SilentlyContinue | Where-Object Name -match '(^|[^0-9])21' | Select-Object -Last 1
  if ($j) { $env:JAVA_HOME = $j.FullName }              # JDK 21 (Android Studio's JBR may be too new)
  elseif (Test-Path "$jbr\bin\java.exe") { $env:JAVA_HOME = $jbr }
  $env:Path = "$env:JAVA_HOME\bin;$env:Path"
  Write-Host "    JAVA_HOME=$env:JAVA_HOME" 
  $bt = Get-ChildItem (Join-Path $env:ANDROID_HOME 'build-tools') -Directory | Sort-Object Name | Select-Object -Last 1
  if (-not $bt) { Fail "Android build-tools not found in $env:ANDROID_HOME" }
  return $bt.FullName
}

# Native "shell" version: appended to the WebView user agent (e.g. BCSMonsterApp/3) so the web code
# knows which APK is installed and can offer a new APK only when the native part changed.
function Next-NativeCode {
  $n = Get-NativeInfo
  return ([int]$n.code + 1)
}

# Runs Gradle without tying it to this window's output pipe (a Gradle daemon would keep the pipe
# open and make the release hang). Output goes to $LogFile; returns Gradle's exit code.
function Invoke-Gradle([string]$Dir, [string]$Task, [string]$LogFile) {
  $stop = Start-Process -FilePath 'cmd.exe' -ArgumentList '/c', 'gradlew.bat --stop >nul 2>&1' -WorkingDirectory $Dir -WindowStyle Hidden -PassThru
  $stop.WaitForExit()
  Write-Host "    gradle $Task (log: $LogFile) ..."
  $p = Start-Process -FilePath 'cmd.exe' -ArgumentList '/c', "gradlew.bat $Task --console=plain < nul > `"$LogFile`" 2>&1" -WorkingDirectory $Dir -WindowStyle Hidden -PassThru
  $p.WaitForExit()
  $code = $p.ExitCode
  $stop = Start-Process -FilePath 'cmd.exe' -ArgumentList '/c', 'gradlew.bat --stop >nul 2>&1' -WorkingDirectory $Dir -WindowStyle Hidden -PassThru
  $stop.WaitForExit()
  return $code
}
