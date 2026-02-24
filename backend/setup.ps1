# Backend Setup Script
Set-Location "C:\Users\Duk\.gemini\antigravity\scratch\rom-ai\backend"

# Create a temporary package.json to initialize NestJS if it doesn't exist
if (!(Test-Path package.json)) {
    npm init -y
    npm install @nestjs/common @nestjs/core @nestjs/platform-express reflect-metadata rxjs
    npm install --save-dev @nestjs/cli @nestjs/schematics @nestjs/testing @types/express typescript ts-node
}

# Ensure prisma exists and matches schema 
npm install prisma --save-dev
npm install @prisma/client

# Create Nest main.ts and app structure
New-Item -ItemType Directory -Force -Path "src"
Set-Content -Path "src/main.ts" -Value @"
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  await app.listen(3000);
}
bootstrap();
"@

Set-Content -Path "src/app.module.ts" -Value @"
import { Module } from '@nestjs/common';
import { MeasurementsController, AuthController, SyncController } from './measurements/measurements.controller';

@Module({
  imports: [],
  controllers: [MeasurementsController, AuthController, SyncController],
  providers: [],
})
export class AppModule {}
"@

# Push prisma schema (note: requires DATABASE_URL env var, using SQLite for MVP dev)
# Modifying prisma to use SQLite for easy local test without Postgres running:
$prismaSchema = Get-Content -Path "prisma/schema.prisma"
$prismaSchema = $prismaSchema -replace 'provider = "postgresql"', 'provider = "sqlite"'
$prismaSchema = $prismaSchema -replace 'url      = env\("DATABASE_URL"\)', 'url      = "file:./dev.db"'
Set-Content -Path "prisma/schema.prisma" -Value $prismaSchema

npx prisma generate
npx prisma db push --accept-data-loss
