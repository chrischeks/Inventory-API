import { BaseService } from "./baseservice";
import { BasicResponse } from "../dto/output/basicresponse";
import { Status } from "../dto/enums/statusenum";
import { NextFunction, Request, Response } from "express";
import { IInventoryItemModel } from "../models/inventory";
import { CreateInventoryItemDTO } from "../dto/input/createinventoryitemdto";
import { UpdateInventoryItemDTO } from "../dto/input/updateinventoryitemdto";
import { DeclineInventoryItemDTO } from "../dto/input/declineitemdto";
import { validateSync } from "class-validator";
import { verify } from 'jsonwebtoken';
import { trailNewRecord, handleException, singleList, trailUpdatedRecord,list, simpleSearchQuery, trailRestockRecord } from "../aspects/audittrailaspects";
import { restockDTO } from "../dto/input/restockdto";

export class InventoryService extends BaseService {
  protected inventoryItemImage = [];

  @handleException()
  public async addInventoryItem( req: Request, res: Response, next: NextFunction, userId: string, tenantId: string) {
    const { name, description, quantity, category, properties, image } = req.body;
    let dto = new CreateInventoryItemDTO(name, description, quantity, category, properties, image);

    let errors = await this.validateNewInventoryDetails(dto, req, tenantId);
    if (this.hasErrors(errors)) {
      this.sendResponse(
        new BasicResponse(Status.FAILED_VALIDATION, errors), res);
      return next();
    }

    await this.saveNewInventoryData(req, res, next, userId, tenantId, dto, this.inventoryItemImage);
  }


  hasErrors(errors) {
    return !(errors === undefined || errors.length == 0);
  }

  @list("inventoryItem")
  public async listInventoryItem( req: Request, res: Response, next: NextFunction, userId: string, tenantId: string) 
  { }

  @singleList("inventoryItem")
  public async fetchItemById( req: Request, res: Response, next: NextFunction, userId: string, tenantId: string )
   { }

  @simpleSearchQuery('inventoryItem')
  public async querySearchEngine( req: Request, res: Response, next: NextFunction, userId: string, tenantId: string)
   { }


  @handleException()
  public async updateInventoryItem(req: Request, res: Response, next: NextFunction, userId: string, tenantId: string) {
    const { name, description, quantity, category, properties, image } = req.body;

    let dto = new UpdateInventoryItemDTO(name, description, quantity, category, properties, image);

      let errors = await this.validateNewInventoryDetails(dto, req, tenantId);
      if (this.hasErrors(errors)) {
        this.sendResponse(new BasicResponse(Status.FAILED_VALIDATION, errors), res);
        return next();
      }
      await this.updateInventoryItemData(req, res, next, userId, tenantId, dto, this.inventoryItemImage);
  }

@trailUpdatedRecord('inventoryItem')
  async updateInventoryItemData(req: Request, res: Response, next:NextFunction,  userId: string, tenantId: string,dto: UpdateInventoryItemDTO, result: any) {
    dto.image = result;
    let existinginventoryItem = null;
    await req.app.locals.inventoryItem.findById(req.params.id).then(result => {
      if (result) {
        existinginventoryItem = result;
      }
      else if (result.length === 0) {
        this.sendResponse(new BasicResponse(Status.NOT_FOUND), res);
      }
    }).catch(err => {
      this.sendResponse(new BasicResponse(Status.NOT_FOUND), res);
      
    });

    existinginventoryItem.secret.name = dto.name;
    existinginventoryItem.nameHash = this.sha256(dto.name);
    existinginventoryItem.secret.image = dto.image;
    existinginventoryItem.secret.description = dto.description;
    existinginventoryItem.secret.quantity = dto.quantity;
    existinginventoryItem.lastUpdatedAt = new Date()

    return existinginventoryItem;

  }


  @trailNewRecord("inventoryItem")
  async saveNewInventoryData(req: Request,res: Response, next: NextFunction, userId: string, tenantId: string, dto: CreateInventoryItemDTO,
    result: any
  ) {
    let { name, description, quantity, category, properties, image } = dto;
    let categoryDoc = null
    await req.app.locals.inventoryCategory.findOne({ _id: category }).then(result => {
      categoryDoc = result
    })
    if (categoryDoc) {
      image = result;
      const inventorySku = await this.storeKeepingUnit(categoryDoc.secret.name, dto.quantity, userId)
      const secret = { name, description, quantity, image};
      let inventory: IInventoryItemModel = req.app.locals.inventoryItem({
         secret, category, properties, inventorySku, userId, tenantId, nameHash: this.sha256(name)
      });
      return inventory;

    }
  }

  async storeKeepingUnit(categoryName: string, quantity, userId) {
    let categoryInitials: string,
      category: string[] = categoryName.split(" "),
      firstWord: string = category[0],
      secondWord: string = category[1],
      thirdWord: string = category[2];

    switch (category.length) {

      case 1:
        let oneWordCategory = firstWord.slice(0, 3)
        categoryInitials = oneWordCategory;
        break;
      case 2:
        if (secondWord.length === 1) {
          categoryInitials = firstWord.slice(0, 2) + secondWord;
        } else {
          categoryInitials = firstWord.slice(0, 1) + secondWord.slice(0, 2);
        }
        break;
      case 3:
        categoryInitials = firstWord.slice(0, 1) + secondWord.slice(0, 1) + thirdWord.slice(0, 1);
        break;
      default:
        categoryInitials = firstWord.slice(0, 1) + secondWord.slice(0, 1) + thirdWord.slice(0, 1);
        break;
    }

    const inventorySku = []
    const size = quantity.toString().length;
    while (quantity > 0) {
      const timestampInMilliSec = Date.now();
      const fixedNumberSequence = (quantity / Math.pow(10, size)).toFixed(size).split('.')[1];
      const saveNewSkuData = { sku: `${categoryInitials}${-timestampInMilliSec}-${fixedNumberSequence}`, userId: userId }
      inventorySku.push(saveNewSkuData);

      quantity--
    }

    return inventorySku
  }


  public async processRestockItem(req: Request, res: Response, next: NextFunction, userId: string, tenantId: string) {
    const { quantity } = req.body;
    let dto = new restockDTO(quantity)
    let errors = await this.validateDeclineInventoryItemDetails(dto, req, tenantId);
    if (this.hasErrors(errors)) {
      this.sendResponse(new BasicResponse(Status.FAILED_VALIDATION, errors), res);
      return next();
    }
    await this.restockItem(req, res, next, dto, userId)

  }

@trailRestockRecord('inventoryItem')
  async restockItem(req: Request, res: Response, next: NextFunction, dto, userId) {
    let existinginventoryItem = null;
    await req.app.locals.inventoryItem.findById(req.params.itemId).then(result => {
      if (result) existinginventoryItem = result;
  
      else this.sendResponse(new BasicResponse(Status.NOT_FOUND, ["No result found for this itemId"]), res);
      
    }).catch(err => {
      this.sendResponse(new BasicResponse(Status.ERROR, ["Invalid itemId"]), res);
    });

    if (existinginventoryItem) {
      let inventorySku;
      let quantity = existinginventoryItem.secret.quantity + dto.quantity;
      await req.app.locals.inventoryCategory.findOne({ _id: existinginventoryItem.category }).then(async result => {
          inventorySku = await this.storeKeepingUnit(result.secret.name, dto.quantity, userId);
          existinginventoryItem.inventorySku = existinginventoryItem.inventorySku.concat(inventorySku)
          existinginventoryItem.secret.quantity = quantity;
      }).catch(err => {
        this.sendResponse(new BasicResponse(Status.ERROR, ["Invalid categoryId"]), res);
      });
      return existinginventoryItem;
    }

  }


  @trailUpdatedRecord('inventoryItem')
  public async approveInventoryItem(req: Request, res: Response, next: NextFunction, userId: string, tenantId: string) {
    let result;
    try {
      result = await req.app.locals.inventoryItem.findById(req.params.id);
      result.approval_status = 'approved'
      result.lastUpdatedAt = new Date()
    } catch (err) {
      this.sendResponse(new BasicResponse(Status.ERROR, err), res);
    }
    return result;

  }


  public async declineInventoryItem(req: Request, res: Response, next: NextFunction, userId: string, tenantId: string) {
    let { comment } = req.body
    let dto = new DeclineInventoryItemDTO(comment)
    let errors = await this.validateDeclineInventoryItemDetails(dto, req, tenantId);
    if (this.hasErrors(errors)) {
      this.sendResponse(new BasicResponse(Status.FAILED_VALIDATION, errors), res)
      return next();
    }
    await this.declineInventoryItemData(req, res, userId, tenantId, dto)
  }


  @trailUpdatedRecord('inventoryItem')
  async declineInventoryItemData(req: Request, res: Response, userId: string, tenantId: string, dto: DeclineInventoryItemDTO) {
    let result;
    try {
      result = await req.app.locals.inventoryItem.findById(req.params.id);
      result.approval_status = 'declined'
      result.secret.comment = dto.comment
      result.lastUpdatedAt = new Date();
    } catch (err) {
      this.sendResponse(new BasicResponse(Status.ERROR, err), res);
    }
    return result;
  }


  async validateNewInventoryDetails(dto: CreateInventoryItemDTO, req: Request, tenantId: string) {
    let errors = validateSync(dto, { validationError: { target: false } });
    if (this.hasErrors(errors)) {
      return errors;
    }

    await req.app.locals.inventoryItem.find({ nameHash: this.sha256(req.body.name), tenantId }).then(result => {
      if (result && result[0] && result[0]._id && result[0]._id != req.params.id) {
        errors.push(this.getItemNameDuplicateError(dto.name));
      } else if (result && result[0] && result[0]._id && !req.params.id) {
        errors.push(this.getItemNameDuplicateError(dto.name));
      }
    });

    if (dto.image) {
      let validateToken = await this.validateImageUploadToken(dto, req, tenantId);
      if (!validateToken) {
        errors.push(this.validateImageToken(dto.image));
      }
    }


    await req.app.locals.inventoryCategory.find({ _id: req.body.category })
      .then(category => {
        if (category.length == 0) {
          errors.push(this.getRequestUnprocessableCategoryError(dto.category));
        }
      }).catch(err => {
        errors.push(this.getRequestUnprocessableCategoryError(dto.category));
      });


      for(let property of dto.properties) {
        await req.app.locals.property.find({_id: property.id}).then(result => {
        if(result.length == 0) {
            errors.push(this.getRequestUnprocessablePropertyError(result));
          }
        }).catch(error => {
                errors.push(this.getRequestUnprocessablePropertyError(dto.properties))
          })
      }

    return errors;
  }


  async validateDeclineInventoryItemDetails(dto, req: Request, tenantId: string) {
    let errors = validateSync(dto, { validationError: { target: false } });
    if (this.hasErrors(errors)) {
      return errors;
    }
    return errors;
  }
  async validateImageUploadToken(dto: CreateInventoryItemDTO, req: Request, tenantId: string) {
    let token = dto.image;
    try {
      var publicKey = JSON.parse(`"${process.env.JWT_PUBLIC_KEY}"`);
      var result: any = verify(token, publicKey, { algorithms: ['RS256'], issuer: process.env.JWT_ISSUER });
      this.setFileVariables(result);
      return true;
    } catch (err) {
      return false;
    }
  }


  protected setFileVariables(result) {

    result.data.forEach(data => {
      this.inventoryItemImage.push(data);
    });
  }


  async findInventoryWithSameNameForTenant(inventory, name: string, tenantId: string) {
    var found = 0;
    await inventory.countDocuments({ nameHash: this.sha256(name),tenantId: tenantId}).then(e => {
        found = e;
      });
    return found;
  }
}