import { ApiProperty } from '@nestjs/swagger';
import { ArrayUnique, IsArray, IsUUID } from 'class-validator';

export class SetMenuItemCategoriesDto {
  @ApiProperty({
    type: 'array',
    items: {
      type: 'string',
      format: 'uuid',
    },
    default: [],
    description: 'Category IDs to assign to the menu item. Send an empty array to clear all.',
  })
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  categoryIds: string[] = [];
}
