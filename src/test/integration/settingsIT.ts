
import { Server } from '../../server';
import * as chai from 'chai';
import chaiHttp = require('chai-http');
import 'mocha';
import { expect } from 'chai';
import mongoose = require("mongoose");
import { ISettingsModel } from '../../models/settings';
import { settingsSchema } from '../../schemas/settings';
import * as dotenv from 'dotenv';

process.env.DB_NAME = 'inventory_test';

chai.use(chaiHttp);
dotenv.config();

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

  let settings = connection.model<ISettingsModel>("settings", settingsSchema);

  settings.deleteMany(function () {
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

  describe('Create settings API Request', () => {

    var path = '/v1/inventory/settings';


    it('should create a new settings if accessed for the first time', async () => {
      return await chai.request(app)
        .put(path)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          enableApprovalForProcurement: "true", procurementApprovers: ['example1@quabbly.com', 'example2@quabbly.com'],
          enableRequisitionApprover: "true", requisitionApprovers: ['example1@quabbly.com', 'example2@quabbly.com'], maxApprovalDelay: "2"
        })
        .then(res => {
          expect(res).to.have.status(201);
          expect(res.body.status).to.be.eql('CREATED');
          expect(res.body.data._id).exist;
        });
    })

    it('should return error if enable approval for procurement is not boolean', async () => {
      return await chai.request(app)
        .put(path)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          enableApprovalForProcurement: "quabbly", procurementApprovers: ['example1@quabbly.com', 'example2@quabbly.com'],
          enableRequisitionApprover: "false", requisitionApprovers: ['example1@quabbly.com', 'example2@quabbly.com'], maxApprovalDelay: "2"
        })
        .then(res => {
          expect(res).to.have.status(400);
          expect(res.body.status).to.be.eql('FAILED_VALIDATION');
          expect(res.body.data).length(1)
          expect(res.body.data[0].property).to.equal('enableApprovalForProcurement')
          expect(res.body.data[0].constraints.isBooleanString).to.equal('enable approval for procurement must be boolean')
          expect(res.body.data[0].value).to.eql('quabbly')
        });
    })

    it('should return email validation if procurementApprovers is not a valid email', async () => {
      return await chai.request(app)
        .put(path)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          enableApprovalForProcurement: "true", procurementApprovers: ['example1', 'example2'],
          enableRequisitionApprover: "false", requisitionApprovers: ['example1@quabbly.com', 'example2@quabbly.com'], maxApprovalDelay: "2"
        })
        .then(res => {
          expect(res).to.have.status(400);
          expect(res.body.status).to.be.eql('FAILED_VALIDATION');
          expect(res.body.data).length(2)
          expect(res.body.data[0].property).to.equal('procurementApprovers')
          expect(res.body.data[0].constraints.isNotValid).to.equal('procurementApprovers not a valid email')
          expect(res.body.data[0].value).to.eql(['example1', 'example2'])
        });
    });

    it('should return email validation if requisitionApprovers is not a valid email', async () => {
      return await chai.request(app)
        .put(path)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          enableApprovalForProcurement: "true", procurementApprovers: ['example1@quabbly.com', 'example2@quabbly.com'],
          enableRequisitionApprover: "false", requisitionApprovers: ['example1', 'example2'], maxApprovalDelay: "2"
        })
        .then(res => {
          expect(res).to.have.status(400);
          expect(res.body.status).to.be.eql('FAILED_VALIDATION');
          expect(res.body.data).length(2)
          expect(res.body.data[0].property).to.equal('requisitionApprovers')
          expect(res.body.data[0].constraints.isNotValid).to.equal('requisitionApprovers not a valid email')
          expect(res.body.data[0].value).to.eql(['example1', 'example2'])
        });
    })

    it('should update settings subsequently', async () => {
      await chai.request(app)
        .put(path)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          enableApprovalForProcurement: "false", procurementApprovers: ['example1@quabbly.com', 'example2@quabbly.com'],
          enableRequisitionApprover: "false", requisitionApprovers: ['example1@quabbly.com', 'example2@quabbly.com'], maxApprovalDelay: "2"
        })
        .then(res => {
          expect(res).to.have.status(201);
          expect(res.body.status).to.be.eql('CREATED');
          expect(res.body.data._id).exist;
        });

      return await chai.request(app)
        .put(path)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          enableApprovalForProcurement: "false", procurementApprovers: ['example1@quabbly.com', 'example2@quabbly.com'],
          enableRequisitionApprover: "false", requisitionApprovers: ['example1@quabbly.com', 'example2@quabbly.com'], maxApprovalDelay: "2"
        })
        .then(res => {
          expect(res).to.have.status(200);
          expect(res.body.status).to.be.eql('SUCCESS');
          expect(res.body.data._id).exist;
        });
    })

    it('should return error if enable approval for requisition is not boolean', async () => {
      return await chai.request(app)
        .put(path)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          enableApprovalForProcurement: "false", procurementApprovers: ['example1@quabbly.com', 'example2@quabbly.com'],
          enableRequisitionApprover: "qubbly", requisitionApprovers: ['example1@quabbly.com', 'example2@quabbly.com'], maxApprovalDelay: "2"
        })
        .then(res => {
          expect(res).to.have.status(400);
          expect(res.body.status).to.be.eql('FAILED_VALIDATION');
          expect(res.body.data).length(1)
          expect(res.body.data[0].property).to.equal('enableRequisitionApprover')
          expect(res.body.data[0].constraints.isBooleanString).to.equal('enable requisition approver must be boolean')
          expect(res.body.data[0].value).to.eql('qubbly')
        });
    })


  })

  describe('List Settings API Request', () => {

    let path = '/v1/inventory/settings'

    it('should return an empty array if no settings found', async () => {
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

    it('should get all settings, must return an empty values for each supported setting if the setting doesn\'t yet exist', async () => {

      await chai.request(app)
        .put(path)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          enableApprovalForProcurement: "true", maxApprovalDelay: "2"
        })
        .then(res => {
          expect(res).to.have.status(201);
          expect(res.body.status).to.be.eql('CREATED');
          expect(res.body.data._id).exist;
        });

      return await chai.request(app)
        .get(path)
        .set('Authorization', `Bearer ${bearerToken}`)
        .then(res => {
          expect(res).to.have.status(200);
          expect(res.body.status).to.be.eql('SUCCESS');
          expect(res.body.data).exist;
          expect(res.body.data.length).to.be.eql(1);
          expect(res.body.data[0].secret.enableApprovalForProcurement).to.be.eql(true);
          expect(res.body.data[0].secret.procurementApprovers).to.be.eql([]);
          expect(res.body.data[0].secret.enableRequisitionApprover).to.be.eql(false);
          expect(res.body.data[0].secret.requisitionApprovers).to.be.eql([]);
        })
    })

    it('should get all settings', async () => {

      await chai.request(app)
        .put(path)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          enableApprovalForProcurement: "true", procurementApprovers: ['example1@quabbly.com', 'example2@quabbly.com'],
          enableRequisitionApprover: "true", requisitionApprovers: ['example1@quabbly.com', 'example2@quabbly.com'], maxApprovalDelay: "2"
        })
        .then(res => {
          expect(res).to.have.status(201);
          expect(res.body.status).to.be.eql('CREATED');
          expect(res.body.data._id).exist;
        });

      return await chai.request(app)
        .get(path)
        .set('Authorization', `Bearer ${bearerToken}`)
        .then(res => {
          expect(res).to.have.status(200);
          expect(res.body.status).to.be.eql('SUCCESS');
          expect(res.body.data).exist;
          expect(res.body.data.length).to.be.eql(1);
          expect(res.body.data[0].secret.enableApprovalForProcurement).to.be.eql(true);
          expect(res.body.data[0].secret.procurementApprovers).to.be.eql(['example1@quabbly.com', 'example2@quabbly.com']);
          expect(res.body.data[0].secret.enableRequisitionApprover).to.be.eql(true);
          expect(res.body.data[0].secret.requisitionApprovers).to.be.eql(['example1@quabbly.com', 'example2@quabbly.com']);
        })
    })
  });

});
