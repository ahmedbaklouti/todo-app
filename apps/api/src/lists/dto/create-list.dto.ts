import { Transform } from 'class-transformer';
import { IsString, MinLength } from 'class-validator';

function trimStringValue(value: unknown) {
  return typeof value === 'string' ? value.trim() : value;
}

export class CreateListDto {
  @Transform(({ value }: { value: unknown }) => trimStringValue(value))
  @IsString()
  @MinLength(1)
  name!: string;
}
