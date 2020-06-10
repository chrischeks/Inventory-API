import { Validator } from "validator.ts/Validator";
import chalk = require("chalk");
import { BasicResponse } from "../dto/output/basicresponse";
import { Status } from "../dto/enums/statusenum";
import crypto = require("crypto");
import { NextFunction, Request, Response } from "express";

export class BaseService {
  protected errors;

  protected hasErrors(input: any): boolean {
    let errors = new Validator().validate(input);
    this.errors = errors;
    return !(errors === undefined || errors.length == 0);
  }

  protected sha256(data) {
    return crypto
      .createHash("sha256")
      .update(data, "utf8")
      .digest("base64");
  }

  protected sendError(
    req: Request,
    res: Response,
    next: NextFunction,
    data?: Object
  ) {
    var dat = {
      status: 401,
      data: data
    };
    res.status(401);
    res.send(dat);
  }

  public sendResponse(serviceResponse: BasicResponse, res: Response): any {
    var response = {
      status: serviceResponse.getStatusString(),
      data: serviceResponse.getData()
    };

    res.status(this.getHttpStatus(serviceResponse.getStatusString()));

    console.log("responding with", response);
    res.json(response);
  }

  protected sendException(
    ex,
    serviceResponse: BasicResponse,
    req: Request,
    res: Response,
    next: NextFunction
  ): any {
    console.log(chalk.default.blue.bgRed.bold(ex));
    this.sendResponse(serviceResponse, res);
  }

  private getHttpStatus(status: string): number {
    switch (status) {
      case "SUCCESS":
        return 200;
      case "CREATED":
        return 201;
      case "FAILED_VALIDATION":
        return 400;
      case "NOT_FOUND":
        return 404;
      case "CONFLICT":
        return 409;
      case "UNPROCESSABLE_ENTRY":
        return 422;
      default:
        return 500;
    }
  }

  protected logInfo(info: string) {
    console.log(chalk.default.blue.bgGreen.bold(info));
  }

  protected logError(error: string) {
    console.log(chalk.default.blue.bgRed.bold(error));
  }

  protected getDuplicateError(name: string): any {
    return {
      property: "name",
      constraints: { unique: "name must be unique" },
      value: name
    };
  }

  protected getItemNameDuplicateError(name: string): any {
    return {
      property: "name",
      constraints: { unique: "name must be unique" },
      value: name
    };
  }

  protected validateImageToken(image: string): any {
    return {
      property: "image",
      constraints: { isNotValid: "image is not valid" },
      value: image
    };
  }

  protected getPropertyNameRequiredError(property: any): any {
    return {
      property: "name",
      constraints: { required: "name is required for this property" },
      value: property.name
    };
  }

  protected getPropertyTypeRequiredError(property: any): any {
    return {
      property: "type",
      constraints: { required: "type is required for this property" },
      value: property.type
    };
  }

  protected getPropertyDescriptionRequiredError(property: any): any {
    return {
      property: "description",
      constraints: { required: "description is required for this property" },
      value: property.description
    };
  }

  protected getPropertyOptionsRequiredErrors(property: any): any {
    return {
      property: "options",
      constraints: { required: "options are required" },
      value: property.options
    };
  }

  protected getProcurementApproversEmailNotValidError(procurementApprovers: any): any {
    return {
      'property': 'procurementApprovers', 'constraints': { 'isNotValid': 'procurementApprovers not a valid email' }, value: procurementApprovers
    };
  }

  protected getRequisitionApproversEmailNotValidError(requisitionApprovers: any): any {
    return {
      'property': 'requisitionApprovers', 'constraints': { 'isNotValid': 'requisitionApprovers not a valid email' }, value: requisitionApprovers
    };
  }

  protected getRequiredRequisitionApprovalsError(requisitionApprovers: any): any {
    return {
      'property': 'requisitionApprovers', 'constraints': { 'required': 'requisitions approval is required' }, value: requisitionApprovers
    };
  }

  protected getItemPriceError(items: any): any {
    return {
      property: "price",
      constraints: { constraint: "price should be number" },
      value: items.price
    };
  }

  protected getItemQuantityError(items: any): any {
    return {
      property: "quantity",
      constraints: { constraint: "quantity should be number" },
      value: items.quantity
    };
  }

  protected getRequestUnprocessableCategoryError(category: any): any {
    return {
      property: "category",
      constraints: {
        isNotValid: "category is not valid"
      },
      value: category
    };
  }

  protected getParentCategoryNameError(property: any): any {
    return {
      property: "parentCategoryId",
      constraints: { error: "parent category does not exist" },
      value: property.parentCategoryId
    };
  }

  protected getRequestUnprocessablePropertyError(property: any): any {
    return {
      property: "property",
      constraints: {
        isNotValid: "property is not valid"
      },
      value: property.id
    };
  }

  protected getItemItemIdRequestError(requisition: any): any {
    return {
      property: "itemId",
      constraints: { required: "item field cannot be empty" },
      value: requisition.itemId
    };
  }


  protected getItemQuantityRequestError(requisition: any): any {
    return {
      property: "quantity",
      constraints: { required: "quantity field cannot be empty" },
      value: requisition.quantity
    };
  }

  protected getRequestUnprocessableItemError(item: any): any {
    return {
      property: "item",
      constraints: {
        isNotValid: "itemId is not valid"
      },
      value: item.itemId
    };
  }

  protected getUnprocessableRequisitionQtyNotAvailError(item: any): any {
    return {
      property: "quantity",
      constraints: {
        Unproccessable: "requested quantity is greater than available quantity"
      },
      value: item.quantity
    };
  }

  protected getItemApprovalStatusisPendingorDeclinedError(item: any): any {
    return {
      property: "item",
      constraints: {
        isNotValid: "unable to process request, requested item is either pending or declined"
      },
      value: item.itemId
    };
  }

  protected getSkuRequestNotValidError(item: any): any {
    return {
      property: "sku",
      constraints: {
        isNotValid: "sku not valid"
      },
      value: item.itemId
    };
  }


  protected getRequisitionApproverNoEmailConfigError(email: any): any {
    return {
      property: "emailApproverConfiguration",
      constraints: { required: "you have no email configured yet for requisition" },
      value: email
    };
  }

  protected getRequisitionApproverNotEnabledError(enable: any): any {
    return {
      property: "enableEmailApprover",
      constraints: { required: "Email approver is not enabled yet" },
      value: enable
    }
  }
  

}

