var moment = require('moment');
var commonData = require('../common-data');

function autoUnlock() {
    var today = moment(new Date());
    var tomorrow = moment([today.year(), today.month(), today.date() + 1]);
    var time_diff = tomorrow.diff(today, 'seconds');
    commonData.unlock();
    setTimeout(autoUnlock, time_diff * 1000);
}

function autoLock() {
    var today = moment(new Date());
    var time18 = moment([today.year(), today.month(), today.date(), 18]);
    var time_diff = time18.diff(today, 'minutes');
    if (time_diff <= 0) {
        commonData.lock();
        setTimeout(autoLock, moment([today.year(), today.month(), today.date() + 1, 18]).diff(today, 'minutes') * 60 * 1000);
    } else {
        setTimeout(autoLock, time_diff * 60 * 1000);
    }
}

exports.autoLock = autoLock;
exports.autoUnlock = autoUnlock;