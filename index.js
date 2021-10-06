// Express
const express = require('express');
const app = express();
const port = (process.env.PORT || 3000);

// Validation
const Ajv = require('ajv');
const ajv = new Ajv();
const postSchema = require('./schemas/post.schema.json');
const userSchema = require('./schemas/user.schema.json');
const postUpdateSchema = require('./schemas/post.update.schema.json');
const validatePost = ajv.compile(postSchema);
const validateUser = ajv.compile(userSchema);
const validateUpdate = ajv.compile(postUpdateSchema);
// Passport
const passport = require('passport');
const bcrypt = require('bcryptjs');
const BasicStrategy = require('passport-http').BasicStrategy;
const jwt = require('jsonwebtoken');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const secrets = require('./secrets.json');
const options = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: secrets.jwtSignKey
};

const database = require('./database.js')

// Middleware
app.use(express.json());
app.use(express.urlencoded({
    extended: true
  }));

passport.use(new BasicStrategy(
    (username, password, done) => {
        const user = database.getUserByName(username)
        if(user && bcrypt.compareSync(password, user.password))
            done(null, user);
        else
            done(null, false);
    }
));

passport.use(new JwtStrategy(options, (payload, done) => {
    // Check if user exists
    const user = database.getUserByName(payload.username);
    if (user)
        done(null, user);
    else
        done(null, false);
}));

const checkIfOwner = (req, res, next) => {
    const post = database.getPostById(req.params.postId)
    if (!post)
        res.status(404).send("Post not found");
    else if (post.ownerId == req.user.id) {
        next();
    } else {
        res.sendStatus(401);
    }
};

const validator = (type) => {
    return (req, res, next) => {
        let errors = null;
        // Validate with the selected validator
        switch (type) {
            case "user":
                if (!validateUser(req.body)) { errors = validateUser.errors};
                break;
            case "post":
                if (!validatePost(req.body)) { errors = validatePost.errors};
                break;
            case "postUpdate":
                if (!validateUpdate(req.body)) { errors = validateUpdate.errors};
                break;
        }
        if (errors) {
            // console.log("Errors: " + JSON.stringify(errors, undefined, 2))

            // Basic error message printing
            res.status(400).send(errors[0].instancePath + " " + errors[0].message);
        } else {
            next();
        }
    }
};

// User Signup
app.post('/signup', validator("user"), (req, res) => {
    //rekisteröitymisessö tarkastatetaan onko jo olemassa kyseisellä
    //nimellä ja jos ei ole niin palautetaan avain
    if (database.getUserByName(req.body.username)) {
        res.status(409).send("User already exists");
        return;
    }
    console.log('originaali salasana ' + req.body.password);
    const salt = bcrypt.genSaltSync(6);
    const hashedPassword = bcrypt.hashSync(req.body.password, salt)
    console.log('hashattu salasana ' + hashedPassword);

    const newUser = { 
        username: req.body.username,
        password: hashedPassword
    }
    const token = jwt.sign(newUser, secrets.jwtSignKey);
    
    database.addUser(newUser);
    res.status(201).json({ token: token});
})

// User Login
app.post('/login', passport.authenticate('basic', {session: false}), (req, res) => {
    //otetaan vastaan annetut kirjautumis tiedot ja jos ne vastaavat
    //tietokannassa olevia niin annetaan authorisaatio tehdä tiettyjä toimintoja
    //aka palauteteaan avain
    console.log("User payload: " + JSON.stringify(req.user))
    const token = jwt.sign(req.user, secrets.jwtSignKey);
    res.json({ token: token})
})

// Create a new Post
app.post('/post', [passport.authenticate('jwt', {session: false}), validator("post")], (req, res) => {
    const newPost = {
        ownerId: req.user.id,
        title: req.body.title,
        description: req.body.description,
        category: req.body.category,
        location: req.body.location,
        images: req.body.images,
        price: req.body.price,
        date: new Date(Date.now()),
        deliveryType: req.body.deliveryType,
        contactInfo: req.body.contactInfo,
    }
    database.addPost(newPost);
    res.sendStatus(201)
})

// Search Posts
app.get('/posts', (req, res) => {
    const criterias = {};
    for (let param in req.query)
        criterias[param] = req.query[param];
    console.log(JSON.stringify(criterias, undefined, 2));
    const posts = database.getPostByCriteria(criterias);
    res.json(posts);
});

// Update a Post
app.patch('/posts/:postId', [passport.authenticate('jwt', {session: false}), validator("postUpdate"), checkIfOwner], (req, res) => {
    const updatedProps = req.body;
    const valid = validateUpdate(updatedProps);
    if (!valid) {
        res.sendStatus(400);
        return;
    }
    database.updatePostById(req.params.postId, updatedProps);
    res.status(200).send("Post updated successfully");
    // Respond with updated post??
});

// Delete a Post
app.delete('/posts/:postId', [passport.authenticate('jwt', {session: false}), checkIfOwner], (req, res) => {
    database.deletePostById(req.params.postId);
    res.status(200).send("Post deleted successfully");
});

// Getter for all users...
// app.get('/users', (req, res) => {
//     res.json(database.getUsers());
// })


let serverInstance = null;

module.exports = {
    start: function(){
      serverInstance = app.listen(port, () => {
        console.log(`Example app listening at http://localhost:${port}`)
      })
  
    },
    close: function(){
      serverInstance.close();
    }
  }

module.exports.start();
