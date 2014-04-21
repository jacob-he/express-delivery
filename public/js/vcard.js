/*global Utf8, ejs, jQuery*/

(function($){

    'use strict';

    var vcardTmpl;

    function generateQrcode() {

        var firstName = $('#inputFirstName').val();
        var lastName = $('#inputLastName').val();
        var companyName = $('#inputCompanyName').val();
        var title = $('#inputTitle').val();
        var phone = $('#inputPhone').val();
        var address = $('#inputAddress').val();
        var email = $('#inputEmail').val();

        $('#qrcode').empty().qrcode({
            text: Utf8.encode(ejs.render($.trim(vcardTmpl), {
                firstName: $.trim(firstName),
                lastName: $.trim(lastName),
                companyName: $.trim(companyName),
                title: $.trim(title),
                phone: $.trim(phone),
                address: $.trim(address),
                email: $.trim(email),
                open: '{{',
                close: '}}'
            }).replace(/ +(?:\r)?\n/g, '\n').replace(/\n+/g, '\n'))
        });
        $('.btn-primary').button('reset');
    }
    
    $(function(){
        $('.form-horizontal').validate({
            errorPlacement: function (error, element) {
                error.appendTo(element.next("span.help-inline"));
                element.parents('.control-group').addClass('error');
            },
            success: function (label) {
                label.parents('.control-group').removeClass('error');
                label.remove();
            },
            submitHandler: function () {
                $('.btn-primary').button('loading');
                generateQrcode();
            }
        });
        vcardTmpl = $.trim($('#vcard-tmpl').html());
    });
})(jQuery);
