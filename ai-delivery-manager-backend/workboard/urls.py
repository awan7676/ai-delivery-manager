from django.urls import path
from . import views

urlpatterns = [
    path('teams/', views.teams_list_create),
    path('members/', views.members_list_create),
    path('tickets/', views.tickets_list_create),
    path('tickets/<int:pk>/', views.ticket_partial_update),
    path('prs/', views.prs_list_create),
    path('dependencies/', views.dependencies_create),
    path('aggregate/', views.aggregate_project),
    path('debug/ticket_statuses/', views.debug_ticket_statuses),
]
