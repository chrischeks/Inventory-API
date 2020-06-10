// import { Server } from '../../server';
// import * as chai from 'chai';
// import chaiHttp = require('chai-http');
// import 'mocha';
// import { expect } from 'chai';
// import mongoose = require("mongoose");
// import { IActivityModel } from '../../models/activity';
// import { activitySchema } from '../../schemas/activity';
// import * as dotenv from "dotenv";

// process.env.DB_NAME = 'accounting_test';

// chai.use(chaiHttp);
// dotenv.config();

// let bearerToken;
// const pathregister = '/v1/auth/register';
// const pathlogin = '/v1/auth/login';
// const random = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5);
// const firstname = `test${random}`;
// const lastname = `testparent${random}`;
// const password = 'ghdhdfhjd';
// const email = `${firstname}${lastname}@gmail.com`;
// const userApiUrl = process.env.USER_API_URL
// const userRegisterObject = {
//     companyName: "Quabbly",
//     firstname: firstname,
//     lastname: lastname,
//     email: email,
//     password: password
// }
// var clearDB = function (done) {
//     const MONGODB_CONNECTION: string = process.env.MONGODB_HOST + process.env.DB_NAME;
//     console.log(MONGODB_CONNECTION);

//     mongoose.set('useCreateIndex', true);
//     mongoose.set('useNewUrlParser', true);

//     let connection: mongoose.Connection = mongoose.createConnection(MONGODB_CONNECTION);

//     let activity = connection.model<IActivityModel>("Activity", activitySchema);

//     activity.deleteMany(function () {
//         connection.close(function () {
//             done();
//         });
//     });
// }

// after(function (done) {
//     clearDB(done);
// });

// beforeEach(function (done) {
//     clearDB(done);
// });

// var app = Server.bootstrap().app;

// describe('Register a new user, and log user in to generate token', () => {
//     before((done) => {
//         chai.request(userApiUrl)
//             .post(pathregister)
//             .send(userRegisterObject)
//             .end((err, res) => {
//                 if (err) throw err;
//                 chai.request(userApiUrl)
//                     .post(pathlogin)
//                     .send({ password: password, username: email })
//                     .end((err, res) => {
//                         if (err) throw err;
//                         bearerToken = res.body.token;
//                         console.log(bearerToken)
//                         done();
//                     });
//             });
//     });

//     describe('GET audit trail API Request', () => {

//         it('should return an empty array if no result found', async () => {
//             return await chai.request(app)
//                 .get('/v1/account/audit_trail')
//                 .set('Authorization', `Bearer ${bearerToken}`)
//                 .then(res => {
//                     expect(res).to.have.status(200);
//                     expect(res.body.status).to.be.eql('SUCCESS');
//                     expect(res.body.data).exist;
//                     expect(res.body.data.length).to.be.eql(0);
//                 })
//         })

//         it('should  return  list of all activities', async () => {

//             await chai.request(app)
//             .put('/v1/account/settings')
//             .set('Authorization', `Bearer ${bearerToken}`)
//             .send({
//                 currency: 'NGN'
//             })
//             .then(res => {
//                 expect(res).to.have.status(201);
//                 expect(res.body.status).to.be.eql('CREATED');
//                 expect(res.body.data._id).exist;
//             });

//             await chai.request(app)
//                 .post('/v1/account/bank')
//                 .set('Authorization', `Bearer ${bearerToken}`)
//                 .send({
//                     bankName: 'GTB', accountName: 'testname', accountNumber: '2098765444', currency: 'NGN'
//                 })
//                 .then(res => {
//                     expect(res).to.have.status(201);
//                     expect(res.body.status).to.be.eql('CREATED');
//                     expect(res.body.data._id).exist;
//                 });

//             await chai.request(app)
//                 .post('/v1/account/customer')
//                 .set('Authorization', `Bearer ${bearerToken}`)
//                 .send({
//                     name: 'testname', phoneNumber: '08111222233', email: 'testuser@quabbly.com',
//                     address: '228 test user street, test address, test city.'
//                 })
//                 .then(res => {
//                     expect(res).to.have.status(201);
//                     expect(res.body.status).to.be.eql('CREATED');
//                     expect(res.body.data._id).exist;

//                 });

//             return await chai.request(app)
//                 .get('/v1/account/audit_trail')
//                 .set('Authorization', `Bearer ${bearerToken}`)
//                 .then(res => {
//                     expect(res).to.have.status(200);
//                     expect(res.body.status).to.be.eql('SUCCESS');
//                     expect(res.body.data).exist;
//                     expect(res.body.data.length).to.be.eql(3);
//                     expect(res.body.data[0].schemaName).to.be.eql('settings')
//                     expect(res.body.data[1].schemaName).to.be.eql('bank')
//                     expect(res.body.data[2].schemaName).to.be.eql('customer')
//                 })
//         })
//     })
// });
