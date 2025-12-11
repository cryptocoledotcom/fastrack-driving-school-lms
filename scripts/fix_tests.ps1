$files = @(
    '../functions/src/certificate/__tests__/certificateFunctions.test.js',
    '../functions/src/payment/__tests__/paymentFunctions.test.js',
    '../functions/src/user/__tests__/userFunctions.test.js'
)

foreach ($file in $files) {
    $content = Get-Content $file -Raw
    
    # Remove conflicting vi.mock calls for firebase modules (keep only firebase-functions)
    $content = $content -replace "let mockDb;\s*", ""
    $content = $content -replace "vi\.mock\('firebase-admin/firestore'.*?\}\)\);`s*", ""
    $content = $content -replace "vi\.mock\('firebase-admin'[^}]*\}\)\);`s*", ""
    $content = $content -replace "vi\.mock\('\.\.\/common\/firebaseUtils'[^}]*\}\)\);`s*", ""
    $content = $content -replace "vi\.mock\('\.\.\/\.\.\/common\/firebaseUtils'[^}]*\}\)\);`s*", ""
    
    # Update beforeEach to set up mockDb properly
    $content = $content -replace "beforeEach\(\(\) => \{`n\s*vi\.clearAllMocks\(\);`n\s*mockDb = createMockFirestore\(\);", 
        "beforeEach(() => {`n    vi.clearAllMocks();`n    const mockDb = createMockFirestore();`n    const { getFirestore } = require('firebase-admin/firestore');`n    vi.mocked(getFirestore).mockReturnValue(mockDb);"
    
    Set-Content $file $content
    Write-Host "Fixed $file"
}
