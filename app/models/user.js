var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');



var User = db.Model.extend({
  tableName: 'users',
  initialize: function() {
    this.on('creating', function(model, attrs, options) {
      // did not like callback within hash function 
      //console.log(model);
      // var hash = bcrypt.hash(model.get('password'), 10, function(err, hash) {
      //   if (err) {
      //     console.log('Err ', err);
      //   }
      //   model.set({'password': hash});
    });
    //});
  }, 

  comparePassword: function(password, callback) {
    if (password === this.get('password')) {
      callback(true);
      // console.log('comparePassword problems?');
      // console.log('password: ', password);
      // console.log('actualPassword: ', this.get('password'));
    } else {
      callback(false);
    }
    // bcrypt.compare(password, this.get('password'), (res) => {
    //   callback(res);
    // });
  }
});

module.exports = User;