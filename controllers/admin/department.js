'use strict';

var co_body = require('co-body');
var thunkify = require('thunkify');

var nodeuuid = require('node-uuid');
var models = require('../../models');
var Department = models.Department;
var commonData = require('../../common-data');

exports.index = function *index() {
    yield this.render('admin/department/index', {title: '管理部门'});
};

exports.list = function *list() {

    var ctx = this;
    var body = yield co_body.json(ctx);

    var page = parseInt(body.page, 10);
    var size = parseInt(body.size, 10);
    var count;
    var departments;

    try {
        count = yield thunkify(function (cb) {
            Department.count({}, cb);
        });
        if (count > 0) {
            departments = yield thunkify(function (cb) {
                Department.find({}, null, { skip: (page - 1) * size, limit: size }, cb);
            });
        } else {
            departments = [];
        }
        yield ctx.render('admin/department/list', {
            departments: departments,
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
    var department;

    if (id) {
        try {
            department = yield thunkify(function (cb) {
                Department.findById(id, cb);
            });
            yield ctx.render('admin/department/edit', department);
        } catch (e) {
            ctx.status = 500;
            ctx.body = e;
        }
    } else {
        yield ctx.render('admin/department/edit', {
            _id: '',
            name: ''
        });
    }
};

exports.remove = function *remove() {

    var ctx = this;
    var body = yield co_body.json(ctx);

    var id = body.id;
    var department;
    
    try {
        department = yield thunkify(function (cb) {
            Department.findByIdAndRemove(id, cb);
        });
        ctx.body = department;
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
    var lastUpdateTime = (new Date()).getTime();
    var level = 0;
    var uuid = nodeuuid.v4();
    var department;

    try {
        department = yield thunkify(function (cb) {
            Department.findOne({ name: name }, cb);
        });

        if (department && (!id || id !== department._id.toString())) {
            ctx.status = 500;
            ctx.body = '部门冲突。';
            return;
        }
        if (id) {
            department = yield thunkify(function (cb) {
                Department.findByIdAndUpdate(id, {name: name, lastUpdateTime: lastUpdateTime}, cb);
            });
        } else {
            department = new Department();
            department.name = name;
            department.lastUpdateTime = lastUpdateTime;
            department.level = level;
            department.uuid = uuid;

            department = yield thunkify(function (cb) {
                department.save(cb);
            });
        }
        ctx.body = department;
        commonData.init();

    } catch (e) {
        ctx.status = 500;
        ctx.body = e;
    }
};
