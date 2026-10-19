import {
  IsIn,
  IsISO8601,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export const BLOCK_REASONS = ['VACATION', 'TRAINING', 'SICK', 'OTHER'] as const;

/** Validated body for POST /api/admin/blocks. */
export class CreateBlockDto {
  @IsString()
  @MinLength(1)
  therapistId!: string;

  @IsIn(BLOCK_REASONS)
  reason!: (typeof BLOCK_REASONS)[number];

  @IsISO8601({ strict: true })
  startAt!: string;

  @IsISO8601({ strict: true })
  endAt!: string;

  @IsOptional()
  @IsString()
  note?: string;
}
