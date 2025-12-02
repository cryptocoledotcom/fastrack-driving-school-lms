$utensils = Get-ChildItem -Path 'c:\Users\Cole\Documents\Fastrack\Fastrack-Learning_Management-System\src\api\utils' -File
$validators = Get-ChildItem -Path 'c:\Users\Cole\Documents\Fastrack\Fastrack-Learning_Management-System\src\api\validators' -File

foreach ($file in $utensils) {
  Remove-Item -Path $file.FullName -Force
  Write-Host "Deleted: $($file.Name)"
}

foreach ($file in $validators) {
  Remove-Item -Path $file.FullName -Force
  Write-Host "Deleted: $($file.Name)"
}

$dateFile = 'c:\Users\Cole\Documents\Fastrack\Fastrack-Learning_Management-System\src\utils\dateTimeFormatter.js'
if (Test-Path $dateFile) {
  Remove-Item -Path $dateFile -Force
  Write-Host "Deleted: dateTimeFormatter.js"
}

Write-Host "Cleanup complete"
