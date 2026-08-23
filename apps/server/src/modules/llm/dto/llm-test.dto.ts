import { IsString, MinLength } from 'class-validator';

export class LlmTestDto {
  @IsString()
  @MinLength(1)
  message!: string;
}
