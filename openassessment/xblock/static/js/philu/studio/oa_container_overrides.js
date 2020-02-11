/**
 * Adds a new table type prompt.
 * **/
OpenAssessment.Container.prototype.addTable = function () {
    var tablePrompt = $(this.templateTablePromptElement)
        .children().first()
        .clone()
        .removeAttr('id')
        .toggleClass('is--hidden', false)
        .toggleClass(this.containerItemClass, true)
        .appendTo($(this.containerElement));

    var tableConfiguration = {
        change: function (table) {
            var html = table.html();
            tablePrompt.find('.openassessment_prompt_html_content').val(html);
        }
    }

    var table = $(tablePrompt).oraTableBuilder(tableConfiguration);

    // Since we just added the new element to the container,
    // it should be the last one.
    var container = this;
    var containerItem = $("." + this.containerItemClass, this.containerElement).last();

    // Install a click handler for the delete button
    if (this.addRemoveEnabled) {
        containerItem.find('.' + this.removeButtonClass)
            .click(function (eventData) {
                var containerItem = container.createContainerItem(eventData.target);
                container.remove(containerItem);
            });
    } else {
        containerItem.find('.' + this.removeButtonClass).addClass('is--disabled');
    }

    // Initialize the item, allowing it to install event handlers.
    // Fire event handler for adding a new element
    var handlerItem = container.createContainerItem(containerItem);
    handlerItem.addEventListeners();
    handlerItem.addHandler();
}
