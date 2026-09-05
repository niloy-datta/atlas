$ErrorActionPreference = 'Stop'
$repositoryRoot = Split-Path -Parent $PSScriptRoot

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

Push-Location $repositoryRoot
try {
    if (Get-Command docker -ErrorAction SilentlyContinue) {
        & docker compose config --quiet
    }

    Push-Location 'backend'
    try {
        if (Get-Command wsl -ErrorAction SilentlyContinue) {
            & wsl bash -c "cd /mnt/d/Website/backend && ./mvnw clean test"
        } else {
            & .\mvnw.cmd clean test
        }
        if ($LASTEXITCODE -ne 0) { throw 'Backend verification failed.' }
    }
    finally {
        Pop-Location
    }

    Push-Location 'frontend'
    try {
        & npm run lint
        if ($LASTEXITCODE -ne 0) { throw 'Frontend lint failed.' }
        & npm run typecheck
        if ($LASTEXITCODE -ne 0) { throw 'Frontend typecheck failed.' }
        & npm test
        if ($LASTEXITCODE -ne 0) { throw 'Frontend unit tests failed.' }
        & npm run build
        if ($LASTEXITCODE -ne 0) { throw 'Frontend build failed.' }
    }
    finally {
        Pop-Location
    }
}
finally {
    Pop-Location
}

Write-Output 'ATLAS / SkillHub repository verification passed.'
