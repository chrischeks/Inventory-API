import { NextFunction, Request, Response } from "express";
import { verify } from "jsonwebtoken";
import { createTransport, TransportOptions } from "nodemailer";
import chalk = require('chalk');
import { BasicResponse } from "../dto/output/basicresponse";

/**
 * Constructor
 *
 * @class BaseController
 */
export class BaseController {

  protected systemErrorMsg: object = { "message": "Sorry your request could not be completed at the moment" };
  protected invalidCredentials: object = { 'message': 'Invalid Credentials' };
  protected notAuthorized: object = { 'message': 'You are not authorized to access this resource' };
  protected itemNotFound: object = { 'message': 'Not found' };
  protected noResults: object = { 'message': 'No results available' };
  protected start: number = 0;
  protected limit: number = 20;

  protected user_firstname = null;
  protected user_lastname = null;
  protected user_roles = null;
  protected user_email = null;
  protected user_tenantId = null;
  protected user_id = null;

  protected initPagination(req: Request, post: boolean) {
    let obj: any = post ? req.body : req.query;

    if (obj.start && !isNaN(obj.start)) {
      this.start = +obj.start;
    }
    if (obj.limit && !isNaN(obj.limit)) {
      this.limit = +obj.limit;
    }

  }


  protected sendResponse(serviceResponse: BasicResponse, req: Request, res: Response, next: NextFunction): any {
    var response = {
      status: serviceResponse.getStatusString(),
      data: serviceResponse.getData()
    }

    res.status(this.getHttpStatus(serviceResponse.getStatusString()));

    console.log('responding with', response);
    res.json(response);
    next();
  }

  private getHttpStatus(status: string): number {
    switch (status) {
      case 'SUCCESS':
        return 200;
      case 'CREATED':
        return 201;
      case 'FAILED_VALIDATION':
        return 400;
      default:
        return 500;
    }
  }
  protected sendError(req: Request, res: Response, next: NextFunction, data?: Object) {

    var dat = {
      status: 401,
      data: data
    }
    res.status(401);
    res.send(dat);

    //return next();
  }

  protected authorized(req: Request, res: Response, next: NextFunction): boolean {
    let token = (req.headers && req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') ? req.headers.authorization.split(' ')[1] : null;

    if (token === null) {
      console.log('cant find header');
      return false;
    }

    try {
      var publicKey = JSON.parse(`"${process.env.JWT_PUBLIC_KEY}"`); //https://github.com/motdotla/dotenv/issues/218

      var user = verify(token, publicKey, { algorithms: ['RS256'], issuer: process.env.JWT_ISSUER });

      // if(!this.isAdminOrAccountant(user)){
      //   return false;
      // }
      this.setUserVariables(user);

      req.app.locals.userobj = user;
      return true;

    } catch (err) {
      console.log(err);
      return false;
    }

  }

  private isAdminOrAccountant(user): boolean {
    let roles = user.roles;
    return roles.indexOf('ACCOUNTS') > -1 || roles.indexOf('ADMIN') > -1;
  }

  protected setUserVariables(user) {
    this.user_firstname = user.firstname;
    this.user_lastname = user.lastname;
    this.user_email = user.email;
    this.user_roles = user.roles;
    this.user_tenantId = user.organisationId;
    this.user_id = user.userId;

  }

}

