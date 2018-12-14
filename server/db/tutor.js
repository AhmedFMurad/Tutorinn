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
    minutes: {
        type: Number,
        default: 0
    }
});

Schema.methods.generateAuth = function () {
    var auth = webtoken.sign({
        _id: this._id.toHexString(),
        auth: 'auth'
    }, secret).toString();

    this.auth = auth;

    return this.save().then(() => {
        return auth;
    });
}

Schema.methods.logoutAuth = function () {
    return this.update({
        $pull: auth
    });
}

Schema.methods.jsonify = function () {
    return JSON.stringify(this);
}

Schema.statics.login = function (email, password) {
    return this.findOne({
        email
    }).then((tutor) => {
        if (!tutor) {
            return Promise.reject();
        }

        return new Promise((resolve, reject) => {
            bcrypt.compare(password, tutor.password, (error, response) => {
                if (response) {
                    resolve(tutor);
                } else {
                    reject();
                }
            });
        });
    });
}

Schema.statics.getAll = function() {
    return this.find({}).select('email').then((tutors) => {
        if(!tutors){
            return false;
        } else {
            return Promise.resolve(tutors);
        }
    });
}
Schema.pre('save', function (next) {
    if (this.isModified('password')) {
        bcrypt.genSalt(7, (error, salt) => {
            bcrypt.hash(this.password, salt, (error, hash) => {
                this.password = hash;
                next();
            });
        });
    } else {
        next();
    }

});

var Tutor = mongoose.model('Tutor', Schema);
module.exports = {
    Tutor
};