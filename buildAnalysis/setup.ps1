Write-Host "BuildAnalysis Setup Tool" -ForegroundColor Cyan

function Test-ModuleInstalled {
    param([string]$ModuleName)
    $module = Get-Module -ListAvailable -Name $ModuleName
    return $null -ne $module
}

function Install-PS2EXE {
    if (Test-ModuleInstalled "ps2exe") {
        Write-Host "ps2exe module is already installed" -ForegroundColor Green
        return $true
    }
    else {
        Write-Host "Installing ps2exe module..." -ForegroundColor Yellow
        try {
            Install-Module -Name ps2exe -Scope CurrentUser -Force
            Write-Host "ps2exe module installed successfully" -ForegroundColor Green
            return $true
        }
        catch {
            Write-Host "Failed to install ps2exe: $($_.Exception.Message)" -ForegroundColor Red
            return $false
        }
    }
}

function Build-Package {
    $scriptPath = Join-Path $PWD "buildAnalysis.ps1"
    $parentDir = Split-Path $PWD -Parent
    $outputPath = Join-Path $parentDir "buildAnalysis.exe"
    
    if (-not (Test-Path $scriptPath)) {
        Write-Host "Error: buildAnalysis.ps1 not found" -ForegroundColor Red
        return $false
    }
    
    try {
        Import-Module ps2exe -Force
        Invoke-PS2EXE -inputFile $scriptPath -outputFile $outputPath -NoConsole
        
        if (Test-Path $outputPath) {
            Write-Host "Package created successfully: $outputPath" -ForegroundColor Green
            return $true
        }
        else {
            Write-Host "Package creation failed" -ForegroundColor Red
            return $false
        }
    }
    catch {
        Write-Host "Package creation failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

<#
Write-Host "Choose an option:"
Write-Host "1. Install ps2exe module"
Write-Host "2. Create EXE package" 
Write-Host "3. Install module and create package"

$choice = Read-Host "Enter choice (1-3)"

switch ($choice) {
    "1" { Install-PS2EXE }
    "2" { 
        if (Test-ModuleInstalled "ps2exe") {
            Build-Package
        }
        else {
            Write-Host "ps2exe module not installed. Run option 1 first." -ForegroundColor Red
        }
    }
    "3" { 
        if (Install-PS2EXE) {
            Build-Package
        }
    }
    default { Write-Host "Invalid option" -ForegroundColor Red }
}
#>

if (Install-PS2EXE) {
    Build-Package
}

Write-Host "Done!"