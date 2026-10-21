import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';

/** Body for the reassignment preview: optionally restrict to chosen targets. */
export class ReassignPreviewDto {
  /** Candidate target therapists; omitted = all other therapists. */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  @MinLength(1, { each: true })
  targetTherapistIds?: string[];
}

export class ReassignAssignmentDto {
  @IsString()
  @MinLength(1)
  appointmentId!: string;

  @IsString()
  @MinLength(1)
  targetTherapistId!: string;
}

/** Body for applying the admin's decided assignments. */
export class ReassignApplyDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => ReassignAssignmentDto)
  assignments!: ReassignAssignmentDto[];
}
