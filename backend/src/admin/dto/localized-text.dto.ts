import { IsOptional, IsString, MinLength } from 'class-validator';

/**
 * A per-locale content map accepted by the admin editors. `de` and `en` are
 * required (so the public read path always has a fallback); `fr`/`it`/`es` are
 * optional (ADR-0015). Validated as a nested object via @ValidateNested + @Type.
 */
export class LocalizedTextDto {
  @IsString()
  @MinLength(1)
  de!: string;

  @IsString()
  @MinLength(1)
  en!: string;

  @IsOptional()
  @IsString()
  fr?: string;

  @IsOptional()
  @IsString()
  it?: string;

  @IsOptional()
  @IsString()
  es?: string;
}
