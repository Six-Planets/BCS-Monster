<#
  ONE-CLICK RELEASE  (double-click release.bat in the project folder, or ask Claude: "release BCS")
    .\deploy\release.ps1            -> bump version, build, publish website. Open apps show "Update available".
    .\deploy\release.ps1 -Apk       -> same, plus build a new signed Android APK and publish it
                                       (only needed when native things change: icon, plugins, permissions).
    .\deploy\release.ps1 -NoBump    -> redeploy the current version without bumping.
#>
param([switch]$Apk, [switch]$NoBump, [string]$Message = "")
$ErrorActionPreference = 'Continue'  # native tools write progress to stderr; we check exit codes instead
$App       = 'bcs'                         # folder on the server: /srv/www/<App>
$AppName   = 'BCS Monster'
$ApkName   = 'BCS-Monster.apk'
$Root      = Split-Path $PSScriptRoot -Parent
Set-Location $Root
. "$PSScriptRoot\release-common.ps1"

function Build-BcsApk($Version) {
  Step "Android APK (signed release)"
  $bt = Find-AndroidTools
  $code = Next-NativeCode
  $native = [ordered]@{ code = $code; version = $Version; apk = "/downloads/$ApkName" }
  [IO.File]::WriteAllText((Join-Path $PSScriptRoot 'native.json'), ($native | ConvertTo-Json))
  $env:VITE_APP_VERSION = $Version
  $env:VITE_API_URL = "https://$($Hosts.BCS_HOST)"
  npm run build; if ($LASTEXITCODE -ne 0) { Fail "web build for APK failed" }
  npx cap sync android; if ($LASTEXITCODE -ne 0) { Fail "cap sync failed" }
  $gradle = Join-Path $Root 'android\app\build.gradle'
  [IO.File]::WriteAllText($gradle, ((Get-Content $gradle -Raw) -replace 'versionCode \d+', "versionCode $code" -replace 'versionName "[^"]*"', "versionName `"$Version`""))
  "sdk.dir=$($env:ANDROID_HOME -replace '\\','\\')" | Set-Content -Encoding ascii (Join-Path $Root 'android\local.properties')
  $ks = Join-Path $PSScriptRoot '.keys\bcs-release.jks'
  $pwFile = Join-Path $PSScriptRoot '.keys\bcs-keystore-password.txt'
  if (-not (Test-Path $pwFile)) { [guid]::NewGuid().ToString('N') | Set-Content -NoNewline $pwFile }
  $pw = (Get-Content $pwFile -Raw).Trim()
  if (-not (Test-Path $ks)) {
    & "$env:JAVA_HOME\bin\keytool.exe" -genkeypair -keystore $ks -alias bcsmonster -keyalg RSA -keysize 2048 -validity 10000 -storepass $pw -keypass $pw -dname "CN=BCS Monster, O=BCS Monster, C=BD"
    if ($LASTEXITCODE -ne 0) { Fail "keytool failed" }
  }
  $glog = Join-Path $PSScriptRoot 'logs\gradle.log'
  $rc = Invoke-Gradle (Join-Path $Root 'android') 'assembleRelease' $glog
  Get-Content $glog -Tail 15
  if ($rc -ne 0) { Fail "gradle assembleRelease failed" }
  $unsigned = Join-Path $Root 'android\app\build\outputs\apk\release\app-release-unsigned.apk'
  $aligned = Join-Path $env:TEMP 'bcs-aligned.apk'
  & "$bt\zipalign.exe" -p -f 4 $unsigned $aligned; if ($LASTEXITCODE -ne 0) { Fail "zipalign failed" }
  & "$bt\apksigner.bat" sign --ks $ks --ks-key-alias bcsmonster --ks-pass "pass:$pw" --key-pass "pass:$pw" --out (Join-Path $Root $ApkName) $aligned
  if ($LASTEXITCODE -ne 0) { Fail "apksigner failed" }
  Ok "$ApkName built (native code $code)"
  return [pscustomobject]$native
}

Step "Version"
if (-not $NoBump) { npm version patch --no-git-tag-version --allow-same-version | Out-Null }
$Version = (node -p "require('./package.json').version").Trim()
Ok "$AppName $Version"

$Native = Get-NativeInfo
if ($Apk) { $Native = Build-BcsApk $Version }

Step "Build website"
$env:VITE_APP_VERSION = $Version
$env:VITE_API_URL = "https://$($Hosts.BCS_HOST)"
npm run build
if ($LASTEXITCODE -ne 0) { Fail "Build failed" }
Write-VersionJson $Version $Native

Publish-Site $App
if ($Apk) { Publish-Apk $App $ApkName }
Verify-Live "https://$($Hosts.BCS_HOST)" $Version
Git-Push $Version $Message
Done "$AppName $Version is live at https://$($Hosts.BCS_HOST)"
