from datetime import datetime, timedelta
from pytz import utc

from django.conf import settings
from django.core.management.base import BaseCommand

from cms.djangoapps.contentstore.utils import get_lms_link_for_item
from common.lib.mandrill_client.client import MandrillClient
from opaque_keys.edx.keys import CourseKey, UsageKey
from opaque_keys.edx.locator import BlockUsageLocator
from openassessment.workflow.api import _get_workflow_model
from openedx.core.djangoapps.content.course_overviews.models import CourseOverview
from student.models import AnonymousUserId
from submissions import api as sub_api


class Command(BaseCommand):
    """
    Sends email to all learners who have not completed their peer assessments
    """
    help = 'Reminds all learners to complete peer assessments'

    def handle(self, *args, **options):
        course_overviews = CourseOverview.objects.all()
        for overview in course_overviews:
            course_key = overview.id
            course_end_date = overview.end
            course_name = overview.display_name

            date_now = datetime.now(utc).date()

            if course_end_date and (course_end_date - timedelta(days=7)).date() == date_now:
                submissions = sub_api.get_all_course_submission_information(
                    course_key.to_deprecated_string(),
                    'openassessment'
                )

                for sub in submissions:
                    student_item, submission, score = sub
                    # check if student has yet to complete peer assessments
                    has_completed_peer_assessment = _get_workflow_model(
                        submission['uuid']).status_details()['peer']['complete']

                    # get user from anonymous user id
                    learner = AnonymousUserId.objects.get(anonymous_user_id=student_item['student_id']).user
                    full_name = '{} {}'.format(learner.first_name, learner.last_name)

                    # usage_key to get location of ora2 xblock in the course
                    usage_key = UsageKey.from_string(student_item['item_id']).map_into_course(course_key)

                    assignment_block_location = "{lms_base}/courses/{course_key}/jump_to/{location}".format(
                        lms_base=settings.LMS_BASE,
                        course_key=course_key.to_deprecated_string(),
                        location=usage_key.to_deprecated_string()
                    )

                    if not has_completed_peer_assessment:
                        MandrillClient().send_mail(
                            MandrillClient.REMIND_LEARNERS_TEMPLATE,
                            learner.email,
                            {
                                'full_name': full_name,
                                'course_name': course_name,
                                'assignment_block_location': assignment_block_location
                            }
                        )
