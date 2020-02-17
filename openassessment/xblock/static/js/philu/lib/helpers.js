$(document).on("keyup",".text-input textarea", function(){
    var element = $(this);
    $(element).next().text($(element).val());
});