import { IsDateString, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateTaskDto {
  @IsString()
  listId!: string;

  @IsString()
  @MinLength(1)
  shortDescription!: string;

  @IsOptional()
  @IsString()
  longDescription?: string;

  @IsDateString()
  dueDate!: string;
}
