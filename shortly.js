//server view
// now contains request for Shmodel 

var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var session = require('express-session');


var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));
app.use(session({
  secret: 'secret code',
  resave: false,
  saveUninitialized: true
}));

app.get('/', util.sessionExist,
function(req, res) {
  // var loggedIn = util.isLoggedIn(req);
  // if (loggedIn) {
  res.render('index');
  // } else {
  //   res.redirect('/login');
  // }
});

app.get('/create', util.sessionExist,
function(req, res) {
  res.render('index');
});

app.get('/links', util.sessionExist,
function(req, res) {
  Links.reset().fetch().then(function(links) {
    res.status(200).send(links.models);
  });
});

app.get('/login',
  function(req, res) {
    res.render('login');
  });

app.get('/signup',
  function(req, res) {
    res.render('signup');
  });

app.get('/logout', function(req, res) {
  console.log('logout');
  req.session.destroy(function() {
    res.redirect('/');
  });

});
// post request for shmodel from user
//sends our new model/link back to user 

app.post('/links', 
function(req, res) {
  // req.body = shmodel
  console.log('SHOULD be here'); 
  var uri = req.body.url;

// checks to see if valid url 
  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.sendStatus(404);
  }

// if it is valid url, 
// creates new instance of model Link 
// asigns url of our shmodel 
  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.status(200).send(found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.sendStatus(404);
        }

        Links.create({
          url: uri,
          title: title,
          baseUrl: req.headers.origin
        })
        .then(function(newLink) {
          res.status(200).send(newLink);
        });
      });
    }
  });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/
// for signup, we are not in the database or collection of users 
//need to check if password is already in database 
app.post('/signup', function(req, res) {
  var username = req.body.username;
  var password = req.body.password;
  // not creating a new user, because no name associated with it 

  new User({username: username}).fetch().then(function(user) {
    if (!user) {
      // created new user model 
      var newUser = new User({username: username, password: password});
      // use .save bookshelf method to add new user to database
      // have not put it into collection 
      newUser.save().then(function(model) {
        util.createSession(req, res, model);
          // create new session
        // req.session.regenerate(function() {
        //   req.session.user = username;
        //   res.redirect('/');
        // create new session
      });
    } else {
      res.redirect('/signup');
        //});
    }
  });
});



// app.post('', function(req, res) {
//   console.log('Its a POST!');
//   res.status(200);
//   //res.render('/login');
//   res.redirect('/login');  
// });
// app.get('', function(req, res) {
//   console.log('Its a GET!');
//   res.status(200);
//   //res.render('/login');
//   res.redirect('/login');
// });

// for login, we are in database, but not in collection; need to add to collection 
// so we need to compare for what is posted to what is in the database 
app.post('/login', function(req, res) {

  var username = req.body.username;
  var password = req.body.password;
  console.log('Is it here?');

  // fetch is a function that links to database 
  // fethch fetches by searching for username and fetches entire row (username, password, rowId )
  // when fetching a yser, youre querying database 
  // fetch populates the collection by querying database 
  // fetch is being called on the model and queries/looks at databasen directly

  //fetch on model and collections are different 
  // nothign to do with collection 

  new User({ username: username }).fetch().then(function(user) {
    if (!user) {
      res.redirect('/login');
    } else {
      //console.log('Sadface');
      user.comparePassword(password, function(pass) {
        if (pass) {
          util.createSession(req, res, username);
        } else {
          res.redirect('/login');
        }
        //if (pass) {
        //console.log('We are HERE!');
        // req.session.regenerate(function() {
        //   req.session.user = username;
        //   // need redirect function so that we are not stuck on login page
        //   //last function on this page redirects to requested site (look at tests)
        //   res.redirect('/');
        // });
        //}
      });
    }
  });
});


    //       Links.create({
    //         url: uri,
    //         title: title,
    //         baseUrl: req.headers.origin
    //       })
    //       .then(function(newLink) {
    //         res.status(200).send(newLink);
    //       }
    //       });
    //     });
    //   }
    // });
/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        linkId: link.get('id')
      });

      click.save().then(function() {
        link.set('visits', link.get('visits') + 1);
        link.save().then(function() {
          return res.redirect(link.get('url'));
        });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);