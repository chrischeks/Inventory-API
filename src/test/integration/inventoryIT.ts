import { Server } from '../../server';
import * as chai from 'chai';

import chaiHttp = require('chai-http');
import 'mocha';
import { expect } from 'chai';
import mongoose = require("mongoose");
import { IInventoryItemModel } from '../../models/inventory';
import { inventoryItemSchema } from '../../schemas/inventory';
import * as dotenv from 'dotenv';

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

  let inventory = connection.model<IInventoryItemModel>("inventory", inventoryItemSchema);

  inventory.deleteMany(function () {
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
  describe('Create inventory API Request', () => {
    const path = '/v1/inventory/item';
    const categoryPath = '/v1/inventory/category';
    let category_id = '';
    let property_id = '';

    it('should create an SKU with first three letters of category name if category name is one word', async () => {
      await chai.request(app)
        .post(categoryPath)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          name: 'category', description: "category test", barcode: true,  properties: [{
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
      return await chai.request(app)
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
          expect(res.body.data.inventorySku[0].sku).include("cat-")
          expect(res.body.data.inventorySku[0].sku).include("-2")
        });
    });


    it('should create an SKU with first letters of first, second and third words if category name is three words', async () => {
      await chai.request(app)
        .post(categoryPath)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          name: 'three Words category', description: "category test", barcode: true, properties: [{
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
      return await chai.request(app)
        .post(path)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          name: 'fod3180', description: 'optoisolator', quantity: '100', category: category_id, properties: [{
            id: property_id,
            value: 'quabbly'
          }]
        })
        .then(res => {
          expect(res).to.have.status(201);
          expect(res.body.status).to.be.eql('CREATED');
          expect(res.body.data._id).exist;
          expect(res.body.data.inventorySku[1].sku).include("tWc-")
          expect(res.body.data.inventorySku[99].sku).include("-001")
        });
    });


    it('should create an SKU with first letter of first word and first two letters of second word if category name is two words', async () => {
      await chai.request(app)
        .post(categoryPath)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          name: 'twoWords category', description: "category test", barcode: true, properties: [{
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
      return await chai.request(app)
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
          expect(res.body.data.inventorySku[0].sku).include("tca-")
          expect(res.body.data.inventorySku[0].sku).include("-2")
        });
    });

    it('should create an SKU with first letters of first, second and third words if category name is three words', async () => {
      await chai.request(app)
        .post(categoryPath)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          name: 'More than three words category', description: "category test", barcode: true, properties: [{
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
      return await chai.request(app)
        .post(path)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          name: 'fod3180', description: 'optoisolator', quantity: '10', category: category_id, properties: [{
            id: property_id,
            value: 'quabbly'
          }]
        })
        .then(res => {
          expect(res).to.have.status(201);
          expect(res.body.status).to.be.eql('CREATED');
          expect(res.body.data._id).exist;
          expect(res.body.data.inventorySku[1].sku).include("Mtt-")
          expect(res.body.data.inventorySku[9].sku).include("-01")
        });
    });



    it('should create a new inventory item successfully', async () => {
      await chai.request(app)
        .post(categoryPath)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          name: 'category test', description: "category test",  barcode: true, properties: [{
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
      return await chai.request(app)
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
        });
    });

    it('should return failed validation error if category is not valid', async () => {
      await chai.request(app)
        .post(categoryPath)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          name: 'category test2', description: "category tester", barcode: true, properties: [{
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
          property_id = res.body.data.properties[0];
        });
      return await chai.request(app)
        .post(path)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          name: 'fod3180', description: 'optoisolator', quantity: '2', category: '11123455555', properties: [{
            id: property_id,
            value: 'quabbly2'
          }]

        })
        .then(res => {
          expect(res).to.have.status(400);
          expect(res.body.status).to.be.eql('FAILED_VALIDATION');
          expect(res.body.data).to.be.an('array');
          expect(res.body.data).length(1);
          expect(res.body.data[0].property).to.be.eql('category');
          expect(res.body.data[0].constraints.isNotValid).to.be.eql('category is not valid');
          expect(res.body.data[0].value).to.be.eql('11123455555');
        });
    })


    it('should return failed validation error if property is not valid', async () => {
      await chai.request(app)
        .post(categoryPath)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          name: 'category test34', description: "category tester", barcode: true, properties: [{
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
          property_id = res.body.data.properties[0];
        });
      return await chai.request(app)
        .post(path)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          name: 'fod3180', description: 'optoisolator', quantity: '2', category: category_id, properties: [{
            id: 'isnotvalid',
            value: 'quabbly2'
          }]

        })
        .then(res => {
          expect(res).to.have.status(400);
          expect(res.body.status).to.be.eql('FAILED_VALIDATION');
          expect(res.body.data).to.be.an('array');
          expect(res.body.data).length(1);
          expect(res.body.data[0].property).to.be.eql('property');
          expect(res.body.data[0].constraints.isNotValid).to.be.eql('property is not valid');
        });
    })

    it('should return duplicate name error if name already exists', async () => {
      await chai.request(app)
        .post(categoryPath)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          name: 'category tester3', description: "category tester3", properties: [{
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
          property_id = res.body.data.properties[0];
        });
      await chai.request(app)
        .post(path)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          name: 'fod3180', description: 'optoisolator', quantity: '2', category: category_id, properties: [{
            id: property_id,
            value: 'quabbly3'
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
          name: 'fod3180', description: 'optoisolator', quantity: '2', category: category_id, properties: [{
            id: property_id,
            value: 'quabbly4'
          }]

        })
        .then(res => {
          expect(res).to.have.status(400);
          expect(res.body.status).to.be.eql('FAILED_VALIDATION');
          expect(res.body.data).to.be.an('array');
          expect(res.body.data).length(1);
          expect(res.body.data[0].property).to.be.eql('name');
          expect(res.body.data[0].constraints.unique).to.be.eql('name must be unique');
          expect(res.body.data[0].value).to.be.eql('fod3180');
        });

    })

    it('should return errors if name is missing', async () => {
      return await chai.request(app)
        .post(path)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          description: 'optoisolator', quantity: '2', category: category_id, properties: [{
            id: property_id,
            value: 'quabbly5'
          }]

        })
        .then(res => {
          expect(res).to.have.status(400);
          expect(res.body.status).to.be.eql('FAILED_VALIDATION');
          expect(res.body.data).to.be.an('array');
          expect(res.body.data).length(1);
          expect(res.body.data[0].property).to.be.eql('name');
          expect(res.body.data[0].constraints.maxLength).to.be.eql('name should not exceed 30 characters');
          expect(res.body.data[0].constraints.isNotEmpty).to.be.eql('name is required');
        });

    })

    it('should return errors if description exceeds 150 characters', async () => {
      return await chai.request(app)
        .post(path)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          name: 'fod3180', description: 'thisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolong', quantity: '2', category: category_id, properties: {
            id: property_id,
            value: 'quabbly6'
          }

        })
        .then(res => {
          expect(res).to.have.status(400);
          expect(res.body.status).to.be.eql('FAILED_VALIDATION');
          expect(res.body.data).to.be.an('array');
          expect(res.body.data[0].property).to.be.eql('description');
          expect(res.body.data[0].constraints.maxLength).to.be.eql('description should not exceed 150 characters');
          expect(res.body.data[0].value).to.be.eql('thisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolong');
        });

    })

    it('should return errors if quantity is less than 1', async () => {
      return await chai.request(app)
        .post(path)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          name: 'fod3180', description: 'optoisolator', quantity: 0, category: category_id, properties: [{
            id: property_id,
            value: 'quabbly7'
          }]

        })
        .then(res => {
          expect(res).to.have.status(400);
          expect(res.body.status).to.be.eql('FAILED_VALIDATION');
          expect(res.body.data).to.be.an('array');
          expect(res.body.data).length(1);
          expect(res.body.data[0].property).to.be.eql('quantity');
          expect(res.body.data[0].constraints.minLength).to.be.eql('quantity should not be less than 1');
        });

    })

    it('should return errors if name exceeds 30 characters', async () => {
      return await chai.request(app)
        .post(path)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          name: 'thisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolong', description: 'component', quantity: '2', category: category_id, properties: [{
            id: property_id,
            value: 'quabbly8'
          }]

        })
        .then(res => {
          expect(res).to.have.status(400);
          expect(res.body.status).to.be.eql('FAILED_VALIDATION');
          expect(res.body.data).to.be.an('array');
          expect(res.body.data[0].property).to.be.eql('name');
          expect(res.body.data[0].constraints.maxLength).to.be.eql('name should not exceed 30 characters');
          expect(res.body.data[0].value).to.be.eql("thisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolong");
        });
    })

    describe('List Inventory Items API Request', () => {
      const path = '/v1/inventory/item';
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
      it('should get the list of inventory item successfully', async () => {
        await chai.request(app)
          .get(path)
          .set('Authorization', `Bearer ${bearerToken}`)
          .then(res => {
            expect(res).to.have.status(200);
          })
      })
    })

  });

    describe('GET single inventory-Category detail API Request', () => {
      const path = '/v1/inventory/item';
      const categoryPath = '/v1/inventory/category';
      let category_id = '';
      let property_id = '';
    it('should get a single category record successfully', async () => {
      let itemId = '';
      await chai.request(app)
      .post(categoryPath)
      .set('Authorization', `Bearer ${bearerToken}`)
      .send({
        name: 'category', description: "category test", barcode: true, properties: [{
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
        expect(res.body.data.inventorySku[0].sku).include("cat-")
        expect(res.body.data.inventorySku[0].sku).include("-2")
        itemId = res.body.data._id;
      });

      return await chai.request(app)
        .get(path + '/' + itemId)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send()
        .then(res => {
          expect(res).to.have.status(200);
          expect(res.body.status).to.be.eql('SUCCESS');
          expect(res.body.data._id).exist;
        });
    });

    it('should return error if request id does not exist', async () => {
      let itemId = '';
      await chai.request(app)
      .post(categoryPath)
      .set('Authorization', `Bearer ${bearerToken}`)
      .send({
        name: 'category', description: "category test", barcode: true, properties: [{
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
        expect(res.body.data.inventorySku[0].sku).include("cat-")
        expect(res.body.data.inventorySku[0].sku).include("-2")
        itemId = res.body.data._id + 1;
      });

      return await chai.request(app)
        .get(path + '/' + itemId)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send()
        .then(res => {
          expect(res).to.have.status(404);
          expect(res.body.status).to.be.eql('NOT_FOUND');
        });
    });
  })

  describe('Update Inventory Item API Request', () => {

    const path = '/v1/inventory/item';
    const categoryPath = '/v1/inventory/category';
    let category_id = '';
    let property_id = '';

    it('should update inventory item successfully', async () => {
      let itemid = '';
      await chai.request(app)
        .post(categoryPath)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          name: 'category test update', description: "category test", properties: [{
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
          itemid = res.body.data._id;
        });

      return await chai.request(app)
        .put(path + '/' + itemid)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          name: 'fod3180', description: 'optoisolator', quantity: '2', category: category_id, properties: [{
            id: property_id,
            value: 'quabbly'
          }]
        })
        .then(res => {
          expect(res).to.have.status(200);
          expect(res.body.data).exist;
          expect(res.body.status).to.be.eql('SUCCESS');
          expect(res.body.data).exist;
        })
    })

    it('should return error if updated name is not passed', async () => {

      let itemid = '';
      await chai.request(app)
        .post(categoryPath)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          name: 'category test update name', description: "category test", properties: [{
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

          itemid = res.body.data._id;
        });

      return await chai.request(app)
        .put(path + '/' + itemid)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          description: 'optoisolator', quantity: '2', category: category_id, properties: [{
            id: property_id,
            value: 'quabbly'
          }]
        })
        .then(res => {
          expect(res).to.have.status(400);
          expect(res.body.status).to.be.eql('FAILED_VALIDATION');
          expect(res.body.data).to.be.an('array');
          expect(res.body.data).length(1);
          expect(res.body.data[0].property).to.be.eql('name');
          expect(res.body.data[0].constraints.maxLength).to.be.eql('name should not exceed 30 characters');
          expect(res.body.data[0].constraints.isNotEmpty).to.be.eql('name is required');
        });
    })

    it('should return error if updated name is more than 30 characters', async () => {
      let itemid = '';
      await chai.request(app)
        .post(categoryPath)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          name: 'category test max', description: "category test", properties: [{
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

          itemid = res.body.data._id;
        });

      return await chai.request(app)
        .put(path + '/' + itemid)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          name: 'properpreparationpreventpoorperformanceproperpreparationpreventpoorperformanceproperpreparationpreventpoorperformanceproperpreparationpreventpoorperformanceproperpreparationpreventpoorperformanceproperpreparationpreventpoorperformanceproperpreparationpreventpoorperformance', description: 'optoisolator', quantity: '2', category: category_id, properties: [{
            id: property_id,
            value: 'quabbly'
          }]
        })
        .then(res => {
          expect(res).to.have.status(400);
          expect(res.body.status).to.be.eql('FAILED_VALIDATION');
          expect(res.body.data).to.be.an('array');
          expect(res.body.data).length(1);
          expect(res.body.data[0].property).to.be.eql('name');
          expect(res.body.data[0].constraints.maxLength).to.be.eql('name should not exceed 30 characters');
          expect(res.body.data[0].value).to.be.eql('properpreparationpreventpoorperformanceproperpreparationpreventpoorperformanceproperpreparationpreventpoorperformanceproperpreparationpreventpoorperformanceproperpreparationpreventpoorperformanceproperpreparationpreventpoorperformanceproperpreparationpreventpoorperformance');
        });
    })

    it('should return error if updated description is more than 150 characters', async () => {
      let itemid = '';
      await chai.request(app)
        .post(categoryPath)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          name: 'category max description', description: "category test", properties: [{
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

          itemid = res.body.data._id;
        });

      return await chai.request(app)
        .put(path + '/' + itemid)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          name: 'name', description: 'properpreparationpreventpoorperformanceproperpreparationpreventpoorperformanceproperpreparationpreventpoorperformanceproperpreparationpreventpoorperformanceproperpreparationpreventpoorperformanceproperpreparationpreventpoorperformanceproperpreparationpreventpoorperformanceproperpreparationpreventpoorperformanceproperpreparationpreventpoorperformanceproperpreparationpreventpoorperformanceproperpreparationpreventpoorperformanceproperpreparationpreventpoorperformanceproperpreparationpreventpoorperformanceproperpreparationpreventpoorperformanceproperpreparationpreventpoorperformanceproperpreparationpreventpoorperformanceproperpreparationpreventpoorperformanceproperpreparationpreventpoorperformanceproperpreparationpreventpoorperformanceproperpreparationpreventpoorperformanceproperpreparationpreventpoorperformanceproperpreparationpreventpoorperformanceproperpreparationpreventpoorperformanceproperpreparationpreventpoorperformanceproperpreparationpreventpoorperformance', quantity: '2', category: category_id, properties: [{
            id: property_id,
            value: 'quabbly'
          }]
        })
        .then(res => {
          expect(res).to.have.status(400);
          expect(res.body.status).to.be.eql('FAILED_VALIDATION');
          expect(res.body.data).to.be.an('array');
          expect(res.body.data).length(1);
          expect(res.body.data[0].property).to.be.eql('description');
          expect(res.body.data[0].constraints.maxLength).to.be.eql('description should not exceed 150 characters');
          expect(res.body.data[0].value).to.be.eql('properpreparationpreventpoorperformanceproperpreparationpreventpoorperformanceproperpreparationpreventpoorperformanceproperpreparationpreventpoorperformanceproperpreparationpreventpoorperformanceproperpreparationpreventpoorperformanceproperpreparationpreventpoorperformanceproperpreparationpreventpoorperformanceproperpreparationpreventpoorperformanceproperpreparationpreventpoorperformanceproperpreparationpreventpoorperformanceproperpreparationpreventpoorperformanceproperpreparationpreventpoorperformanceproperpreparationpreventpoorperformanceproperpreparationpreventpoorperformanceproperpreparationpreventpoorperformanceproperpreparationpreventpoorperformanceproperpreparationpreventpoorperformanceproperpreparationpreventpoorperformanceproperpreparationpreventpoorperformanceproperpreparationpreventpoorperformanceproperpreparationpreventpoorperformanceproperpreparationpreventpoorperformanceproperpreparationpreventpoorperformanceproperpreparationpreventpoorperformance');
        });
    })

    it('should return duplicate error if updated name already exist', async () => {
      let itemid = '';
      await chai.request(app)
        .post(categoryPath)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          name: 'category name unique', description: "category test", properties: [{
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
            value: 'quabbly3'
          }]

        })
        .then(res => {
          expect(res).to.have.status(201);
          expect(res.body.status).to.be.eql('CREATED');
          expect(res.body.data._id).exist;
        });
      await chai.request(app)
        .post(path)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          name: 'fod31811', description: 'optoisolator', quantity: '2', category: category_id, properties: [{
            id: property_id,
            value: 'quabbly4'
          }]

        })
        .then(res => {
          expect(res).to.have.status(201);
          expect(res.body.status).to.be.eql('CREATED');
          expect(res.body.data._id).exist;
          itemid = res.body.data._id;
        });
      return await chai.request(app)
        .put(path + '/' + itemid)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          name: 'fod3180', description: 'optoisolator', quantity: '2', category: category_id, properties: [{
            id: property_id,
            value: 'quabbly3'
          }]
        })
        .then(res => {
          expect(res).to.have.status(400);
          expect(res.body.status).to.be.eql('FAILED_VALIDATION');
          expect(res.body.data).to.be.an('array');
          expect(res.body.data).length(1);
          expect(res.body.data[0].property).to.be.eql('name');
          expect(res.body.data[0].constraints.unique).to.be.eql('name must be unique');
          expect(res.body.data[0].value).to.be.eql('fod3180');
        });
    });
  });

  describe('Approved inventory Item API Request', () => {
    const path = '/v1/inventory/item';
    const categoryPath = '/v1/inventory/category';
    let category_id = '';
    let property_id = '';
    let id = '';
    it('should approve & decline inventory item successfully', async () => {
      await chai.request(app)
        .post(categoryPath)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          name: 'test cat approve', description: "category test", properties: [{
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
      return await chai.request(app)
        .patch(path + '/approve' + '/' + id)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send()
        .then(res => {
          expect(res).to.have.status(200);
          expect(res.body.status).to.be.eql('SUCCESS');
          expect(res.body.data._id).exist;
          expect(res.body.data.approval_status).to.be.eql('approved');
        });
    });

    it('should decline inventory item successfully', async () => {
      await chai.request(app)
        .post(categoryPath)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          name: 'test cat decline', description: "category test", properties: [{
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
          name: 'fod31801', description: 'optoisolator', quantity: '2', category: category_id, properties: [{
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
      return await chai.request(app)
        .patch(path + '/decline' + '/' + id)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send()
        .then(res => {
          expect(res).to.have.status(200);
          expect(res.body.status).to.be.eql('SUCCESS');
          expect(res.body.data._id).exist;
          expect(res.body.data.approval_status).to.be.eql('declined');
        });
    });
  });




  describe('Search inventory item API request', () => {
    const path = '/v1/inventory/item';
    const categoryPath = '/v1/inventory/category';
    let category_id = '';
    let property_id = '';
    let id = '';
    it('should create an item & search inventory item successfully', async () => {
      await chai.request(app)
        .post(categoryPath)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          name: 'test cat approve', description: "category test", properties: [{
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
        .get('/v1/inventory/items/search?name=fod3180')
        .set('Authorization', `Bearer ${bearerToken}`)
        .then(res => {
          expect(res).to.have.status(200);
          expect(res.body.status).to.be.eql('SUCCESS');
        });
    });

    it('should should return status 404 if search item is not found', async () => {
      await chai.request(app)
        .post(categoryPath)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          name: 'test category approve', description: "category test", properties: [{
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
          name: 'fod3080', description: 'optoisolator', quantity: '2', category: category_id, properties: [{
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
        .get('/v1/inventory/items/search?name=tlp250')
        .set('Authorization', `Bearer ${bearerToken}`)
        .then(res => {
          expect(res).to.have.status(404);
          expect(res.body.status).to.be.eql('NOT_FOUND');
        });
    });
  });



















})
