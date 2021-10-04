const express = require('express');
const app = express();
const port = 3000;
const passport = require('passport');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const BasicStrategy = require('passport-http').BasicStrategy;

const database = require('./database.js')


app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hello World!');
});


let userDb = [];

passport.use(new BasicStrategy(
    (username, password, done) => {
        console.log('Basic Strategy params, username ' + username + " , password " + password);
        
        const searchResult = userDb.find(user => {
            if(user.username === username) {
                if(bcrypt.compareSync(password, user.password)) {
                    return true;
                }
            }
            return false;
        });
        console.log(searchResult)
        //((username === user.username) && (password === user.password))})
        if(searchResult != undefined) {
            done(null, searchResult);
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
        username: req.query.username,
        sortByDate: req.query.sortByDate,
    }
    console.log("criterias: " + JSON.stringify(criterias));
    let posts = database.getPostByCriteria(criterias);

    if (req.query.sortByDate == "true") {
        res.json(database.sortPostsByDate(posts));
    } else {
        res.json(posts);
    }
})

app.post('/user', (req, res) => {
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
        password: hashedPassword,
        id: uuidv4()
    }
    userDb.push(newUser);
    res.sendStatus(201);
})

const jwt = require('jsonwebtoken');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const secrets = require('./secrets.json');

const options = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: secrets.jwtSignKey
};

passport.use(new JwtStrategy(options, (payload, done) => {
    //tarkistus onko käyttäjä olemassa 
    //(aka pystyykö esim poistamisen yhteydessä tämä käyttäjä tekemään poiston (onko omistaja))
    done(null, {});

}));

app.post('/user/login', passport.authenticate('basic', {session: false}), (req, res) => {
    //otetaan vastaan annetut kirjautumis tiedot ja jos ne vastaavat
    //tietokannassa olevia niin annetaan authorisaatio tehdä tiettyjä toimintoja
    //aka palauteteaan avain 
    const token = jwt.sign({foo: "bar"}, secrets.jwtSignKey);
    res.json({ token: token})
})

app.post('/post', (req, res) => {
    // tekee posti post database listaan jossa käyttäjän pitää täyttää
    //tarvittavat tiedot
})

app.listen(port, () => {
    console.log(`App running at http://localhost:${port}`)
});