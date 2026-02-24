import { Controller, Get, Post, Body, Param, Put } from '@nestjs/common';

@Controller('measurements')
export class MeasurementsController {

    @Get()
    async getMeasurements() {
        return {
            success: true,
            data: [
                // Dummy data
            ]
        };
    }

    @Post()
    async syncMeasurements(@Body() payload: any) {
        // Sync batch von Messungen aus der Offline-Queue (SQLite)
        return {
            success: true,
            syncedCount: payload?.measurements?.length || 0
        };
    }

    @Get('stats')
    async getStats() {
        return {
            trend: "+5° pro Woche",
            average: "90°",
            max: "95°"
        }
    }

    @Get('chart-data')
    async getChartData() {
        return {
            labels: ["01.", "05.", "10."],
            data: [50, 65, 78]
        }
    }
}

@Controller('auth')
export class AuthController {
    @Post('login')
    async login() {
        return { token: 'jwt.mock.token' };
    }
}

@Controller('sync')
export class SyncController {
    @Post()
    async bulkSync(@Body() payload: any) {
        return {
            success: true,
            message: "Data successfully synced to database"
        }
    }
}
