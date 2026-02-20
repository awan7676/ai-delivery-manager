from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import Team, Member, Ticket, PullRequest, Dependency
from .serializers import (
    TeamSerializer,
    MemberSerializer,
    TicketSerializer,
    PullRequestSerializer,
    DependencySerializer,
)
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.utils.crypto import get_random_string
import logging

logger = logging.getLogger(__name__)


def _generate_key():
    # simple key generator PROJ-<random>
    suffix = get_random_string(4).upper()
    return f"PROJ-{suffix}"


@api_view(["GET", "POST"])
def teams_list_create(request):
    if request.method == "GET":
        teams = Team.objects.all()
        return Response(TeamSerializer(teams, many=True).data)
    serializer = TeamSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "POST"])
def members_list_create(request):
    if request.method == "GET":
        members = Member.objects.all()
        return Response(MemberSerializer(members, many=True).data)
    serializer = MemberSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "POST"])
def tickets_list_create(request):
    if request.method == "GET":
        qs = Ticket.objects.all().order_by('-created_at')
        # simple filters
        status_q = request.query_params.get('status')
        assignee_q = request.query_params.get('assignee_id') or request.query_params.get('assignee')
        if status_q:
            qs = qs.filter(status=status_q)
        if assignee_q:
            try:
                qs = qs.filter(assignee__id=int(assignee_q))
            except ValueError:
                pass
        data = TicketSerializer(qs, many=True).data
        return Response(data)

    data = request.data.copy()
    with transaction.atomic():
        # generate unique key
        data['key'] = _generate_key()
        # allow passing assignee id
        assignee_id = data.pop('assignee', None)
        serializer = TicketSerializer(data=data)
        if serializer.is_valid():
            ticket = serializer.save()
            if assignee_id:
                try:
                    member = Member.objects.get(id=assignee_id)
                    ticket.assignee = member
                    ticket.save()
                except Member.DoesNotExist:
                    pass
            return Response(TicketSerializer(ticket).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "PUT", "PATCH", "DELETE"])
def ticket_partial_update(request, pk):
    ticket = get_object_or_404(Ticket, pk=pk)
    logger.info("ticket_partial_update called for id=%s method=%s data=%s", pk, request.method, request.data)

    if request.method == "GET":
        return Response(TicketSerializer(ticket).data)

    if request.method == "DELETE":
        logger.info("Deleting ticket id=%s key=%s", ticket.id, ticket.key)
        ticket.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    data = request.data.copy()
    # handle assignee by id
    assignee_id = data.get('assignee')
    if assignee_id is not None:
        if assignee_id == "" or assignee_id is None:
            ticket.assignee = None
        else:
            try:
                member = Member.objects.get(id=assignee_id)
                ticket.assignee = member
            except Member.DoesNotExist:
                ticket.assignee = None
    # PR linking: accept pr_id to associate
    pr_id = data.get('pr_id')
    if pr_id:
        try:
            pr = PullRequest.objects.get(id=pr_id)
            ticket.prs.add(pr)
        except PullRequest.DoesNotExist:
            pass

    # update fields
    title = data.get('title')
    description = data.get('description')
    status_val = data.get('status')
    if title is not None:
        ticket.title = title
    if description is not None:
        ticket.description = description
    if status_val is not None:
        logger.info("Updating ticket id=%s from status=%s to status=%s", ticket.id, ticket.status, status_val)
        ticket.status = status_val
    ticket.save()
    logger.info("Saved ticket id=%s status=%s assignee=%s", ticket.id, ticket.status, getattr(ticket.assignee, 'id', None))
    return Response(TicketSerializer(ticket).data)


@api_view(["GET"])
def debug_ticket_statuses(request):
    """Return ticket keys, statuses, and their dependencies with depended-on status for debugging."""
    tickets = Ticket.objects.all().order_by('key')
    out = []
    for t in tickets:
        deps = []
        for d in t.dependencies.all():
            deps.append({
                'depends_on_id': d.depends_on.id,
                'depends_on_key': d.depends_on.key,
                'depends_on_status': d.depends_on.status,
            })
        out.append({
            'id': t.id,
            'key': t.key,
            'title': t.title,
            'status': t.status,
            'assignee_id': getattr(t.assignee, 'id', None),
            'assignee_name': getattr(t.assignee, 'name', None),
            'dependencies': deps,
        })
    return Response(out)


@api_view(["GET", "POST"])
def prs_list_create(request):
    if request.method == "GET":
        prs = PullRequest.objects.all()
        return Response(PullRequestSerializer(prs, many=True).data)
    serializer = PullRequestSerializer(data=request.data)
    if serializer.is_valid():
        pr = serializer.save()
        # optional link to ticket
        ticket_id = request.data.get('ticket_id')
        if ticket_id:
            try:
                ticket = Ticket.objects.get(id=ticket_id)
                pr.tickets.add(ticket)
            except Ticket.DoesNotExist:
                pass
        return Response(PullRequestSerializer(pr).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
def dependencies_create(request):
    serializer = DependencySerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
def aggregate_project(request):
    # return simple aggregate for reports: tickets, prs, blockers
    tickets = Ticket.objects.all()
    prs = PullRequest.objects.all()
    blockers = [
        {"key": t.key, "title": t.title, "reason": ", ".join([d.depends_on.key for d in t.dependencies.all()])}
        for t in tickets if t.dependencies.exists()
    ]
    return Response({
        'tickets': TicketSerializer(tickets, many=True).data,
        'prs': PullRequestSerializer(prs, many=True).data,
        'blockers': blockers,
    })
