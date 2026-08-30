$ErrorActionPreference = 'Stop'
$repositoryRoot = Split-Path -Parent $PSScriptRoot

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

Push-Location $repositoryRoot
try {
    & docker compose config --quiet

    Push-Location 'backend'
    try {
        & .\mvnw.cmd clean verify
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

Write-Output 'ATLAS repository verification passed.'
