import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { BirthProfilesService } from './birth-profiles.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/types/jwt-payload';
import { CreateBirthProfileDto } from './dto/create-birth-profile.dto';
import { UpdateBirthProfileDto } from './dto/update-birth-profile.dto';

@Controller('birth-profiles')
@UseGuards(JwtAuthGuard)
export class BirthProfilesController {
  constructor(private readonly birthProfilesService: BirthProfilesService) {}

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateBirthProfileDto) {
    return this.birthProfilesService.create(user.sub, dto);
  }

  @Get()
  list(@CurrentUser() user: JwtPayload) {
    return this.birthProfilesService.list(user.sub);
  }

  @Get(':id')
  getOne(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.birthProfilesService.getOne(user.sub, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBirthProfileDto,
  ) {
    return this.birthProfilesService.update(user.sub, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.birthProfilesService.remove(user.sub, id);
  }
}
