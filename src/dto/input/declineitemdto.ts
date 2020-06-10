import { Length, IsOptional } from "class-validator";

export class DeclineInventoryItemDTO {

  @IsOptional()
  @Length(3, 150, {
    message: 'comment should be between 3 and 150 characters'
  })
  comment: string;

  constructor(comment?: string) {
    this.comment = comment
  }
}