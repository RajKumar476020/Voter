import { ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsEnum, IsOptional, IsString, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PollType } from '@prisma/client';

export class PollOptionInput {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  text!: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}

export class CreatePollDto {
  @IsString()
  @MinLength(4)
  @MaxLength(500)
  question!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => PollOptionInput)
  options!: PollOptionInput[];

  @IsOptional()
  @IsEnum(PollType)
  pollType?: PollType;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  duration?: string;

  @IsOptional()
  expiresAt?: string;

  @IsOptional()
  @IsBoolean()
  allowComments?: boolean;

  @IsOptional()
  @IsBoolean()
  anonymousVoting?: boolean;
}

export class UpdatePollDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  question?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsBoolean()
  allowComments?: boolean;
}

export class VoteDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @IsString({ each: true })
  optionIds!: string[];
}
