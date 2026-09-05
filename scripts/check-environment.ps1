$ErrorActionPreference = 'Stop'

$jdk = Get-ChildItem 'C:\Program Files\Eclipse Adoptium\jdk-21*', 'C:\Program Files\Microsoft\jdk-21*', 'C:\Program Files\Java\jdk-21*' -Directory -ErrorAction SilentlyContinue |
    Sort-Object Name -Descending |
    Select-Object -First 1

if ($jdk) {
    $env:JAVA_HOME = $jdk.FullName
    $env:Path = "$($jdk.FullName)\bin;$env:Path"
}

$dockerBin = 'C:\Program Files\Docker\Docker\resources\bin'
if (Test-Path "$dockerBin\docker.exe") {
    $env:Path = "$dockerBin;$env:Path"
}

$requiredCommands = @('java', 'node', 'npm', 'git')
$missing = @()

foreach ($command in $requiredCommands) {
    if (-not (Get-Command $command -ErrorAction SilentlyContinue)) {
        $missing += $command
    }
}

if ($missing.Count -gt 0) {
    throw "Missing required commands: $($missing -join ', ')"
}

$javaOutput = (& java -version 2>&1 | Out-String)
if ($javaOutput -notmatch 'version "21') {
    throw "Java 21 LTS is required. Detected: $javaOutput"
}

& node --version
& npm --version
& git --version

if (Get-Command docker -ErrorAction SilentlyContinue) {
    & docker --version
    & docker compose version
} else {
    Write-Host 'Docker is not currently detected on PATH; local infrastructure requires Docker when executing full Compose services.'
}

Write-Output 'ATLAS / SkillHub environment check passed (Java 21 LTS, Node, npm, Git verified).'
