from django.conf.urls import url

urlpatterns = [
    url(
        r'^(?P<student_id>[^/]+)/(?P<course_id>[^/]+)/(?P<item_id>[^/]+)$',
        'openassessment.assessment.views.get_evaluations_for_student_item'
    ),
]
