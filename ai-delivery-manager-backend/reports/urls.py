from django.urls import path
from . import views

urlpatterns = [
    path("daily-standup/", views.daily_standup),
    path("weekly-client/", views.weekly_client),
    path("rewrite/", views.rewrite_summary),
    path("risk-analysis/", views.risk_analysis),
    path("dashboard/", views.dashboard_stats),
]
