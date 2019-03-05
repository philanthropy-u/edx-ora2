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
        bot_user_id = self._get_philu_bot()

        # filter all courses which end date lies in last 24 hours
        en_date = datetime.now(utc)
        st_date = en_date - timedelta(days=1)
        course_overviews = CourseOverview.objects.filter(end__range=(st_date, en_date))

        for overview in course_overviews:
            course_id = overview.id
            course_end_date = overview.end
            course_name = overview.display_name

            # If course end date has met
            if course_end_date and course_end_date <= en_date:
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

                        # Find the associated rubric for that course_id & item_id
                        rubric_dict = self._get_rubric_for_course(course_id, usage_key)

                        rubric = rubric_from_dict(rubric_dict)
                        options_selected, earned, possible = self._select_options(rubric_dict)

                        # Use usage key and student id to get the submission of the user.
                        try:
                            submission = Submission.objects.get(
                                student_item__course_id=course_id.to_deprecated_string(),
                                student_item__student_id=student['anonymous_user_id'],
                                student_item__item_id=usage_key,
                                student_item__item_type='openassessment'
                            )
                        except Submission.DoesNotExist:
                            logger.warn(u"No submission found for user {user_id}".format(
                                user_id=student['anonymous_user_id']
                            ))
                            continue

                        # Create assessments
                        assessment = Assessment.create(
                            rubric=rubric,
                            scorer_id=bot_user_id,
                            submission_uuid=submission.uuid,
                            score_type='ST'
                        )
                        AssessmentPart.create_from_option_names(
                            assessment=assessment,
                            selected=options_selected
                        )

                        logger.info(
                            u"Created assessment for user {user_id}, submission {submission}, "
                            u"course {course_id}, item {item_id} with rubric {rubric} by PhilU Bot.".format(
                                user_id=student['anonymous_user_id'],
                                submission=submission.uuid,
                                course_id=course_id.to_deprecated_string(),
                                item_id=usage_key,
                                rubric=rubric.content_hash
                            )
                        )

                        reset_score(
                            student_id=student['anonymous_user_id'],
                            course_id=course_id.to_deprecated_string(),
                            item_id=usage_key
                        )
                        set_score(
                            submission_uuid=submission.uuid,
                            points_earned=earned,
                            points_possible=possible
                        )

    def _get_philu_bot(self):
        # Check if bot user exist
        philu_bot, _ = User.objects.get_or_create(
            username='philubot',
            defaults={
                'first_name': 'PhilU',
                'last_name': 'Bot',
                'email': 'bot@philanthropyu.org',
                'is_active': True
            }
        )

        # Create anonymized id for the bot
        hasher = hashlib.md5()
        hasher.update(settings.SECRET_KEY)
        hasher.update(unicode(philu_bot.id))
        digest = hasher.hexdigest()

        return digest

    def _select_options(self, rubric_dict):
        criteria = rubric_dict['criteria']
        options_selected = {}
        points_earned = 0
        points_possible = 0

        for crit in criteria:
            options = crit['options']
            points = list(set([o['points'] for o in options]))

            if len(points) > 2:
                # 3 pt rubric
                pt = points[-2]
            else:
                # 2 pt rubric
                pt = points[-1]

            points_earned += pt
            points_possible += max(points)
            # Get a list of all options with the pt value.
            # Some rubrics have multiple options against a single point value.
            # for such cases we are using list here.
            options_selected[crit['name']] = [o['name'] for o in options if o['points'] == pt][0]

        return options_selected, points_earned, points_possible

    def _get_rubric_for_course(self, course_id, usage_key):
        course_id = SlashSeparatedCourseKey.from_deprecated_string(course_id.to_deprecated_string())
        usage_key = course_id.make_usage_key_from_deprecated_string(unquote_slashes(usage_key))

        instance = modulestore().get_item(usage_key)
        return {
            'prompts': instance.prompts,
            'criteria': instance.rubric_criteria
        }
