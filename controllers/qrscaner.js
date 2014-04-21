'use strict';

exports.index = function *index() {
    yield this.render('qrscaner/index', {title: '扫描二维码'});
};
