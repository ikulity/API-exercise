const express = require('express');
const app = express();
const port = 3000;
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


app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hello World!');
});

passport.use(new BasicStrategy(
    (username, password, done) => {
        console.log('Basic Strategy params, username ' + username + " , password " + password);

        let isValid = false;
        const user = database.getUserByName(username)
        if(bcrypt.compareSync(password, user.password))
            isValid = true;

        if(isValid) {
            done(null, user);
        } else {
            done(null, false);
        }
    }
));

app.get('/posts', (req, res) => {
    //hakee postit databaseta tietyillä hakukriteereillä ja
    //jos ei anna kaikkia kriteereitä etsitään default kriteereillä 
    //ja jos ei anna kriteereitä olenkaan niin palautetaan kaikki

    const criterias = {
        category: req.query.category,
        location: req.query.location,
        ownerId: req.query.ownerId,
        sortByDate: req.query.sortByDate,
    }
    let posts = database.getPostByCriteria(criterias);

    if (req.query.sortByDate == "true") {
        res.json(database.sortPostsByDate(posts));
    } else {
        res.json(posts);
    }
})

app.post('/signup', (req, res) => {
    //rekisteröitymisessö tarkastatetaan onko jo olemassa kyseisellä
    //nimellä ja jos ei ole niin palautetaan avain
    console.log('originaali salasana ' + req.body.password);
    const salt = bcrypt.genSaltSync(6);
    console.log('suola ' + salt);
    const hashedPassword = bcrypt.hashSync(req.body.password, salt)
    console.log('hashattu salasana');
    console.log(hashedPassword);

    const newUser = { 
        username: req.body.username,
        password: hashedPassword
    }
    database.addUser(newUser);
    res.sendStatus(201);
})

passport.use(new JwtStrategy(options, (payload, done) => {
    //tarkistus onko käyttäjä olemassa
    console.log("JWT PAYLOAD: " + JSON.stringify(payload))
    const user = database.getUserByName(payload.username);
    if (user)
        done(null, user);
    else
        done(null, false);
}));

app.post('/user/login', passport.authenticate('basic', {session: false}), (req, res) => {
    //otetaan vastaan annetut kirjautumis tiedot ja jos ne vastaavat
    //tietokannassa olevia niin annetaan authorisaatio tehdä tiettyjä toimintoja
    //aka palauteteaan avain
    console.log("User payload: " + JSON.stringify(req.user))
    const token = jwt.sign(req.user, secrets.jwtSignKey);
    res.json({ token: token})
})

app.post('/post', passport.authenticate('jwt', {session: false}), (req, res) => {
    // tekee posti post database listaan jossa käyttäjän pitää täyttää
    //tarvittavat tiedotc
    const username = req.user.username;
    console.log("Username from payload: " + username);

    const newPost = {
        ownerId: req.user.id,
        title: req.body.title,
        description: req.body.description,
        category: req.body.category,
        location: req.body.location,
        images: req.body.images,
        price: req.body.price,
        date: req.body.date,
        deliveryType: req.body.deliveryType,
        contactInfo: req.body.contactInfo,
    }
    database.addPost(newPost);
    res.sendStatus(201)
})

app.patch('/posts/:postId', passport.authenticate('jwt', {session: false}), (req, res) => {
    const post = database.getPostById(req.params.postId)
    console.log("Params postID: " + req.params.postId + " - post: " + JSON.stringify(post))
    if (post.ownerId == req.user.id) {
        let updatedProps = {
            title: "uusi title jee",
            description: "uusi description",
        }
        database.updatePostById(post.id, updatedProps)
        res.status(200).send("Post updated successfully");
    } else {
        res.sendStatus(401);
    }
});

app.delete('/posts/:postId', passport.authenticate('jwt', {session: false}), (req, res) => {
    // get post by id and then check if owner matches
    const post = database.getPostById(req.params.postId)
    if (post.ownerId == req.user.id) {
        database.deletePostById(post.id);
        res.status(200).send("Post deleted successfully");
    } else {
        res.sendStatus(401);
    }
});


app.listen(port, () => {
    console.log(`App running at http://localhost:${port}`)
});