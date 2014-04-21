'use strict';

exports.index = function *index() {
    yield this.render('vcard/index', {title: '制作二维码电子名片'});
};
