(function () {

    var oa_table_builder_init_helpers = {
        oa_response_init: function (event) {
            if (!$(event.target).is('li')) {
                return;
            }

            event.preventDefault();
            $(this).find('li.submission__answer__part[data-prompt-type="html-control"]').each(function (index, oa_block_li) {

                var loop_counter = $(oa_block_li).data('loop-counter'),
                    oa_block_id = "#submission__answer__part__description__" + loop_counter,
                    oa_block_saved_id = "#submission__answer__part__saved__state__" + loop_counter;
                var oa_block = $(oa_block_li).find(oa_block_id),
                    oa_block_saved = $(oa_block_li).find(oa_block_saved_id);
                var oa_table_td_list = $(oa_block).find('td');
                var textarea = $(oa_block_li)
                    .find('textarea.submission__answer__part__text__value')
                    .first();
                $(oa_block_saved).find('td').each(function (index, element) {
                    var text_input = $(oa_table_td_list.get(index)).find('.text-input');
                    var data = text_input.data();
                    if (data) {
                        var hidden_place_holder = data['hiddenPlaceHolder'],
                            input_control_type = data['inputControlType'];
                        text_input.find(hidden_place_holder).text($(element).find(hidden_place_holder).text());
                        text_input.find(input_control_type).val($(element).find(hidden_place_holder).text());
                    } else {
                        $(oa_table_td_list.get(index)).html($(element).html());
                    }
                });

                $(oa_block).initORATableCheckbox('checkbox-input', false);
                $(oa_block).oaTable();

                $(oa_block).off('input change').on('input change', 'table', function (e) {
                    e.preventDefault();
                    textarea.val($(this).oaTable().locked_html())
                        .trigger('change');
                });
            })
        },
        oa_submitted_response_init: function (event) {
            if (!$(event.target).is('li')) {
                return;
            }
            $(this).find('li.submission__answer__part[data-prompt-type="html-control"][data-oa-submitted-part="true"]').each(function (index, oa_block_submitted_li) {
                var loop_counter = $(oa_block_submitted_li).data('loop-counter'),
                    submission_div_id = "[data-section-id='submission__answer__part__description__" + loop_counter + "_div']";
                $(oa_block_submitted_li).find(submission_div_id).initORATableCheckbox('checkbox-input', true);
                $(oa_block_submitted_li).find(submission_div_id).oaTable();
            });
        },
        oa_prompt_edit_init: function () {
            $(this).find('[data-prompt-type="html-control"]').each(function (index, prompt) {
                var config = {
                    update: function (table) {
                        var loop_counter = $(prompt).data('loop-counter'),
                            targetTextArea = $(prompt).find('#html-content-textarea-' + loop_counter),
                            updated_html = table.html();
                        table.find('script').remove();
                        targetTextArea.val(updated_html);
                    }
                };
                $(prompt).find('.enable-header-editing').openassessmentEditableTableHeaders(config);
            });
        },
        oa_text_input_field_init: function () {
            var element = $(this);
            $(element).next().text($(element).val());
        }
    }

    $(document).on("keyup", ".text-input textarea", oa_table_builder_init_helpers.oa_text_input_field_init);

    $(document).on('DOMNodeInserted', 'li.openassessment__steps__step', oa_table_builder_init_helpers.oa_response_init);

    $(document).on('DOMNodeInserted', 'li.openassessment__steps__step', oa_table_builder_init_helpers.oa_submitted_response_init)

    $(document).on('DOMNodeInserted', '.xblock.xblock-studio_view.xblock-studio_view-openassessment', oa_table_builder_init_helpers.oa_prompt_edit_init);
})();
