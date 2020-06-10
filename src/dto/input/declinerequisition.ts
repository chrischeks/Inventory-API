import { Length, IsNotEmpty } from "class-validator";

export class DeclineInventoryItemRequestDTO {

  @IsNotEmpty({
    message: 'remark field cannot be empty'
  })
  @Length(3, 150, {
    message: 'remark should be between 3 and 150 characters'
  })
  remark: string;

  constructor(remark?: string) {
    this.remark = remark
  }
}