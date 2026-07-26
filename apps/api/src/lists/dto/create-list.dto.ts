import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

function trimStringValue(value: unknown) {
  return typeof value === 'string' ? value.trim() : value;
}

export class CreateListDto {
  @Transform(({ value }: { value: unknown }) => trimStringValue(value))
  @IsString({ message: 'Le nom de la liste est obligatoire.' })
  @IsNotEmpty({ message: 'Le nom de la liste est obligatoire.' })
  @MinLength(1, { message: 'Le nom de la liste est obligatoire.' })
  name!: string;
}
