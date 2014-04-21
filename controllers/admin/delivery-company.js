'use strict';

var co_body = require('co-body');
var thunkify = require('thunkify');

var models = require('../../models');
var ExpressCompany = models.ExpressCompany;
var mongoose = require('mongoose');
var commonData = require('../../common-data');

exports.index = function *index() {
    yield this.render('admin/delivery-company/index', {title: '管理快递公司'});
};

exports.list = function *list() {

    var ctx = this;
    var body = yield co_body.json(ctx);

    var page = parseInt(body.page, 10);
    var size = parseInt(body.size, 10);
    var count;
    var companies;

    count = yield thunkify(function (cb) {
        ExpressCompany.count({}, cb);
    });
    if (count >= 0) {
        companies = yield thunkify(function (cb) {
            ExpressCompany.find({}, null, { skip: (page - 1) * size, limit: size }, cb);
        });

        yield ctx.render('admin/delivery-company/list', {
            expressCompanies: companies,
            count: count,
            page: page,
            size: size
        });
    }
};

exports.view = function *view() {

    var ctx = this;
    var body = yield co_body.json(ctx);

    var id = body.id;
    var company;

    if (id) {
        company = yield thunkify(function (cb) {
            ExpressCompany.findById(mongoose.Types.ObjectId(id), cb);
        });
        yield ctx.render('admin/delivery-company/edit', company);
    }
    else {
        yield ctx.render('admin/delivery-company/edit', {
            _id: '',
            name: '',
            code: ''
        });
    }
};

exports.remove = function *remove() {

    var ctx = this;
    var body = yield co_body.json(ctx);

    var id = mongoose.Types.ObjectId(body.id);
    var company;

    try {
        company = yield thunkify(function (cb) {
            ExpressCompany.findByIdAndRemove(id, cb);
        });
        ctx.body = company;
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
    var code = body.code;
    var company;

    try {
        company = yield thunkify(function (cb) {
            ExpressCompany.findOne({ name: name }, cb);
        });

        if (company && (!id || id !== company._id.toString())) {
            ctx.status = 500;
            ctx.body = '快递公司名称冲突。';
            return;
        }
        if (id) {
            company = yield thunkify(function (cb) {
                ExpressCompany.findByIdAndUpdate(id, {name: name, code: code}, cb);
            });
        } else {
            company = new ExpressCompany();
            company.name = name;
            company.code = code;
            company = yield thunkify(function (cb) {
                company.save(cb);
            });
        }
        ctx.body = company;
        commonData.init();
    } catch (e) {
        ctx.status = 500;
        ctx.body = e;
    }
};
