import { IsNotEmpty, IsNumber } from "class-validator";

export class restockDTO {

  @IsNotEmpty({
    message: "Quantity is required"
  })
  @IsNumber()
  quantity
  

  constructor(quantity?: number) {
    this.quantity= quantity;
  }
}
