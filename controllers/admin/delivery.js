'use strict';

var models = require('../../models');
var ExpressSubItem = models.ExpressSubItem;
var ExpressItem = models.ExpressItem;
var mongoose = require('mongoose');
var moment = require('moment');
var commonData = require('../../common-data');
var co_body = require('co-body');
var thunkify = require('thunkify');

exports.index = function *index() {
    yield this.render('admin/delivery/index', {title: '管理快递申请'});
};

exports.list = function *list() {

    var ctx = this;
    var body = yield co_body.json(ctx);

    var page = parseInt(body.page);
    var size = parseInt(body.size);
    var deliveryDate = body.deliveryDate;
    var expressCompany = body.expressCompany;
    var paymentTerm = body.paymentTerm;
    var searchParam = {};
    var count;
    var expressItems;

    if(deliveryDate) {
        searchParam.deliveryDate = deliveryDate;
    }
    if(expressCompany){
        searchParam.expressCompany = expressCompany;
    }
    if(paymentTerm){
        searchParam.paymentTerm = paymentTerm;
    }
    
    try {
        count = yield thunkify(function (cb) {
            ExpressItem.count(searchParam, cb);
        });

        if (count > 0) {
            expressItems = yield thunkify(function (cb) {
                ExpressItem.find(searchParam, null, { skip: (page - 1) * size, limit: size }, cb);
            });
        } else {
            expressItems = [];
        }
        ctx.body = {
            expressItems: expressItems,
            count: count,
            page: page,
            size: size
        };
    } catch (e) {
        ctx.status = 500;
        ctx.body = e;
    }
};

exports.view = function *view() {

    var ctx = this;
    var body = yield co_body.json(ctx);

    var _id = mongoose.Types.ObjectId(body._id);

    try {
        this.body = yield thunkify(function (cb) {
            ExpressItem.findById(_id, cb);
        });
    } catch (e) {
        this.body = e;
    }
};

exports.update = function *update() {

    var ctx = this;
    var modifiedExpressItem = yield co_body.json(ctx);

    var id = modifiedExpressItem._id;
    delete modifiedExpressItem._id;

    try {
        this.body = yield thunkify(function (cb) {
            ExpressItem.findByIdAndUpdate(id, modifiedExpressItem, cb);
        });
    } catch (e) {
        this.body = e;
    }
};

exports.remove = function *remove() {

    var ctx = this;
    var body = yield co_body.json(ctx);

    var _id = mongoose.Types.ObjectId(body._id);

    try {
        ctx.body = yield thunkify(function (cb) {
            ExpressItem.findByIdAndRemove(_id, cb);
        });
    } catch (e) {
        ctx.body = e;
    }

};

exports.addSubItem = function *addSubItem() {

    var ctx = this;
    var body = yield co_body.json(ctx);

    var _id = mongoose.Types.ObjectId(body.id);
    var expressItem;
    var expressSubItem = new ExpressSubItem();


    expressSubItem.department = body.department;
    expressSubItem.sender = body.sender;
    expressSubItem.senderPhone = body.senderPhone;
    expressSubItem.recipient = body.recipient;
    expressSubItem.recipientPhone = body.recipientPhone;
    //expressSubItem.recipientAddress = body.recipientAddress;
    expressSubItem.fileType = body.fileType;
    expressSubItem.deliveryReason = body.deliveryReason;
    expressSubItem.dateOfApplication = moment(new Date()).format('YYYY-MM-DD');

    try {
        expressItem = yield thunkify(function (cb) {
            ExpressItem.findOne({ _id: _id }, cb);
        });
        expressSubItem.recipientAddress = expressItem.subItems[0].recipientAddress;
        expressItem.subItems.push(expressSubItem);

        yield thunkify(function (cb) {
            expressItem.save(cb);
        });
        ctx.body = expressItem.subItems[expressItem.subItems.length - 1];
    } catch (e) {
        ctx.body = e;
    }
};

exports.removeSubItem = function *removeSubItem() {

    var ctx = this;
    var body = yield co_body.json(ctx);

    var _id = mongoose.Types.ObjectId(body.id);
    var _sub_id = body.sub_id;

    var expressItem;
    var subItems;
    var length;
    var i;

    try {
        expressItem = yield thunkify(function (cb) {
            ExpressItem.findOne({ _id: _id }, cb);
        });

        subItems = expressItem.subItems;
        length = subItems.length;

        for (i = 0; i < length; i += 1) {
            if (subItems[i]._id.toString() === _sub_id) {
                subItems.splice(i, 1);
                break;
            }
        }

        yield thunkify(function (cb) {
            expressItem.save(cb);
        });

        ctx.body = expressItem;
    } catch (e) {
        ctx.body = e;
    }
};


exports.print = function *print() {

    var ctx = this;
    var body = yield co_body.form(ctx);

    var deliveryDate = body.deliveryDate;
    var expressCompany = body.expressCompany;
    var paymentTerm = body.paymentTerm;
    var searchParam = {};
    var expressItems;

    if(deliveryDate) {
        searchParam.deliveryDate = deliveryDate;
    }
    if(expressCompany){
        searchParam.expressCompany = expressCompany;
    }
    if(paymentTerm){
        searchParam.paymentTerm = paymentTerm;
    }

    try {
        expressItems = yield thunkify(function (cb) {
            ExpressItem.find(searchParam, cb);
        });

        yield ctx.render('admin/delivery/print', { expressItems: expressItems });
    } catch (e) {
        yield ctx.render('admin/error', { err: e });
    }
};

exports.lock = function *lock() {
    commonData.lock();
    this.body = {};
};

exports.unlock = function *unlock() {
    commonData.unlock();
    this.body = {};
};
