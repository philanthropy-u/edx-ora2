/**
 Finds the values currently entered in the Prompts's fields, and returns them.

 Returns:
 object literal of the form:
 {
         'description': 'Write a nice long essay about anything.',
         'prompt_type': 'text | html-content',
         'html_content': 'html string for generated table'
     }
 **/
OpenAssessment.Prompt.prototype.getFieldValues = function () {
    return {
        description: this.description(),
        prompt_type: this.promptType(),
        html_content: this.getHtmlContent(),
    };
}

/**
 *  Get prompt type from current textarea.
 *
 * @returns {string}
 */
OpenAssessment.Prompt.prototype.promptType = function () {
    return $('.openassessment_prompt_description', this.element).data('w-type') || 'text';
}
/**
 * Get html content of table
 *
 * @returns {string|undefined}
 */
OpenAssessment.Prompt.prototype.getHtmlContent = function () {
    return $('.openassessment_prompt_html_content', this.element).first().val();
}
