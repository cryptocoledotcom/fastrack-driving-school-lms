Get-ChildItem -Recurse -Path 'src' -Include '*.jsx','*.js' | ForEach-Object {
  $content = Get-Content $_.FullName -Raw
  if ($content -match 'from.*enrollmentServices') {
    Write-Host "Found in: $($_.FullName)"
    $lines = $content.Split("`n")
    for ($i=0; $i -lt $lines.Length; $i++) {
      if ($lines[$i] -match 'enrollmentServices') {
        Write-Host "Line $($i+1): $($lines[$i])"
      }
    }
  }
}
