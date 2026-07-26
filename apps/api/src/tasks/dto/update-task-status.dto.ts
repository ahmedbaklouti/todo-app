import { IsBoolean } from 'class-validator';

export class UpdateTaskStatusDto {
  @IsBoolean({ message: 'Le statut de la tache doit etre un booleen.' })
  completed!: boolean;
}
