var moment = require('moment');
var timeline = moment(new Date()).format('YYYY-MM-DD');

exports.getTimeLine = function () {
    return timeline;
}

exports.setTimeLine = function (ptimeline) {
    timeline = ptimeline;
}