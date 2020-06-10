import { Length, IsArray, IsNotEmpty, IsOptional } from "class-validator";

export class CreateInventoryCategoryDTO {
  @IsNotEmpty({
    message: "name is required"
  })
  @Length(4, 30, {
    message: "name should be between 4 and 30 characters"
  })
  name: string;

  @IsOptional()
  @Length(3, 150, {
    message: "description should be between 3 and 150 characters"
  })
  description: string;

  @IsOptional()
  barcode: boolean;

  @IsOptional()
  parentCategoryId: string;

  @IsOptional()
  properties: [
    {
      name?: string,
      description?: string,
      type?: string,
      options?: string[],
      required: boolean
    }
  ];

  constructor(
    name?: string,
    description?: string,
    barcode?: boolean,
    parentCategoryId?: string,
    properties?: [
      {
        name?: string,
        description?: string,
        type?: string,
        options?: string[],
        required: boolean
      }
    ],
    active?: boolean
  ) {
    this.name = name;
    this.description = description;
    this.barcode = barcode;
    this.parentCategoryId = parentCategoryId;
    this.properties = properties;
  }
}
