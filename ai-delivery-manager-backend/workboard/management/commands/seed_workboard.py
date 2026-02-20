from django.core.management.base import BaseCommand
from workboard.models import Team, Member, Ticket, PullRequest, Dependency
from django.utils import timezone
import datetime


class Command(BaseCommand):
    help = 'Seed workboard with demo teams, members, tickets, PRs, and dependencies'

    def handle(self, *args, **options):
        self.stdout.write('Seeding workboard demo data...')
        Team.objects.all().delete()
        Member.objects.all().delete()
        Ticket.objects.all().delete()
        PullRequest.objects.all().delete()
        Dependency.objects.all().delete()

        team = Team.objects.create(name='Alpha Squad', description='Core delivery team for the client portal project')

        alice = Member.objects.create(name='Ali Hassan', email='ali@example.com', team=team, role='Backend Engineer')
        sara = Member.objects.create(name='Sara Khan', email='sara@example.com', team=team, role='Frontend Engineer')
        pm = Member.objects.create(name='Priya Sharma', email='priya@example.com', team=team, role='Project Manager')
        devops = Member.objects.create(name='James Lee', email='james@example.com', team=team, role='DevOps Engineer')

        # Pull Requests
        pr1 = PullRequest.objects.create(repo='frontend', title='Add dashboard layout and navigation', author=sara, status='Merged')
        pr2 = PullRequest.objects.create(repo='backend', title='Create auth endpoints: /login, /logout, /refresh', author=alice, status='Open')
        pr3 = PullRequest.objects.create(repo='frontend', title='User profile page with avatar upload', author=sara, status='Merged')
        pr4 = PullRequest.objects.create(repo='infra', title='Setup CI/CD pipeline with GitHub Actions', author=devops, status='Merged')
        pr5 = PullRequest.objects.create(repo='backend', title='WIP: Payment gateway integration', author=alice, status='Draft')
        pr6 = PullRequest.objects.create(repo='frontend', title='Mobile responsive layout fixes', author=sara, status='Open')
        pr7 = PullRequest.objects.create(repo='backend', title='Notification service: email + push', author=pm, status='Open')

        today = datetime.date.today()

        # Tickets
        t1 = Ticket.objects.create(
            key='PROJ-101', title='Implement login API',
            description='Create login endpoints and integrate OAuth with Azure AD. Includes JWT issuance and refresh flow.',
            status='IN_PROGRESS', assignee=alice, priority='High',
            due_date=today - datetime.timedelta(days=5),  # overdue
        )
        t1.prs.add(pr2)

        t2 = Ticket.objects.create(
            key='PROJ-102', title='Client dashboard UI',
            description='Design and implement the main client dashboard with widgets for KPIs, charts, and activity feed.',
            status='DONE', assignee=sara, priority='High',
            due_date=today - datetime.timedelta(days=10),
        )
        t2.prs.add(pr1)

        t3 = Ticket.objects.create(
            key='PROJ-103', title='Payment gateway integration',
            description='Integrate Stripe payment gateway for subscription billing. Requires PROJ-101 to be completed first.',
            status='BLOCKED', assignee=alice, priority='Critical',
            due_date=today - datetime.timedelta(days=2),  # overdue
        )
        t3.prs.add(pr5)

        t4 = Ticket.objects.create(
            key='PROJ-104', title='Notification service',
            description='Build email and push notification service. Supports templates for transactional emails.',
            status='IN_PROGRESS', assignee=pm, priority='Medium',
            due_date=today + datetime.timedelta(days=2),
        )
        t4.prs.add(pr7)

        t5 = Ticket.objects.create(
            key='PROJ-105', title='User profile page',
            description='Build user profile page with avatar upload, personal settings, and notification preferences.',
            status='DONE', assignee=sara, priority='Low',
            due_date=today - datetime.timedelta(days=12),
        )
        t5.prs.add(pr3)

        t6 = Ticket.objects.create(
            key='PROJ-106', title='API rate limiting',
            description='Implement request rate limiting using Django Ratelimit. Protect all public endpoints.',
            status='TODO', assignee=alice, priority='Medium',
            due_date=today + datetime.timedelta(days=5),
        )

        t7 = Ticket.objects.create(
            key='PROJ-107', title='Mobile responsive layout',
            description='Fix responsive breakpoints for tablet and mobile views. Affects all pages.',
            status='IN_PROGRESS', assignee=sara, priority='High',
            due_date=today - datetime.timedelta(days=6),  # overdue
        )
        t7.prs.add(pr6)

        t8 = Ticket.objects.create(
            key='PROJ-108', title='End-to-end testing setup',
            description='Configure Playwright for E2E tests. Write tests for login, dashboard, and payment flows.',
            status='TODO', assignee=pm, priority='Low',
            due_date=today + datetime.timedelta(days=8),
        )

        t9 = Ticket.objects.create(
            key='PROJ-109', title='Security audit & vulnerability fixes',
            description='Run OWASP ZAP scan and address findings. Compliance team sign-off required.',
            status='BLOCKED', assignee=alice, priority='Critical',
            due_date=today - datetime.timedelta(days=3),  # overdue
        )

        t10 = Ticket.objects.create(
            key='PROJ-110', title='Deployment pipeline (CI/CD)',
            description='Automated build, test, and deploy pipeline using GitHub Actions and AWS ECS.',
            status='DONE', assignee=devops, priority='High',
            due_date=today - datetime.timedelta(days=15),
        )
        t10.prs.add(pr4)

        # Dependencies
        Dependency.objects.create(ticket=t3, depends_on=t1, note='Payment flow requires auth API to be fully implemented')
        Dependency.objects.create(ticket=t8, depends_on=t2, note='E2E tests need dashboard UI to be stable')
        Dependency.objects.create(ticket=t9, depends_on=t1, note='Security audit scope includes auth endpoints')

        self.stdout.write(self.style.SUCCESS(
            'Seeded: 1 team, 4 members, 7 PRs, 10 tickets, 3 dependencies'
        ))
