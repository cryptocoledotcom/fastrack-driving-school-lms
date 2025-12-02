$utils = 'src\api\utils'
$validators = 'src\api\validators'

if (Test-Path $utils) {
  Remove-Item $utils -Recurse -Force
  Write-Host "Deleted: $utils"
}

if (Test-Path $validators) {
  Remove-Item $validators -Recurse -Force
  Write-Host "Deleted: $validators"
}

Write-Host "Done"
