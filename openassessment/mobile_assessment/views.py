# -*- coding: utf-8 -*-
from __future__ import unicode_literals
from .models import AssessmentTemplate

from django.shortcuts import render
from django.http import JsonResponse


def assessment_templates(self, request):
    assessment_templates_list = AssessmentTemplate.objects.all()
    return JsonResponse(assessment_templates_list)
