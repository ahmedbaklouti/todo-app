import { Transform } from 'class-transformer';
import { IsNotEmpty, IsUUID } from 'class-validator';

function trimStringValue(value: unknown) {
  return typeof value === 'string' ? value.trim() : value;
}

export class ListIdParamDto {
  @Transform(({ value }: { value: unknown }) => trimStringValue(value))
  @IsUUID('4', { message: 'La liste selectionnee est invalide.' })
  @IsNotEmpty({ message: 'La liste selectionnee est obligatoire.' })
  id!: string;
}
