import { Transform } from 'class-transformer';
import { IsDateString, IsOptional, IsString, MinLength } from 'class-validator';

function trimStringValue(value: unknown) {
  return typeof value === 'string' ? value.trim() : value;
}

export class UpdateTaskDto {
  @Transform(({ value }: { value: unknown }) => trimStringValue(value))
  @IsOptional()
  @IsString()
  @MinLength(1)
  shortDescription?: string;

  @Transform(({ value }: { value: unknown }) => trimStringValue(value))
  @IsOptional()
  @IsString()
  longDescription?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;
}
