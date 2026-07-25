import { IsDateString, IsString, Matches, MinLength } from 'class-validator';

export class CreatePorondamDto {
  @IsString()
  @MinLength(2)
  groomName!: string;

  @IsDateString()
  groomBirthDate!: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}(:\d{2})?$/, { message: 'groomBirthTime must be HH:mm or HH:mm:ss' })
  groomBirthTime!: string;

  @IsString()
  @MinLength(2)
  groomBirthPlace!: string;

  @IsString()
  @MinLength(2)
  brideName!: string;

  @IsDateString()
  brideBirthDate!: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}(:\d{2})?$/, { message: 'brideBirthTime must be HH:mm or HH:mm:ss' })
  brideBirthTime!: string;

  @IsString()
  @MinLength(2)
  brideBirthPlace!: string;
}
