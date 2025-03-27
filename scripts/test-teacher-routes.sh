#!/bin/bash

# Configuration
API_URL="http://localhost:3000/api"
ADMIN_TOKEN="votre_token_jwt_admin" # À remplacer par un vrai token JWT d'admin

# Couleurs pour les messages
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo "🚀 Test des routes des professeurs"

# 1. Créer un professeur
echo -e "\n${GREEN}1. Création d'un professeur${NC}"
curl -X POST "${API_URL}/teachers" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Jean",
    "lastName": "Dupont",
    "email": "jean.dupont@example.com",
    "password": "password123",
    "phone": "0123456789"
  }'

# 2. Récupérer tous les professeurs
echo -e "\n\n${GREEN}2. Récupération de tous les professeurs${NC}"
curl -X GET "${API_URL}/teachers" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}"

# 3. Récupérer un professeur spécifique (remplacer TEACHER_ID par l'ID réel)
echo -e "\n\n${GREEN}3. Récupération d'un professeur spécifique${NC}"
curl -X GET "${API_URL}/teachers/TEACHER_ID" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}"

# 4. Mettre à jour un professeur (remplacer TEACHER_ID par l'ID réel)
echo -e "\n\n${GREEN}4. Mise à jour d'un professeur${NC}"
curl -X PUT "${API_URL}/teachers/TEACHER_ID" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Jean",
    "lastName": "Martin",
    "phone": "9876543210"
  }'

# 5. Supprimer un professeur (remplacer TEACHER_ID par l'ID réel)
echo -e "\n\n${GREEN}5. Suppression d'un professeur${NC}"
curl -X DELETE "${API_URL}/teachers/TEACHER_ID" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}"

echo -e "\n\n${GREEN}✅ Tests terminés${NC}" 