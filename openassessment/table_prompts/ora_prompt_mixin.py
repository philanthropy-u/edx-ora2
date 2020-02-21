from webob import Response
from xblock.core import XBlock
from django.core import serializers
from .models import PromptHtmlTemplate


class OraPromptMixin(object):

    @XBlock.handler
    def get_prompt_templates(self, data, suffix=''):
        """
        Returns:
             Return the list of html templates.
        """
        html_templates_values = serializers.serialize('json', PromptHtmlTemplate.objects.all())
        return Response(html_templates_values)
