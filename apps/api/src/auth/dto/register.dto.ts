import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

function trimStringValue(value: unknown) {
  return typeof value === 'string' ? value.trim() : value;
}

export class RegisterDto {
  @Transform(({ value }: { value: unknown }) => trimStringValue(value))
  @IsString({ message: 'Le prenom est obligatoire.' })
  @IsNotEmpty({ message: 'Le prenom est obligatoire.' })
  firstName!: string;

  @Transform(({ value }: { value: unknown }) => trimStringValue(value))
  @IsString({ message: 'Le nom est obligatoire.' })
  @IsNotEmpty({ message: 'Le nom est obligatoire.' })
  lastName!: string;

  @Transform(({ value }: { value: unknown }) => trimStringValue(value))
  @IsEmail({}, { message: "L'adresse email doit etre valide." })
  email!: string;

  @Transform(({ value }: { value: unknown }) => trimStringValue(value))
  @IsEmail(
    {},
    { message: "La confirmation de l'adresse email doit etre valide." },
  )
  emailConfirmation!: string;

  @IsString({ message: 'Le mot de passe est obligatoire.' })
  @IsNotEmpty({ message: 'Le mot de passe est obligatoire.' })
  @MinLength(8, {
    message: 'Le mot de passe doit contenir au moins 8 caracteres.',
  })
  password!: string;

  @IsString({ message: 'La confirmation du mot de passe est obligatoire.' })
  @IsNotEmpty({ message: 'La confirmation du mot de passe est obligatoire.' })
  @MinLength(8, {
    message:
      'La confirmation du mot de passe doit contenir au moins 8 caracteres.',
  })
  passwordConfirmation!: string;
}
