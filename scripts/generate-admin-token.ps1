# Configuration
$API_URL = "http://localhost:3000/api"
$ADMIN_EMAIL = "admin@example.com"
$ADMIN_PASSWORD = "admin123"

# Connexion et récupération du token
$body = @{
    email = $ADMIN_EMAIL
    password = $ADMIN_PASSWORD
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$API_URL/auth/login" `
        -Method Post `
        -Headers @{
            "Content-Type" = "application/json"
        } `
        -Body $body

    Write-Host "Token JWT généré :" -ForegroundColor Green
    Write-Host $response.token
} catch {
    Write-Host "Erreur : Impossible de générer le token. Vérifiez que le serveur est en cours d'exécution et que les identifiants sont corrects." -ForegroundColor Red
} 