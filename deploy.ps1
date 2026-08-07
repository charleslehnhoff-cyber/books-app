# Direct Cloud Run Container Deployment for Sphaerus Books
Write-Host "🚀 Starting Cloud Run Container Deployment..." -ForegroundColor Cyan
Set-Location -Path "z:\Applications\Books"
gcloud run deploy books-app --source . --region us-central1 --project sphaerus-intranet-new --min-instances 1 --cpu 2 --memory 2Gi --allow-unauthenticated

if ($LASTEXITCODE -eq 0) {
    Write-Host "🎉 Deployment Complete! Service live at https://books.sphaerus.net" -ForegroundColor Green
} else {
    Write-Host "❌ Deployment Failed!" -ForegroundColor Red
}
