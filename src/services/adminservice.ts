import { BaseService } from "./baseservice";
import { BasicResponse } from "../dto/output/basicresponse";
import { Status } from "../dto/enums/statusenum";
import { ISettingsModel } from "../models/settings";
import { NextFunction, Request, Response } from "express";
import { UpdateSettingsDTO } from "../dto/input/updatesettingsdto"
import { validateSync } from "class-validator";
import { trailNewRecord, handleException, trailUpdatedRecord } from "../aspects/audittrailaspects";

export class AdminService extends BaseService {

  @handleException()
  public async createSettings(req: Request, res: Response, next: NextFunction, userId: string, tenantId: string) {

    const { enableApprovalForProcurement, procurementApprovers, enableRequisitionApprover, maxApprovalDelay, requisitionApprovers } = req.body;
    let dto = new UpdateSettingsDTO(enableApprovalForProcurement, procurementApprovers, enableRequisitionApprover, maxApprovalDelay, requisitionApprovers);

    let errors = await this.validateSettingsDetails(dto, req, tenantId);
    if (this.hasErrors(errors)) {
      this.sendResponse(new BasicResponse(Status.FAILED_VALIDATION, errors), res);
      return next();
    }
    await req.app.locals.settings.find({ tenantId: tenantId }).then(result => {
      if (result.length < 1) {
        this.saveNewSettings(req, res, next, userId, tenantId, dto);
      } else {
        this.updateSettings(req, res, next, userId, tenantId, dto);
      }
    })

  }

  hasErrors(errors) {
    return !(errors === undefined || errors.length == 0);
  }

  @trailUpdatedRecord('settings')
  public async updateSettings(req: Request, res: Response, next: NextFunction, userId: string, tenantId: string, dto: UpdateSettingsDTO) {

    let existingSettings = null;
    await req.app.locals.settings.find({ tenantId: tenantId }).then(result => {

      if (result) {
        existingSettings = result;
      }
    }).catch(err => {
      this.sendResponse(new BasicResponse(Status.ERROR, err), res)
    });

    let maxApprovalTime = req.body.maxApprovalDelay;
    let maxApprovalDelay = (maxApprovalTime * (60000 * 60));
    existingSettings[0].secret.enableApprovalForProcurement = dto.enableApprovalForProcurement;
    existingSettings[0].secret.procurementApprovers = dto.procurementApprovers;
    existingSettings[0].secret.enableRequisitionApprover = dto.enableRequisitionApprover;
    existingSettings[0].secret.maxApprovalDelay = maxApprovalDelay;
    existingSettings[0].secret.requisitionApprovers = dto.requisitionApprovers;
    existingSettings[0].lastUpdatedAt = new Date();

    let responseObj = null;
    await existingSettings[0].save().then(result => {
      if (!result) {
        responseObj = new BasicResponse(Status.ERROR);
      } else {
        responseObj = new BasicResponse(Status.SUCCESS, result);
      }

    }).catch(err => {
      responseObj = new BasicResponse(Status.ERROR, err);
    });

    this.sendResponse(responseObj, res);
  }

  @trailNewRecord('settings')
  async saveNewSettings(req: Request, res: Response, next: NextFunction, userId: string, tenantId: string, dto: UpdateSettingsDTO) {
    let { enableApprovalForProcurement, procurementApprovers, enableRequisitionApprover, maxApprovalDelay, requisitionApprovers } = dto;
    let maxApprovalTime = req.body.maxApprovalDelay;
    maxApprovalDelay = (maxApprovalTime * (60000 * 60))

    const secret = { enableApprovalForProcurement, procurementApprovers, enableRequisitionApprover, maxApprovalDelay, requisitionApprovers }
    let settings: ISettingsModel = req.app.locals.settings({ secret, userId, tenantId });

    return settings
  }

  public async listSettings(req: Request, res: Response, next: NextFunction, userId: string, tenantId: string) {

    req.app.locals.settings.find({ tenantId: tenantId }).then(result => {

      if (!result) {
        this.sendResponse(new BasicResponse(Status.NOT_FOUND), res)
      } else {
        this.sendResponse(new BasicResponse(Status.SUCCESS, result), res)
      }
    }).catch(err => {
      this.sendResponse(new BasicResponse(Status.ERROR, err), res);
    });
  }

  async validateSettingsDetails(dto: UpdateSettingsDTO, req: Request, tenantId: string) {
    let errors = validateSync(dto, { validationError: { target: false } });
    if (this.hasErrors(errors)) {
      return errors;
    }

    function validateEmail(email) {
      var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      return re.test(String(email).toLowerCase());
    }

    if (dto.procurementApprovers) { 
      dto.procurementApprovers.forEach(item =>{
        if (!validateEmail(item)) {
          errors.push(this.getProcurementApproversEmailNotValidError(dto.procurementApprovers))
        }
      })
    }

    if (dto.requisitionApprovers) {
      dto.requisitionApprovers.forEach(item => {
        if (!validateEmail(item)) {
          errors.push(this.getRequisitionApproversEmailNotValidError(dto.requisitionApprovers))
        }
      })
    }

    if(dto.enableRequisitionApprover === 'true' && (dto.requisitionApprovers === undefined || dto.requisitionApprovers === null || dto.requisitionApprovers.length === 0) ) {
      errors.push(this.getRequiredRequisitionApprovalsError(dto.requisitionApprovers))
    } 

    return errors;
  }

}