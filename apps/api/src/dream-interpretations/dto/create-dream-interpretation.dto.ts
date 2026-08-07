import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateDreamInterpretationDto {
  @IsString()
  @MinLength(8, { message: 'dreamText must be at least 8 characters' })
  @MaxLength(4000, { message: 'dreamText must be at most 4000 characters' })
  dreamText!: string;
}
