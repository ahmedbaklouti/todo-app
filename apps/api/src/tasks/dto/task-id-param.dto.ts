import { Transform } from 'class-transformer';
import { IsNotEmpty, IsUUID } from 'class-validator';

function trimStringValue(value: unknown) {
  return typeof value === 'string' ? value.trim() : value;
}

export class TaskIdParamDto {
  @Transform(({ value }: { value: unknown }) => trimStringValue(value))
  @IsUUID('4', { message: 'La tache selectionnee est invalide.' })
  @IsNotEmpty({ message: 'La tache selectionnee est obligatoire.' })
  id!: string;
}
