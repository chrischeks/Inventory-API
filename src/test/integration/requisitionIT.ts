import { Server } from '../../server';
import * as chai from 'chai';
import * as dotenv from 'dotenv';
import chaiHttp = require('chai-http');
import 'mocha';
import { expect } from 'chai';
import mongoose = require("mongoose");
import { IInventoryRequisitionModel } from '../../models/requisition';
import { requisitionSchema } from '../../schemas/requisition';
import { beforeMethod } from 'kaop-ts';

dotenv.config();

chai.use(chaiHttp);

process.env.DB_NAME = 'inventory_test';

let bearerToken;
// const userApiUrl = process.env.USER_API_URL;
const userApiUrl = 'https://p-user-api-dev.quabbly.com';
const pathregister = '/v1/auth/register';
const pathlogin = '/v1/auth/login';
const random = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5);
const firstname = `test${random}`;
const lastname = `testparent${random}`;
const password = 'default111';
const email = `${firstname}${lastname}@r.quabbly.com`;
const userRegisterObject = { companyName: 'Quabbly', firstname, lastname, email, password }

var clearDB = function (done) {
    const MONGODB_CONNECTION: string = process.env.MONGODB_HOST + process.env.DB_NAME;
    console.log(MONGODB_CONNECTION);

    mongoose.set('useCreateIndex', true);
    mongoose.set('useNewUrlParser', true);

    let connection: mongoose.Connection = mongoose.createConnection(MONGODB_CONNECTION);

    let requisition = connection.model<IInventoryRequisitionModel>("requisition", requisitionSchema);

    requisition.deleteMany(function () {
        connection.close(function () {
            done();
        });
    });
}

after(function (done) {
    clearDB(done);
});

beforeEach(function (done) {
    clearDB(done);
});

var app = Server.bootstrap().app;

describe('Register a new user, and authenticate user login to generate token before each test suit', () => {
    before((done) => {
        chai.request(userApiUrl)
            .post(pathregister)
            .send(userRegisterObject)
            .end((err, res) => {
                if (err) throw err;
                chai.request(userApiUrl)
                    .post(pathlogin)
                    .send({ password: password, username: email })
                    .end((err, res) => {
                        if (err) throw err;
                        bearerToken = res.body.token;
                        done();
                    });
            });
    });

    
    describe('Create new inventory requisition API request', () => {
      const path = '/v1/inventory/item';
      const categoryPath = '/v1/inventory/category';
      let settingsPath = '/v1/inventory/settings';
      let category_id = '';
      let property_id = '';
      let id = '';
      it('should create category & create an inventory item successfully before making any requisition', async () => {
      await chai.request(app)
        .put(settingsPath)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          enableApprovalForProcurement: "true", procurementApprovers: ['example1@quabbly.com', 'example2@quabbly.com'],
          enableRequisitionApprover: "true", requisitionApprovers: [ email, 'quabbly@photizo.com' ], maxApprovalDelay: "2"
        })
        .then(res => {
          expect(res).to.have.status(201);
          expect(res.body.status).to.be.eql('CREATED');
          expect(res.body.data._id).exist;
        });
        await chai.request(app)
          .post(categoryPath)
          .set('Authorization', `Bearer ${bearerToken}`)
          .send({
            name: 'requisiion category', description: "category test", properties: [{
              name: "component",
              description: "rectifier",
              type: "dropdown",
              options: ["mosfet", "semi-conductor", "transistor"]
            }]
          })
          .then(res => {
            expect(res).to.have.status(201);
            expect(res.body.status).to.be.eql('CREATED');
            expect(res.body.data._id).exist;
  
            category_id = res.body.data._id;
            property_id = res.body.data.properties[0]
          });
        await chai.request(app)
          .post(path)
          .set('Authorization', `Bearer ${bearerToken}`)
          .send({
            name: 'fod3180', description: 'optoisolator', quantity: '2', category: category_id, properties: [{
              id: property_id,
              value: 'quabbly'
            }]
          })
          .then(res => {
            expect(res).to.have.status(201);
            expect(res.body.status).to.be.eql('CREATED');
            expect(res.body.data._id).exist;
            id = res.body.data._id;
          });
        await chai.request(app)
          .patch(path + '/approve' + '/' + id)
          .set('Authorization', `Bearer ${bearerToken}`)
          .then(res => {
            expect(res).to.have.status(200);
            expect(res.body.status).to.be.eql('SUCCESS');
            expect(res.body.data._id).exist;
            expect(res.body.data.approval_status).to.be.eql('approved');
          });
  
        return await chai.request(app)
          .post('/v1/inventory/requisition')
          .set('Authorization', `Bearer ${bearerToken}`)
          .send({
            cart: [
              {
                itemId: id,
                quantity: 1
              }
            ],
            comment: "avalanche shoothrough with flyback topology"
          })
          .then(res => {
            expect(res).to.have.status(201);
            expect(res.body.status).to.be.eql('CREATED');
          });
      });
  
      it('should should return status 404 if requested item is not found', async () => {
      await chai.request(app)
        .put(settingsPath)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          enableApprovalForProcurement: "true", procurementApprovers: ['example1@quabbly.com', 'example2@quabbly.com'],
          enableRequisitionApprover: "true", requisitionApprovers: [ email, 'quabbly@photizo.com' ], maxApprovalDelay: "2"
        })
        .then(res => {
          expect(res).to.have.status(201);
          expect(res.body.status).to.be.eql('CREATED');
          expect(res.body.data._id).exist;
        });
      await chai.request(app)
        .post(categoryPath)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          name: 'requisiion category modified', description: "category test", properties: [{
            name: "component",
            description: "rectifier",
            type: "dropdown",
            options: ["mosfet", "semi-conductor", "transistor"]
          }]
        })
        .then(res => {
          expect(res).to.have.status(201);
          expect(res.body.status).to.be.eql('CREATED');
          expect(res.body.data._id).exist;

          category_id = res.body.data._id;
          property_id = res.body.data.properties[0]
        });
      await chai.request(app)
        .post(path)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          name: 'fod3180', description: 'optoisolator', quantity: '2', category: category_id, properties: [{
            id: property_id,
            value: 'quabbly'
          }]
        })
        .then(res => {
          expect(res).to.have.status(201);
          expect(res.body.status).to.be.eql('CREATED');
          expect(res.body.data._id).exist;
          id = res.body.data._id;
        });
      await chai.request(app)
        .patch(path + '/approve' + '/' + id)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send()
        .then(res => {
          expect(res).to.have.status(200);
          expect(res.body.status).to.be.eql('SUCCESS');
          expect(res.body.data._id).exist;
          expect(res.body.data.approval_status).to.be.eql('approved');
        });

      return await chai.request(app)
        .post('/v1/inventory/requisition')
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          cart: [
            {
              itemId: "5cd5377d7c3ee7000f51b6e0",
              quantity: 1
            }
          ],
          comment: "avalanche shoothrough with flyback topology"
        })
        .then(res => {
          expect(res).to.have.status(400);
          expect(res.body.status).to.be.eql('FAILED_VALIDATION');
        });
      });
    });


    describe('GET single inventory requisition API request', () => {
      const path = '/v1/inventory/item';
      const categoryPath = '/v1/inventory/category';
      const settingsPath = '/v1/inventory/settings';
      let category_id = '';
      let property_id = '';
      let id = '';
      let requisition_id = '';
      it('should create category & create an inventory item successfully before making any requisition', async () => {
      await chai.request(app)
        .put(settingsPath)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          enableApprovalForProcurement: "true", procurementApprovers: ['example1@quabbly.com', 'example2@quabbly.com'],
          enableRequisitionApprover: "true", requisitionApprovers: [ email, 'quabbly@photizo.com' ], maxApprovalDelay: "2"
        })
        .then(res => {
          expect(res).to.have.status(201);
          expect(res.body.status).to.be.eql('CREATED');
          expect(res.body.data._id).exist;
        });
        await chai.request(app)
          .post(categoryPath)
          .set('Authorization', `Bearer ${bearerToken}`)
          .send({
            name: 'single category', description: "category test", properties: [{
              name: "component",
              description: "rectifier",
              type: "dropdown",
              options: ["mosfet", "semi-conductor", "transistor"]
            }]
          })
          .then(res => {
            expect(res).to.have.status(201);
            expect(res.body.status).to.be.eql('CREATED');
            expect(res.body.data._id).exist;
  
            category_id = res.body.data._id;
            property_id = res.body.data.properties[0]
          });
        await chai.request(app)
          .post(path)
          .set('Authorization', `Bearer ${bearerToken}`)
          .send({
            name: 'fod3180', description: 'optoisolator', quantity: '2', category: category_id, properties: [{
              id: property_id,
              value: 'quabbly'
            }]
          })
          .then(res => {
            expect(res).to.have.status(201);
            expect(res.body.status).to.be.eql('CREATED');
            expect(res.body.data._id).exist;
            id = res.body.data._id;
          });
        await chai.request(app)
          .patch(path + '/approve' + '/' + id)
          .set('Authorization', `Bearer ${bearerToken}`)
          .then(res => {
            expect(res).to.have.status(200);
            expect(res.body.status).to.be.eql('SUCCESS');
            expect(res.body.data._id).exist;
            expect(res.body.data.approval_status).to.be.eql('approved');
          });
  
        await chai.request(app)
          .post('/v1/inventory/requisition')
          .set('Authorization', `Bearer ${bearerToken}`)
          .send({
            cart: [
              {
                itemId: id,
                quantity: 1
              }
            ],
            comment: "avalanche shoothrough with flyback topology"
          })
          .then(res => {
            expect(res).to.have.status(201);
            expect(res.body.status).to.be.eql('CREATED');
            requisition_id = res.body.data._id;
          });
        return await chai.request(app)
          .get('/v1/inventory/requisition/' + requisition_id)
          .set('Authorization', `Bearer ${bearerToken}`)
          .send()
          .then(res => {
            expect(res).to.have.status(200);
            expect(res.body.status).to.be.eql('SUCCESS');
            expect(res.body.data._id).exist;
        });
      });
  
      it('should should return status 404 if get single requisition record by id is not found', async () => {
         await chai.request(app)
          .post(categoryPath)
          .set('Authorization', `Bearer ${bearerToken}`)
          .send({
            name: 'single get category', description: "category test", properties: [{
              name: "component",
              description: "rectifier",
              type: "dropdown",
              options: ["mosfet", "semi-conductor", "transistor"]
            }]
          })
          .then(res => {
            expect(res).to.have.status(201);
            expect(res.body.status).to.be.eql('CREATED');
            expect(res.body.data._id).exist;
  
            category_id = res.body.data._id;
            property_id = res.body.data.properties[0]
          });
        await chai.request(app)
          .post(path)
          .set('Authorization', `Bearer ${bearerToken}`)
          .send({
            name: 'fod3180', description: 'optoisolator', quantity: '2', category: category_id, properties: [{
              id: property_id,
              value: 'quabbly'
            }]
          })
          .then(res => {
            expect(res).to.have.status(201);
            expect(res.body.status).to.be.eql('CREATED');
            expect(res.body.data._id).exist;
            id = res.body.data._id;
          });
        await chai.request(app)
          .patch(path + '/approve' + '/' + id)
          .set('Authorization', `Bearer ${bearerToken}`)
          .then(res => {
            expect(res).to.have.status(200);
            expect(res.body.status).to.be.eql('SUCCESS');
            expect(res.body.data._id).exist;
            expect(res.body.data.approval_status).to.be.eql('approved');
          });
  
        await chai.request(app)
          .post('/v1/inventory/requisition')
          .set('Authorization', `Bearer ${bearerToken}`)
          .send({
            cart: [
              {
                itemId: id,
                quantity: 1
              }
            ],
            comment: "avalanche shoothrough with flyback topology"
          })
          .then(res => {
            expect(res).to.have.status(201);
            expect(res.body.status).to.be.eql('CREATED');
          });
        return await chai.request(app)
          .get('/v1/inventory/requisition/' + '5cd5377d7c3ee7000f51b6e0')
          .set('Authorization', `Bearer ${bearerToken}`)
          .send()
          .then(res => {
            expect(res).to.have.status(404);
            expect(res.body.status).to.be.eql('NOT_FOUND');
        });
      });
    });


    describe('Approved / Decline inventory Requisition API Request', () => {
      const path = '/v1/inventory/item';
      const categoryPath = '/v1/inventory/category';
      const settingsPath = '/v1/inventory/settings';
      let category_id = '';
      let property_id = '';
      let id = '';
      let requisition_id = '';
      it('should approve inventory requisition successfully', async () => {
      await chai.request(app)
        .put(settingsPath)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          enableApprovalForProcurement: "true", procurementApprovers: ['example1@quabbly.com', 'example2@quabbly.com'],
          enableRequisitionApprover: "true", requisitionApprovers: [ email, 'quabbly@photizo.com' ], maxApprovalDelay: "2"
        })
        .then(res => {
          expect(res).to.have.status(201);
          expect(res.body.status).to.be.eql('CREATED');
          expect(res.body.data._id).exist;
        });

        await chai.request(app)
          .post(categoryPath)
          .set('Authorization', `Bearer ${bearerToken}`)
          .send({
            name: 'requisition approve', description: "category test", properties: [{
              name: "component",
              description: "rectifier",
              type: "dropdown",
              options: ["mosfet", "semi-conductor", "transistor"]
            }]
          })
          .then(res => {
            expect(res).to.have.status(201);
            expect(res.body.status).to.be.eql('CREATED');
            expect(res.body.data._id).exist;
  
            category_id = res.body.data._id;
            property_id = res.body.data.properties[0]
          });
        await chai.request(app)
          .post(path)
          .set('Authorization', `Bearer ${bearerToken}`)
          .send({
            name: 'fod3180', description: 'optoisolator', quantity: '2', category: category_id, properties: [{
              id: property_id,
              value: 'quabbly'
            }]
          })
          .then(res => {
            expect(res).to.have.status(201);
            expect(res.body.status).to.be.eql('CREATED');
            expect(res.body.data._id).exist;
            id = res.body.data._id;
          });
        await chai.request(app)
          .patch(path + '/approve' + '/' + id)
          .set('Authorization', `Bearer ${bearerToken}`)
          .then(res => {
            expect(res).to.have.status(200);
            expect(res.body.status).to.be.eql('SUCCESS');
            expect(res.body.data._id).exist;
            expect(res.body.data.approval_status).to.be.eql('approved');
          });
        await chai.request(app)
          .post('/v1/inventory/requisition')
          .set('Authorization', `Bearer ${bearerToken}`)
          .send({
            cart: [
              {
                itemId: id,
                quantity: 1
              }
            ],
            remark: "avalanche shoothrough with flyback topology"
          })
          .then(res => {
            expect(res).to.have.status(201);
            expect(res.body.status).to.be.eql('CREATED');
            requisition_id = res.body.data._id;
          });
        return await chai.request(app)
          .put('/v1/inventory/requisition/approve/' + requisition_id)
          .set('Authorization', `Bearer ${bearerToken}`)
          .send({
            cart: [
              {
                itemId: id,
                quantity: 1
              }
            ],
            comment: "avalanche shoothrough with flyback topology"
          })
          .then(res => {
            expect(res).to.have.status(200);
            expect(res.body.status).to.be.eql('SUCCESS');
            expect(res.body.data._id).exist;
            expect(res.body.data.approval_status).to.be.eql('approved');
          });
      });



  
      it('should decline inventory requisition successfully', async () => {
      await chai.request(app)
        .put(settingsPath)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          enableApprovalForProcurement: "true", procurementApprovers: ['example1@quabbly.com', 'example2@quabbly.com'],
          enableRequisitionApprover: "true", requisitionApprovers: [ email, 'quabbly@photizo.com' ], maxApprovalDelay: "2"
        })
        .then(res => {
          console.log('setings from decline', res.status);
          expect(res).to.have.status(201);
          expect(res.body.status).to.be.eql('CREATED');
          expect(res.body.data._id).exist;
        });
      await chai.request(app)
        .post(categoryPath)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          name: 'requisition dclined', description: "category test", properties: [{
            name: "component",
            description: "rectifier",
            type: "dropdown",
            options: ["mosfet", "semi-conductor", "transistor"]
          }]
        })
        .then(res => {
          expect(res).to.have.status(201);
          expect(res.body.status).to.be.eql('CREATED');
          expect(res.body.data._id).exist;

          category_id = res.body.data._id;
          property_id = res.body.data.properties[0]
        });
      await chai.request(app)
        .post(path)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          name: 'fod3180', description: 'optoisolator', quantity: '2', category: category_id, properties: [{
            id: property_id,
            value: 'quabbly'
          }]
        })
        .then(res => {
          expect(res).to.have.status(201);
          expect(res.body.status).to.be.eql('CREATED');
          expect(res.body.data._id).exist;
          id = res.body.data._id;
        });
      await chai.request(app)
        .patch(path + '/approve' + '/' + id)
        .set('Authorization', `Bearer ${bearerToken}`)
        .then(res => {
          expect(res).to.have.status(200);
          expect(res.body.status).to.be.eql('SUCCESS');
          expect(res.body.data._id).exist;
          expect(res.body.data.approval_status).to.be.eql('approved');
        });
      await chai.request(app)
        .post('/v1/inventory/requisition')
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          cart: [
            {
              itemId: id,
              quantity: 1
            }
          ],
          remark: "avalanche shoothrough with flyback topology"
        })
        .then(res => {
          expect(res).to.have.status(201);
          expect(res.body.status).to.be.eql('CREATED');
          requisition_id = res.body.data._id;
        });
      return await chai.request(app)
        .put('/v1/inventory/requisition/decline/' + requisition_id)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({remark: "no comment"})
        .then(res => {
          expect(res).to.have.status(200);
          expect(res.body.status).to.be.eql('SUCCESS');
          expect(res.body.data._id).exist;
          expect(res.body.data.approval_status).to.be.eql('declined');
        });
      });
    });



    describe('inventory store access search API Request', () => {
      const path = '/v1/inventory/item';
      const settingsPath = '/v1/inventory/settings';
      const categoryPath = '/v1/inventory/category';
      let category_id = '';
      let property_id = '';
      let id = '';
      let requisition_id = '';
      let requisition_no = '';
      let accessCode = '';
      it('should search for approved requisition using requisition number and access code successfully', async () => {
      await chai.request(app)
        .put(settingsPath)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          enableApprovalForProcurement: "true", procurementApprovers: ['example1@quabbly.com', 'example2@quabbly.com'],
          enableRequisitionApprover: "true", requisitionApprovers: [ email, 'quabbly@photizo.com' ], maxApprovalDelay: "2"
        })
        .then(res => {
          expect(res).to.have.status(201);
          expect(res.body.status).to.be.eql('CREATED');
          expect(res.body.data._id).exist;
        });
        await chai.request(app)
          .post(categoryPath)
          .set('Authorization', `Bearer ${bearerToken}`)
          .send({
            name: 'category access search', description: "category test", properties: [{
              name: "component",
              description: "rectifier",
              type: "dropdown",
              options: ["mosfet", "semi-conductor", "transistor"]
            }]
          })
          .then(res => {
            expect(res).to.have.status(201);
            expect(res.body.status).to.be.eql('CREATED');
            expect(res.body.data._id).exist;
  
            category_id = res.body.data._id;
            property_id = res.body.data.properties[0]
          });
        await chai.request(app)
          .post(path)
          .set('Authorization', `Bearer ${bearerToken}`)
          .send({
            name: 'fod3180', description: 'optoisolator', quantity: '2', category: category_id, properties: [{
              id: property_id,
              value: 'quabbly'
            }]
          })
          .then(res => {
            expect(res).to.have.status(201);
            expect(res.body.status).to.be.eql('CREATED');
            expect(res.body.data._id).exist;
            id = res.body.data._id;
          });
        await chai.request(app)
          .patch(path + '/approve' + '/' + id)
          .set('Authorization', `Bearer ${bearerToken}`)
          .then(res => {
            expect(res).to.have.status(200);
            expect(res.body.status).to.be.eql('SUCCESS');
            expect(res.body.data._id).exist;
            expect(res.body.data.approval_status).to.be.eql('approved');
          });
        await chai.request(app)
          .post('/v1/inventory/requisition')
          .set('Authorization', `Bearer ${bearerToken}`)
          .send({
            cart: [
              {
                itemId: id,
                quantity: 1
              }
            ],
            comment: "avalanche shoothrough with flyback topology"
          })
          .then(res => {
            expect(res).to.have.status(201);
            expect(res.body.status).to.be.eql('CREATED');
            requisition_id = res.body.data._id;
          });
        await chai.request(app)
          .put('/v1/inventory/requisition/approve/' + requisition_id)
          .set('Authorization', `Bearer ${bearerToken}`)
          .send({
            cart: [
              {
                itemId: id,
                quantity: 1
              }
            ],
            comment: "avalanche shoothrough with flyback topology"
          })
          .then(res => {
            expect(res).to.have.status(200);
            expect(res.body.status).to.be.eql('SUCCESS');
            expect(res.body.data._id).exist;
            expect(res.body.data.approval_status).to.be.eql('approved');
            requisition_no = res.body.data.requisition_number;
            accessCode = res.body.data.access_code;
          });
        return await chai.request(app)
          .get(`/v1/inventory/store/access?requisition_number=${requisition_no}&access_code=${accessCode}`)
          .set('Authorization', `Bearer ${bearerToken}`)
          .then(res => {
            expect(res).to.have.status(200);
            expect(res.body.status).to.be.eql('SUCCESS');
          });
      });
  
      it('should return 404 if requisition number and access code is not valid', async () => {
      await chai.request(app)
        .put(settingsPath)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          enableApprovalForProcurement: "true", procurementApprovers: ['example1@quabbly.com', 'example2@quabbly.com'],
          enableRequisitionApprover: "true", requisitionApprovers: [ email, 'quabbly@photizo.com' ], maxApprovalDelay: "2"
        })
        .then(res => {
          expect(res).to.have.status(201);
          expect(res.body.status).to.be.eql('CREATED');
          expect(res.body.data._id).exist;
        });
        await chai.request(app)
        .post(categoryPath)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          name: 'category-test', description: "category test", properties: [{
            name: "component",
            description: "rectifier",
            type: "dropdown",
            options: ["mosfet", "semi-conductor", "transistor"]
          }]
        })
        .then(res => {
          expect(res).to.have.status(201);
          expect(res.body.status).to.be.eql('CREATED');
          expect(res.body.data._id).exist;

          category_id = res.body.data._id;
          property_id = res.body.data.properties[0]
        });
      await chai.request(app)
        .post(path)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          name: 'fod3180', description: 'optoisolator', quantity: '2', category: category_id, properties: [{
            id: property_id,
            value: 'quabbly'
          }]
        })
        .then(res => {
          expect(res).to.have.status(201);
          expect(res.body.status).to.be.eql('CREATED');
          expect(res.body.data._id).exist;
          id = res.body.data._id;
        });
      await chai.request(app)
        .patch(path + '/approve' + '/' + id)
        .set('Authorization', `Bearer ${bearerToken}`)
        .then(res => {
          expect(res).to.have.status(200);
          expect(res.body.status).to.be.eql('SUCCESS');
          expect(res.body.data._id).exist;
          expect(res.body.data.approval_status).to.be.eql('approved');
        });
      await chai.request(app)
        .post('/v1/inventory/requisition')
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          cart: [
            {
              itemId: id,
              quantity: 1
            }
          ],
          comment: "avalanche shoothrough with flyback topology"
        })
        .then(res => {
          expect(res).to.have.status(201);
          expect(res.body.status).to.be.eql('CREATED');
          requisition_id = res.body.data._id;
        });
      await chai.request(app)
        .put('/v1/inventory/requisition/decline/' + requisition_id)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({remark: 'no remark'})
        .then(res => {
          expect(res).to.have.status(200);
          expect(res.body.status).to.be.eql('SUCCESS');
          expect(res.body.data._id).exist;
          expect(res.body.data.approval_status).to.be.eql('declined');
          requisition_no = res.body.data.requisition_number;
          accessCode = res.body.data.access_code;
        });
      return await chai.request(app)
        .get(`/v1/inventory/store/access?requisition_number=${'12344555'}&access_code=${'12344555'}`)
        .set('Authorization', `Bearer ${bearerToken}`)
        .then(res => {
          expect(res).to.have.status(404);
          expect(res.body.status).to.be.eql('NOT_FOUND');
        });
      });
    });


    describe('List Inventory Requisition API Request', () => {
      const path = '/v1/inventory/requisition';
      it('should return an empty array if no result found', async () => {
        return await chai.request(app)
          .get(path)
          .set('Authorization', `Bearer ${bearerToken}`)
          .then(res => {
            expect(res).to.have.status(200);
            expect(res.body.status).to.be.eql('SUCCESS');
            expect(res.body.data).exist;
            expect(res.body.data.length).to.be.eql(0);
          })
      })
      it('should get the list of inventory requisition successfully', async () => {
        await chai.request(app)
          .get(path)
          .set('Authorization', `Bearer ${bearerToken}`)
          .then(res => {
            expect(res).to.have.status(200);
          })
      })
      describe('Move inventory Requisition API Request', () => {
        const path = '/v1/inventory/item';
        const categoryPath = '/v1/inventory/category';
        const settingsPath = '/v1/inventory/settings';
        let category_id = '';
        let property_id = '';
        let id = '';
        let requisition_payload;
        let acceptance_code;
        let requisition_id = '';
        let firstSku;
        let secondSku;

       async function requisition(){
          await chai.request(app)
          .put(settingsPath)
          .set('Authorization', `Bearer ${bearerToken}`)
          .send({
            enableApprovalForProcurement: "true", procurementApprovers: ['example1@quabbly.com', 'example2@quabbly.com'],
            enableRequisitionApprover: "true", requisitionApprovers: [ email, 'quabbly@photizo.com' ], maxApprovalDelay: "2"
          })
          .then(res => {
            expect(res).to.have.status(201);
            expect(res.body.status).to.be.eql('CREATED');
            expect(res.body.data._id).exist;
          });
  
          await chai.request(app)
            .post(categoryPath)
            .set('Authorization', `Bearer ${bearerToken}`)
            .send({
              name: 'requisition approve', description: "category test", properties: [{
                name: "component",
                description: "rectifier",
                type: "dropdown",
                options: ["mosfet", "semi-conductor", "transistor"]
              }]
            })
            .then(res => {
              expect(res).to.have.status(201);
              expect(res.body.status).to.be.eql('CREATED');
              expect(res.body.data._id).exist;
    
              category_id = res.body.data._id;
              property_id = res.body.data.properties[0]
            });
          await chai.request(app)
            .post(path)
            .set('Authorization', `Bearer ${bearerToken}`)
            .send({
              name: 'fod3180', description: 'optoisolator', quantity: '4', category: category_id, properties: [{
                id: property_id,
                value: 'quabbly'
              }]
            })
            .then(res => {
              expect(res).to.have.status(201);
              expect(res.body.status).to.be.eql('CREATED');
              expect(res.body.data._id).exist;
              id = res.body.data._id;
              firstSku = res.body.data.inventorySku[0].sku
              secondSku = res.body.data.inventorySku[1].sku
            });
          await chai.request(app)
            .patch(path + '/approve' + '/' + id)
            .set('Authorization', `Bearer ${bearerToken}`)
            .then(res => {
              expect(res).to.have.status(200);
              expect(res.body.status).to.be.eql('SUCCESS');
              expect(res.body.data._id).exist;
              expect(res.body.data.approval_status).to.be.eql('approved');
            });
          await chai.request(app)
            .post('/v1/inventory/requisition')
            .set('Authorization', `Bearer ${bearerToken}`)
            .send({
              cart: [
                {
                  itemId: id,
                  quantity: 2
                }
              ],
              remark: "avalanche shoothrough with flyback topology"
            })
            .then(res => {
              expect(res).to.have.status(201);
              expect(res.body.status).to.be.eql('CREATED');
              requisition_id = res.body.data._id;
            });
          await chai.request(app)
            .put('/v1/inventory/requisition/approve/' + requisition_id)
            .set('Authorization', `Bearer ${bearerToken}`)
            .send({
              cart: [
                {
                  itemId: id,
                  quantity: 2
                }
              ],
              comment: "avalanche shoothrough with flyback topology"
            })
            .then(res => {
              expect(res).to.have.status(200);
              expect(res.body.status).to.be.eql('SUCCESS');
              expect(res.body.data._id).exist;
              expect(res.body.data.approval_status).to.be.eql('approved');
              acceptance_code = res.body.data.acceptance_code;
            });

            return {acceptance_code, id, firstSku, secondSku}

        }
        it('should approve inventory requisition successfully', async () => {
        
            requisition_payload = await requisition()
            return await chai.request(app)
            .patch('/v1/inventory/requisition/move/' + requisition_payload.acceptance_code)
            .set('Authorization', `Bearer ${bearerToken}`)
            .send({ sku:[requisition_payload.firstSku, requisition_payload.secondSku]})
            .then(res => {
              expect(res).to.have.status(200);
              expect(res.body.status).to.be.eql('SUCCESS');
              expect(res.body.data._id).exist;
              expect(res.body.data.approval_status).to.be.eql('approved');
              expect(res.body.data.fulfilled_date).to.exist
              expect(res.body.data.fulfilled_by).to.be.eql(res.body.data.userId)
            });
        });


        it('should throw an error when given an invalid sku', async () => {
          requisition_payload = await requisition()
          return await chai.request(app)
            .patch('/v1/inventory/requisition/move/' + requisition_payload.acceptance_code)
            .set('Authorization', `Bearer ${bearerToken}`)
            .send({ sku: ["inv-123456789-1", "inv-123456789-2"] })
            .then(res => {
              expect(res).to.have.status(500);
              expect(res.body.status).to.be.eql('ERROR');
              expect(res.body.data).to.be.eql(['Verify your inputs and send again inv-123456789-1,inv-123456789-2']);

            });
        });

        it('should throw an error if given sku is less than approved skus', async () => {
          requisition_payload = await requisition()
          return await chai.request(app)
            .patch('/v1/inventory/requisition/move/' + requisition_payload.acceptance_code)
            .set('Authorization', `Bearer ${bearerToken}`)
            .send({ sku: ["inv-123456789-1"] })
            .then(res => {
              expect(res).to.have.status(400);
              expect(res.body.status).to.be.eql('FAILED_VALIDATION');
              expect(res.body.data).to.be.eql([ 'This acceptance code expects 2 UNIQUE skus but 1 was given' ]);

            });
        });

        it('should throw an error if given sku is less than approved skus', async () => {
          requisition_payload = await requisition()
          return await chai.request(app)
            .patch('/v1/inventory/requisition/move/' + 'invalidAcceptanceCode')
            .set('Authorization', `Bearer ${bearerToken}`)
            .then(res => {
              expect(res).to.have.status(404);
              expect(res.body.status).to.be.eql('NOT_FOUND');
              expect(res.body.data).to.be.eql([ 'Entered acceptance code does not exist' ]);

            });
        });

        it('should throw an error if an acceptance code want to be reused', async () => {
          requisition_payload = await requisition()
          await chai.request(app)
          .patch('/v1/inventory/requisition/move/' + requisition_payload.acceptance_code)
          .set('Authorization', `Bearer ${bearerToken}`)
          .send({ sku:[requisition_payload.firstSku, requisition_payload.secondSku]})
          .then(res => {
            expect(res).to.have.status(200);
            expect(res.body.status).to.be.eql('SUCCESS');
            expect(res.body.data._id).exist;
            expect(res.body.data.approval_status).to.be.eql('approved');
            expect(res.body.data.fulfilled_date).to.exist
            expect(res.body.data.fulfilled_by).to.be.eql(res.body.data.userId)
          });
          return await chai.request(app)
            .patch('/v1/inventory/requisition/move/' + requisition_payload.acceptance_code)
            .set('Authorization', `Bearer ${bearerToken}`)
            .then(res => {
              expect(res).to.have.status(422);
              expect(res.body.status).to.be.eql('UNPROCESSABLE_ENTRY');
              expect(res.body.data).to.be.eql([ 'This acceptance code has been used' ]);

            });
        });
      })
    })
})
