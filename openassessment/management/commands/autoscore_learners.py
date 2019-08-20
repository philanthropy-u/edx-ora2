import hashlib
import logging
from datetime import datetime, timedelta

from django.conf import settings
from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from django.db import transaction
from opaque_keys.edx.locations import SlashSeparatedCourseKey
from openassessment.assessment.models import Assessment, AssessmentPart
from openassessment.assessment.serializers import rubric_from_dict
from openassessment.workflow.api import get_users_who_not_assessed
from openedx.core.djangoapps.content.course_overviews.models import CourseOverview
from openedx.core.djangoapps.content.course_structures.models import CourseStructure
from openedx.core.lib.url_utils import unquote_slashes
from pytz import utc
from submissions.api import reset_score, set_score
from submissions.models import Submission
from xmodule.modulestore.django import modulestore
from openedx.features.assessment.helpers import autoscore_ora
logger = logging.getLogger(__name__)


# noinspection PyMethodMayBeStatic
class Command(BaseCommand):
    """
    Auto score learners in the waiting state at the time when course ends.
        - For a 3-pt Rubric: User's assignment is graded 2-pt (median), Needs Improvement: 80
        - For a 2-pt Rubric: User's assignment is graded 2-pt (highest), Criteria Met: 100
    """

    @transaction.atomic
    def handle(self, *args, **options):

        print('Hello')

        # bot_user_id = get_philu_bot()

        # filter all courses which end date lies in last 24 hours
        en_date = datetime.now(utc)
        st_date = en_date - timedelta(days=1)
        course_overviews = CourseOverview.objects.filter(end__range=(st_date, en_date))

        for overview in course_overviews:
            course_id = overview.id
            course_name = overview.display_name

            try:
                course_struct = CourseStructure.objects.get(
                    course_id=course_id
                ).structure
            except CourseStructure.DoesNotExist:
                logger.error("Course doesn't have a proper structure.")
                raise

            ora_blocks = []
            for k, v in course_struct['blocks'].iteritems():
                if v['block_type'] == 'openassessment':
                    ora_blocks.append(course_struct['blocks'][k])

            # If course doesn't have any ORA blocks, continue.
            if not ora_blocks:
                continue

            logger.info(
                u"Auto scoring {course_name} learners if there are any!".format(
                    course_name=course_name
                )
            )

            for ora in ora_blocks:
                # Get all students in waiting state
                usage_key = ora['usage_key']

                waiting_students = get_users_who_not_assessed(
                    course_id=course_id.to_deprecated_string(),
                    item_id=usage_key
                )

                for student in waiting_students:
                    user = User.objects.get(id=student['id'])
                    anonymous_user = user.anonymoususerid_set.get(course_id=course_id)
                    student['anonymous_user_id'] = anonymous_user.anonymous_user_id

                    autoscore_ora(course_id, usage_key, student)

                    # # Find the associated rubric for that course_id & item_id
                    # rubric_dict = get_rubric_for_course(course_id, usage_key)
                    #
                    # rubric = rubric_from_dict(rubric_dict)
                    # options_selected, earned, possible = select_options(rubric_dict)
                    #
                    # # Use usage key and student id to get the submission of the user.
                    # try:
                    #     submission = Submission.objects.get(
                    #         student_item__course_id=course_id.to_deprecated_string(),
                    #         student_item__student_id=student['anonymous_user_id'],
                    #         student_item__item_id=usage_key,
                    #         student_item__item_type='openassessment'
                    #     )
                    # except Submission.DoesNotExist:
                    #     logger.warn(u"No submission found for user {user_id}".format(
                    #         user_id=student['anonymous_user_id']
                    #     ))
                    #     continue
                    #
                    # # Create assessments
                    # assessment = Assessment.create(
                    #     rubric=rubric,
                    #     scorer_id=bot_user_id,
                    #     submission_uuid=submission.uuid,
                    #     score_type='ST'
                    # )
                    # AssessmentPart.create_from_option_names(
                    #     assessment=assessment,
                    #     selected=options_selected
                    # )
                    #
                    # logger.info(
                    #     u"Created assessment for user {user_id}, submission {submission}, "
                    #     u"course {course_id}, item {item_id} with rubric {rubric} by PhilU Bot.".format(
                    #         user_id=student['anonymous_user_id'],
                    #         submission=submission.uuid,
                    #         course_id=course_id.to_deprecated_string(),
                    #         item_id=usage_key,
                    #         rubric=rubric.content_hash
                    #     )
                    # )
                    #
                    # reset_score(
                    #     student_id=student['anonymous_user_id'],
                    #     course_id=course_id.to_deprecated_string(),
                    #     item_id=usage_key
                    # )
                    # set_score(
                    #     submission_uuid=submission.uuid,
                    #     points_earned=earned,
                    #     points_possible=possible
                    # )
