import { BaseService } from "./baseservice";
import { BasicResponse } from "../dto/output/basicresponse";
import { Status } from "../dto/enums/statusenum";
import { NextFunction, Request, Response } from "express";
import { IInventoryCategoryModel } from "../models/category";
import { CreateInventoryCategoryDTO } from "../dto/input/createcategorydto";
import { updateInventoryCategoryDTO } from "../dto/input/updatecategorydto";
import { validateSync, validate } from "class-validator";
import { propertyTypeList } from "../dto/enums/data";
import { trailNewRecord, handleException, simpleList, simpleSingleList, trailUpdatedRecord } from "../aspects/audittrailaspects";
import { IPropertyModel } from "../models/property";
import { Types } from "mongoose";

export class InventoryCategoryService extends BaseService {
  @handleException()
  public async createInventoryCategory( req: Request, res: Response, next: NextFunction, userId: string, tenantId: string) {
    const {description, barcode, parentCategoryId, properties, active } = req.body;
    let name: string;
    if(req.body.name){
      name = req.body.name.trim().split(/\s+/).join(" ");
    }else{
      name = req.body.name;
    } 
    
    let dto = new CreateInventoryCategoryDTO(name, description, barcode, parentCategoryId, properties, active);

    let errors = await this.validateNewInvCategoryDetails(dto, req, tenantId);
    if (this.hasErrors(errors)) {
      this.sendResponse(
        new BasicResponse(Status.FAILED_VALIDATION, errors),
        res
      );
      return next();
    }
    await this.saveNewInvCategoryData(req, res, next, userId, tenantId, dto);
  }


  hasErrors(errors) {
    return !(errors === undefined || errors.length == 0);
  }


  @trailNewRecord('inventoryCategory')
  async saveNewInvCategoryData(req: Request, res: Response, nextt: NextFunction,  userId: string, tenantId: string,  dto: CreateInventoryCategoryDTO) {
    let properties = await this.saveAndGetPropertyIds(req, userId, tenantId, dto.properties);
    const { name, description, barcode, parentCategoryId } = dto;

    const secret = { name, description, barcode, parentCategoryId };
    let inventoryCategory: IInventoryCategoryModel = req.app.locals.inventoryCategory(
      { secret, properties, parentCategoryId, userId: userId,tenantId: tenantId, nameHash: this.sha256(name) } );
    
      console.log('inventory category', inventoryCategory);
    return inventoryCategory;

  }

  async saveAndGetPropertyIds(req, userId, tenantId, properties: [{ name?: string; description?: string; type?: string; options?: string[]; required: boolean; }]) {

    if (properties === undefined) {
      return [];
    }

    let response = [];
    await this.forEach(properties, async e => {
      let property = {
        secret: {
          name: e.name,
          description: e.description === undefined ? '' : e.description,
          property_type: e.type,
          options: e.options,
          required: e.required === undefined ? false : e.required
        },
        userId: userId,
        tenantId: tenantId,
        nameHash: this.sha256(e.name)
      };

      await req.app.locals.property(property).save().then(result => {
        response.push(Types.ObjectId(result._id));
      }).catch(err => {
         
      });
    });

    return response;
  }

  async forEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array);
    }
  }

  public async listCategoryPropertyTypes(req: Request, res: Response, next: NextFunction, userId: string, tenantId: string) {
    this.sendResponse(new BasicResponse(Status.SUCCESS, propertyTypeList), res);
  }

  @simpleList('inventoryCategory', 'properties')
  public async listInventoryCategories(req: Request, res: Response, next: NextFunction, userId: string, tenantId: string)
   { }


  @simpleSingleList('inventoryCategory', 'properties')
  public async fetchCategoryById(req: Request, res: Response, next: NextFunction, userId: string, tenantId: string)
   { }

  @handleException()
  public async updateInventoryCategory(req: Request, res: Response, next: NextFunction, userId: string, tenantId: string) {
    const { name, description, barcode, properties } = req.body;

    let dto = new updateInventoryCategoryDTO(name, description, barcode, properties);
    
      let errors = await this.validateNewInvCategoryDetails(dto, req, tenantId);

      if (this.hasErrors(errors)) {
        this.sendResponse(
          new BasicResponse(Status.FAILED_VALIDATION, errors),
          res
        );
        return next();
      }

      await this.updateInventoryCategoryData(req, res, next, userId, tenantId, dto);
  }

  @trailUpdatedRecord('inventoryCategory')
  async updateInventoryCategoryData( req: Request, res: Response, next: NextFunction,  userId: string, tenantId: string, dto: updateInventoryCategoryDTO) {
    let existingCategory = null,
      validPropertyId = null,
      existingProperty = null
     let propertyDto = null


    await req.app.locals.inventoryCategory.findById(req.params.id).then(result => {
      if (result) {
        existingCategory = result
      }
      else if (result.length === 0) {
        this.sendResponse( new BasicResponse(Status.NOT_FOUND), res);
      }
    }).catch(err => {
      this.sendResponse(new BasicResponse(Status.NOT_FOUND), res);
    });


    await req.app.locals.property.find({ _id: existingCategory.properties.toString() }).then(propertyId => {
      if (propertyId) {
        validPropertyId = propertyId
      } 
      
      else if (propertyId.length === 0) {
        this.sendResponse( new BasicResponse(Status.NOT_FOUND),res);
      }
    }).catch(err => {
      this.sendResponse(new BasicResponse(Status.NOT_FOUND), res);
    });

    validPropertyId.forEach(validId => existingProperty = validId);

    req.body.properties.forEach(prop =>  propertyDto = prop);

    existingCategory.secret.name = dto.name;
    existingCategory.nameHash = this.sha256(dto.name);
    existingCategory.secret.description = dto.description;
    existingCategory.secret.barcode = dto.barcode;
    existingProperty.secret.name = propertyDto.name;
    existingProperty.secret.description = propertyDto.description;
    existingProperty.secret.property_type = propertyDto.type;
    existingProperty.secret.options = propertyDto.options;
    existingProperty.secret.required = propertyDto.required;
    existingCategory.lastUpdatedAt = new Date();

    await existingProperty.save();

    return existingCategory;
  }


  @trailUpdatedRecord('inventoryCategory')
  public async suspendInventoryCategory(req: Request, res: Response, next: NextFunction, userId: string,
    tenantId: string
  ) {
    let result;
    try {
      result = await req.app.locals.inventoryCategory.findById(req.params.id);

      result.active = false;
    } catch (err) {
      this.sendResponse(new BasicResponse(Status.ERROR, err), res);
    }
    return result;
  }

  @trailUpdatedRecord('inventoryCategory')
  public async unsuspendInventoryCategory(req: Request, res: Response, next: NextFunction, userId: string,
    tenantId: string
  ) {
    let result;
    try {
      result = await req.app.locals.inventoryCategory.findById(req.params.id);

      result.active = true;
    } catch (err) {
      this.sendResponse(new BasicResponse(Status.ERROR, err), res);
    }
    return result;
  }

  async validateNewInvCategoryDetails(dto: CreateInventoryCategoryDTO, req: Request, tenantId: string) {

    let errors = validateSync(dto, { validationError: { target: false } });
    if (this.hasErrors(errors)) {
      return errors;
    }

    await req.app.locals.inventoryCategory.find({ _id: req.body.parentCategoryId }).then(result => {
      if (!result) errors.push(this.getParentCategoryNameError(dto.parentCategoryId));
    }).catch(err => {
      errors.push(this.getParentCategoryNameError(dto.parentCategoryId))
    });

    if (dto.properties !== undefined) {
      dto.properties.forEach(property => {
        if (property.name === null || property.name === undefined) {
          errors.push(this.getPropertyNameRequiredError(property));
        }

        if (property.type === null || property.type === undefined) {
          errors.push(this.getPropertyTypeRequiredError(property))
        }

        if (property.type === 'dropdown' && (property.options === null || (property.options === undefined))) {
          errors.push(this.getPropertyOptionsRequiredErrors(property));

        } else if (property.type === 'checkbox' && (property.options === null || (property.options === undefined))) {
          errors.push(this.getPropertyOptionsRequiredErrors(property));
        } else if (property.type === 'radiobutton' && (property.options === null || (property.options === undefined))) {
          errors.push(this.getPropertyOptionsRequiredErrors(property));
        }
      });
    }

    await req.app.locals.inventoryCategory.find({ nameHash: this.sha256(req.body.name), tenantId }).then(result => {
      if (result && result[0] && result[0]._id && result[0]._id != req.params.id) {
        errors.push(this.getItemNameDuplicateError(dto.name));
      } else if (result && result[0] && result[0]._id && !req.params.id) {
        errors.push(this.getItemNameDuplicateError(dto.name));
      }
    });
    return errors;
  }

  async findInventoryCategoriesWithSameNameForTenant(inventoryCategory, name: string, tenantId: string) {
    var found = 0;
    await inventoryCategory
      .countDocuments({ nameHash: this.sha256(name), tenantId: tenantId })
      .then(e => {
        found = e;
      });
    return found;
  }
}
