import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateServiceDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsInt()
  @Min(1)
  durationMin!: number;

  @IsOptional()
  @IsString()
  descriptionDe?: string;

  @IsOptional()
  @IsString()
  descriptionEn?: string;
}

export class UpdateServiceDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationMin?: number;

  @IsOptional()
  @IsString()
  descriptionDe?: string;

  @IsOptional()
  @IsString()
  descriptionEn?: string;

  /** false archives the service (hidden from the public + booking). */
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
