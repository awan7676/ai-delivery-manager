from django.core.management.base import BaseCommand
from workboard.models import Team, Member, Ticket, PullRequest, Dependency
from django.utils import timezone
from django.utils.crypto import get_random_string
import random


TICKET_TITLES = [
    'Refactor auth flow',
    'Improve dashboard performance',
    'Add unit tests for payments',
    'Integrate analytics',
    'Fix caching bug',
    'Upgrade dependencies',
    'Add feature flag for beta',
    'Investigate memory leak',
    'Improve logging',
    'Add retry logic for webhooks',
]

PR_TITLES = [
    'WIP: perf improvements',
    'Fix: test flake',
    'Feat: add analytics',
    'Chore: bump libs',
    'Docs: update README',
]


class Command(BaseCommand):
    help = 'Augment workboard with additional randomized tickets, PRs, and dependencies (no destructive changes)'

    def add_arguments(self, parser):
        parser.add_argument('--tickets', type=int, default=5, help='Number of tickets to create')
        parser.add_argument('--prs', type=int, default=5, help='Number of PRs to create')

    def handle(self, *args, **options):
        tcount = options.get('tickets', 5)
        pcount = options.get('prs', 5)

        team = Team.objects.first() or Team.objects.create(name='Demo Team', description='Auto-created')
        members = list(Member.objects.all())
        if not members:
            members = [Member.objects.create(name=f'User{get_random_string(3)}', team=team) for _ in range(3)]

        created_prs = []
        for i in range(pcount):
            title = random.choice(PR_TITLES) + f' {get_random_string(3)}'
            author = random.choice(members)
            pr = PullRequest.objects.create(repo=random.choice(['frontend','backend','infra']), title=title, author=author, status=random.choice(['Open','Closed','Merged']))
            created_prs.append(pr)

        existing_tickets = list(Ticket.objects.all())
        for i in range(tcount):
            key = f'PROJ-{get_random_string(4).upper()}'
            title = random.choice(TICKET_TITLES) + f' {get_random_string(2)}'
            assignee = random.choice(members)
            status = random.choice(['TODO','IN_PROGRESS','IN_REVIEW','DONE','BLOCKED'])
            ticket = Ticket.objects.create(key=key, title=title, description='Auto-generated task', status=status, assignee=assignee)
            # link a random PR
            if created_prs and random.random() < 0.6:
                ticket.prs.add(random.choice(created_prs))
            existing_tickets.append(ticket)

        # create some random dependencies
        if len(existing_tickets) > 1:
            for _ in range(max(1, tcount // 3)):
                a = random.choice(existing_tickets)
                b = random.choice(existing_tickets)
                if a.id != b.id:
                    try:
                        Dependency.objects.create(ticket=a, depends_on=b, note='Auto-dependency')
                    except Exception:
                        pass

        self.stdout.write(self.style.SUCCESS(f'Created {tcount} tickets and {pcount} PRs (approx)'))
