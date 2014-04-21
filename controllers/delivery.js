/*jslint node: true, vars: true, nomen: true*/
'use strict';

var co_body = require('co-body');
var models = require('../models');
var ExpressSubItem = models.ExpressSubItem;
var ExpressItem = models.ExpressItem;
var mongoose = require('mongoose');
var moment = require('moment');
var timeline = require('../timeline');
var logger = require('../loggers').defaultlogger;
var _ = require('underscore.string');
var thunkify = require('thunkify');

var express_item_find = thunkify(function (query, cb) {

    ExpressItem.find(query, cb);
});

var express_item_findOne = thunkify(function (query, cb) {

    ExpressItem.findOne(query, cb);
});

exports.home = function *home() {
    yield this.render('delivery/index', {title: '快递申请系统'});
};

exports.insert = function *insert() {

    var ctx = this;
    var body = yield co_body.form(ctx);

    var expressSubItem = new ExpressSubItem();
    var expressItem = new ExpressItem();
    expressItem.destination = _.trim(body.destination);
    expressItem.expressCompany = _.trim(body.expressCompany);
    expressItem.expressNumber = _.trim(body.expressNumber);
    expressItem.paymentTerm = _.trim(body.paymentTerm);

    expressSubItem.department = _.trim(body.department);
    expressSubItem.sender = _.trim(body.sender);
    expressSubItem.senderPhone = _.trim(body.senderPhone);
    expressSubItem.recipient = _.trim(body.recipient);
    expressSubItem.recipientPhone = _.trim(body.recipientPhone);
    expressSubItem.recipientAddress = _.trim(body.recipientAddress);
    expressSubItem.fileType = _.trim(body.fileType);
    expressSubItem.deliveryReason = _.trim(body.deliveryReason);

    expressItem.subItems = [expressSubItem];

    expressItem.dateOfApplication = expressSubItem.dateOfApplication = moment(new Date()).format('YYYY-MM-DD');
    expressItem.deliveryDate = timeline.getTimeLine();

    logger.info('saving express request: ', body);

    try {
        yield thunkify(function (cb) {

            expressItem.save(cb);
        });

        ctx.redirect('/delivery/success');
        logger.info('save express success: ', body);
    } catch (e) {
        ctx.redirect('/delivery/error');
        logger.err('save express fail: ', body);
    }
};

exports.merge = function *merge() {
    
    var ctx = this;
    var body = yield co_body.form(ctx);
    var _id = mongoose.Types.ObjectId(body._id);
    var expressSubItem = new ExpressSubItem();
    expressSubItem.department = body.department;
    expressSubItem.sender = body.sender;
    expressSubItem.senderPhone = body.senderPhone;
    expressSubItem.recipient = body.recipient;
    expressSubItem.recipientPhone = body.recipientPhone;
    expressSubItem.recipientAddress = body.recipientAddress;
    expressSubItem.fileType = body.fileType;
    expressSubItem.deliveryReason = body.deliveryReason;
    expressSubItem.dateOfApplication = moment(new Date()).format('YYYY-MM-DD');

    logger.info('saving join: ', body);

    try {
        var expressItem = yield express_item_findOne({ _id: _id });

        expressItem.subItems.push(expressSubItem);

        yield thunkify(function (cb) {

            expressItem.save(cb);
        });

        ctx.redirect('/delivery/success');
        logger.info('save join success: ', body);
    } catch (e) {
        ctx.redirect('/delivery/error');
        logger.err('save join fail: ', body);
    }
};

exports.match = function *match() {

    var ctx = this;
    var body = yield co_body.form(ctx);
    var destination = body.destination;
    try {
        ctx.body = yield express_item_find({ destination: destination, deliveryDate: timeline.getTimeLine() });
    } catch (e) {
        ctx.status = 500;
        ctx.bocy = e;
    }
};

exports.error = function *error() {
    return yield this.render('delivery/error', {title: '快递申请出错'});
};

exports.success = function *success() {
    return yield this.render('delivery/success', {title: '快递申请成功'});
};
