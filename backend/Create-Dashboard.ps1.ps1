param (
    [string]$username,
    [string]$espMac
)

# Replace colons with dashes in MAC address
$macFormatted = $espMac -replace ":", "-"

# Set the output file path
$outputPath = "src\main\resources\static\dashboard-$macFormatted.html"

# Create basic HTML content
$htmlContent = @"
<!DOCTYPE html>
<html>
<head>
    <title>Dashboard - $username</title>
</head>
<body>
    <h2>Welcome, $username!</h2>
    <p>This is your personalized ESP32 dashboard.</p>
    <p>ESP32 MAC Address: $espMac</p>
</body>
</html>
"@

# Create directory if it doesn't exist
$directory = Split-Path $outputPath
if (-not (Test-Path $directory)) {
    New-Item -Path $directory -ItemType Directory -Force
}

# Write to file
$htmlContent | Set-Content -Path $outputPath -Encoding UTF8

Write-Host "✅ Dashboard created: $outputPath"
