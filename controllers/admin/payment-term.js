'use strict';

var co_body = require('co-body');
var thunkify = require('thunkify');

var models = require('../../models');
var PaymentTerm = models.PaymentTerm;
var commonData = require('../../common-data');

exports.index = function *index() {
    yield this.render('admin/payment-term/index', { title: '管理付款方式'});
};

exports.list = function *list() {

    var ctx = this;
    var body = yield co_body.json(ctx);

    var page = parseInt(body.page, 10);
    var size = parseInt(body.size, 10);
    var count;
    var paymentTerms;

    try {
        count = yield thunkify(function (cb) {
            PaymentTerm.count({}, cb);
        });

        if (count === 0) {
            paymentTerms = [];
        } else {
            paymentTerms = yield thunkify(function (cb) {
                PaymentTerm.find({}, null, { skip: (page - 1) * size, limit: size }, cb);
            });
        }
        yield ctx.render('admin/payment-term/list', {
            paymentTerms: paymentTerms,
            count: count,
            page: page,
            size: size
        });
    } catch (e) {
        ctx.status = 500;
        ctx.body = e;
    }
};

exports.view = function *view() {

    var ctx = this;
    var body = yield co_body.json(ctx);

    var id = body.id;
    var paymentTerm;

    if (id) {
        paymentTerm = yield thunkify(function (cb) {
            PaymentTerm.findById(id, cb);
        });
        yield ctx.render('admin/payment-term/edit', paymentTerm);
    }
    else {
        yield ctx.render('admin/payment-term/edit', {
            _id: '',
            name: ''
        });
    }
};

exports.remove = function *remove() {

    var ctx = this;
    var body = yield co_body.json(ctx);

    var id = body.id;
    var paymentTerm;
    try {
        paymentTerm = yield thunkify(function (cb) {
            PaymentTerm.findByIdAndRemove(id, cb);
        });
        ctx.body = paymentTerm;
        commonData.init();
    } catch (e) {
        ctx.status = 500;
        ctx.body = e;
    }
};

exports.save = function *save() {

    var ctx = this;
    var body = yield co_body.json(ctx);

    var id = body.id;
    var name = body.name;
    var paymentTerm;

    try {
        paymentTerm = yield thunkify(function (cb) {
            PaymentTerm.findOne({ name: name }, cb);
        });

        if (paymentTerm && (!id || id !== paymentTerm._id.toString())) {
            ctx.status = 500;
            ctx.body = '付款方式名称冲突。';
            return;
        }
        if (id) {
            paymentTerm = yield thunkify(function (cb) {
                PaymentTerm.findByIdAndUpdate(id, {name: name}, cb);
            });
        } else {
            paymentTerm = new PaymentTerm();
            paymentTerm.name = name;

            paymentTerm = yield thunkify(function (cb) {
                    paymentTerm.save(cb);
            });
        }

        ctx.body = paymentTerm;
        commonData.init();

    } catch (e) {
        ctx.status = 500;
        ctx.body = e;
    }
};
