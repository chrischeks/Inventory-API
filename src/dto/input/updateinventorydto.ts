import { Length, IsNotEmpty, MinLength, IsOptional } from "class-validator";

export class UpdateInventoryDTO {
  @IsNotEmpty({
    message: "item description is required"
  })
  @Length(3, 100, {
    message: "item description should be between 3 and 100 characters"
  })
  item_description: string;

  @IsNotEmpty({
    message: "category is required"
  })
  @Length(3, 100, {
    message: "category should be between 3 and 100 characters"
  })
  category: string;

  @IsNotEmpty({
    message: "quantity is required"
  })
  @MinLength(1, {
    message: "quantity should not be less than 1"
  })
  quantity: string;

  @IsNotEmpty({
    message: "unit cost is required"
  })
  @Length(3, 100, {
    message: "unit cost should be between 3 and 100 characters"
  })
  unit_cost: string;

  constructor(
    item_description?: string,
    category?: string,
    quantity?: string,
    unit_cost?: string
  ) {
    this.item_description = item_description;
    this.category = category;
    this.quantity = quantity;
    this.unit_cost = unit_cost;
  }
}
