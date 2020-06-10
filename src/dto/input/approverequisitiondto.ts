import { Length, IsNotEmpty, IsOptional } from "class-validator";

export class ApproveInventoryItemRequestDTO {
  @IsNotEmpty({
    message: 'field cannot be empty'
  })
  cart?: [{ itemId?: string, quantity?: number, skus?: [string]}];

  @IsOptional()
  @Length(3, 150, {
    message: 'remark should be between 3 and 150 characters'
  })
  comment: string;

  constructor( cart?: [{  itemId?: string, quantity?: number, skus?: [string]}], comment?: string) {
    this.cart = cart;
    this.comment = comment;
  }
}