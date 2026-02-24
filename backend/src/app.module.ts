import { Module } from '@nestjs/common';
import { MeasurementsController, AuthController, SyncController } from './measurements/measurements.controller';

@Module({
  imports: [],
  controllers: [MeasurementsController, AuthController, SyncController],
  providers: [],
})
export class AppModule {}
