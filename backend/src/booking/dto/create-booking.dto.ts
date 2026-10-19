import { Type } from 'class-transformer';
import {
  Equals,
  IsEmail,
  IsISO8601,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class PatientDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  phone!: string;
}

export class ConsentDto {
  /** Version of the privacy policy the patient accepted (revDSG). */
  @IsString()
  @MinLength(1)
  policyVersion!: string;

  /** Must be true — booking requires explicit consent. */
  @Equals(true)
  accepted!: boolean;
}

/** Validated body for POST /api/public/bookings. */
export class CreateBookingDto {
  @IsString()
  @MinLength(1)
  serviceId!: string;

  @IsString()
  @MinLength(1)
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
