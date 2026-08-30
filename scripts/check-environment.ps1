$ErrorActionPreference = 'Stop'

$adoptiumJdk = Get-ChildItem 'C:\Program Files\Eclipse Adoptium\jdk-25*' -Directory -ErrorAction SilentlyContinue |
    Sort-Object Name -Descending |
    Select-Object -First 1

if ($adoptiumJdk) {
    $env:JAVA_HOME = $adoptiumJdk.FullName
    $env:Path = "$($adoptiumJdk.FullName)\bin;$env:Path"
}

$dockerBin = 'C:\Program Files\Docker\Docker\resources\bin'
if (Test-Path "$dockerBin\docker.exe") {
    $env:Path = "$dockerBin;$env:Path"
}

$requiredCommands = @('java', 'node', 'npm', 'git', 'docker')
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
if ($javaOutput -notmatch 'version "25') {
    throw "Java 25 is required. Detected: $javaOutput"
}

& node --version
& npm --version
& git --version
& docker --version
& docker compose version

Write-Output 'ATLAS environment check passed.'
