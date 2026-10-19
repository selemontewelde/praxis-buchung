import { IsOptional, IsString, Matches, MinLength } from 'class-validator';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Validated query for GET /api/public/slots. */
export class GetSlotsQueryDto {
  @IsString()
  @MinLength(1)
  serviceId!: string;

  @IsOptional()
  @IsString()
  therapistId?: string;

  @Matches(ISO_DATE, { message: 'from must be a date in YYYY-MM-DD format' })
  from!: string;

  @Matches(ISO_DATE, { message: 'to must be a date in YYYY-MM-DD format' })
  to!: string;
}
