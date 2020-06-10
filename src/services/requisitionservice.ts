import { BaseService } from "./baseservice";
import { BasicResponse } from "../dto/output/basicresponse";
import { Status } from "../dto/enums/statusenum";
import { NextFunction, Request, Response } from "express";
import { IInventoryRequisitionModel } from "../models/requisition";
import { ApproveInventoryItemRequestDTO } from '../dto/input/approverequisitiondto';
import { DeclineInventoryItemRequestDTO } from "../dto/input/declinerequisition";
import { CreateInventoryRequisitionDTO } from "../dto/input/createinventoryrequisitiondto";
import { validateSync } from 'class-validator';

import { trailNewRecord, simpleStoreAccessSearch, trailNewRecordWIthSettingsIntegrated, trailUpdatedRecord, trailUpdatedRequisitionRecord, handleException, list, singleList, simpleGetRequisition, trailMovedRequisitionRecord, trailDeclineRequisitionRecord } from "../aspects/audittrailaspects";

export class InventoryRequisitionService extends BaseService {

  @handleException()
  public async createInventoryRequisition(req: Request, res: Response, next: NextFunction, userId: string, tenantId: string) {
    const { cart, comment, requisition_number, access_code, acceptance_code } = req.body;
    let dto = new CreateInventoryRequisitionDTO(cart, comment, requisition_number, access_code, acceptance_code);
    let errors = await this.validateNewInventoryRequisitionDetails(dto, req, tenantId);
    if (this.hasErrors(errors)) {
      this.sendResponse(new BasicResponse(Status.FAILED_VALIDATION, errors), res);
      return next();
    }


    await this.saveNewInventoryRequisitionData(req, res, next, userId, tenantId, dto);
  }


  hasErrors(errors) {
    return !(errors === undefined || errors.length == 0);
  }


  @list("requisition")
  public async listInventoryRequisition(req: Request, res: Response, next: NextFunction, userId: string, tenantId: string) { }


  @simpleGetRequisition('requisition')
  public async fetchRequisitionById(req: Request, res: Response, next: NextFunction, userId: string, tenantId: string) { }

  @simpleStoreAccessSearch('requisition')
  public async inventoryStoreAccessSearch(req: Request, res: Response, next: NextFunction, userId: string, tenantId: string) { }


  @trailNewRecordWIthSettingsIntegrated("requisition")
  async saveNewInventoryRequisitionData(req: Request, res: Response, next: NextFunction, userId: string, tenantId: string, dto: CreateInventoryRequisitionDTO) {
    let { cart, comment, requisition_number, access_code, acceptance_code } = dto;
    requisition_number = 'REQ-' + Math.floor((1 + Math.random()) * 0x100000000);
    let requisition: IInventoryRequisitionModel = req.app.locals.requisition({ cart, comment, requisition_number, access_code, acceptance_code, userId, tenantId });
    return requisition;

  }

  public async approveInventoryItemRequisition(req: Request, res: Response, next: NextFunction, userId: string, tenantId: string) {
    let { cart, comment } = req.body
    let dto = new ApproveInventoryItemRequestDTO(cart, comment)
    let errors = await this.validateInventoryItemApproveRequest(dto, req, tenantId);
    if (this.hasErrors(errors)) {
      this.sendResponse(new BasicResponse(Status.FAILED_VALIDATION, errors), res)
      return next();
    }
    await this.approveInventoryItemData(req, res, next, userId, tenantId, dto)
  }


  @trailUpdatedRequisitionRecord('requisition')
  public async approveInventoryItemData(req: Request, res: Response, next: NextFunction, userId: string, tenantId: string, dto: ApproveInventoryItemRequestDTO) {
    let result;
    let userInfo = req.app.locals.userobj;
    let requisitionApprovals = await req.app.locals.settings.find({ tenantId: tenantId });
    let approvalRights = requisitionApprovals[0].secret.requisitionApprovers;
    if (approvalRights.indexOf(userInfo.email) === -1) {
      return this.sendResponse(new BasicResponse(Status.UNPROCESSABLE_ENTRY, ['you are not authorized to approve this request']), res);
    }
    try {
      result = await req.app.locals.requisition.findById(req.params.id);
      result.approval_status = 'approved'
      result.lastUpdatedAt = new Date();
      result.cart = dto.cart;
      result.access_code = 'RAC-' + Math.floor((1 + Math.random()) * 0x100000000);
      result.acceptance_code = 'PTZ-' + Math.floor((1 + Math.random()) * 0x100000000);
      result.remark = dto.comment;
      result.approved_by = userInfo.userId;
      result.approved_date = new Date()

    } catch (err) {
      this.sendResponse(new BasicResponse(Status.ERROR, err), res);
    }
    return result;

  }


  public async declineInventoryItemRequisition(req: Request, res: Response, next: NextFunction, userId: string, tenantId: string) {
    let { remark } = req.body
    let dto = new DeclineInventoryItemRequestDTO(remark)
    let errors = await this.validateInventoryItemDeclineRequest(dto, req, tenantId);
    if (this.hasErrors(errors)) {
      this.sendResponse(new BasicResponse(Status.FAILED_VALIDATION, errors), res)
      return next();
    }
    await this.declineInventoryItemData(req, res, next, userId, tenantId, dto)
  }


  @trailDeclineRequisitionRecord('requisition')
  async declineInventoryItemData(req: Request, res: Response, next: NextFunction, userId: string, tenantId: string, dto: DeclineInventoryItemRequestDTO) {
    let result;
    let userInfo = req.app.locals.userobj;
    let requisitionApprovals = await req.app.locals.settings.find({ tenantId: tenantId });
    let declineRequisitionRights = requisitionApprovals[0].secret.requisitionApprovers;
    if(declineRequisitionRights.indexOf(userInfo.email) === -1) {
          return this.sendResponse(new BasicResponse(Status.UNPROCESSABLE_ENTRY, ['you are not authorized to decline this request']), res);
    }
    try {
      result = await req.app.locals.requisition.findById(req.params.id);
      result.approval_status = 'declined'
      result.remark = dto.remark
      result.declined_by = userId;
      result.declined_date = new Date();
      result.lastUpdatedAt = new Date();
    } catch (err) {
      this.sendResponse(new BasicResponse(Status.ERROR, err), res);
    }
    return result;
  }


  public async processMoveRequisition(req: Request, res: Response, next: NextFunction, userId: string, tenantId: string) {
    const acceptanceCode = req.params.acceptanceCode;
    let requisitionResult = null;
    await req.app.locals.requisition.findOne({ tenantId: tenantId, acceptance_code: acceptanceCode, approval_status: "approved" }).then(result => {
      if (result) {
        if (result.moved === false) {
          requisitionResult = result

        } else {
          this.sendResponse(new BasicResponse(Status.UNPROCESSABLE_ENTRY, ["This acceptance code has been used"]), res);
        }
      } else {
        this.sendResponse(new BasicResponse(Status.NOT_FOUND, ["Entered acceptance code does not exist"]), res);
      }
    }).catch(err => {
      this.sendResponse(new BasicResponse(Status.ERROR), res);
    })

    let moveDetail = await this.checkInventoryItem(requisitionResult, tenantId, req, res)
    await this.checkSkuInputs(moveDetail, req, res, next, tenantId, userId);
  }


  async checkSkuInputs(moveDetail, req, res, next: NextFunction, tenantId, userId) {
    let unauthorizedSku = []
    let requisitions = []
    let invalidSku = [];
    let status = [];
    let itemIdAndSku = {};
    const inputSku = Array.from(new Set(req.body.sku));
    let skuRequisitonQty: number;
    const numberOfEnteredSKU = inputSku.length

    if (numberOfEnteredSKU === moveDetail.totalItemNumber) {
      for (let j = 0; j < inputSku.length; j++) {
        await req.app.locals.inventoryItem.findOne({ inventorySku: { $elemMatch: { sku: { $regex: inputSku[j], $options: "$i" } } }, tenantId: tenantId }).then(async result => {
          const skuPosition = await result.inventorySku.findIndex(i => i.sku === inputSku[j])
          await this.checkItemAvailability(result, skuPosition, moveDetail, skuRequisitonQty, itemIdAndSku, inputSku,requisitions, unauthorizedSku, status, j)
        }).catch(err => {
          invalidSku.push(inputSku[j])
        })
      }
      await this.validateMoveSku(req, res, next, invalidSku, unauthorizedSku, requisitions, moveDetail, status, itemIdAndSku, userId)
    } else {
      this.sendResponse(new BasicResponse(Status.FAILED_VALIDATION, [`This acceptance code expects ${moveDetail.totalItemNumber} UNIQUE skus but ${numberOfEnteredSKU} was given`]), res)
    }

  }

  async checkItemAvailability(result, skuPosition, moveDetail, skuRequisitonQty, itemIdAndSku, inputSku,requisitions, unauthorizedSku, status, j){
    if (result.inventorySku[skuPosition].status !== 'Out of store') {
      if (moveDetail.move.some(function (i) {
        skuRequisitonQty = i.requisitionQuantity
        if (!itemIdAndSku[i.id]) itemIdAndSku[i.id] = [];
        itemIdAndSku[i.id].push(inputSku[j])
        return JSON.stringify(i.id) === JSON.stringify(result._id)
      })) {
        requisitions.push({ skuPosition: skuPosition, itemResult: result, requisitionQuantity: skuRequisitonQty })
      } else {
        unauthorizedSku.push(inputSku[j])

      }
    } else {
      status.push(inputSku[j])
    }
  }

  async validateMoveSku(req: Request, res: Response, next: NextFunction, invalidSku, unauthorizedSku, requisitions, moveDetail, status, itemIdAndSku, userId) {
    if (status.length > 0) {
      this.sendResponse(new BasicResponse(Status.UNPROCESSABLE_ENTRY, [`The following SKUs have already been moved: ${status}`]), res)
    } else if (unauthorizedSku.length > 0) {
      this.sendResponse(new BasicResponse(Status.FAILED_VALIDATION, [`Your access code does not cover the following sku ${unauthorizedSku}`]), res)
    } else if (invalidSku.length > 0) {
      this.sendResponse(new BasicResponse(Status.ERROR, [`Verify your inputs and send again ${invalidSku}`]), res)
    } else if (requisitions.length > 0) {
      await this.updateInventory(req, res, next, requisitions, moveDetail, itemIdAndSku, userId)
    }
    else {
      this.sendResponse(new BasicResponse(Status.UNPROCESSABLE_ENTRY, ["No sku was entered"]), res)
    }

  }

@trailMovedRequisitionRecord('requisition')
  async updateInventory(req: Request, res: Response, next: NextFunction, requisitions, moveDetail, itemIdAndSku, userId) { }


  async checkInventoryItem(requisitionResult, tenantId, req, res) {
    let move = [];
    let inventoryItem = []
    let totalItemNumber = 0;
    for (let i = 0; i < requisitionResult.cart.length; i++) {
      const requisitionid = requisitionResult.cart[i].itemId._id;
      await req.app.locals.inventoryItem.findOne({ tenantId: tenantId, _id: requisitionid }).then(itemResult => {
        if (itemResult) {
          totalItemNumber += requisitionResult.cart[i].quantity
          move[move.length] = { id: requisitionid, inventoryQuantity: itemResult.secret.quantity, requisitionQuantity: requisitionResult.cart[i].quantity };
        } else {
          inventoryItem[inventoryItem.length] = requisitionResult.cart[i].itemId.secret.name;
        }
      })
    }
    if (inventoryItem.length > 0) {
      this.sendResponse(new BasicResponse(Status.FAILED_VALIDATION, ["The following items were not found", inventoryItem]), res)
    }
    return { move, totalItemNumber, requisitionResult }
  }


  async validateNewInventoryRequisitionDetails(dto: CreateInventoryRequisitionDTO, req: Request, tenantId: string) {
    let errors = validateSync(dto, { validationError: { target: false } });
    if (this.hasErrors(errors)) {
      return errors;
    }

    for (let requisition of dto.cart) {
      if (requisition.itemId === null || requisition.itemId === undefined || requisition.itemId === '') {
        errors.push(this.getItemItemIdRequestError(requisition));
      }
      if (requisition.quantity === null || requisition.quantity === undefined) {
        errors.push(this.getItemQuantityRequestError(requisition));
      }
    }


    for (let item of dto.cart) {
      await req.app.locals.inventoryItem.find({ tenantId: tenantId, _id: item.itemId }).then(result => {
        if (result.length == 0) {
          errors.push(this.getRequestUnprocessableItemError(result));
        }else {
          for (let itemStatus of result) {
            if( itemStatus.approval_status === 'pending' || itemStatus.approval_status === 'declined') {
              errors.push(this.getItemApprovalStatusisPendingorDeclinedError(result));
            }
          }
        }
      }).catch(error => {
        errors.push(this.getRequestUnprocessableItemError(dto.cart))
      })
    }

    return errors;
  }


  async validateInventoryItemApproveRequest(dto: ApproveInventoryItemRequestDTO, req: Request, tenantId: string) {
    let errors = validateSync(dto, { validationError: { target: false } });
    if (this.hasErrors(errors)) {
      return errors;
    }
    return errors;
  }

  async validateInventoryItemDeclineRequest(dto: DeclineInventoryItemRequestDTO, req: Request, tenantId: string) {
    let errors = validateSync(dto, { validationError: { target: false } });
    if (this.hasErrors(errors)) {
      return errors;
    }
    return errors;
  }


}