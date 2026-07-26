import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

function trimStringValue(value: unknown) {
  return typeof value === 'string' ? value.trim() : value;
}

export class CreateTaskDto {
  @IsString({ message: 'La liste selectionnee est obligatoire.' })
  @IsNotEmpty({ message: 'La liste selectionnee est obligatoire.' })
  listId!: string;

  @Transform(({ value }: { value: unknown }) => trimStringValue(value))
  @IsString({ message: 'La description courte est obligatoire.' })
  @IsNotEmpty({ message: 'La description courte est obligatoire.' })
  @MinLength(1, { message: 'La description courte est obligatoire.' })
  shortDescription!: string;

  @Transform(({ value }: { value: unknown }) => trimStringValue(value))
  @IsOptional()
  @IsString({ message: 'La description longue doit etre un texte.' })
  longDescription?: string;

  @IsDateString(
    {},
    { message: "La date d'echeance doit etre une date valide." },
  )
  dueDate!: string;
}
