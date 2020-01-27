# -*- coding: utf-8 -*-
from __future__ import unicode_literals
from django.db import models


class AssessmentTemplate(models.Model):
    """
    Model for Storing the HTML templates for ORA Peer Assessment
    """
    title = models.CharField(max_length=500)
    content = models.TextField()

