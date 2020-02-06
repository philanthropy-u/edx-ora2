"use strict"

$.fn.oraTableBuilder = function ($config) {
    var _this = this
    var change_cb = function (table) {
        console.info("Please overrider change in configuration object");
    }
    if ($config && $config.change) {
        change_cb = $config.change;
    } else {
        $config.change = change_cb;
    }

    function plugin() {
        this._this = _this;
        var __this = this;
        this.controls = {
            div: document.createElement('div'),
            input: document.createElement('input'),
            table: document.createElement('table'),
            thead: document.createElement('thead'),
            tbody: document.createElement('tbody'),
            tr: document.createElement('tr'),
            td: document.createElement('td'),
            th: document.createElement('th'),
            select: document.createElement('select'),
            option: document.createElement('option'),
            label: document.createElement('label'),
            caption: document.createElement('caption'),
            button: document.createElement('button'),
            checkbox: $(document.createElement('input')).attr({type: 'checkbox'}),
            radio: $(document.createElement('input')).attr({type: 'radio'}),
            text: $(document.createElement('input')).attr({type: 'text'}),
            table_text_input: $(document.createElement('input')).attr({type: 'text'})
        };

        $(_this).find('script[data-w-name="input"]').each(function (index, template) {
            var template_meta = $(template).data();
            __this.controls[template_meta['wType']] = $($.parseHTML($(template).text()));
            $(__this.controls[template_meta['wType']]).bind('DOMNodeInsertedIntoDocument', function () {
                var _current_element = $(this);
                $(this).find('label').first().text($(this).data('label')).click(function () {
                    $(this).parent().find('input').click();
                });

                if (template_meta['wType'] === 'checkbox' || template_meta['wType'] === 'table-editor-checkbox') {
                    $(_current_element).find('input[type="checkbox"]').prop('checked', $(this).data('checked'));
                }


                $(this).find('input').first().change(function () {
                    if (template_meta['wType'] === 'checkbox') {
                        _current_element.attr('data-checked', $(this).is(':checked'));
                    }
                })
            })
        });
        this.inputTypes = [
            {title: 'text', value: 'table_text_input'},
            {title: 'checkbox', value: 'checkbox'},
            // {title: 'radio', value: 'radio'} TODO uncomment to add radio button support.
        ];

        this.input_type_select = this.controls['select'].cloneNode();
        this.populate_input_type_select(this.input_type_select);

        this.controls['th'].setAttribute('contenteditable', true);
        $(this.controls['caption'].setAttribute('contenteditable', true)).addClass('merged-cell');

        this.table_editor = this.controls['div'].cloneNode();
        this.table_preview = this.controls['div'].cloneNode();

        this.overrider_global_col_input = $(this.controls['div'].cloneNode());
        this.overrider_global_row_input = $(this.controls['div'].cloneNode());
        this.overrider_global_col_input.attr({
            name: 'overrider_global_col_input',
            class: 'overrider_global_col_input',
        });


        this.overrider_global_row_input.attr({
            name: 'overrider_global_row_input',
            class: 'overrider_global_row_input'
        });

        this.contains_horizontal_headers = this.controls['table-editor-checkbox'].clone(true, true);
        this.contains_horizontal_headers.attr({
            name: 'contains_horizontal_headers',

            'data-label': 'Horizontal Headers',
            'data-checked': true,
        });
        this.contains_vertical_headers = this.controls['table-editor-checkbox'].clone(true, true);
        this.contains_vertical_headers.attr({
            name: 'contains_vertical_headers',

            'data-label': 'Vertical Headers',
            'data-checked': true,
        });

        this.contains_caption = this.controls['table-editor-checkbox'].clone(true, true);
        this.contains_caption.attr({
            name: 'contains_caption',

            'data-label': 'Caption',
            'data-checked': false,
        })

        $(this.table_editor).attr({class: 'table-editor'});
        $(this.table_preview).attr({class: 'table-preview'});

        this.editor_rows = this.controls['input'].cloneNode();
        this.editor_cols = this.controls['input'].cloneNode();
        $(this.editor_rows).attr({class: 'table-editor-rows', value: 4});
        $(this.editor_cols).attr({class: 'table-editor-cols', value: 4});


        /*
        * TODO Create Form Template Row One
        * */
        var h2 = $(document.createElement('H2')), h5 = $(document.createElement('H5'));
        var rows = [
            $(this.controls['div'].cloneNode()).attr({class: 'row'}),
            $(this.controls['div'].cloneNode()).attr({class: 'row'}),
            $(this.controls['div'].cloneNode()).attr({class: 'row'}),
            $(this.controls['div'].cloneNode()).attr({class: 'row'}),
            $(this.controls['div'].cloneNode()).attr({class: 'row'}),
        ]
        var columns = [
            $(this.controls['div'].cloneNode()).attr({class: 'column'}),
            $(this.controls['div'].cloneNode()).attr({class: 'column'}),
            $(this.controls['div'].cloneNode()).attr({class: 'column checkbox-container'}),
            $(this.controls['div'].cloneNode()).attr({class: 'column'}),
        ]
        columns[0].append(h5.clone().text('Rows')).append(this.editor_rows);
        columns[1].append(h5.clone().text('Columns')).append(this.editor_cols);
        columns[2].append(h5.clone().text('Features')).append(this.contains_horizontal_headers, this.contains_vertical_headers, this.contains_caption);
        columns[3].append(h5.clone().text('Input Type')).append(this.input_type_select);
        rows[0].append($(h2.clone().text('Create Table')));
        rows[1].append(columns);

        columns = [
            $(this.controls['div'].cloneNode()).attr({class: 'column'}),
            $(this.controls['div'].cloneNode()).attr({class: 'column'}),
            $(this.controls['div'].cloneNode()).attr({class: 'column'}),
            $(this.controls['div'].cloneNode()).attr({class: 'column'}),
        ]


        rows[2].append($(h2.clone().text('Add Custom Html Tags'))).hide();
        rows[3].append(columns).hide();


        var renderButton = $(this.controls['button'].cloneNode()).text("Generate Table").addClass('button-primary');
        renderButton.click(function () {
            __this.renderTable();
        })

        rows[4].append(renderButton);

        this.editor_form_rows = rows;


        $(this.table_editor).append(rows);
        $(this._this).append(this.table_editor, this.table_preview);
    }

    plugin.prototype.renderTable = function () {
        var _this = this, rows = $(this.editor_rows).val(),
            cols = $(this.editor_cols).val(),
            contains_horizontal_headers = this.contains_horizontal_headers.find('input[type="checkbox"]').is(':checked'),
            contains_vertical_headers = this.contains_vertical_headers.find('input[type="checkbox"]').is(':checked'),
            contains_caption = this.contains_caption.find('input[type="checkbox"]').is(':checked');
        var input_type_select = this.input_type_select;
        var table = this.controls['table'].cloneNode(), tr = this.controls['tr'].cloneNode(),
            td = this.controls['td'].cloneNode(),
            th = this.controls['th'].cloneNode(),
            caption = this.controls['caption'].cloneNode(),
            tbody = this.controls['tbody'].cloneNode(),
            thead = this.controls['thead'].cloneNode();
        $(table).addClass('ora-prompt-table ora-table-builder');
        var col_options = [], row_options = [];
        this.col_select = this.controls['select'].cloneNode();
        this.row_select = this.controls['select'].cloneNode();
        for (var c = 0; c < cols; c++) {
            var option = this.controls['option'].cloneNode();
            $(option).attr({value: c}).html('Column ' + (c + 1));
            col_options.push(option);
        }

        for (var r = 0; r < rows; r++) {
            var option = this.controls['option'].cloneNode();
            $(option).attr({value: r}).html('Row ' + (r + 1));
            row_options.push(option);
        }

        $(this.col_select).append(col_options);
        $(this.row_select).append(row_options);
        this.col_input_type_select = input_type_select.cloneNode();
        this.row_input_type_select = input_type_select.cloneNode();
        this.populate_input_type_select(this.col_input_type_select);
        this.populate_input_type_select(this.row_input_type_select);


        var rows_custom_input_types_div = $(this.editor_form_rows[3]).find('div');

        $(rows_custom_input_types_div[0]).empty();
        $(rows_custom_input_types_div[0]).append(this.row_select);
        $(rows_custom_input_types_div[1]).empty();
        $(rows_custom_input_types_div[1]).append(this.row_input_type_select);
        $(this.row_input_type_select).change(function () {
            $($(table).find('tbody tr')[$(_this.row_select).val()]).find('td').each(function (index, td) {
                $(td).empty().append($(_this.controls[$(_this.row_input_type_select).val()]).clone(true, true));
            });
            change_cb(_this);
        });

        $(rows_custom_input_types_div[2]).empty();
        $(rows_custom_input_types_div[2]).append(this.col_select);

        $(rows_custom_input_types_div[3]).empty();
        $(rows_custom_input_types_div[3]).append(this.col_input_type_select);
        $(this.col_input_type_select).change(function () {
            $(table).find('tr').each(function (index, tr) {
                $($(tr).find('td')[$(_this.col_select).val()]).empty().append($(_this.controls[$(_this.col_input_type_select).val()]).clone(true, true));
            });
            change_cb(_this);
        });

        $(this.editor_form_rows[2]).show();
        $(this.editor_form_rows[3]).show();


        if (contains_caption) {
            $(table).append(caption);
        }

        if (contains_horizontal_headers) {
            var header_tr = tr.cloneNode();
            if (contains_vertical_headers) {
                $(header_tr).append(th.cloneNode());
            }
            for (var c = 0; c < cols; c++) {
                $(header_tr).append(th.cloneNode());
            }
            $(thead).append(header_tr);
            $(table).append(thead);
        }
        for (var r = 0; r < rows; r++) {
            var _tr = tr.cloneNode();
            if (contains_vertical_headers) {
                $(_tr).append(th.cloneNode());
            }
            for (var c = 0; c < cols; c++) {
                $(_tr).append(td.cloneNode());
            }
            $(tbody).append(_tr);
        }
        $(table).append(tbody).addClass('oa-table-default');

        var oa_table_container = $(this.controls['div']).clone().addClass('oa-table-container').append(table)

        $(this.table_preview).empty().append(oa_table_container);


        $(input_type_select).change(function () {
            var value = $(this).val();
            $(table).find('td').each(function () {
                $(this).empty();
                $(this).append($(_this.controls[value]).clone(true, true));
            });
            change_cb(_this);
        })
        $(input_type_select).change();

        $(table).on('blur keyup paste input', '[contenteditable]', function () {
            change_cb(_this)
        })

        return this;
    }

    plugin.prototype.populate_input_type_select = function (input_type_select) {
        var _this = this;
        this.inputTypes.forEach(function (v_option, index) {
            var option = _this.controls['option'].cloneNode();
            $(option).attr({value: v_option.value}).html(v_option.title);
            $(input_type_select).append(option)
        });
    }

    plugin.prototype.html = function () {
        return $(this.table_preview).html();
    }
    plugin.prototype.setHeaderContentEditable = function (contenteditable) {
        $(this.table_preview).find('th').each(function (index, th) {
            $(th).attr({contenteditable: contenteditable});
        })
        $(this.table_preview).find('caption').each(function (index, th) {
            $(th).attr({contenteditable: contenteditable});
        })
    }
    return new plugin();
}


$.fn.initORATableCheckbox = function (checkboxClass = 'checkbox-input', disabled = false) {
    var _this = $(this);

    function plugin() {
        _this.find('.' + checkboxClass).each(function (index, element) {
            var checkbox = $($(element).find('input[type="checkbox"]'));
            checkbox.prop('checked', $(element).data('checked')).change(function () {
                $(element).attr({'data-checked': $(this).is(':checked')});
            });
            if (disabled) {
                checkbox.prop('disabled', true);
            }
        })
    }

    return new plugin();
}

$.fn.oaTable = function () {
    var table = $(this);

    function plugin(table) {
        this.table = table
        $(table).find('th[contenteditable]').removeAttr('contenteditable');
        $(table).find('caption[contenteditable]').removeAttr('contenteditable');
    }

    plugin.prototype.locked_html = function () {
        var table = $(this.table.clone(true, true));
        table.find('[contenteditable]').each(function (index, editable) {
            $(editable).removeAttr('contenteditable');
        })
        return table.prop("outerHTML");
    }
    return new plugin(table);
}