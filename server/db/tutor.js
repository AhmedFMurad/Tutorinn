const mongoose = require('mongoose');
const _ = require('lodash');
const validate = require('validator');
const bcrypt = require('bcryptjs');
const webtoken = require('jsonwebtoken');
const secret = 'KJFSISFJHKKSJFSFKJHjkhsdjkhfskj';
var Schema = new mongoose.Schema({
    email: {
        type: String,
        unique: true,
    },
    password: String,
    auth: String,
    minutes: {
        type: Number,
        default: 0
    },
    testPassed: {
        type: Boolean,
        default: false
    }
});

Schema.methods.generateAuth = function(){
    var auth = webtoken.sign({_id: this._id.toHexString(), auth: 'auth'}, secret).toString();

    this.auth = auth;

    this.save().then(() => {
        return auth;
    });
}

Schema.methods.logoutAuth = function(){
    return this.update({
        $pull: auth
    });
}

Schema.pre('save', () => {
    if(this.isModified('password')){
        bcrypt.genSalt(27, (error, salt) => {
            bcrypt.hash(this.password, salt, (error, hash) => {
                this.password = hash;
                next()
            });
        });
    }
    next();
});

Schema.statics.login = function(email, password){
    return this.findOne({email}).then((stu) => {
        if(stu == undefined){
            return false;
        }

        bcrypt.compare(password, this.password, (error, response) => {
            if(response){
                return this;
            } else {
                return false;
            }
        });
    });
}

var Tutor = mongoose.model('Tutor', Schema);
module.exports = Tutor;