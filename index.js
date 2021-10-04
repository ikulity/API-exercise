// Express
const express = require('express');
const app = express();
const port = 3000;
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

passport.use(new BasicStrategy(
    (username, password, done) => {
        const user = database.getUserByName(username)
        if(bcrypt.compareSync(password, user.password))
            done(null, user);
        else
            done(null, false);
    }
));

passport.use(new JwtStrategy(options, (payload, done) => {
    // Check if user exists
    if (database.getUserByName(payload.username))
        done(null, user);
    else
        done(null, false);
}));

// User Signup
app.post('/signup', (req, res) => {
    //rekisteröitymisessö tarkastatetaan onko jo olemassa kyseisellä
    //nimellä ja jos ei ole niin palautetaan avain
    if (database.getUserByName(req.body.username)) {
        res.status(409).send("User already exists");
        return;
    }
    console.log('originaali salasana ' + req.body.password);
    const salt = bcrypt.genSaltSync(6);
    const hashedPassword = bcrypt.hashSync(req.body.password, salt)

    const newUser = { 
        username: req.body.username,
        password: hashedPassword
    }
    database.addUser(newUser);
    res.sendStatus(201);
})

// User Login
app.post('/user/login', passport.authenticate('basic', {session: false}), (req, res) => {
    //otetaan vastaan annetut kirjautumis tiedot ja jos ne vastaavat
    //tietokannassa olevia niin annetaan authorisaatio tehdä tiettyjä toimintoja
    //aka palauteteaan avain
    console.log("User payload: " + JSON.stringify(req.user))
    const token = jwt.sign(req.user, secrets.jwtSignKey);
    res.json({ token: token})
})

// Create a new Post
app.post('/post', passport.authenticate('jwt', {session: false}), (req, res) => {
    const newPost = {
        ownerId: req.user.id,
        title: req.body.title,
        description: req.body.description,
        category: req.body.category,
        location: req.body.location,
        images: req.body.images,
        price: req.body.price,
        date: Date.now(),
        deliveryType: req.body.deliveryType,
        contactInfo: req.body.contactInfo,
    }
    database.addPost(newPost);
    res.sendStatus(201)
})

// Search Posts
app.get('/posts', (req, res) => {
    const criterias = {
        category: req.query.category,
        location: req.query.location,
        ownerId: req.query.ownerId,
        sortByDate: req.query.sortByDate,
    }
    let posts = database.getPostByCriteria(criterias);

    if (req.query.sortByDate == "true")
        res.json(database.sortPostsByDate(posts));
    else
        res.json(posts);
})

// Update a Post
app.patch('/posts/:postId', passport.authenticate('jwt', {session: false}), (req, res) => {
    const post = database.getPostById(req.params.postId)
    if (post.ownerId == req.user.id) {
        const updatedProps = req.body;
        database.updatePostById(post.id, updatedProps)
        res.status(200).send("Post updated successfully");
    } else
        res.sendStatus(401);
});

// Delete a Post
app.delete('/posts/:postId', passport.authenticate('jwt', {session: false}), (req, res) => {
    const post = database.getPostById(req.params.postId)
    if (post.ownerId == req.user.id) {
        database.deletePostById(post.id);
        res.status(200).send("Post deleted successfully");
    } else
        res.sendStatus(401);
});

// Getter for all users...
// app.get('/users', (req, res) => {
//     res.json(database.getUsers());
// })

app.listen(port, () => {
    console.log(`App running at http://localhost:${port}`)
});