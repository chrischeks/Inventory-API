import { Length, IsNotEmpty, IsOptional } from "class-validator";

export class updateInventoryCategoryDTO {
  @IsNotEmpty({
    message: "name is required"
  })
  @Length(3, 30, {
    message: "name should be between 3 and 30 characters"
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
      options: string[],
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
        options: string[],
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
