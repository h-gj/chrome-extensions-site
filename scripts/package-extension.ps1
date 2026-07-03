param(
    [Parameter(Mandatory = $true)]
    [string]$ProjectPath,

    [string]$OutputDir = ""
)

$ProjectPath = Resolve-Path $ProjectPath
$projectName = Split-Path $ProjectPath -Leaf

if (-not $OutputDir) {
    $OutputDir = Join-Path $ProjectPath "dist"
}
$OutputDir = New-Item -ItemType Directory -Force -Path $OutputDir | Select-Object -ExpandProperty FullName

$manifestPath = Join-Path $ProjectPath "manifest.json"
if (-not (Test-Path $manifestPath)) {
    Write-Error "manifest.json not found in $ProjectPath"
    exit 1
}

$manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json
$version = $manifest.version
$zipName = "$projectName-v$version.zip"
$zipPath = Join-Path $OutputDir $zipName

$excludePatterns = @(
    '.git', '.gitignore', 'dist', 'node_modules', 'venv',
    '__pycache__', '.cursor', '*.log', 'ed25519-*.pem'
)

if (Test-Path $zipPath) { Remove-Item $zipPath -Force }

Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::Open($zipPath, [System.IO.Compression.ZipArchiveMode]::Create)

function Should-Exclude($relativePath) {
    foreach ($pattern in $excludePatterns) {
        if ($pattern -like '*.*') {
            if ($relativePath -like $pattern) { return $true }
        } else {
            if ($relativePath -split '[\\/]' | Where-Object { $_ -eq $pattern }) { return $true }
        }
    }
    return $false
}

Get-ChildItem $ProjectPath -Recurse -File | ForEach-Object {
    $relative = $_.FullName.Substring($ProjectPath.Length + 1)
    if (-not (Should-Exclude $relative)) {
        $entryName = "$projectName/$relative".Replace('\', '/')
        [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $_.FullName, $entryName) | Out-Null
    }
}

$zip.Dispose()

Write-Host "Created: $zipPath"
Write-Host "Upload this file to GitHub Release, then update data/extensions.json download URL."
