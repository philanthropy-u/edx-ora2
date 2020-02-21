(function () {
    /**
     *
     * @type {{EVENTS: {DOMNODEINSERTED: string, KEYUP: string}, SELECTORS: {SUBMISSION_ANSWER_PART_TEXTAREA: string, SUBMISSION_ANSWER_PART: string, SUBMITTED_ANSWER_PART: string, HTML_TYPE_PROMPT: string, OPENASSESSMENT_STEPS: string, TEXT_INPUT_TEXTAREA: string, XBLOCK_STUDIO_EDITOR: string}}}
     */
    var CONSTANTS = {
        EVENTS: {
            KEYUP: 'keyup',
            DOMNODEINSERTED: 'DOMNodeInserted'
        },
        SELECTORS: {
            OPENASSESSMENT_STEPS: 'li.openassessment__steps__step',
            TEXT_INPUT_TEXTAREA: '.text-input textarea',
            XBLOCK_STUDIO_EDITOR: '.xblock.xblock-studio_view.xblock-studio_view-openassessment',
            SUBMISSION_ANSWER_PART: 'li.submission__answer__part[data-prompt-type="html-control"]',
            SUBMISSION_ANSWER_PART_TEXTAREA: 'textarea.submission__answer__part__text__value',
            SUBMITTED_ANSWER_PART:'li.submission__answer__part[data-prompt-type="html-control"][data-oa-submitted-part="true"]',
            HTML_TYPE_PROMPT:'[data-prompt-type="html-control"]'
        }
    }, oa_table_builder_init_helpers = {
        oa_response_init: function (event) {
            /**
             * initializing table builder events on response page.
             */
            event.preventDefault();
            if (!$(event.target).is('li')) {
                return;
            }

            $(this).find(CONSTANTS.SELECTORS.SUBMISSION_ANSWER_PART).each(function (index, oa_block_li) {

                var loop_counter = $(oa_block_li).data('loop-counter'),
                    oa_block_id = "#submission__answer__part__description__" + loop_counter,
                    oa_block_saved_id = "#submission__answer__part__saved__state__" + loop_counter;
                var oa_block = $(oa_block_li).find(oa_block_id),
                    oa_block_saved = $(oa_block_li).find(oa_block_saved_id);
                var oa_table_td_list = $(oa_block).find('td');
                var textarea = $(oa_block_li)
                    .find(CONSTANTS.SELECTORS.SUBMISSION_ANSWER_PART_TEXTAREA)
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
            /**
             * initializing submitted table response for submitted assessments.
             */
            if (!$(event.target).is('li')) {
                return;
            }
            $(this).find(CONSTANTS.SELECTORS.SUBMITTED_ANSWER_PART).each(function (index, oa_block_submitted_li) {
                var loop_counter = $(oa_block_submitted_li).data('loop-counter'),
                    submission_div_id = "[data-section-id='submission__answer__part__description__" + loop_counter + "_div']";
                $(oa_block_submitted_li).find(submission_div_id).initORATableCheckbox('checkbox-input', true);
                $(oa_block_submitted_li).find(submission_div_id).oaTable();
            });
        },
        oa_prompt_edit_init: function () {
            /**
             * initializing edit prompt view.
             */
            $(this).find(CONSTANTS.SELECTORS.HTML_TYPE_PROMPT).each(function (index, prompt) {
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
            /**
             * updated table html on input in textarea of input type custom field.
             */
            var element = $(this);
            $(element).next().text($(element).val());
        }
    };
    $(document).on(CONSTANTS.EVENTS.KEYUP, CONSTANTS.SELECTORS.TEXT_INPUT_TEXTAREA, oa_table_builder_init_helpers.oa_text_input_field_init);

    $(document).on(CONSTANTS.EVENTS.DOMNODEINSERTED, CONSTANTS.SELECTORS.OPENASSESSMENT_STEPS, oa_table_builder_init_helpers.oa_response_init);

    $(document).on(CONSTANTS.EVENTS.DOMNODEINSERTED, CONSTANTS.SELECTORS.OPENASSESSMENT_STEPS, oa_table_builder_init_helpers.oa_submitted_response_init)

    $(document).on(CONSTANTS.EVENTS.DOMNODEINSERTED, CONSTANTS.SELECTORS.XBLOCK_STUDIO_EDITOR, oa_table_builder_init_helpers.oa_prompt_edit_init);
})();
