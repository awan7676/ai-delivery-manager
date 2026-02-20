from rest_framework import serializers
from .models import Team, Member, Ticket, PullRequest, Dependency


class TeamSerializer(serializers.ModelSerializer):
    class Meta:
        model = Team
        fields = '__all__'


class MemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = Member
        fields = '__all__'


class PullRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = PullRequest
        fields = '__all__'


class TicketSerializer(serializers.ModelSerializer):
    prs = PullRequestSerializer(many=True, read_only=True)
    assignee = MemberSerializer(read_only=True)

    class Meta:
        model = Ticket
        fields = '__all__'


class DependencySerializer(serializers.ModelSerializer):
    class Meta:
        model = Dependency
        fields = '__all__'
