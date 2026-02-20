from django.contrib import admin
from .models import Team, Member, Ticket, PullRequest, Dependency

@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_at')


@admin.register(Member)
class MemberAdmin(admin.ModelAdmin):
    list_display = ('name', 'team', 'email')


@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = ('key', 'title', 'status', 'assignee')
    list_filter = ('status', 'priority')


@admin.register(PullRequest)
class PRAdmin(admin.ModelAdmin):
    list_display = ('title', 'status', 'repo')


@admin.register(Dependency)
class DependencyAdmin(admin.ModelAdmin):
    list_display = ('ticket', 'depends_on')
