import { IsString, MaxLength, MinLength } from 'class-validator';

/** Body for POST /api/admin/password (change your own password). */
export class ChangePasswordDto {
  @IsString()
  @MinLength(1)
  currentPassword!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(100)
  newPassword!: string;
}
