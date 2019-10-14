from django.conf.urls import url
from openassessment.fileupload.views_filesystem import filesystem_storage

urlpatterns =[
    url(r'^(?P<key>.+)/$', filesystem_storage, name='openassessment-filesystem-storage'),
]
