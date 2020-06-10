import { IsEmail, IsString, IsOptional, IsBooleanString, IsArray, IsEnum, IsNotEmpty } from "class-validator";

export class UpdateSettingsDTO {

  @IsOptional()
  @IsBooleanString({
    message: "enable approval for procurement must be boolean"
  })
  enableApprovalForProcurement: string;

  @IsOptional()
  @IsArray({})
  procurementApprovers: string[];

  @IsOptional()
  @IsBooleanString({
    message: "enable requisition approver must be boolean"
  })
  enableRequisitionApprover: string

  @IsOptional() 
  maxApprovalDelay: number
  
  @IsOptional()
  @IsArray()
  requisitionApprovers: string[];

  constructor(enableApprovalForProcurement?: string, procurementApprovers?: string[], enableRequisitionApprover?: string, maxApprovalDelay?:number, requisitionApprovers?: string[]) {
    this.enableApprovalForProcurement = enableApprovalForProcurement
    this.procurementApprovers = procurementApprovers;
    this.enableRequisitionApprover = enableRequisitionApprover;
    this.maxApprovalDelay = maxApprovalDelay;
    this.requisitionApprovers = requisitionApprovers;
  }
}