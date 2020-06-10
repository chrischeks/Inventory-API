import { IsNotEmpty, IsOptional } from "class-validator";

export class CreateInventoryRequisitionDTO {
  @IsNotEmpty({
    message: 'field cannot be empty'
  })
  cart?: [{ itemId?: string, quantity?: number, skus?: [string]}];

  @IsOptional()
  comment?: string;

  @IsOptional()
  requisition_number?: string;

  @IsOptional()
  access_code?: string;

  @IsOptional()
  acceptance_code?: string;
    
    constructor( cart?: [{  itemId?: string, quantity?: number, skus?: [string]}], comment?: string, requisition_number?: string, access_code?: string, acceptance_code?: string) {
      this.cart = cart;
      this.comment = comment;
      this.requisition_number = requisition_number;
      this.access_code = access_code;
      this.acceptance_code = acceptance_code;
    }
}