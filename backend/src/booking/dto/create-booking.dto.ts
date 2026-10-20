import { Type } from 'class-transformer';
import {
  Equals,
  IsEmail,
  IsISO8601,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class PatientDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  // 254 is the maximum length of an email address (RFC 5321).
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(30)
  phone!: string;
}

export class ConsentDto {
  /** Version of the privacy policy the patient accepted (revDSG). */
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  policyVersion!: string;

  /** Must be true — booking requires explicit consent. */
  @Equals(true)
  accepted!: boolean;
}

/** Validated body for POST /api/public/bookings. */
export class CreateBookingDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  serviceId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  therapistId!: string;

  /** Slot start as a UTC ISO instant (as returned by the availability API). */
  @IsISO8601({ strict: true })
  startAt!: string;

  @ValidateNested()
  @Type(() => PatientDto)
  patient!: PatientDto;

  @ValidateNested()
  @Type(() => ConsentDto)
  consent!: ConsentDto;
}
