var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

mongoose.connect('mongodb://localhost/gmoa');

var ExpressSubItemSchema = new Schema({
    department: String
    , sender: String
    , senderPhone: String
    , recipient: String
    , recipientPhone: String
    , recipientAddress: String
    , fileType: String
    , deliveryReason: String
    , dateOfApplication: String
});

var ExpressItemSchema = new Schema({
    destination: String
    , expressCompany: String
    , expressNumber: String
    , paymentTerm: String
    , dateOfApplication: String
    , deliveryDate: String
    , subItems: [ExpressSubItemSchema]
});

var ExpressCompanySchema = new Schema({
    name: String
    , code: String
});

var PaymentTermSchema = new Schema({
    name: String
});

var OfficeSchema  = new Schema({
    area: String
    , name: String
    , address: String
});

var DepartmentSchema = new Schema({
    uuid: String
    , name: String
    , lastUpdateTime: Number
    , level: Number
});

var ExpressSubItem = mongoose.model('ExpressSubItem', ExpressSubItemSchema);
var ExpressItem = mongoose.model('ExpressItem', ExpressItemSchema);
var ExpressCompany = mongoose.model('ExpressCompany', ExpressCompanySchema);
var PaymentTerm = mongoose.model('PaymentTerm', PaymentTermSchema);
var Office = mongoose.model('Office', OfficeSchema);
var Department = mongoose.model('Department', DepartmentSchema);

exports.ExpressSubItem = ExpressSubItem;
exports.ExpressItem = ExpressItem;
exports.ExpressCompany = ExpressCompany;
exports.PaymentTerm = PaymentTerm;
exports.Office = Office;
exports.Department = Department;
