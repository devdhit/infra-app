$results = @()

function Get-UninstallItems($path) {
  if (Test-Path $path) {
    Get-ItemProperty "$path\*" | ForEach-Object {
      [PSCustomObject]@{
        Source         = $path
        DisplayName    = $_.DisplayName
        DisplayVersion = $_.DisplayVersion
        Publisher      = $_.Publisher
      }
    }
  }
}

# Search common uninstall locations
$results += Get-UninstallItems "HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall"
$results += Get-UninstallItems "HKLM:\Software\Wow6432Node\Microsoft\Windows\CurrentVersion\Uninstall"

# Filter Office-related rows and remove null DisplayName
$officeRows = $results | Where-Object { $_.DisplayName -and ($_.DisplayName -match 'Office|Microsoft 365|Microsoft Office|Visio|Project') } |
              Sort-Object DisplayName -Unique

# Output only the essential information in a more efficient format
if ($officeRows.Count -gt 0) {
  # Output just the first Office entry to reduce processing time
  $firstOffice = $officeRows[0]
  @{
    DisplayName = $firstOffice.DisplayName
    DisplayVersion = $firstOffice.DisplayVersion
  } | ConvertTo-Json
}
