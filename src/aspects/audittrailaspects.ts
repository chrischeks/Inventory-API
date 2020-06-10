import { afterMethod, beforeMethod, onException } from "kaop-ts";
import { IActivityModel } from "../models/activity";
import { BasicResponse } from "../dto/output/basicresponse";
import { Status } from "../dto/enums/statusenum";
import { IsNumberString } from "class-validator";
import { isNumber } from "util";
import crypto = require("crypto");
import * as cron from "node-cron";
import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config();

export const sha256 = (data): any => {
  return crypto
    .createHash("sha256")
    .update(data, "utf8")
    .digest("base64");
}


export const handleException = (): any =>
  onException(meta => {
    let response = meta.args[1];
    sendResponse(new BasicResponse(Status.ERROR), response);
  });


function isMissing(param) {
  return !param;
}


function isNotANumber(param) {
  return !(IsNumberString(param) || isNumber(param));
}



export const simpleList = (schemaName: string, populate?: string): any =>
  afterMethod(async meta => {
    let request = meta.args[0];
    let response = meta.args[1];
    let next = meta.args[2];

    const tenantId = request.app.locals.userobj.organisationId;

    let offset = request.query.offset;
    let limit = request.query.limit;

    if (isMissing(offset) || isNotANumber(offset)) {
      offset = 0;
    }

    if (isMissing(limit) || isNotANumber(limit)) {
      limit = 50;
    }

    let skip = offset * limit;
    let count = 0;
    
    await request.app.locals[schemaName].count({ tenantId: tenantId }).then(result => { count = result });

    let base;
    if (populate) {
      base = request.app.locals[schemaName].find({ tenantId: tenantId }).populate(populate).populate('parentCategoryId').populate({
        path: 'childCategoryAttached ItemAttachedToThisCategory', populate: {
        path: 'childCategoryAttached ItemAttachedToThisCategory', populate: {
        path: 'childCategoryAttached ItemAttachedToThisCategory', populate: {
        path: 'childCategoryAttached ItemAttachedToThisCategory'}}}})
    } else {
      base = request.app.locals[schemaName].find({ tenantId: tenantId }).populate(populate).populate('parentCategoryId').populate({
        path: 'childCategoryAttached ItemAttachedToThisCategory', populate: {
          path: 'childCategoryAttached ItemAttachedToThisCategory', populate: {
          path: 'childCategoryAttached ItemAttachedToThisCategory', populate: {
          path: 'childCategoryAttached ItemAttachedToThisCategory'}}}})
    }
    base
      .skip(skip)
      .limit(parseInt(limit))
      .sort([['createdAt', -1]])
      .then(result => {
        if (!result) {
          sendResponse(new BasicResponse(Status.ERROR), response);
          return next();
        } else {
          sendResponse(
            new BasicResponse(Status.SUCCESS, result, count),
            response
          );
          return next();
        }
      })
      .catch(err => {
        sendResponse(new BasicResponse(Status.ERROR, err), response);
        return next();
      });
  });



export const simpleSearchQuery = (schemaName: string): any =>
  afterMethod(async meta => {
    let request = meta.args[0];
    let response = meta.args[1];
    let next = meta.args[2];

    let tenantId = request.app.locals.userobj.organisationId;

    let model = request.app.locals[schemaName];

    let offset = request.query.offset;
    let limit = request.query.limit;

    if (isMissing(offset) || isNotANumber(offset)) offset = 0;

    if (isMissing(limit) || isNotANumber(limit)) {
      limit = 50;
    }
 
    let skip = offset * limit;
    let count = 0;
    await model.countDocuments({ tenantId: tenantId, approval_status: 'approved', $or: [{inventorySku: {$elemMatch: {sku: {$regex: request.query.name, $options:"$i"}} }}, {nameHash: sha256(request.query.name)}]}).then(result => {
      count = result;
    });

    model
      .find({ tenantId: tenantId, approval_status: 'approved', $or: [{inventorySku: {$elemMatch: {sku: {$regex: request.query.name, $options:"$i"}} }}, {nameHash: sha256(request.query.name)}]}).populate('properties.id')
      .skip(skip)
      .limit(parseInt(limit))
      .sort([['createdAt', -1]])
      .then(result => {
        if (!result) {
          sendResponse(new BasicResponse(Status.ERROR), response);
          return next();
        } else if (result.length === 0) {
          sendResponse(new BasicResponse(Status.NOT_FOUND), response);
          return next();
        } else {
          sendResponse(
            new BasicResponse(Status.SUCCESS, result, count),
            response
          );
          return next();
        }
      })
      .catch(err => {
        sendResponse(new BasicResponse(Status.ERROR, err), response);
        return next();
      });
  });


  export const simpleStoreAccessSearch = (schemaName: string): any =>
  afterMethod(async meta => {
    let request = meta.args[0];
    let response = meta.args[1];
    let next = meta.args[2];

    let tenantId = request.app.locals.userobj.organisationId;

    let model = request.app.locals[schemaName];

    let offset = request.query.offset;
    let limit = request.query.limit;

    if (isMissing(offset) || isNotANumber(offset)) offset = 0;

    if (isMissing(limit) || isNotANumber(limit)) {
      limit = 50;
    }
 
    let skip = offset * limit;
    let count = 0;
    await model.countDocuments({ tenantId: tenantId, $and: [{ requisition_number: request.query.requisition_number }, { access_code: request.query.access_code}] }).then(result => {
      count = result;
    });

    model
      .find({ tenantId: tenantId, $and: [{ requisition_number: request.query.requisition_number }, { access_code: request.query.access_code}] }).populate('cart.itemId')
      .skip(skip)
      .limit(parseInt(limit))
      .sort([['createdAt', -1]])
      .then(result => {
        if (!result) {
          sendResponse(new BasicResponse(Status.ERROR), response);
          return next();
        } else if (result.length === 0) {
          sendResponse(new BasicResponse(Status.NOT_FOUND), response);
          return next();
        } else {
          sendResponse(
            new BasicResponse(Status.SUCCESS, result, count),
            response
          );
          return next();
        }
      })
      .catch(err => {
        sendResponse(new BasicResponse(Status.ERROR, err), response);
        return next();
      });
  });
 


export const simpleSingleList = (schemaName: string, populate?: string): any =>
  afterMethod(async meta => {
    let request = meta.args[0];
    let response = meta.args[1];
    let next = meta.args[2];

    const tenantId = request.app.locals.userobj.organisationId;

    let offset = request.query.offset;
    let limit = request.query.limit;

    if (isMissing(offset) || isNotANumber(offset)) {
      offset = 0;
    }

    if (isMissing(limit) || isNotANumber(limit)) {
      limit = 50;
    }

    let skip = offset * limit;
    let count = 0;
    await request.app.locals[schemaName]
      .count({ tenantId: tenantId })
      .then(result => {
        count = result;
      });

    let base;
    if (populate) {
      base = request.app.locals[schemaName].findById(request.params.id)
      .populate(populate)
      .populate({
        path: 'childCategoryAttached ItemAttachedToThisCategory', populate: {
        path: 'childCategoryAttached ItemAttachedToThisCategory', populate: {
        path: 'childCategoryAttached ItemAttachedToThisCategory', populate: {
        path: 'childCategoryAttached ItemAttachedToThisCategory'}}}})  
     
    } else {
      base = request.app.locals[schemaName].findById(request.params.id)
      .populate(populate)
      .populate({
        path: 'childCategoryAttached ItemAttachedToThisCategory', populate: {
          path: 'childCategoryAttached ItemAttachedToThisCategory', populate: {
          path: 'childCategoryAttached ItemAttachedToThisCategory', populate: {
          path: 'childCategoryAttached ItemAttachedToThisCategory'}}}})
    }
    base
      .skip(skip)
      .limit(parseInt(limit))
      .sort([['createdAt', -1]])
      .then(result => {
        if (!result) {
          sendResponse(new BasicResponse(Status.ERROR), response);
          return next();
        }else if(result.length === 0) {
          sendResponse(new BasicResponse(Status.NOT_FOUND), response);
        return next();
        } else {
          sendResponse(
            new BasicResponse(Status.SUCCESS, result),
            response
          );
          return next();
        }
      })
      .catch(err => {
        sendResponse(new BasicResponse(Status.NOT_FOUND), response);
        return next();
      });
  });


  export const singleList = (schemaName: string): any =>
  afterMethod(async meta => {
    let request = meta.args[0];
    let response = meta.args[1];
    let next = meta.args[2];

    const tenantId = request.app.locals.userobj.organisationId;

    let offset = request.query.offset;
    let limit = request.query.limit;

    if (isMissing(offset) || isNotANumber(offset)) {
      offset = 0;
    }

    if (isMissing(limit) || isNotANumber(limit)) {
      limit = 50;
    }

    let skip = offset * limit;
    let count = 0;
    await request.app.locals[schemaName]
      .count({ tenantId: tenantId })
      .then(result => {
        count = result;
      });

    let base;
     let id = request.params.id;
      base = request.app.locals[schemaName].findById(id).populate('properties.id').populate('cart.itemId')
    base
      .skip(skip)
      .limit(parseInt(limit))
      .sort([['createdAt', -1]])
      .then(result => {
        if (!result) {
          sendResponse(new BasicResponse(Status.NOT_FOUND), response);
          return next();
        }else if(result.length === 0) {
          sendResponse(new BasicResponse(Status.NOT_FOUND), response);
        return next();
        } else {
          sendResponse(
            new BasicResponse(Status.SUCCESS, result),
            response
          );
          return next();
        }
      })
      .catch(err => {
        sendResponse(new BasicResponse(Status.NOT_FOUND), response);
        return next();
      });
  });




  export const simpleGetRequisition = (schemaName: string): any =>
  afterMethod(async meta => {
    let request = meta.args[0];
    let response = meta.args[1];
    let next = meta.args[2];

    const tenantId = request.app.locals.userobj.organisationId;

    let offset = request.query.offset;
    let limit = request.query.limit;

    if (isMissing(offset) || isNotANumber(offset)) {
      offset = 0;
    }

    if (isMissing(limit) || isNotANumber(limit)) {
      limit = 50;
    }

    let skip = offset * limit;
    let count = 0;
    await request.app.locals[schemaName]
      .count({ tenantId: tenantId })
      .then(result => {
        count = result;
      });

    let base;
     let id = request.params.id;
      base = request.app.locals[schemaName].findById(id).populate('properties.id').populate('cart.itemId')
    base
      .skip(skip)
      .limit(parseInt(limit))
      .sort([['createdAt', -1]])
      .then(result => {
        if (!result) {
          sendResponse(new BasicResponse(Status.NOT_FOUND), response);
          return next();
        }else if(result.length === 0) {
          sendResponse(new BasicResponse(Status.NOT_FOUND), response);
        return next();
        } else {
          sendResponse(
            new BasicResponse(Status.SUCCESS, result),
            response
          );
          return next();
        }
      })
      .catch(err => {
        sendResponse(new BasicResponse(Status.NOT_FOUND), response);
        return next();
      });
  });


export const list = (schemaName: string): any =>
  afterMethod(async meta => {
    let request = meta.args[0];
    let response = meta.args[1];
    let next = meta.args[2];

    let tenantId = request.app.locals.userobj.organisationId;

    let model = request.app.locals[schemaName];

    let offset = request.query.offset;
    let limit = request.query.limit;

    if (isMissing(offset) || isNotANumber(offset)) offset = 0;

    if (isMissing(limit) || isNotANumber(limit)) {
      limit = 50;
    }

    let skip = offset * limit;
    let count = 0;
    await model.countDocuments({ tenantId: tenantId }).then(result => {
      count = result;
    });

    model
      .find({ tenantId: tenantId }).populate('properties.id').populate('cart.itemId')
      .skip(skip)
      .limit(parseInt(limit))
      .sort([['createdAt', -1]])
      .then(result => {
        if (!result) {
          sendResponse(new BasicResponse(Status.ERROR), response);
          return next();
        } else {
          sendResponse(
            new BasicResponse(Status.SUCCESS, result, count),
            response
          );
          return next();
        }
      })
      .catch(err => {
        sendResponse(new BasicResponse(Status.ERROR, err), response);
        return next();
      });
  });


export const trailNewRecordWIthSettingsIntegrated = (schemaName: string): any =>
  afterMethod(async meta => {
    let request = meta.args[0];
    let response = meta.args[1];
    let next = meta.args[2];
    let dto = meta.args[5];
    let userInfo = request.app.locals.userobj;
    let tenantId = request.app.locals.userobj.organisationId;
    let description = `${userInfo.firstname} ${userInfo.lastname} added a new record`;
    let recipientEmails = await request.app.locals.settings.find({ tenantId: tenantId })
    meta.result.then(model => {
      model.save().then(async entity => {
        await request.app.locals[schemaName].findById(entity._id).then(async result => {
          await request.app.locals.settings.find({tenantId: tenantId}).then(async setting => {
            if(result && setting.length === 0 || setting[0].secret.enableRequisitionApprover === false) {

              await saveAutomaticApprovalRequisition(request, response, next, result, schemaName, description, entity, recipientEmails, dto);
              requisitionTiming(request, setting, dto, entity._id);
            }
            else if (setting[0].secret.enableRequisitionApprover === true) {
              result.approval_status = 'pending';
              await result.save().then(data => {
                saveRequisitionActivity(description, schemaName, null, result, "create", request);
                sendResponse(new BasicResponse(Status.CREATED, data), response);
                return next();
              })
            }
          });
          sendResponse(new BasicResponse(Status.ERROR, entity), response);
          return next();
        });
      });
    });

  });


  async function saveAutomaticApprovalRequisition(request, response, next, result, schemaName, description, entity, recipientEmails, dto) {
    let success = [];
    let failed = [];

    for (let item of dto.cart) {
      await request.app.locals.inventoryItem.findOne({ _id: item.itemId }).then(itemResult => {
        if(itemResult.secret.quantity >= item.quantity) {
          success.push(item);
        }else {
          failed.push(item.itemId)
        }
      })
    }

    if(failed.length > 0) {
      sendResponse(new BasicResponse(Status.UNPROCESSABLE_ENTRY, [`Requested quantity with the given id ${ failed } is greater than available quantity`]), response);
    }else {
      for(let s of success ) {
        await request.app.locals.inventoryItem.findOne({ _id: s.itemId }).then(result => {
          result.secret.quantity -= s.quantity;
          result.secret.temporary_quantity += s.quantity;
          result.save();
        })
      }
      
      let userInfo = request.app.locals.userobj;
      let userId = userInfo.userId;
      result.approval_status = 'approved';
      result.access_code = 'RAC-' + Math.floor((1 + Math.random()) * 0x100000000);
      result.acceptance_code = 'PTZ-' + Math.floor((1 + Math.random()) * 0x100000000);
      result.approved_date = new Date()
      result.approved_by = userId;
        await result.save().then(data => {
          saveRequisitionActivity(description, schemaName, null, result, "create", request);
          sendResponse(new BasicResponse(Status.CREATED, data), response);
          sendRequestNotificationEmail(request, entity, recipientEmails, userInfo);  
          return next();
        })
    }
  }



async function requisitionTiming(req, setting, dto, id) {
  let timeout;
    if(!setting || setting.length === 0 || setting[0].secret.maxApprovalDelay === null || setting[0].secret.maxApprovalDelay === ' ') { 
       timeout = process.env.defaultMaxApprovalDelay; 
      }
    else {
      timeout = setting[0].secret.maxApprovalDelay;

    }
    
  setTimeout(function () {
    req.app.locals.requisition.findOne({ _id: id }).then(async requisitionResult => {
      
      if (requisitionResult.moved == false) {
        requisitionResult.approval_status = 'declined'
        requisitionResult.remark = "This Requisition was auto declined because it has exceeded the maximum wait time";
        requisitionResult.declined_by = "Auto Declined";
        requisitionResult.declined_date = new Date();
        requisitionResult.lastUpdatedAt = new Date();
        requisitionResult.save()
        for (let item of dto.cart) {
          await req.app.locals.inventoryItem.findOne({ _id: item.itemId }).then(result => {
            if (result) {
              result.secret.quantity += item.quantity
              result.secret.temporary_quantity -= item.quantity
              result.save()
            }
          })
        }
      } else {
        for (let item of dto.cart) {
          await req.app.locals.inventoryItem.findOne({ _id: item.itemId }).then(inventoryResult => {
            if (inventoryResult) {
              inventoryResult.secret.temporary_quantity -= item.quantity
              inventoryResult.save()
            }
          })
        }
      }
    })
  }, timeout)

}


  export const trailUpdatedRecord = (schemaName: string): any =>
  afterMethod( meta => {
    let request = meta.args[0];
    let response = meta.args[1];
    let next = meta.args[2];

    let userInfo = request.app.locals.userobj;

    let description = `${userInfo.firstname} ${userInfo.lastname} updated a record`;
    let modelInstance = request.app.locals[schemaName];

    let previousEntity = null;
     modelInstance.findById(request.params.id).then(result => {
      previousEntity = result;
    });

    meta.result.then(model => {
      model.save().then(async entity => {
        if (entity) {
          saveActivity(description, schemaName, previousEntity.secret, entity.secret, "update", request);
          sendResponse(new BasicResponse(Status.SUCCESS, entity), response);
          return next();
        } else {
          sendResponse(new BasicResponse(Status.ERROR, entity), response);
          return next();
        }
      });
    });
  });

  export const trailRestockRecord = (schemaName: string): any =>
  afterMethod( meta => {
    let request = meta.args[0];
    let response = meta.args[1];
    let next = meta.args[2];

    let userInfo = request.app.locals.userobj;
    let description = `${userInfo.firstname} ${userInfo.lastname} updated a record`;
    let modelInstance = request.app.locals[schemaName];

    let previousEntity = null;
     modelInstance.findById(request.params.id).then(result => {
      previousEntity = result;
    });

    meta.result.then(model => {
      model.save().then(async entity => {
        if (entity) {
          saveActivity(description, schemaName, previousEntity, entity, "update", request);
          sendResponse(new BasicResponse(Status.SUCCESS, entity), response);
          return next();
        } else {
          sendResponse(new BasicResponse(Status.ERROR, entity), response);
          return next();
        }
      });
    });
  });

  



  export const trailMovedRequisitionRecord = (schemaName: string): any =>
  afterMethod(async meta => {
    let request = meta.args[0];
    let response = meta.args[1];
    let next = meta.args[2];
    let requisitions = meta.args[3];
    let moveDetail = meta.args[4];
    let itemIdAndSku = meta.args[5];
    let tenantId = request.app.locals.userobj.organisationId;
    let userInfo = request.app.locals.userobj;
    let description = `${userInfo.firstname} ${userInfo.lastname} updated a record`;
    let modelInstance = request.app.locals[schemaName];

    let previousEntity = null;
    modelInstance.findById(request.params.id).then(result => {
      previousEntity = result;
    });

    await processMovedRequisitionSkuInstance(request, response, schemaName, requisitions, moveDetail, itemIdAndSku, description, userInfo, previousEntity)

  });



  async function processMovedRequisitionSkuInstance(request, response, schemaName, requisitions, moveDetail, itemIdAndSku, description, userInfo, previousEntity) {
    for (let i = 0; i < requisitions.length; i++) {
      requisitions[i].itemResult.inventorySku[requisitions[i].skuPosition].status = 'Out of store'
      await requisitions[i].itemResult.save().then(result => {
        if (result) {
          if (i === requisitions.length - 1) {
            moveDetail.requisitionResult.moved = true
            moveDetail.requisitionResult.itemId_skus = itemIdAndSku;
            moveDetail.requisitionResult.fulfilled_date = new Date()
            moveDetail.requisitionResult.fulfilled_by = userInfo.userId

            moveDetail.requisitionResult.save().then(entity => {
              if (entity) {
                saveRequisitionActivity(description, schemaName, previousEntity, entity, "update", request);
                sendResponse(new BasicResponse(Status.SUCCESS, entity), response)
              } else {
                sendResponse(new BasicResponse(Status.FAILED_VALIDATION), response)
              }
            })

          }
        } else {
          sendResponse(new BasicResponse(Status.FAILED_VALIDATION), response)
        }

      }).catch(err => {
        sendResponse(new BasicResponse(Status.ERROR), response)
      })
  }
  }


  export const trailDeclineRequisitionRecord = (schemaName: string): any =>
  afterMethod(async meta => {
    let request = meta.args[0];
    let response = meta.args[1];
    let next = meta.args[2];
    let dto = meta.args[5];
    let tenantId = request.app.locals.userobj.organisationId;
    let userInfo = request.app.locals.userobj;
    let description = `${userInfo.firstname} ${userInfo.lastname} updated a record`;
    let modelInstance = request.app.locals[schemaName];

    let previousEntity = null;
    modelInstance.findById(request.params.id).then(result => {
      previousEntity = result;
    });

    meta.result.then(model => {
      model.save().then(async entity => {
        if (entity) {
          saveRequisitionActivity(description, schemaName, previousEntity, entity, "update", request);
          sendResponse(new BasicResponse(Status.SUCCESS, entity), response);
          return next();
        } else {
          sendResponse(new BasicResponse(Status.ERROR, entity), response);
          return next();
        }
      });

    });
  });
  

  export const trailUpdatedRequisitionRecord = (schemaName: string): any =>
  afterMethod(async meta => {
    let request = meta.args[0];
    let response = meta.args[1];
    let next = meta.args[2];
    let dto = meta.args[5];
    let tenantId = request.app.locals.userobj.organisationId;
    let userInfo = request.app.locals.userobj;
    let description = `${userInfo.firstname} ${userInfo.lastname} updated a record`;
    let modelInstance = request.app.locals[schemaName];

    let previousEntity = null;
    modelInstance.findById(request.params.id).then(result => {
      previousEntity = result;
    });

    let notifyEmails = await request.app.locals.settings.find({tenantId: tenantId});
    let recipientEmails = notifyEmails[0].secret.requisitionApprovers;
        recipientEmails.push(userInfo.email);

    meta.result.then(async model => {
      await validateEachRequisitionBeforeApproval(request, response, next, schemaName, previousEntity, model, tenantId, dto, description, recipientEmails, userInfo)

    });
  });



async function validateEachRequisitionBeforeApproval(request, response, next, schemaName, previousEntity, model, tenantId, dto, description, recipientEmails, userInfo) {

    let availableItemQuantity = [];
    let unAvailableItemQuantity = [];

    for (let item of dto.cart) {
      await request.app.locals.inventoryItem.findOne({ _id: item.itemId }).then(itemResult => {
        if(itemResult.secret.quantity >= item.quantity) {
          availableItemQuantity.push(item);
        }else {
          unAvailableItemQuantity.push(item.itemId)
        }
      })
    }

    if(unAvailableItemQuantity.length > 0) {
      sendResponse(new BasicResponse(Status.UNPROCESSABLE_ENTRY, [`Requested quantity with the given id ${ unAvailableItemQuantity } is greater than available quantity`]), response);
    } else {
      for(let avail of availableItemQuantity ) {
        await request.app.locals.inventoryItem.findOne({ _id: avail.itemId }).then(result => {
          result.secret.quantity -= avail.quantity;
          result.secret.temporary_quantity += avail.quantity;
          result.save();
        })
      }
    await saveRequisitionApproval(request, response, next, schemaName, previousEntity, model, tenantId, dto, description, recipientEmails, userInfo)
    }
  }


async function saveRequisitionApproval (request, response, next, schemaName, previousEntity, model, tenantId, dto, description, recipientEmails, userInfo) {
  model.save().then(async entity => {
    await request.app.locals.settings.find({tenantId: tenantId}).then(async setting => {
      if(setting && setting[0].secret.enableRequisitionApprover === true) {
        requisitionTiming(request, setting, dto, entity._id);
      }
    });

    if (entity) {
      saveRequisitionActivity(description, schemaName, previousEntity, entity, "update", request);
      sendRequestNotificationEmail(request, entity, recipientEmails, userInfo);  
      sendResponse(new BasicResponse(Status.SUCCESS, entity), response);
      return next();
    } else {
      sendResponse(new BasicResponse(Status.ERROR, entity), response);
      return next();
    }
  });
}


async function sendRequestNotificationEmail(request, entity, recipientEmails, userInfo) {
  let recipients = recipientEmails;
  let userRequisitionNumber = entity.requisition_number;
  let userAccessCode = entity.access_code;
  let userAcceptanceCode = entity.acceptance_code
  let token = (request.headers && request.headers.authorization && request.headers.authorization.split(' ')[0] === 'Bearer') ?request.headers.authorization.split(' ')[1] : null
  let payload = new URLSearchParams();
    payload.append("subject", "Quabbly request notification")
    payload.append("htmlContent", `
    {requisition-code: ${userRequisitionNumber}, access-code: {${userAccessCode}}, acceptance-code: ${userAcceptanceCode} }`);
    for(let recipient of recipients) {
      payload.append("recipient", recipient)
    }
    axios({
      url: process.env.SEND_NOTIFICATION_URL,
      method: "post",
      data: payload,
      headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
          "Authorization" : `Bearer ${token}`
      }
    });
  }


export const trailNewRecord = (schemaName: string): any =>
  afterMethod(meta => {
    let request = meta.args[0];
    let response = meta.args[1];
    let next = meta.args[2];
    let userInfo = request.app.locals.userobj;
    let description = `${userInfo.firstname} ${userInfo.lastname} added a new record`;

    meta.result.then(model => {
      model.save().then(entity => {
        if (entity) {
          saveActivity(description, schemaName, null, entity.secret, "create", request);

          sendResponse(new BasicResponse(Status.CREATED, entity), response);
          return next();
        } else {
          sendResponse(new BasicResponse(Status.ERROR, entity), response);
          return next();
        }
      });
    });
  });



async function saveActivity(description, schemaName, previousEntity, newEntity, actionType: string, request) {
  let userInfo = request.app.locals.userobj;
  let userId = userInfo.userId;
  let tenantId = userInfo.organisationId;

  let secret = { description, actionType, previousEntity, newEntity };
  let activity: IActivityModel = request.app.locals.activity({schemaName, secret, userId, tenantId});
  activity.save();
  return activity;
}

async function saveRequisitionActivity(description, schemaName, previousEntity, newEntity, actionType: string, request) {
  let userInfo = request.app.locals.userobj;
  let userId = userInfo.userId;
  let tenantId = userInfo.organisationId;

  let secret = { description, actionType, previousEntity, newEntity };
  let activity: IActivityModel = request.app.locals.activity({schemaName, secret, userId, tenantId});
  activity.save();
  return activity;
}

function sendResponse(serviceResponse: BasicResponse, responseObj): any {
  let clientResponse = {
    status: serviceResponse.getStatusString(),
    data: serviceResponse.getData(),
    recordCount: serviceResponse.getRecordCount()
  };

  responseObj.status(getHttpStatus(serviceResponse.getStatusString()));

  console.log("responding with", clientResponse);
  responseObj.json(clientResponse);
}

function getHttpStatus(status: string): number {
  switch (status) {
    case "SUCCESS":
      return 200;
    case "CREATED":
      return 201;
    case "FAILED_VALIDATION":
      return 400;
    case "NOT_FOUND":
      return 404;
    default:
      return 500;
  }
}
