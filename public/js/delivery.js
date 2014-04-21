/*jslint browser: true, vars: true, nomen: true*/
/*global ejs, alert, Pouch, jQuery*/

(function ($) {

    'use strict';

    var matching_template;
    var history_template;

    $.ajaxSetup({
        dataType: 'json',
        type: 'POST'
    });

    function loadMatchItem(destination) {
        $.ajax({
            url: '/delivery/match',
            data: {
                destination: destination,
                date: $.datepicker.formatDate('yy-mm-dd', new Date())
            },
            success: function (data) {
                if (!data || !data.length) {
                    return;
                }
                $('#join').click(function (e) {
                    $('#matching-dialog').dialog({
                        title: '搭单',
                        modal: true,
                        width: 600,
                        open: function (event, ui) {
                            var self = $(this);
                            self.html(ejs.render(matching_template, { items: data , open: '{{', close: '}}'}));
                            // bind events
                            $('#matching-dialog tbody tr').click(function (e) {
                                var tr = $(this);
                                var tds = tr.find('td');
                                $('form').attr('action', '/delivery/merge');
                                $('#_id').val($(tds[4]).text());
                                $('#selectExpressCompany').val($(tds[0]).text()).attr('disabled', true);
                                $('#inputExpressNumber').val($(tds[1]).text()).attr('disabled', true);
                                $('#selectPaymentTerm').val($(tds[2]).text()).attr('disabled', true);
                                $('#inputRecipientAddress').val($(tds[3]).text()).attr('disabled', true);
                                self.dialog('close');
                            });
                        },
                        close: function () {
                            $(this).html('');
                        }
                    });
                }).show();
            }
        });
    }

    function initValidation() {
        $('.form-horizontal').validate({
            errorPlacement: function (error, element) {
                error.appendTo(element.next("span.help-inline"));
                element.parents('.control-group').addClass('error');
            },
            success: function (label) {
                label.parents('.control-group').removeClass('error');
                label.remove();
            },
            rules: {
                destination: 'required',
                expressCompany: 'required',
                expressNumber: {
                    required: true
                },
                department: 'required',
                sender: 'required',
                senderPhone: 'required',
                recipient: 'required',
                recipientPhone: 'required',
                recipientAddress: 'required',
                fileType: 'required',
                deliveryReason: 'required',
                paymentTerm: 'required'
            },
            submitHandler: function (form) {
                $('#submit').button('loading');
                form.submit();
            }
        });
    }

    function save_to_local(e) {
        e.preventDefault();
        var self = $(e.target);
        var obj = {};
        self.button('loading');

        // get all fields and values
        $('form [name]').each(function (i, el) {
            el = $(el);
            obj[el.attr('name')] = el.val();
        });
        Pouch('idb://local', function (err, db) {
            if (err) {
                self.button('reset');
                alert(err);
                return;
            }
            delete obj._id;
            db.post(obj, function (err) {
                self.button('reset');
                if (err) {
                    alert(err);
                    return;
                }
                alert('保存成功');
            });
        });
    }

    function showLocalHistory(histories) {
        $('#history-dialog').dialog({
            title: '本地记录',
            modal: true,
            width: 900,
            open: function () {
                var self = $(this);
                self.html(ejs.render(history_template, {histories: histories, open: '{{', close: '}}'}));
                // bind events
                $('.btn-danger', self).click(function (e) {
                    e.preventDefault();
                    e.stopPropagation();

                    var self = $(this);
                    //console.log(self.data('id'));
                    Pouch('idb://local', function (err, db) {
                        if (err) {
                            alert(err);
                            return;
                        }
                        db.get(self.data('id'), function (err, doc) {
                            if (err) {
                                alert(err);
                                return;
                            }
                            db.remove(doc, function (err, response) {
                                if (err) {
                                    alert(err);
                                    return;
                                }
                                if (response.ok) {
                                    self.parents('tr').remove();
                                }
                            });
                        });
                    });
                });
                $('tbody tr', self).click(function (e) {
                    var tr = $(this);
                    var tds = tr.find('td');
                    $('#selectDestination').val($(tds[1]).text());
                    $('#inputRecipientAddress').val($(tds[2]).text());
                    $('#selectExpressCompany').val($(tds[3]).text());
                    $('#inputExpressNumber').val($(tds[4]).text());
                    $('#selectDepartment').val($(tds[5]).text());
                    $('#inputSender').val($(tds[6]).text());
                    $('#inputSenderPhone').val($(tds[7]).text());
                    $('#inputRecipient').val($(tds[8]).text());
                    $('#inputRecipientPhone').val($(tds[9]).text());
                    $('#inputFileType').val($(tds[10]).text());
                    $('#inputDeliveryReason').val($(tds[11]).text());
                    $('#selectPaymentTerm').val($(tds[12]).text());
                    if ($('#selectDestination').val() === '办事处') {
                        $('#area-controls').show();
                    } else {
                        $('#area-controls').hide();
                    }
                    self.dialog('close');
                });
            },
            close: function () {
                $(this).html('');
            }
        });
    }

    function load_from_local(e) {
        e.preventDefault();
        var self = $(e.target);
        self.button('loading');

        Pouch('idb://local', function (err, db) {
            if (err) {
                self.button('reset');
                alert(err);
                return;
            }
            db.allDocs({include_docs: true}, function (err, response) {
                self.button('reset');
                if (err) {
                    alert(err);
                    return;
                }
                var rows = response.rows;
                var docs = [];
                var i;
                //console.log(response);
                for (i = 0; i < rows.length; i += 1) {
                    docs.push(rows[i].doc);
                }
                //console.log(docs);
                showLocalHistory(docs);
            });
        });
    }

    function clear_local(e) {
        e.preventDefault();
        var self = $(e.target);
        if (window.confirm('删除后所有本地数据将被清空，确定删除？')) {
            self.button('loading');
            Pouch.destroy('idb://local', function (err) {
                self.button('reset');
                if (err) {
                    alert(err);
                    return;
                }
                alert('清除成功');
            });
        }
    }

    function sync_with_server(e) {
        e.preventDefault();
        var self = $(e.target);
        self.button('loading');
        Pouch.replicate('http://localhost:3001/sync/mydb','idb://local', function (err, changes) {
            console.log('finished!');
            self.button('reset');
            if (err) {
                alert(err);
                return;
            }
            console.log(changes);
            alert('同步成功');
        });
    }

    $(function () {
        matching_template = $('#matching-template').html();
        history_template = $('#history-template').html();
        $('#selectDestination').change(function () {
            var s = $(this);
            switch (s.val()) {
            case '办事处':
                loadMatchItem(s.val());
                $('#area-controls').show();
                break;
            default:
                $('#area-controls').hide();
                $('form').attr('action', '/delivery/insert');
                if ($('#_id').val()) {
                    $('#_id').val();
                    $('#selectExpressCompany').val('').attr('disabled', false);
                    $('#inputExpressNumber').val('').attr('disabled', false);
                    $('#selectPaymentTerm').val('').attr('disabled', false);
                    $('#inputRecipientAddress').val('').attr('disabled', false);
                }
                $('#join').hide().unbind('click');
            }
        });
        initValidation();
        if (($.browser.mozilla && parseInt($.browser.version, 10) >= 12) || $.browser.webkit) {
            $('#save_to_local').attr('disabled', false).click(save_to_local);
            $('#load_from_local').attr('disabled', false).click(load_from_local);
            $('#clear_local').attr('disabled', false).click(clear_local);
            // $('#sync_with_server').attr('disabled', false).click(sync_with_server);
        }
        $('.dropdown-menu a').click(function (e) {
            e.preventDefault();
            $(this).parents('.control-group').find('#inputRecipientAddress').val($(this).data('full-address'));
        });
        if ($('#locking-text').length) {
            $('#locking-dialog').modal();
        }
    });
}(jQuery));
