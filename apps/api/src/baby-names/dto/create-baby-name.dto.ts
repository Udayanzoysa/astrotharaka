import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MinLength,
  ValidateIf,
} from 'class-validator';

export enum BabyGender {
  male = 'male',
  female = 'female',
}

export enum BabyNameStyle {
  Traditional = 'Traditional',
  Modern = 'Modern',
  SouthIndian = 'SouthIndian',
  Unique = 'Unique',
}

export class CreateBabyNameDto {
  @IsDateString()
  birthDate!: string;

  @IsOptional()
  @ValidateIf((_, v) => typeof v === 'string' && v.trim().length > 0)
  @IsString()
  @Matches(/^\d{2}:\d{2}(:\d{2})?$/, { message: 'birthTime must be HH:mm or HH:mm:ss' })
  birthTime?: string;

  @IsString()
  @MinLength(2)
  birthPlaceName!: string;

  @IsString()
  @MinLength(1)
  firstLetter!: string;

  @IsString()
  @MinLength(1)
  secondLetter!: string;

  @IsOptional()
  @IsEnum(BabyGender)
  gender?: BabyGender;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @ArrayMinSize(1)
  @IsEnum(BabyNameStyle, { each: true })
  styles?: BabyNameStyle[];
}
