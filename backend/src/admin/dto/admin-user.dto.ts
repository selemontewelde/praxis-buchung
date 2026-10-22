import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

const ROLES = ['ADMIN', 'THERAPIST'] as const;

export class CreateAdminUserDto {
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(100)
  password!: string;

  @IsIn(ROLES)
  role!: 'ADMIN' | 'THERAPIST';

  /** Required for a THERAPIST (the therapist id/key); ignored for an ADMIN. */
  @IsOptional()
  @IsString()
  @MinLength(1)
  therapistId?: string;
}

export class UpdateAdminUserDto {
  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  email?: string;

  @IsOptional()
  @IsIn(ROLES)
  role?: 'ADMIN' | 'THERAPIST';

  /** A therapist id to (re)link, or null to clear. */
  @IsOptional()
  @ValidateIf((o: UpdateAdminUserDto) => o.therapistId !== null)
  @IsString()
  @MinLength(1)
  therapistId?: string | null;
}
