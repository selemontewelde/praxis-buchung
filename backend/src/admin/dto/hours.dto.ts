import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export const WEEKDAYS = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
] as const;

/** A recurring weekly window in local wall-clock minutes from midnight. */
export type Weekday = (typeof WEEKDAYS)[number];

export class WindowDto {
  @IsIn(WEEKDAYS)
  weekday!: Weekday;

  @IsInt()
  @Min(0)
  @Max(1440)
  startMin!: number;

  @IsInt()
  @Min(0)
  @Max(1440)
  endMin!: number;
}

export class SetWindowsDto {
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => WindowDto)
  windows!: WindowDto[];
}
