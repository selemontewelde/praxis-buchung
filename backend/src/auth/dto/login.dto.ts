import { IsEmail, IsString, MinLength } from 'class-validator';

/** Validated body for POST /api/admin/login. */
export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  password!: string;
}
