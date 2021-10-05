const assert = require('assert');
const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const chaiJsonSchemaAjv = require('chai-json-schema-ajv');
chai.use(chaiJsonSchemaAjv);
const server = require('../index');

const serverAddress = "http://localhost:3000";
const postArraySchema = require('../schemas/post.array.schema.json')

const postitesti = {
    "title": "string",
    "description": "string",
    "category": "stsdfg",
    "location": "helsinki",
    "images": [ "string" ],
    "price": 0,
    "deliveryType": "pickup",
    "contactInfo": "Jukka, 05049569213"
}

let makenId = null;




describe('API TEST', function() {

    before(function() {
        server.start();
    })

    after(function() {
        server.close();
    })

    describe('POST /signup' , function() {
        it('should return token', function(done){
            chai.request(serverAddress)
            .post('/signup')
            .send({
                "username": "foooo",
                "password": "barrrrrrrrr"
            })

            .end(function(err,res){
                expect(err).to.be.null;
                expect(res).to.have.status(201);
                done();
            })
        })
    })
    describe('POST /signup', function() {
        it('should not work if the password or username is too short', function(done){
            chai.request(serverAddress)
            .post('/signup')
            .send({
                "username": "fo",
                "password": "barrrrrrrrr"
            })
            .end(function(err, res){
                expect(err).to.be.null;
                expect(res).to.have.status(400);
                done();
            
            })
        })
    })
    describe('POST /login', function(){
        it('should not work if password or username is wrong', function(done){
            chai.request(serverAddress)
            .post('/login')
            .send({
                "username": "fo",
                "password": "barrrrrrrrr"
            })
            .end(function(err, res){
                expect(err).to.be.null;
                expect(res).to.have.status(401);
                done();
            
            })
        })
    })
    describe('POST /post' , function(done){
        it('should not work if one of the contets is too short or long', function(done){
            chai.request(serverAddress)
            .post('/post')
            .send({
                "title": "string",
                "description": "string",
                "category": "st",
                "location": "helsinki",
                "images": [
                "string"
                ],
                "price": 0,
                "deliveryType": "pickup",
                "contactInfo": "Jukka, 05049569213"
            })
            .end(function(err, res){
                expect(err).to.be.null;
                expect(res).to.have.status(401);
                done();
            
            })
        })

        it('should create functional post', function(done){

            chai.request(serverAddress)
            .post('/post')
            .send(postitesti)
            .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMjY3NSIsInVzZXJuYW1lIjoia3Jpc3UiLCJwYXNzd29yZCI6IiQyYSQwNiRxVFpmUjhPNHprNkNwZ2RTMi9jT2cubDV1ZU1uYkc5SVBrSEhuaWM1RG9KT1RPMEkvMWMvUyIsImlhdCI6MTYzMzQyNzU3Nn0.GV7VmisU4vM7d5GwsjttYtU7muBNWhaqrcGH-OvhsYw')
            .end(function(err, res){
                expect(err).to.be.null;
                expect(res).to.have.status(201);
                done();
            
            })
        })
    })

    describe('GET /posts', function() {
        it('should return array posts and it is founds from the postlist', function(done) {
            //send http request
            chai.request(serverAddress)
            .get('/posts')
            .end(function(err, res) {
                expect(err).to.be.null;
                 // check response statuses
                expect(res).to.have.status(200);
                 //check response data structure
                expect(res.body).to.be.jsonSchema(postArraySchema);
                console.log(res.body.slice(-1));
                const parsedpost = res.body.slice(-1)[0];
                makenId = parsedpost.id
                delete parsedpost.id
                console.log('TÄMÄ ON TÄSSÄ' + makenId);
                delete parsedpost.ownerId;
                delete parsedpost.date;
                console.log(parsedpost);
                console.log(postitesti);
                expect(parsedpost).to.eql(postitesti);
                
                
                done();
            })
        })
    })
    describe('PATCH /posts ', function() {
        it('should be able to patch content if you are creator of it', function(done) {
            console.log(makenId)
            chai.request(serverAddress)
            .patch(`/posts/${makenId}`)
            .send({
                title: "stringarino"
            })
            .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMjY3NSIsInVzZXJuYW1lIjoia3Jpc3UiLCJwYXNzd29yZCI6IiQyYSQwNiRxVFpmUjhPNHprNkNwZ2RTMi9jT2cubDV1ZU1uYkc5SVBrSEhuaWM1RG9KT1RPMEkvMWMvUyIsImlhdCI6MTYzMzQyNzU3Nn0.GV7VmisU4vM7d5GwsjttYtU7muBNWhaqrcGH-OvhsYw')
            .end(function(err, res){
                expect(err).to.be.null;
                expect(res).to.have.status(200);


                done();
            })

        })
    })
    describe('DELETE /posts/:id', function(){
        it('should delete a post according to given id', function(done){
            chai.request(serverAddress)
            .delete(`/posts/${makenId}`)
            .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMjY3NSIsInVzZXJuYW1lIjoia3Jpc3UiLCJwYXNzd29yZCI6IiQyYSQwNiRxVFpmUjhPNHprNkNwZ2RTMi9jT2cubDV1ZU1uYkc5SVBrSEhuaWM1RG9KT1RPMEkvMWMvUyIsImlhdCI6MTYzMzQyNzU3Nn0.GV7VmisU4vM7d5GwsjttYtU7muBNWhaqrcGH-OvhsYw')
            .end(function(err, res){
                expect(err).to.be.null;
                expect(res).to.have.status(200);


                done();
            })
        })
    })



})