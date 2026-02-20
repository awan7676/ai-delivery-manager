from django.db import models


class Team(models.Model):
    name = models.CharField(max_length=120)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Member(models.Model):
    team = models.ForeignKey(Team, on_delete=models.SET_NULL, null=True, blank=True, related_name='members')
    name = models.CharField(max_length=120)
    email = models.EmailField(blank=True)
    role = models.CharField(max_length=80, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class PullRequest(models.Model):
    repo = models.CharField(max_length=200, blank=True)
    title = models.CharField(max_length=255)
    author = models.ForeignKey(Member, on_delete=models.SET_NULL, null=True, blank=True)
    status = models.CharField(max_length=30, default='Open')
    url = models.URLField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"PR: {self.title} ({self.status})"


class Ticket(models.Model):
    STATUS_CHOICES = [
        ('TODO', 'To Do'),
        ('IN_PROGRESS', 'In Progress'),
        ('IN_REVIEW', 'In Review'),
        ('DONE', 'Done'),
        ('BLOCKED', 'Blocked'),
    ]

    key = models.CharField(max_length=20, unique=True)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='TODO')
    assignee = models.ForeignKey(Member, on_delete=models.SET_NULL, null=True, blank=True, related_name='tickets')
    priority = models.CharField(max_length=30, blank=True)
    due_date = models.DateField(null=True, blank=True)
    prs = models.ManyToManyField(PullRequest, blank=True, related_name='tickets')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.key} - {self.title}"


class Dependency(models.Model):
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name='dependencies')
    depends_on = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name='dependents')
    note = models.CharField(max_length=255, blank=True)

    class Meta:
        unique_together = ('ticket', 'depends_on')

    def __str__(self):
        return f"{self.ticket.key} depends on {self.depends_on.key}"
