# Expense Management System - Quick Setup Script
# Run this from PowerShell in the odoo/ directory

Write-Host "🚀 Expense Management System - Quick Setup" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
Write-Host "✓ Checking Node.js..." -ForegroundColor Yellow
$nodeVersion = node --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Node.js not found! Please install Node.js 18+ first." -ForegroundColor Red
    exit 1
}
Write-Host "  Node.js version: $nodeVersion" -ForegroundColor Green
Write-Host ""

# Check if PostgreSQL is installed
Write-Host "✓ Checking PostgreSQL..." -ForegroundColor Yellow
$pgVersion = psql --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠ PostgreSQL not detected. Make sure it's installed and accessible." -ForegroundColor Yellow
} else {
    Write-Host "  PostgreSQL version: $pgVersion" -ForegroundColor Green
}
Write-Host ""

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
Write-Host "  This may take 2-3 minutes..." -ForegroundColor Gray

# Install root dependencies
npm install --silent

# Install backend dependencies
Write-Host "  Installing backend packages..." -ForegroundColor Gray
Set-Location backend
npm install --silent
Set-Location ..

# Install frontend dependencies
Write-Host "  Installing frontend packages..." -ForegroundColor Gray
Set-Location frontend
npm install --silent
Set-Location ..

Write-Host "✓ Dependencies installed successfully!" -ForegroundColor Green
Write-Host ""

# Setup environment files
Write-Host "🔧 Setting up environment files..." -ForegroundColor Yellow

if (-not (Test-Path "backend\.env")) {
    Copy-Item "backend\.env.example" "backend\.env"
    Write-Host "  Created backend\.env (please configure DATABASE_URL)" -ForegroundColor Yellow
} else {
    Write-Host "  backend\.env already exists" -ForegroundColor Gray
}

if (-not (Test-Path "frontend\.env")) {
    Copy-Item "frontend\.env.example" "frontend\.env"
    Write-Host "  Created frontend\.env" -ForegroundColor Green
} else {
    Write-Host "  frontend\.env already exists" -ForegroundColor Gray
}
Write-Host ""

# Database setup instructions
Write-Host "📊 Database Setup" -ForegroundColor Yellow
Write-Host "  Next steps:" -ForegroundColor Gray
Write-Host "  1. Create PostgreSQL database: createdb expense_db" -ForegroundColor Cyan
Write-Host "  2. Update DATABASE_URL in backend\.env" -ForegroundColor Cyan
Write-Host "  3. Run: cd backend; npm run prisma:migrate" -ForegroundColor Cyan
Write-Host "  4. Run: npm run prisma:seed" -ForegroundColor Cyan
Write-Host ""

Write-Host "✨ Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Quick Commands:" -ForegroundColor Yellow
Write-Host "  npm run dev                  - Start both servers" -ForegroundColor Cyan
Write-Host "  cd backend; npm run dev      - Start backend only" -ForegroundColor Cyan
Write-Host "  cd frontend; npm run dev     - Start frontend only" -ForegroundColor Cyan
Write-Host "  cd backend; npm run prisma:studio - Open database GUI" -ForegroundColor Cyan
Write-Host ""
Write-Host "🌐 Access URLs:" -ForegroundColor Yellow
Write-Host "  Frontend:  http://localhost:5173" -ForegroundColor Cyan
Write-Host "  Backend:   http://localhost:5000/api" -ForegroundColor Cyan
Write-Host "  Health:    http://localhost:5000/api/health" -ForegroundColor Cyan
Write-Host ""
Write-Host "🎭 Demo Login:" -ForegroundColor Yellow
Write-Host "  Email:     alice@company.com" -ForegroundColor Cyan
Write-Host "  Password:  password123" -ForegroundColor Cyan
Write-Host ""
Write-Host "📖 For detailed instructions, see QUICKSTART.md" -ForegroundColor Gray
Write-Host ""
Write-Host "Happy Hacking! 🚀" -ForegroundColor Magenta
