import { IsEmail, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Le pseudo doit faire au moins 3 caractères' })
  @MaxLength(20, { message: 'Le pseudo ne peut pas dépasser 20 caractères' })
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'Le pseudo ne peut contenir que des lettres, chiffres, tirets et underscores',
  })
  pseudo?: string;

  @IsOptional()
  @IsEmail({}, { message: "L'adresse email n'est pas valide" })
  email?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;
  // Explicit undefined to satisfy strictPropertyInitialization
  declare _?: never;
}
