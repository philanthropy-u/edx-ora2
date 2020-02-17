"use strict"
/**
 *  This plugin is written to add support for tabular type prompts to ora. we have introduced the whole new functionality.
 *  to ORA. there are few html data variables as well which we needs to understand before start integration of this plugin.
 *  data-w-type="html-control" will be added to the textarea of prompt to hold widget type of hte prompt.
 * */
var oa_helpers = {
    lockInputField: function (element) {
        var data = $(element).data();
        var hiddenPlaceHolder = data['hiddenPlaceHolder'], inputControlType = data['inputControlType'];
        $(element).find(hiddenPlaceHolder).show();
        $(element).find(inputControlType).remove();
    }
}
$.fn.oraTableBuilder = function ($config) {
    var CHECKBOX_SELECTOR = 'input[type="checkbox"]', CONTENTENDITABLE_SELECTOR = '[contenteditable]',
        CUSTOM_TH_INPUT_CONTROL_SELECTOR = "th>[data-input-control=true]",
        CUSTOM_CAPTION_INPUT_CONTROL_SELECTOR = "caption>[data-input-control=true]",
        CUSTOM_INPUT_CONTROL_SELECTOR = '[data-input-control=true]';
    var _this = this;
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
            div: $('<div></div>'),
            input: $('<input/>'),
            table: $('<table></table>'),
            thead: $('<thead></thead>'),
            tbody: $('<tbody></tbody>'),
            tr: $('<tr></tr>'),
            td: $('<td></td>'),
            th: $('<th></th>'),
            select: $('<select></select>'),
            option: $('<option></option>'),
            label: $('<label></label>'),
            caption: $('<caption class="merged-cell"></caption>'),
            button: $('<button></button>'),
            checkbox: $('<input type="checkbox" />'),
            radio: $('<input type="radio" />'),
            text: $('<input type="text" />'),
            table_text_input: $('<input type="text" />')
        };

        $(_this).find('script[data-w-name="input"]').each(function (index, template) {
            var template_meta = $(template).data();
            __this.controls[template_meta['wType']] = $($.parseHTML($(template).text()));
            $(__this.controls[template_meta['wType']]).bind('DOMNodeInsertedIntoDocument', function () {
                var _current_element = $(this);
                _current_element.find('label').first().text($(this).data('label')).click(function () {
                    $(this).parent().find('input').click();
                });

                if (template_meta['wType'] === 'checkbox' || template_meta['wType'] === 'table-editor-checkbox') {
                    $(_current_element).find(CHECKBOX_SELECTOR).prop('checked', $(this).data('checked'));
                }


                _current_element.find('input').first().change(function () {
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

        this.input_type_select = this.controls['select'].clone();
        this.populate_input_type_select(this.input_type_select);

        this.table_editor = this.controls['div'].clone();
        this.table_preview = this.controls['div'].clone();

        this.overrider_global_col_input = $(this.controls['div'].clone());
        this.overrider_global_row_input = $(this.controls['div'].clone());
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

        this.editor_rows = this.controls['input'].clone();
        this.editor_cols = this.controls['input'].clone();
        $(this.editor_rows).attr({class: 'table-editor-rows', value: 4});
        $(this.editor_cols).attr({class: 'table-editor-cols', value: 4});


        /*
        * TODO Create Form Template Row One
        * */
        var h2 = $(document.createElement('H2')), h5 = $(document.createElement('H5'));
        var rows = [
            $(this.controls['div'].clone()).attr({class: 'row'}),
            $(this.controls['div'].clone()).attr({class: 'row'}),
            $(this.controls['div'].clone()).attr({class: 'row'}),
            $(this.controls['div'].clone()).attr({class: 'row'}),
            $(this.controls['div'].clone()).attr({class: 'row'}),
        ]
        var columns = [
            $(this.controls['div'].clone()).attr({class: 'column'}),
            $(this.controls['div'].clone()).attr({class: 'column'}),
            $(this.controls['div'].clone()).attr({class: 'column checkbox-container'}),
            $(this.controls['div'].clone()).attr({class: 'column'}),
        ]
        columns[0].append(h5.clone().text('Rows')).append(this.editor_rows);
        columns[1].append(h5.clone().text('Columns')).append(this.editor_cols);
        columns[2].append(h5.clone().text('Features')).append(this.contains_horizontal_headers, this.contains_vertical_headers, this.contains_caption);
        columns[3].append(h5.clone().text('Input Type')).append(this.input_type_select);
        rows[0].append($(h2.clone().text('Create Table')));
        rows[1].append(columns);

        columns = [
            $(this.controls['div'].clone()).attr({class: 'column'}),
            $(this.controls['div'].clone()).attr({class: 'column'}),
            $(this.controls['div'].clone()).attr({class: 'column'}),
            $(this.controls['div'].clone()).attr({class: 'column'}),
        ]


        rows[2].append($(h2.clone().text('Add Custom Html Tags'))).hide();
        rows[3].append(columns).hide();


        var renderButton = $(this.controls['button'].clone()).text("Generate Table").addClass('button-primary');
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
            contains_horizontal_headers = this.contains_horizontal_headers.find(CHECKBOX_SELECTOR).is(':checked'),
            contains_vertical_headers = this.contains_vertical_headers.find(CHECKBOX_SELECTOR).is(':checked'),
            contains_caption = this.contains_caption.find(CHECKBOX_SELECTOR).is(':checked');
        var input_type_select = this.input_type_select;
        var table = this.controls['table'].clone(), tr = this.controls['tr'].clone(),
            table_text_input = this.controls['table_text_input'].clone(),
            td = this.controls['td'].clone(),
            th = this.controls['th'].clone(),
            caption = this.controls['caption'].clone().append(table_text_input),
            tbody = this.controls['tbody'].clone(),
            thead = this.controls['thead'].clone();
        th.append(table_text_input);
        var CUSTOM_INPUT_TYPE_HEADER_ROW_INDEX = 2, CUSTOM_INPUT_TYPE_CONTROL_ROW_INDEX = 3,
            CUSTOM_INPUT_ROW_FIRST_COLUMN = 0, CUSTOM_INPUT_ROW_SECOND_COLUMN = 1,
            CUSTOM_INPUT_ROW_THIRD_COLUMN = 2, CUSTOM_INPUT_ROW_FOURTH_COLUMN = 3;
        $(table).addClass('ora-prompt-table ora-table-builder');
        var col_options = [], row_options = [];
        this.col_select = this.controls['select'].clone();
        this.row_select = this.controls['select'].clone();
        for (var c = 0; c < cols; c++) {
            var option = this.controls['option'].clone();
            $(option).attr({value: c}).html('Column ' + (c + 1));
            col_options.push(option);
        }

        for (var r = 0; r < rows; r++) {
            var option = this.controls['option'].clone();
            $(option).attr({value: r}).html('Row ' + (r + 1));
            row_options.push(option);
        }

        $(this.col_select).append(col_options);
        $(this.row_select).append(row_options);
        this.col_input_type_select = input_type_select.clone();
        this.row_input_type_select = input_type_select.clone();
        this.populate_input_type_select(this.col_input_type_select);
        this.populate_input_type_select(this.row_input_type_select);


        var rows_custom_input_types_div = $(this.editor_form_rows[3]).find('div');

        $(rows_custom_input_types_div[CUSTOM_INPUT_ROW_FIRST_COLUMN]).empty();
        $(rows_custom_input_types_div[CUSTOM_INPUT_ROW_FIRST_COLUMN]).append(this.row_select);
        $(rows_custom_input_types_div[CUSTOM_INPUT_ROW_SECOND_COLUMN]).empty();
        $(rows_custom_input_types_div[CUSTOM_INPUT_ROW_SECOND_COLUMN]).append(this.row_input_type_select);
        $(this.row_input_type_select).change(function () {
            $($(table).find('tbody tr')[$(_this.row_select).val()]).find('td').each(function (index, td) {
                $(td).empty().append($(_this.controls[$(_this.row_input_type_select).val()]).clone(true, true));
            });
            change_cb(_this);
        });

        $(rows_custom_input_types_div[CUSTOM_INPUT_ROW_THIRD_COLUMN]).empty();
        $(rows_custom_input_types_div[CUSTOM_INPUT_ROW_THIRD_COLUMN]).append(this.col_select);

        $(rows_custom_input_types_div[CUSTOM_INPUT_ROW_FOURTH_COLUMN]).empty();
        $(rows_custom_input_types_div[CUSTOM_INPUT_ROW_FOURTH_COLUMN]).append(this.col_input_type_select);
        $(this.col_input_type_select).change(function () {
            $(table).find('tr').each(function (index, tr) {
                $($(tr).find('td')[$(_this.col_select).val()]).empty().append($(_this.controls[$(_this.col_input_type_select).val()]).clone(true, true));
            });
            change_cb(_this);
        });

        // show custom column input type rows.
        $(this.editor_form_rows[CUSTOM_INPUT_TYPE_HEADER_ROW_INDEX]).show();
        $(this.editor_form_rows[CUSTOM_INPUT_TYPE_CONTROL_ROW_INDEX]).show();


        if (contains_caption) {
            caption.append(table_text_input.clone(true, true))
            $(table).append(caption);
        }

        if (contains_horizontal_headers) {
            var header_tr = tr.clone();
            if (contains_vertical_headers) {
                $(header_tr).append(th.clone(true, true));
            }
            for (var c = 0; c < cols; c++) {
                $(header_tr).append(th.clone(true, true));
            }
            $(thead).append(header_tr);
            $(table).append(thead);
        }

        for (var r = 0; r < rows; r++) {
            var _tr = tr.clone();
            if (contains_vertical_headers) {
                $(_tr).append(th.clone(true, true));
            }
            for (var c = 0; c < cols; c++) {
                $(_tr).append(td.clone());
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

        $(table).on('blur keyup paste input', CUSTOM_INPUT_CONTROL_SELECTOR, function () {
            change_cb(_this)
        })

        return this;
    }

    plugin.prototype.populate_input_type_select = function (input_type_select) {
        var _this = this;
        input_type_select.empty();
        this.inputTypes.forEach(function (v_option, index) {
            var option = _this.controls['option'].clone();
            $(option).attr({value: v_option.value}).html(v_option.title);
            $(input_type_select).append(option)
        });
        $(input_type_select).click(function () {
            $(input_type_select).change();
        })
    }

    plugin.prototype.html = function () {
        var _table_preview = this.table_preview.clone(true, true);

        function lockField(selector) {
            _table_preview.find(selector).each(function (index, element) {
                oa_helpers.lockInputField(element);
            });
        }

        [CUSTOM_TH_INPUT_CONTROL_SELECTOR, CUSTOM_CAPTION_INPUT_CONTROL_SELECTOR].forEach(function (selector) {
            lockField(selector);
        });
        return $(_table_preview).html();
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


$.fn.initORATableCheckbox = function (checkboxClass, disabled) {
    var _this = $(this);
    var CHECKBOX_SELECTOR = 'input[type="checkbox"]';

    function plugin() {
        _this.find('.' + checkboxClass).each(function (index, element) {

            var checkbox = $($(element).find(CHECKBOX_SELECTOR));
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
    var CONTENTENDITABLE_SELECTOR = '[contenteditable]', CONTENTEDITABLE_TH_SELECTOR = 'th[contenteditable]',
        CONTENTEDITABLE_CAPTION_SELECTOR = 'caption[contenteditable]',
        CUSTOM_INPUT_CONTROL_SELECTOR = "[data-input-control=true]";
    var table = $(this);

    function plugin(table) {
        this.table = table
        $(table).find(CONTENTEDITABLE_TH_SELECTOR).removeAttr('contenteditable');
        $(table).find(CONTENTEDITABLE_CAPTION_SELECTOR).removeAttr('contenteditable');
    }

    plugin.prototype.locked_html = function () {
        var table = $(this.table.clone(true, true));

        table.find(CONTENTENDITABLE_SELECTOR).each(function (index, editable) {
            $(editable).removeAttr('contenteditable');
        });
        table.find(CUSTOM_INPUT_CONTROL_SELECTOR).each(function (index, element) {
            oa_helpers.lockInputField(element);
        });

        return table.prop("outerHTML");
    }

    return new plugin(table);
}

$.fn.openassessmentEditableTableHeaders = function ($config) {
    var table = $(this);
    var update_cb = function (table) {
        console.info("Please overrider change in configuration object");
    }
    update_cb = ($config && $config.update) ? $config.update : update_cb;
    var $container = $(this);

    function plugin() {
        this.$container = $container;
        this.$container.find('th,caption').each(function (index, element) {
            function _onDoubleClick(e) {
                var _element = this;
                e.preventDefault();
                $(_element).off('dblclick');
                var $textarea = $('<textarea class="openassessment-header-textarea"></textarea>').html($(_element).html());
                $(element).empty().append($textarea);
                $textarea.focus();

                function focusout() {
                    $(_element).html($(this).val());
                    $textarea.remove();
                    var updatedTable=table.clone(true,true);
                    updatedTable.clone(true,true);
                    update_cb(updatedTable);
                    setTimeout(function () {
                        $(element).off('dblclick').dblclick(_onDoubleClick);
                    }, 50);
                }

                setTimeout(function () {
                    $textarea.off('focusout').focusout(focusout);
                },100);

            }

            $(element).off('dblclick').dblclick(_onDoubleClick);
        })
    }

    return new plugin();
}
