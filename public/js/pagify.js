/*global jQuery*/
(function($) {

    'use strict';

    $.ajaxSetup({
        type: 'POST',
        dataType: 'json',
        contentType: 'application/json',
        error: function (jqXHR) {
            if(jqXHR.responseText) {
                console.log(jqXHR.responseText);
            }
        }
    });
    
    var widget_options = {
        _list_url: null,
        _dialog_url: null,
        _remove_url: null,
        _save_url: null,
        _xhr: null,
        _edit_dialog: null,
        _current_page: 1,
        options: {
            start_page: 1,
            page_size: 20
        },
        _create: function(){
            var self = this,
                list = $('#list');

            self._list_url = list.data('list-url');
            self._dialog_url = list.data('dialog-url');
            self._remove_url = list.data('remove-url');
            self._save_url = list.data('save-url');

            $('#add').click(function () {
                self._showEditDialog();
            });
            $('#search').click(function(){
                self._loadList(self.options.start_page, self.options.page_size);
            });
            $('.select-date').datepicker({
                dateFormat: 'yy-mm-dd',
                constrainInput: true,
                onSelect: function (dateText, inst) {
                }
            });

            self._edit_dialog = $('#edit-dialog').dialog({
                width: 600,
                height: 400,
                minWidth: 600,
                minHeight: 200,
                title: '编辑',
                modal: true,
                autoOpen: false,
                buttons: [
                    {
                        text: "保存",
                        id: 'save',
                        click: function () {
                            $(this).submit();
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
                    if (self._xhr) {
                        self._xhr.abort();
                        self._xhr = null;
                    }
                    $(this).html('').parent().find('#save').button('reset');
                }
            }).on('success', function () {
                self._loadList(self._current_page, self.options.page_size);
            });
            
            self._loadList(self.options.start_page, self.options.page_size);        
        },
        _loadList: function (page, size) {
            // get search conditions
            var self = this,
                search_form = $('#search-form'),
                form_data = {};
            
            if(search_form.length) {
                search_form.find('[name]:enabled').each(function (i, el) {
                    var name = $(el).attr('name'),
                        val = $(el).val();
                    if(name in form_data) {
                        if(!form_data[name].push) {
                            form_data[name] = [form_data[name]];
                        }
                        form_data[name].push(val);
                    } else {
                        form_data[name] = val;
                    }
                });
            }
            $.ajax({
                url: self._list_url,
                dataType: 'html',
                data: JSON.stringify($.extend({
                    page: page,
                    size: size
                }, form_data)),
                success: function (data) {
                    self._current_page = page;
                    if (!data) {
                        $('#list').html('<p>找不到相关记录。</p>');
                        return;
                    }

                    $('#list').html(data);
                    // bind events
                    $('#list .btn-primary').click(function (e) {
                        // show edit dialog
                        self._showEditDialog($(this).data('id'));
                    });
                    $('#list .btn-danger').click(function (e) {
                        // show confirm dialog
                        if (window.confirm('你确定要删除吗？')) {
                            // remove item
                            self._removeItem($(this).data('id'));
                        }
                    });
                    $('.pagination li:not([class])').click(function(e){
                        e.preventDefault();
                        self._loadList($(this).data('page'), size);
                    });
                    self._trigger('listloaded', new $.Event('list-loaded'), $('#list'));
                }
            });
        },
        _showEditDialog: function(id) {

            var self = this;
            self._xhr = $.ajax({
                url: self._dialog_url,
                dataType: 'html',
                data: JSON.stringify({
                    id: id
                }),
                success: function (data) {
                    self._xhr = null;
                    self._edit_dialog.html(data);
                    self._edit_dialog.validate({
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
                            
                            self._xhr = $.ajax({
                                url: self._save_url,
                                data: JSON.stringify(data),
                                success: function (data) {
                                    self._xhr = null;
                                    self._edit_dialog.trigger('success');
                                    self._edit_dialog.dialog("close");
                                }
                            });
                        }
                    });
                    self._edit_dialog.dialog('open');
                }
            });
        },

        _removeItem: function(id) {
            var self = this;
            $.ajax({
                url: self._remove_url,
                data: JSON.stringify({
                    id: id
                }),
                success: function () {
                    self._loadList(self._current_page, self.options.page_size);
                }
            });
        }
    };
    $.widget('gm.pagify', widget_options);
})(jQuery);
