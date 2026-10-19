import {
  ArrayUnique,
  IsArray,
  IsISO8601,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class CreateTherapistDto {
  @IsString()
  @MinLength(1)
  firstName!: string;

  @IsString()
  @MinLength(1)
  lastName!: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsString()
  @MinLength(1)
  roleDe!: string;

  @IsString()
  @MinLength(1)
  roleEn!: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;

  /** Start of the Active range (ISO date). */
  @IsISO8601()
  activeFrom!: string;

  /** End of the Active range (ISO date), or omitted for open-ended. */
  @IsOptional()
  @IsISO8601()
  activeUntil?: string;
}

export class UpdateTherapistDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  lastName?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  roleDe?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  roleEn?: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;

  @IsOptional()
  @IsISO8601()
  activeFrom?: string;

  /** ISO date to deactivate at, or null to re-activate (open-ended). */
  @IsOptional()
  @ValidateIf((o: UpdateTherapistDto) => o.activeUntil !== null)
  @IsISO8601()
  activeUntil?: string | null;
}

export class SetCapabilitiesDto {
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  serviceIds!: string[];
}
