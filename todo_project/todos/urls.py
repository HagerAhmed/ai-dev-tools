from django.urls import path
from . import views

urlpatterns = [
    path("", views.home, name="home"),
    path("toggle/<int:id>/", views.toggle_complete, name="toggle"),
    path("delete/<int:id>/", views.delete_task, name="delete"),
    path("edit/<int:id>/", views.edit_task, name="edit"),
]
