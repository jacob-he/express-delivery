'use strict';

/*
 * GET users listing.
 */

exports.login = function *login() {
    yield this.render('user/login', {title: '登陆'});
};

exports.logout = function *logout() {

    this.req.logout();
    this.redirect('/');
};
