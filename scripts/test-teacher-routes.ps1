# Configuration
$API_URL = "http://localhost:3000/api"
$ADMIN_TOKEN = "votre_token_jwt_admin" # À remplacer par un vrai token JWT d'admin

# Couleurs pour les messages
$Green = [System.ConsoleColor]::Green
$Red = [System.ConsoleColor]::Red

Write-Host "🚀 Test des routes des professeurs" -ForegroundColor $Green

# 1. Créer un professeur
Write-Host "`n1. Création d'un professeur" -ForegroundColor $Green
$body = @{
    firstName = "Jean"
    lastName = "Dupont"
    email = "jean.dupont@example.com"
    password = "password123"
    phone = "0123456789"
} | ConvertTo-Json

Invoke-RestMethod -Uri "$API_URL/teachers" `
    -Method Post `
    -Headers @{
        "Authorization" = "Bearer $ADMIN_TOKEN"
        "Content-Type" = "application/json"
    } `
    -Body $body

# 2. Récupérer tous les professeurs
Write-Host "`n2. Récupération de tous les professeurs" -ForegroundColor $Green
Invoke-RestMethod -Uri "$API_URL/teachers" `
    -Method Get `
    -Headers @{
        "Authorization" = "Bearer $ADMIN_TOKEN"
    }

# 3. Récupérer un professeur spécifique (remplacer TEACHER_ID par l'ID réel)
Write-Host "`n3. Récupération d'un professeur spécifique" -ForegroundColor $Green
Invoke-RestMethod -Uri "$API_URL/teachers/TEACHER_ID" `
    -Method Get `
    -Headers @{
        "Authorization" = "Bearer $ADMIN_TOKEN"
    }

# 4. Mettre à jour un professeur (remplacer TEACHER_ID par l'ID réel)
Write-Host "`n4. Mise à jour d'un professeur" -ForegroundColor $Green
$updateBody = @{
    firstName = "Jean"
    lastName = "Martin"
    phone = "9876543210"
} | ConvertTo-Json

Invoke-RestMethod -Uri "$API_URL/teachers/TEACHER_ID" `
    -Method Put `
    -Headers @{
        "Authorization" = "Bearer $ADMIN_TOKEN"
        "Content-Type" = "application/json"
    } `
    -Body $updateBody

# 5. Supprimer un professeur (remplacer TEACHER_ID par l'ID réel)
Write-Host "`n5. Suppression d'un professeur" -ForegroundColor $Green
Invoke-RestMethod -Uri "$API_URL/teachers/TEACHER_ID" `
    -Method Delete `
    -Headers @{
        "Authorization" = "Bearer $ADMIN_TOKEN"
    }

Write-Host "`n✅ Tests terminés" -ForegroundColor $Green 