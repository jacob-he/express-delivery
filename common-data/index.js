/// <reference path="../node_modules/async/lib/async.js" />
var models = require('../models');
var ExpressCompany = models.ExpressCompany;
var PaymentTerm = models.PaymentTerm;
var Department = models.Department;
var Office = models.Office;
var events = require('events');
var async = require('async');
var moment = require('moment');
var timeline = require('../timeline');

function CommonData() {
    this._lock = false;
    events.EventEmitter.call(this);
}

// inherit events.EventEmitter
CommonData.super_ = events.EventEmitter;
CommonData.prototype = Object.create(events.EventEmitter.prototype, {
    constructor: {
        value: CommonData
        , enumerable: false
    }
});

CommonData.prototype.init = function () {
    var self = this;
    async.parallel({
        expressCompany: function (callback) {
            ExpressCompany.find({}, callback);
        }
        , paymentTerm: function (callback) {
            PaymentTerm.find({}, callback);
        }
        , department: function (callback) {
            Department.find({}, callback);
        }
        , offices: function (callback) {
            Office.find({}, callback);
        }
        , lock: function (callback) {
            callback(null, self._lock);
        }
    }
    , function (err, results) {
        if (err) {
            console.log('can\'t load common data');
            return;
        }
        self.emit('init', results);
    });
};

CommonData.prototype.lock = function () {
    timeline.setTimeLine(moment(new Date()).add({d:1}).format('YYYY-MM-DD'));
    this._lock = true;
    this.init();
};

CommonData.prototype.unlock = function () {
    timeline.setTimeLine(moment(new Date()).format('YYYY-MM-DD'));
    this._lock = false;
    this.init();
};

module.exports = new CommonData();
