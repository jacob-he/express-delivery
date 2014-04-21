/*jslint node: true, vars: true, nomen: true*/

'use strict';

var delivery = require('./controllers/delivery');
var r_history = require('./controllers/history');
var vcard = require('./controllers/vcard');
var qrscaner = require('./controllers/qrscaner');
var user = require('./controllers/user');
var admin = require('./controllers/admin');
var admin_delivery = admin.delivery;
var admin_delivery_company = admin.delivery_company;
var admin_department = admin.department;
var admin_office = admin.office;
var admin_payment_term = admin.payment_term;
var compress = require('koa-compress');
var logger = require('koa-logger');
var serve = require('koa-static');
var router = require('koa-router');
var koa = require('koa');
var path = require('path');
var app = module.exports = koa();
var views = require('koa-views');
var url = require('url');
// sessions
var session = require('koa-sess');
var auth = require('./auth');
var formidable = require('koa-formidable');

app.keys = ['your-session-secret'];
app.use(session());

app.use(auth.initialize());
app.use(auth.session());

var commonData = require('./common-data');

var common_data = {
};

commonData.on('init', function (data) {
    common_data = data;
});

commonData.init();

// Logger
app.use(logger());

// Serve static files
app.use(serve(path.join(__dirname, 'public')));

app.use(views('./views', 'ejs', {}));

app.use(function *(next) {

    this.locals = {
        __authenticated: this.req.isAuthenticated(),
        __selected_uri: url.parse(this.url).pathname,
        _expressCompany: common_data.expressCompany,
        _paymentTerm: common_data.paymentTerm,
        _department: common_data.department,
        _offices: common_data.offices,
        _lock: common_data.lock
    };

    yield next;
});

app.use(router(app));

app.get('/', delivery.home);

app.post('/delivery/insert', delivery.insert);
app.post('/delivery/match', delivery.match);
app.post('/delivery/merge', delivery.merge);
app.get('/delivery/success', delivery.success);
app.get('/delivery/error', delivery.error);

app.get('/vcard', vcard.index);
app.get('/qrscaner', qrscaner.index);
app.get('/history', r_history.index);
app.post('/history/list', r_history.list);
app.post('/history/progress', r_history.progress);


app.get('/user/login', user.login);
app.post('/user/login', formidable(), auth.authenticate('local', { 
    failureRedirect: '/user/login',
    successRedirect: '/admin/delivery' 
}));

function *verify(next) {

    if (this.req.isAuthenticated()) {
        yield next;
    } else {
        if (this.get('x-requested-with') === 'XMLHttpRequest') {
            this.status = 500;
            this.body = '你已经退出登录';
        } else {
            this.redirect('/user/login');
        }
    }
}

app.get('/user/logout', user.logout);

app.get('/admin/delivery', verify, admin_delivery.index);
app.post('/admin/delivery/list', verify, admin_delivery.list);
app.post('/admin/delivery/update', verify, admin_delivery.update);
app.post('/admin/delivery/remove', verify, admin_delivery.remove);
app.post('/admin/delivery/view', verify, admin_delivery.view);
app.post('/admin/delivery/addSubItem', verify, admin_delivery.addSubItem);
app.post('/admin/delivery/removeSubItem', verify, admin_delivery.removeSubItem);
app.get('/admin/delivery/print', verify, admin_delivery.print);
app.post('/admin/delivery/lock', verify, admin_delivery.lock);
app.post('/admin/delivery/unlock', verify, admin_delivery.unlock);

app.get('/admin/delivery-company', verify, admin_delivery_company.index);
app.post('/admin/delivery-company/list', verify, admin_delivery_company.list);
app.post('/admin/delivery-company/view', verify, admin_delivery_company.view);
app.post('/admin/delivery-company/remove', verify, admin_delivery_company.remove);
app.post('/admin/delivery-company/save', verify, admin_delivery_company.save);

app.get('/admin/payment-term', verify, admin_payment_term.index);
app.post('/admin/payment-term/list', verify, admin_payment_term.list);
app.post('/admin/payment-term/view', verify, admin_payment_term.view);
app.post('/admin/payment-term/remove', verify, admin_payment_term.remove);
app.post('/admin/payment-term/save', verify, admin_payment_term.save);

app.get('/admin/office', verify, admin_office.index);
app.post('/admin/office/list', verify, admin_office.list);
app.post('/admin/office/view', verify, admin_office.view);
app.post('/admin/office/remove', verify, admin_office.remove);
app.post('/admin/office/save', verify, admin_office.save);

app.get('/admin/department', verify, admin_department.index);
app.post('/admin/department/list', verify, admin_department.list);
app.post('/admin/department/view', verify, admin_department.view);
app.post('/admin/department/remove', verify, admin_department.remove);
app.post('/admin/department/save', verify, admin_department.save);


// Compress
app.use(compress());

if (!module.parent) {
    app.listen(3000);
    console.log('listening on port 3000');
}
