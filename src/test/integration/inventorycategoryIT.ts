import { Server } from '../../server';
import * as chai from 'chai';

import chaiHttp = require('chai-http');
import 'mocha';
import { expect } from 'chai';
import mongoose = require("mongoose");
import { IInventoryCategoryModel } from '../../models/category';
import { inventoryCategorySchema } from '../../schemas/category';
import * as dotenv from 'dotenv'
chai.use(chaiHttp);
dotenv.config();

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

  let inventorycategory = connection.model<IInventoryCategoryModel>("InventoryCategory", inventoryCategorySchema);

  inventorycategory.deleteMany(function () {
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

describe('Register a new user, and authenticate user login to generate token before each test suite', () => {
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
  describe('Create inventory-Category API Request', () => {
    var path = '/v1/inventory/category';
    it('should create a new inventory-category successfully', async () => {
      return await chai.request(app)
        .post(path)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          name: 'category test', description: "category test", properties: [{
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
        });
    })

    it('should return duplicate name error if name already exists', async () => {
      await chai.request(app)
        .post(path)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          name: 'category test', description: "category test", properties: [{
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
        });

      return await chai.request(app)
        .post(path)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          name: 'category test', description: "category test", properties: [{
            name: "component",
            description: "rectifier",
            type: "dropdown",
            options: ["mosfet", "semi-conductor", "transistor"]
          }]
        })
        .then(res => {
          expect(res).to.have.status(400);
          expect(res.body.status).to.be.eql('FAILED_VALIDATION');
          expect(res.body.data).to.be.an('array');
          expect(res.body.data).length(1);
          expect(res.body.data[0].property).to.be.eql('name');
          expect(res.body.data[0].constraints.unique).to.be.eql('name must be unique');
          expect(res.body.data[0].value).to.be.eql('category test');
        });

    })

    it('should return failed validation error if name is missing', async () => {
      return await chai.request(app)
        .post(path)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          description: "category test", properties: [{
            name: "component",
            description: "rectifier",
            type: "dropdown",
            options: ["mosfet", "semi-conductor", "transistor"]
          }]
        })
        .then(res => {
          expect(res).to.have.status(400);
          expect(res.body.status).to.be.eql('FAILED_VALIDATION');
          expect(res.body.data).to.be.an('array');
          expect(res.body.data).length(1);
          expect(res.body.data[0].property).to.be.eql('name');
          expect(res.body.data[0].constraints.length).to.be.eql('name should be between 4 and 30 characters');
          expect(res.body.data[0].constraints.isNotEmpty).to.be.eql('name is required');
        });

    })

    it('should return errors if name exceeds 30 characters', async () => {
      return await chai.request(app)
        .post(path)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          name: "componentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponent", description: "category test", properties: [{
            name: "component",
            description: "rectifier",
            type: "dropdown",
            options: ["mosfet", "semi-conductor", "transistor"]
          }]
        })
        .then(res => {
          expect(res).to.have.status(400);
          expect(res.body.status).to.be.eql('FAILED_VALIDATION');
          expect(res.body.data).to.be.an('array');
          expect(res.body.data).length(1);
          expect(res.body.data[0].property).to.be.eql('name');
          expect(res.body.data[0].constraints.length).to.be.eql('name should be between 4 and 30 characters');
          expect(res.body.data[0].value).to.be.eql('componentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponent');
        });

    });



    it('should return errors if description exceeds 150 characters', async () => {
      return await chai.request(app)
        .post(path)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          name: "quabbly", description: "componentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponent", properties: [{
            name: "component",
            description: "rectifier",
            type: "dropdown",
            options: ["mosfet", "semi-conductor", "transistor"]
          }]
        })
        .then(res => {
          expect(res).to.have.status(400);
          expect(res.body.status).to.be.eql('FAILED_VALIDATION');
          expect(res.body.data).to.be.an('array');
          expect(res.body.data).length(1);
          expect(res.body.data[0].property).to.be.eql('description');
          expect(res.body.data[0].constraints.length).to.be.eql('description should be between 3 and 150 characters');
          expect(res.body.data[0].value).to.be.eql('componentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponent');
        });

    });

    it('should return failed validation error, if property name is not set', async () => {
      return await chai.request(app)
        .post(path)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          name: 'category test', description: "category test", properties: [{
            description: "rectifier",
            type: "dropdown",
            options: ["model", "component"]
          }]
        })
        .then(res => {
          expect(res).to.have.status(400);
          expect(res.body.status).to.be.eql('FAILED_VALIDATION');
          expect(res.body.data).to.be.an('array');
          expect(res.body.data).length(1);
          expect(res.body.data[0].property).to.be.eql('name');
          expect(res.body.data[0].constraints.required).to.be.eql('name is required for this property');
        });
    });

    it('should return failed validation error, if property type is set to dropdown and options is not set', async () => {
      return await chai.request(app)
        .post(path)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          name: 'category test', description: "category test", properties: [{
            name: "component",
            description: "rectifier",
            type: "dropdown"
          }]
        })
        .then(res => {
          expect(res).to.have.status(400);
          expect(res.body.status).to.be.eql('FAILED_VALIDATION');
          expect(res.body.data).to.be.an('array');
          expect(res.body.data).length(1);
          expect(res.body.data[0].property).to.be.eql('options');
          expect(res.body.data[0].constraints.required).to.be.eql('options are required');
        });
    });

    it('should return failed validation error, if property type is set to checkbox and options is not set', async () => {
      return await chai.request(app)
        .post(path)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          name: 'category test', description: "category test", properties: [{
            name: "component",
            description: "rectifier",
            type: "checkbox"
          }]
        })
        .then(res => {
          expect(res).to.have.status(400);
          expect(res.body.status).to.be.eql('FAILED_VALIDATION');
          expect(res.body.data).to.be.an('array');
          expect(res.body.data).length(1);
          expect(res.body.data[0].property).to.be.eql('options');
          expect(res.body.data[0].constraints.required).to.be.eql('options are required');
        });
    });

    it('should create a category successfully if property type is set to inputfield and options is not set ', async () => {
      return await chai.request(app)
        .post(path)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          name: 'category test', description: "category test", properties: [{
            name: "component",
            description: "rectifier",
            type: "inputfield",
          }]
        })
        .then(res => {
          expect(res).to.have.status(201);
          expect(res.body.status).to.be.eql('CREATED');
          expect(res.body.data._id).exist;
        });
    })

    it('should create a category successfully if properties is empty', async () => {
      return await chai.request(app)
        .post(path)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          name: 'category test', description: "category test", properties: []
        })
        .then(res => {
          expect(res).to.have.status(201);
          expect(res.body.status).to.be.eql('CREATED');
          expect(res.body.data._id).exist;
        });
    })
  })
  describe('List Inventory Categories API Request', () => {
    const path = '/v1/inventory/category';
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
    it('should get the list of inventory categories successfully', async () => {
      await chai.request(app)
        .get(path)
        .set('Authorization', `Bearer ${bearerToken}`)
        .then(res => {
          expect(res).to.have.status(200);
        })
    })
  })

  describe('Update Inventory Category API Request', () => {

    const path = '/v1/inventory/category';

    it('should update inventory category successfully', async () => {

      let id = '';
      await chai.request(app)
        .post(path)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          name: 'category test', description: "category test", properties: [{
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

          id = res.body.data._id;
        });

      return await chai.request(app)
        .put(path + '/' + id)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          name: 'category test', description: "category test", properties: [{
            name: "component",
            description: "rectifier",
            type: "dropdown",
            options: ["mosfet", "semi-conductor", "transistor"]
          }]
        })
        .then(res => {
          expect(res).to.have.status(200);
          expect(res.body.data).exist;
          expect(res.body.status).to.be.eql('SUCCESS');
          expect(res.body.data).exist;
        })
    })

    it('should return error if updated name is empty', async () => {

      let id = '';
      await chai.request(app)
        .post(path)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          name: 'category tester2', description: "category test", properties: [{
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

          id = res.body.data._id;
        });

      return await chai.request(app)
        .put(path + '/' + id)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          name: '', description: "category test", properties: [{
            name: "component",
            description: "rectifier",
            type: "dropdown",
            options: ["mosfet", "semi-conductor", "transistor"]
          }]
        })
        .then(res => {
          expect(res).to.have.status(400);
          expect(res.body.status).to.be.eql('FAILED_VALIDATION');
          expect(res.body.data).to.be.an('array');
          expect(res.body.data).length(1);
          expect(res.body.data[0].property).to.be.eql('name');
          expect(res.body.data[0].constraints.length).to.be.eql('name should be between 3 and 30 characters');
          expect(res.body.data[0].constraints.isNotEmpty).to.be.eql('name is required');
        });
    })

    it('should return error if updated name is less than 3 characters', async () => {

      let id = '';
      await chai.request(app)
        .post(path)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          name: 'category test', description: "category test", properties: [{
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

          id = res.body.data._id;
        });

      return await chai.request(app)
        .put(path + '/' + id)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          name: 'ca', description: "category test", properties: [{
            name: "component",
            description: "rectifier",
            type: "dropdown",
            options: ["mosfet", "semi-conductor", "transistor"]
          }]
        })
        .then(res => {
          expect(res).to.have.status(400);
          expect(res.body.status).to.be.eql('FAILED_VALIDATION');
          expect(res.body.data).to.be.an('array');
          expect(res.body.data).length(1);
          expect(res.body.data[0].property).to.be.eql('name');
          expect(res.body.data[0].constraints.length).to.be.eql('name should be between 3 and 30 characters');
          expect(res.body.data[0].value).to.be.eql('ca');
        });
    })

    it('should return error if updated name is more than 30 characters', async () => {

      let id = '';
      await chai.request(app)
        .post(path)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          name: "category", description: "category test", properties: [{
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

          id = res.body.data._id;
        });

      return await chai.request(app)
        .put(path + '/' + id)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          name: "componentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponent", description: "category test", properties: [{
            name: "component",
            description: "rectifier",
            type: "dropdown",
            options: ["mosfet", "semi-conductor", "transistor"]
          }]
        })
        .then(res => {
          expect(res).to.have.status(400);
          expect(res.body.status).to.be.eql('FAILED_VALIDATION');
          expect(res.body.data).to.be.an('array');
          expect(res.body.data).length(1);
          expect(res.body.data[0].property).to.be.eql('name');
          expect(res.body.data[0].constraints.length).to.be.eql('name should be between 3 and 30 characters');
          expect(res.body.data[0].value).to.be.eql('componentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponent');
        });
    })



    it('should return error if updated description is more than 150 characters', async () => {

      let id = '';
      await chai.request(app)
        .post(path)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          name: "category", description: "category test", properties: [{
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

          id = res.body.data._id;
        });

      return await chai.request(app)
        .put(path + '/' + id)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          name: "test quabbly", description: "componentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponent", properties: [{
            name: "component",
            description: "rectifier",
            type: "dropdown",
            options: ["mosfet", "semi-conductor", "transistor"]
          }]
        })
        .then(res => {
          expect(res).to.have.status(400);
          expect(res.body.status).to.be.eql('FAILED_VALIDATION');
          expect(res.body.data).to.be.an('array');
          expect(res.body.data).length(1);
          expect(res.body.data[0].property).to.be.eql('description');
          expect(res.body.data[0].constraints.length).to.be.eql('description should be between 3 and 150 characters');
          expect(res.body.data[0].value).to.be.eql('componentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponentcomponent');
        });
    })

    it('should return duplicate error if updated name already exist', async () => {
      await chai.request(app)
        .post(path)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          name: "category", description: "category test", properties: [{
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
        });

      let id = '';
      await chai.request(app)
        .post(path)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          name: "category_update", description: "category test", properties: [{
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

          id = res.body.data._id;
        });

      return await chai.request(app)
        .put(path + '/' + id)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          name: "category", description: "category test", properties: [{
            name: "component",
            description: "rectifier",
            type: "dropdown",
            options: ["mosfet", "semi-conductor", "transistor"]
          }]
        })
        .then(res => {
          expect(res).to.have.status(400);
          expect(res.body.status).to.be.eql('FAILED_VALIDATION');
          expect(res.body.data).to.be.an('array');
          expect(res.body.data).length(1);
          expect(res.body.data[0].property).to.be.eql('name');
          expect(res.body.data[0].constraints.unique).to.be.eql('name must be unique');
          expect(res.body.data[0].value).to.be.eql('category');
        });
    });

    it('should not return error if updated property name is empty', async () => {
      let id = '';
      await chai.request(app)
      .post(path)
      .set('Authorization', `Bearer ${bearerToken}`)
      .send({
        name: "category_update", description: "category test", properties: [{
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

        id = res.body.data._id;
      });

    return await chai.request(app)
      .put(path + '/' + id)
      .set('Authorization', `Bearer ${bearerToken}`)
      .send({
        name: "category", description: "category test", properties: [{
          name: "",
          description: "rectifier",
          type: "dropdown",
          options: ["mosfet", "semi-conductor", "transistor"]
        }]
      })
      .then(res => {
        expect(res).to.have.status(200);
          expect(res.body.data).exist;
          expect(res.body.status).to.be.eql('SUCCESS');
          expect(res.body.data).exist;
      });
    });

    it('should not return error if updated property type is set to dropdown and options are not set', async () => {

      let id = '';
      await chai.request(app)
        .post(path)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          name: 'category test', description: "category test", properties: [{
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

          id = res.body.data._id;
        });

      return await chai.request(app)
        .put(path + '/' + id)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          name: 'category', description: "category test", properties: [{
            name: "categoty",
            description: "rectifier",
            type: "dropdown"
          }]
        })
        .then(res => {
          expect(res).to.have.status(200);
          expect(res.body.data).exist;
          expect(res.body.status).to.be.eql('SUCCESS');
          expect(res.body.data).exist;
        });
    });

    it('should return error if updated property type is set to checkbox and options is not set', async () => {

      let id = '';
      await chai.request(app)
        .post(path)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          name: 'category test', description: "category test", properties: [{
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

          id = res.body.data._id;
        });

      return await chai.request(app)
        .put(path + '/' + id)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          name: 'category', description: "category test", properties: [{
            name: "category",
            description: "rectifier",
            type: "checkbox"
          }]
        })
        .then(res => {
          expect(res).to.have.status(200);
          expect(res.body.data).exist;
          expect(res.body.status).to.be.eql('SUCCESS');
          expect(res.body.data).exist;
        });
    });

    it('should update category successfully if update property type is set to inputfield and options are not set', async () => {

      let id = '';
      await chai.request(app)
        .post(path)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          name: 'category test', description: "category test", properties: [{
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
          id = res.body.data._id;
        });

      return await chai.request(app)
        .put(path + '/' + id)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          name: 'category', description: "category test", properties: [{
            name: "category",
            description: "rectifier",
            type: "inputfield"
          }]
        })
        .then(res => {
          expect(res).to.have.status(200);
          expect(res.body.status).to.be.eql('SUCCESS');
          expect(res.body.data._id).exist;
        });
    });

  });




  describe('GET single inventory-Category detail API Request', () => {
    const path = '/v1/inventory/category';
    it('should get a single category record successfully', async () => {
      let id = '';
      await chai.request(app)
        .post(path)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          name: 'category test', description: "category test", properties: [{
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
          id = res.body.data._id;
        });

      return await chai.request(app)
        .get(path + '/' + id)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send()
        .then(res => {
          expect(res).to.have.status(200);
          expect(res.body.status).to.be.eql('SUCCESS');
          expect(res.body.data._id).exist;
        });
    });

    it('should return error if request id does not exist', async () => {
      let id = '';
      await chai.request(app)
        .post(path)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          name: 'category test', description: "category test", properties: [{
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
          id = res.body.data._id + 1;
        });

      return await chai.request(app)
        .get(path + '/' + id)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send()
        .then(res => {
          expect(res).to.have.status(404);
          expect(res.body.status).to.be.eql('NOT_FOUND');
        });
    });
  })



  describe('Suspend & Unsuspend inventory-Category API Request', () => {
    const path = '/v1/inventory/category';
    it('should suspend a category successfully', async () => {
      let id = '';
      await chai.request(app)
        .post(path)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          name: 'category test', description: "category test", properties: [{
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
          id = res.body.data._id;
        });

      return await chai.request(app)
        .patch(path + '/suspend' + '/' + id)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send()
        .then(res => {
          expect(res).to.have.status(200);
          expect(res.body.status).to.be.eql('SUCCESS');
          expect(res.body.data._id).exist;
          expect(res.body.data.active).to.be.eql(false);
        });
    });

    it('should unsuspend a category successfully', async () => {
      let id = '';
      await chai.request(app)
        .post(path)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          name: 'category test', description: "category test", properties: [{
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
          id = res.body.data._id;
        });

      return await chai.request(app)
        .patch(path + '/unsuspend' + '/' + id)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send()
        .then(res => {
          expect(res).to.have.status(200);
          expect(res.body.status).to.be.eql('SUCCESS');
          expect(res.body.data._id).exist;
          expect(res.body.data.active).to.be.eql(true);
        });
    });
  })
});
