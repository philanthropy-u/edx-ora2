"use strict"

$.fn.oraTableBuilder = function () {
  var _this = this

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
      text: $(document.createElement('input')).attr({type: 'text'})
    };

    this.inputTypes = [
      'text',
      'checkbox',
      'radio'
    ];

    this.input_type_select = this.controls['select'].cloneNode();
    this.populate_input_type_select(this.input_type_select);

    this.controls['th'].setAttribute('contenteditable', true);
    this.controls['caption'].setAttribute('contenteditable', true);

    this.table_editor = this.controls['div'].cloneNode();
    this.table_preview = this.controls['div'].cloneNode();

    this.overrider_global_col_input = $(this.controls['div'].cloneNode());
    this.overrider_global_row_input = $(this.controls['div'].cloneNode());
    this.overrider_global_col_input.attr({
      name: 'overrider_global_col_input',
      id: 'overrider_global_col_input'
    });
    this.overrider_global_row_input.attr({
      name: 'overrider_global_row_input',
      id: 'overrider_global_row_input'
    });

    this.contains_horizontal_headers = this.controls['checkbox'].clone();
    this.contains_horizontal_headers.attr({
      name: 'contains_horizontal_headers',
      id: 'contains_horizontal_headers'
    })
    this.contains_vertical_headers = this.controls['checkbox'].clone();
    this.contains_vertical_headers.attr({
      name: 'contains_vertical_headers',
      id: 'contains_vertical_headers'
    });

    this.contains_caption = this.controls['checkbox'].clone();
    this.contains_caption.attr({
      name: 'contains_caption',
      id: 'contains_caption'
    })

    $(this.table_editor).attr({id: 'table-editor', class: 'table-editor'});
    $(this.table_preview).attr({id: 'table-preview', class: 'table-preview'});

    this.editor_rows = this.controls['input'].cloneNode();
    this.editor_cols = this.controls['input'].cloneNode();
    $(this.editor_rows).attr({id: 'table-editor-rows', class: 'table-editor-rows', value: 4});
    $(this.editor_cols).attr({id: 'table-editor-cols', class: 'table-editor-cols', value: 4});


    $(this.table_editor).append(this.editor_rows, this.editor_cols, this.contains_horizontal_headers, this.contains_vertical_headers, this.contains_caption, this.input_type_select, this.overrider_global_row_input, this.overrider_global_col_input);
    $(this._this).append(this.table_editor, this.table_preview);
  }

  plugin.prototype.renderTable = function () {
    var _this = this, rows = $(this.editor_rows).val(),
      cols = $(this.editor_cols).val(), contains_horizontal_headers = this.contains_horizontal_headers.is(':checked'),
      contains_vertical_headers = this.contains_vertical_headers.is(':checked'),
      contains_caption = this.contains_caption.is(':checked');
    var input_type_select = this.input_type_select;
    var table = this.controls['table'].cloneNode(), tr = this.controls['tr'].cloneNode(),
      td = this.controls['td'].cloneNode(),
      th = this.controls['th'].cloneNode(),
      caption = this.controls['caption'].cloneNode(),
      tbody = this.controls['tbody'].cloneNode(),
      thead = this.controls['thead'].cloneNode();

    var overrider_global_row_input = this.overrider_global_row_input,
      overrider_global_col_input = this.overrider_global_col_input;
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

    var overrider_row_input_button = this.controls['button'].cloneNode();
    $(overrider_row_input_button).html('Apply');
    $(overrider_row_input_button).click(function () {
      $($(table).find('tbody tr')[$(_this.row_select).val()]).find('td').each(function (index, td) {
        $(td).empty().append($(_this.controls[$(_this.row_input_type_select).val()]).clone());
      })
    });

    var overrider_col_input_button = this.controls['button'].cloneNode();
    $(overrider_col_input_button).html('Apply');
    $(overrider_col_input_button).click(function () {
      $(table).find('tr').each(function (index, tr) {
        $($(tr).find('td')[$(_this.col_select).val()]).empty().append($(_this.controls[$(_this.col_input_type_select).val()]).clone());
      });
    });

    overrider_global_row_input.empty();
    overrider_global_row_input.append(this.row_select, this.row_input_type_select, overrider_row_input_button);

    overrider_global_col_input.empty();
    overrider_global_col_input.append(this.col_select, this.col_input_type_select, overrider_col_input_button);


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
    $(table).append(tbody)
    $(this.table_preview).empty().append(table);


    $(input_type_select).change(function () {
      var value = $(this).val();
      $(table).find('td').each(function () {
        $(this).empty();
        $(this).append($(_this.controls[value]).clone());
      })
    })
    $(input_type_select).change();

    return this;
  }

  plugin.prototype.populate_input_type_select = function (input_type_select) {
    var _this = this;
    this.inputTypes.forEach(function (value, index) {
      var option = _this.controls['option'].cloneNode();
      $(option).attr({value: value}).html(value);
      $(input_type_select).append(option)
    });
  }

  plugin.prototype.html = function () {
    return $(this.table_preview).html();
  }
  plugin.prototype.setContentEditable=function (contenteditable) {
    $(this.table_preview).find('th').each(function (index, th) {
      $(th).attr({contenteditable: contenteditable});
    })
    $(this.table_preview).find('caption').each(function (index, th) {
      $(th).attr({contenteditable: contenteditable});
    })
  }
  return new plugin();
}