import { Transform } from 'class-transformer';
import { IsDateString, IsOptional, IsString, MinLength } from 'class-validator';

function trimStringValue(value: unknown) {
  return typeof value === 'string' ? value.trim() : value;
}

export class UpdateTaskDto {
  @Transform(({ value }: { value: unknown }) => trimStringValue(value))
  @IsOptional()
  @IsString({ message: 'La description courte doit etre un texte.' })
  @MinLength(1, {
    message: 'La description courte ne peut pas etre vide.',
  })
  shortDescription?: string;

  @Transform(({ value }: { value: unknown }) => trimStringValue(value))
  @IsOptional()
  @IsString({ message: 'La description longue doit etre un texte.' })
  longDescription?: string;

  @IsOptional()
  @IsDateString(
    {},
    { message: "La date d'echeance doit etre une date valide." },
  )
  dueDate?: string;
}
