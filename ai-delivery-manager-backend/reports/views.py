from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from . import summary_builder
import logging

logger = logging.getLogger(__name__)


@api_view(["POST"])
def daily_standup(request):
    logger.info("Generating daily standup report")
    data = summary_builder.build_daily_standup()
    return Response(data)


@api_view(["POST"])
def weekly_client(request):
    logger.info("Generating weekly client report")
    data = summary_builder.build_weekly_client()
    return Response(data)


@api_view(["POST"])
def rewrite_summary(request):
    tone = request.data.get("tone", "client")
    text = request.data.get("text", "")
    data = summary_builder.rewrite_summary(tone, text)
    return Response(data)


@api_view(["POST"])
def risk_analysis(request):
    data = summary_builder.analyze_risks()
    return Response(data)


@api_view(["GET"])
def dashboard_stats(request):
    """Aggregate stats for the dashboard home page."""
    data = summary_builder.get_dashboard_stats()
    return Response(data)
