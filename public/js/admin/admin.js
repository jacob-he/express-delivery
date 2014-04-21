/*global jQuery, ejs*/

(function ($) {

    'use strict';

    var list_tmpl;
    var sub_list_tmpl;
    var edit_dialog_tmpl;
    var sub_item_tmpl;
    var current_page = 1;
    var page_size = 20;
    var current_date = $.datepicker.formatDate('yy-mm-dd', new Date());
    var expressCompany = '';
    var paymentTerm = '';
    var xhr = null;

    $.ajaxSetup({
        type: 'POST',
        dataType: 'json',
        contentType: 'application/json',
        error: function (jqXHR) {
            $('#lock').button('reset');
            xhr = null;
            alert(jqXHR.responseText);
        }
    });

    function loadList(page, size) {
        $.ajax({
            url: '/admin/delivery/list',
            data: JSON.stringify({
                page: page,
                size: size,
                deliveryDate: current_date,
                expressCompany: expressCompany,
                paymentTerm: paymentTerm
            }),
            success: function (data) {
                current_page = page;

                if (!data) {
                    $('#list').html('<p>找不到相关记录。</p>');
                    return;
                }
                
                var list = $('#list');
                data.open = '{{';
                data.close = '}}';
                list.html(ejs.render(list_tmpl, data));
                // bind events
                $('.btn-primary', list).click(function () {
                    // show edit dialog
                    showEditDialog($(this).data('id'));
                });
                $('.btn-danger', list).click(function () {
                    // show confirm dialog
                    if (window.confirm('你确定要删除吗？')) {
                        // remove item
                        removeItem($(this).data('id'));
                    }
                });
                $('.pagination li:not([class])').click(function (e) {
                    e.preventDefault();
                    loadList($(this).data('page'), page_size);
                });
            }
        });
    }

    function showEditDialog(id) {
        $('#edit-dialog').dialog({
            width: 970,
            height: 400,
            minWidth: 800,
            minHeight: 200,
            title: '编辑快递申请',
            modal: true,
            buttons: [
                {
                    text: "保存",
                    id: 'save',
                    click: function () {
                        $(this).find('form.form-horizontal').submit();
                    }
                },
                {
                    text: "取消",
                    id: 'cancel',
                    click: function () {
                        $(this).dialog("close");
                    }
                }
            ],
            open: function () {
                var self = $(this);
                xhr = $.ajax({
                    url: '/admin/delivery/view',
                    data: JSON.stringify({
                        _id: id
                    }),
                    success: function (data) {
                        xhr = null;
                        function remove(e) {
                            if (window.confirm('注意：删除会马上生效！你确定要删除吗？')) {
                                var subItem = $(e.target);
                                removeSubItem(self.data('_id'), subItem.attr('id'), function () {
                                    subItem.parents('tr').remove();
                                    self.trigger('removeSubItem');
                                });
                            }
                        }
                        data.open = '{{';
                        data.close = '}}';
                        self.html(ejs.render(edit_dialog_tmpl, data));
                        self.data('_id', data._id);
                        // bind events
                        self.find('.btn-danger').click(remove);
                        self.find('#add_sub_item').click(function () {
                            addSubItem(self.data('_id'), function (subItem) {
                                subItem.open = '{{';
                                subItem.close = '}}';
                                self.find('tbody').append(ejs.render(sub_item_tmpl, subItem))
                                    .find('tr:last-child .btn-danger').click(remove);
                                self.trigger('addSubItem');
                            });
                        });
                        self.find('form.form-horizontal').validate({
                            errorPlacement: function (error, element) {
                                error.appendTo(element.next("span.help-inline"));
                                element.parents('.control-group').addClass('error');
                            },
                            success: function (label) {
                                label.parents('.control-group').removeClass('error');
                                label.remove();
                            },
                            submitHandler: function (form) {
                                var jform = $(form),
                                    data = {};
                                
                                jform.parent().find('#save').data('loading-text', '正在保存...').button('loading');
                                jform.find('[name]:enabled').each(function (i, el) {
                                    var name = $(el).attr('name'),
                                        val = $.trim($(el).val());
                                    if (name in data) {
                                        if (!$.isArray(data[name])) {
                                            data[name] = [data[name]];
                                        }
                                        data[name].push(val);
                                    } else {
                                        data[name] = val;
                                    }
                                });
                                
                                xhr = $.ajax({
                                    url: '/admin/delivery/update',
                                    data: JSON.stringify(data),
                                    success: function () {
                                        xhr = null;
                                        self.trigger('success');
                                        self.dialog("close");
                                    }
                                });
                            }
                        });
                    }
                });
            },
            close: function () {
                if (xhr) {
                    xhr.abort();
                    xhr = null;
                }
                $(this).html('').parent().find('#save').button('reset');
            }
        }).on('removeSubItem, addSubItem, success', function () {
            // reload list
            loadList(current_page, page_size);
        });
    }

    function removeSubItem(id, sub_id, callback) {
        $.ajax({
            url: '/admin/delivery/removeSubItem',
            data: JSON.stringify({
                id: id,
                sub_id: sub_id
            }),
            success: function () {
                if ($.isFunction(callback)) {
                    callback();
                }
            }
        });
    }

    function addSubItem(id, callback) {
        $('#add-sub-item').dialog({
            title: '搭单',
            modal: true,
            width: 600,
            height: 500,
            minWidth: 500,
            minHeight: 500,
            create: function () {
                $(this).validate({
                    errorPlacement: function (error, element) {
                        error.appendTo(element.next("span.help-inline"));
                        element.parents('.control-group').addClass('error');
                    },
                    success: function (label) {
                        label.parents('.control-group').removeClass('error');
                        label.remove();
                    },
                    rules: {
                        department: 'required',
                        sender: 'required',
                        senderPhone: 'required',
                        recipient: 'required',
                        recipientPhone: 'required',
                        recipientAddress: 'required',
                        fileType: 'required',
                        deliveryReason: 'required'
                    },
                    submitHandler: function (form) {
                        var self = $(form);
                        self.parent().find('#confirm').data('loading-text', '正在保存...').button('loading');
                        var department = $.trim(self.find('#selectDepartment').val());
                        var sender = $.trim(self.find('#inputSender').val());
                        var senderPhone = $.trim(self.find('#inputSenderPhone').val());
                        var recipient = $.trim(self.find('#inputRecipient').val());
                        var recipientPhone = $.trim(self.find('#inputRecipientPhone').val());
                        //var recipientAddress = $.trim(self.find('#inputRecipientAddress').val());
                        var fileType = $.trim(self.find('#inputFileType').val());
                        var deliveryReason = $.trim(self.find('#inputDeliveryReason').val());
                        $.ajax({
                            url: '/admin/delivery/addSubItem',
                            data: JSON.stringify({
                                id: id,
                                department: department,
                                sender: sender,
                                senderPhone: senderPhone,
                                recipient: recipient,
                                recipientPhone: recipientPhone,
                                //, recipientAddress: recipientAddress
                                fileType: fileType,
                                deliveryReason: deliveryReason
                            }),
                            success: function (data) {
                                if ($.isFunction(callback)) {
                                    callback(data);
                                }
                                self.dialog("close");
                            }
                        });
                    }
                });
            },
            buttons: [
                {
                    text: "确定",
                    id: 'confirm',
                    click: function () {
                        var self = $(this);
                        self.submit();
                    }
                },
                {
                    text: "取消",
                    id: 'cancel',
                    click: function () {
                        $(this).dialog("close");
                    }
                }
            ],
            close: function () {
                var self = $(this);
                self.find('#selectDepartment').val('');
                self.find('#inputSender').val('');
                self.find('#inputSenderPhone').val('');
                self.find('#inputRecipient').val('');
                self.find('#inputRecipientPhone').val('');
                //self.find('#inputRecipientAddress').val('');
                self.find('#inputFileType').val('');
                self.find('#inputDeliveryReason').val('');
                self.validate().resetForm();
                self.find('.error').removeClass('error');
                self.parent().find('#confirm').button('reset');
            }
        });
    }

    function removeItem(id) {
        $.ajax({
            url: '/admin/delivery/remove',
            data: JSON.stringify({
                _id: id
            }),
            success: function () {
                // reload list
                loadList(current_page, page_size);
            }
        });
    }

    $(function () {
        list_tmpl = $('#list-template').html();
        sub_list_tmpl = $('#sub-list-template').html();
        edit_dialog_tmpl = $('#edit_dialog_template').html();
        sub_item_tmpl = $('#sub_item_template').html();
        $(".select-date").val(current_date).datepicker({
            dateFormat: 'yy-mm-dd',
            constrainInput: true,
            onSelect: function (dateText) {
                current_date = dateText;
                //loadList(1, page_size);
            }
        });

        $('#search').click(function () {
            expressCompany = $('#selectExpressCompany').val();
            paymentTerm = $('#selectPaymentTerm').val();
            loadList(1, page_size);
        });
        
        $('#print').click(function () {
            window.open('/admin/delivery/print?deliveryDate=' + current_date +
                        '&expressCompany=' + encodeURIComponent(expressCompany) +
                        '&paymentTerm=' + encodeURIComponent(paymentTerm), '_blank');
        });

        $('#lock').click(function () {
            var self = $(this);
            self.button('loading');
            //console.log(self.data('resetText'));
            if (self.data('lock') == false) {
                $.ajax({
                    url: '/admin/delivery/lock',
                    success: function () {
                        self.button('unlock');
                        self.data('lock', true);
                    }
                });
            } else {
                $.ajax({
                    url: '/admin/delivery/unlock',
                    success: function () {
                        self.button('lock');
                        self.data('lock', false);
                    }
                });
            }
        });

        loadList(current_page, page_size);
    });

})(jQuery);
