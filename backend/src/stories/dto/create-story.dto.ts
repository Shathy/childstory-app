import { IsIn, IsInt, IsObject, IsOptional, IsString, Max, Min } from 'class-validator';

export class AppearanceDto {
  @IsOptional() @IsString() skinTone?: string;
  @IsOptional() @IsString() hairType?: string;
  @IsOptional() @IsString() hairColor?: string;
  @IsOptional() glasses?: boolean;
  @IsOptional() @IsString() sourceImageUrl?: string;
}

export class CreateStoryDto {
  @IsString() childName: string;

  @IsIn(['male', 'female']) childGender: 'male' | 'female';

  @IsInt() @Min(3) @Max(10) childAge: number;

  @IsObject() appearance: AppearanceDto;

  @IsString() setting: string;

  @IsString() moralValue: string;

  @IsIn(['ar', 'en']) language: 'ar' | 'en';
}
