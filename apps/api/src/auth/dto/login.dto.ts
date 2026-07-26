import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

function trimStringValue(value: unknown) {
  return typeof value === 'string' ? value.trim() : value;
}

export class LoginDto {
  @Transform(({ value }: { value: unknown }) => trimStringValue(value))
  @IsEmail({}, { message: "L'adresse email doit etre valide." })
  email!: string;

  @IsString({ message: 'Le mot de passe est obligatoire.' })
  @IsNotEmpty({ message: 'Le mot de passe est obligatoire.' })
  password!: string;
}
