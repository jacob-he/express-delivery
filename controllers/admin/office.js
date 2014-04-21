'use strict';

var models = require('../../models');
var Office = models.Office;
var commonData = require('../../common-data');
var co_body = require('co-body');
var thunkify = require('thunkify');

exports.index = function *index() {

    yield this.render('admin/office/index', {title: '管理办事处'});
};

exports.list = function *list() {

    var ctx = this;
    var body = yield co_body.json(ctx);

    var page = parseInt(body.page);
    var size = parseInt(body.size);

    var count;
    var offices;

    try {
        count = yield thunkify(function (cb) {
            Office.count({}, cb);
        });

        if (count > 0) {
            offices = yield thunkify(function (cb) {
                Office.find({}, null, { skip: (page - 1) * size, limit: size }, cb);
            });
        } else {
            offices = [];
        }
        yield ctx.render('admin/office/list', {
                offices: offices,
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
    var office;
    var id = body.id;

    if (id) {
        try {
            office = yield thunkify(function (cb) {
                Office.findById(id, cb);
            });
            yield ctx.render('admin/office/edit', office);
        } catch (e) {
            ctx.status = 500;
            ctx.body = e;
        }
    } else {
        yield ctx.render('admin/office/edit', {
            _id: '',
            area: '',
            name: '',
            address: ''
        });
    }
};

exports.remove = function *remove() {

    var ctx = this;
    var body = yield co_body.json(ctx);
    var office;
    var id = body.id;

    try {
        office = yield thunkify(function (cb) {
            Office.findByIdAndRemove(id, cb);
        });

        ctx.body = office;
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
    var area = body.area;
    var address = body.address;

    var office;

    try {
        office = yield thunkify(function (cb) {
            Office.findOne({ name: name }, cb);
        });

        if (office && (!id || id !== office._id.toString())) {
            ctx.status = 500;
            ctx.body = '办事处冲突。';
            return;
        }
        if (id) {
            office = yield thunkify(function (cb) {
            Office.findByIdAndUpdate(id, {area: area, name: name, address: address}, cb);
            });
            ctx.body = office;
            commonData.init();
        } else {
            office = new Office();
            office.name = name;
            office.area = area;
            office.address = address;

            office = yield thunkify(function (cb) {
                office.save(cb);
            });
            ctx.body = office;
            commonData.init();
        }
    } catch (e) {
        ctx.status = 500;
        ctx.body = e;
    }
};
