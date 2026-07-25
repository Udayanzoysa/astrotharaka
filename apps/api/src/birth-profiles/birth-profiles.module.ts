import { Module } from '@nestjs/common';
import { BirthProfilesService } from './birth-profiles.service';
import { BirthProfilesController } from './birth-profiles.controller';

@Module({
  controllers: [BirthProfilesController],
  providers: [BirthProfilesService],
})
export class BirthProfilesModule {}
