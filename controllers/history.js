'use strict';

var co_body = require('co-body');
var models = require('../models');
var ExpressItem = models.ExpressItem;
var moment = require('moment');
var request = require('request');
var querystring = require('querystring');
var thunkify = require('thunkify');
var get = thunkify(request.get);

exports.index = function *index() {
    yield this.render('history/index', {title: '查看快递列表', defaultDate: moment(new Date()).format('YYYY-MM-DD')});
};

exports.list = function *list() {

    var ctx = this;
    var body = yield co_body.json(ctx);

    var page = parseInt(body.page);
    var size = parseInt(body.size);
    var deliveryDate = body.deliveryDate;
    var sender = body.sender;
    var recipient = body.recipient;
    var searchParam = {};

    var count;
    var expressItems;

    if(deliveryDate) {
        searchParam.deliveryDate = deliveryDate;
    }
    if(sender){
        searchParam['subItems.sender'] = sender;
    }
    if(recipient){
        searchParam['subItems.recipient'] = recipient;
    }

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

    yield ctx.render('history/list', {
        expressItems: expressItems,
        count: count,
        page: page,
        size: size
    });
};

exports.progress = function *progress() {

    var ctx = this;
    var body = yield co_body.json(ctx);

    var company = body.company;
    var number = body.number;

    var data = yield get({
        url: 'http://www.kuaidi100.com/query?' + querystring.stringify({
             type: company,
             postid: number,
             id: 5,
             valicode: '',
             temp: Math.random(),
             sessionid: '',
             tmp: Math.random()
         })
    });

    try {
        yield ctx.render('history/tips', JSON.parse(data[1].replace(/'/g, '"')));
    } catch(e){
        ctx.body = '<p>Parse Error</p>';
    }
};
