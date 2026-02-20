from pathlib import Path
import json
from datetime import datetime
from django.db import models


BASE_DIR = Path(__file__).resolve().parent.parent
MOCK_DIR = BASE_DIR / "data_sources" / "mock_data"


def _load_json(name):
    path = MOCK_DIR / name
    if not path.exists():
        return []
    with open(path, "r", encoding="utf-8") as fh:
        return json.load(fh)


def _try_import_workboard():
    try:
        from workboard.models import Ticket, PullRequest, Member
        return Ticket, PullRequest, Member
    except Exception:
        return None, None, None


def build_daily_standup():
    Ticket, PullRequest, Member = _try_import_workboard()
    # use DB if available
    if Ticket:
        # Yesterday: most recent PR title as proxy for commits
        yesterday = None
        pr = PullRequest.objects.order_by('-created_at').first()
        if pr:
            yesterday = pr.title

        # Today: pick an in-progress ticket title
        in_prog_qs = Ticket.objects.filter(status__in=['IN_PROGRESS']).order_by('-updated_at')
        today_items = []
        for t in in_prog_qs[:5]:
            today_items.append({
                'key': t.key,
                'title': t.title,
                'assignee': t.assignee.name if t.assignee else None,
            })
        if today_items:
            today = f"Continue work on {today_items[0]['title']}"
        else:
            t0 = Ticket.objects.order_by('-created_at').first()
            today = f"Work on {t0.title}" if t0 else "No planned tasks detected"

        # Blockers: consider only tickets that are not DONE and either BLOCKED
        # or have unresolved dependencies (depends_on not DONE). Include assignee.
        blockers = []
        for t in Ticket.objects.exclude(status='DONE'):
            if t.status == 'BLOCKED':
                blockers.append({
                    'key': t.key,
                    'title': t.title,
                    'assignee': t.assignee.name if t.assignee else None,
                    'waiting_on': [],
                })
                continue
            waiting_on = [d.depends_on for d in t.dependencies.all() if d.depends_on.status != 'DONE']
            if waiting_on:
                blockers.append({
                    'key': t.key,
                    'title': t.title,
                    'assignee': t.assignee.name if t.assignee else None,
                    'waiting_on': [w.key for w in waiting_on],
                })

        # Build a friendly blockers text
        if blockers:
            blockers_text = ", ".join([
                f"{b['key']}: {b['title']}" + (f" (assignee: {b['assignee']})" if b['assignee'] else "") + (f" (waiting on {b['waiting_on']})" if b['waiting_on'] else "")
                for b in blockers
            ])
        else:
            blockers_text = "None"

        return {
            "summary": {"yesterday": yesterday or "No recent PRs", "today": today, "blockers": blockers_text},
            "details": {"today_items": today_items, "blockers": blockers},
        }

    # fallback to JSON mocks
    tickets = _load_json("jira_tickets.json")
    commits = _load_json("git_activity.json")
    slack = _load_json("slack_messages.json")

    # Yesterday: most recent commit message
    yesterday = None
    if commits:
        yesterday = commits[-1].get("commit")

    # Today: pick an in-progress ticket title
    today = None
    for t in tickets:
        if t.get("status", "").lower() in ("in progress", "in_progress", "inprogress"):
            today = f"Continue work on {t.get('title')}"
            break
    if not today and tickets:
        today = f"Work on {tickets[0].get('title')}"

    # Blockers: look for slack messages mentioning 'blocked' or 'blocked waiting'
    blockers = []
    for m in slack:
        msg = m.get("message", "").lower()
        if "block" in msg or "blocked" in msg or "waiting for" in msg:
            blockers.append(m.get("message"))
    blockers_text = ", ".join(blockers) if blockers else "None"

    return {
        "summary": {
            "yesterday": yesterday or "No recent commits",
            "today": today or "No planned tasks detected",
            "blockers": blockers_text,
        }
    }


def build_weekly_client():
    Ticket, PullRequest, Member = _try_import_workboard()
    if Ticket:
        tickets = Ticket.objects.all()
        total = tickets.count()
        done = tickets.filter(status='DONE').count()
        progress = f"{int((done / total) * 100) if total>0 else 0}%"

        milestones = list(tickets.filter(status='DONE').values_list('title', flat=True))

        risks = []
        from django.utils import timezone as djtz
        for t in tickets.exclude(status='DONE'):
            if t.due_date:
                try:
                    if t.due_date < djtz.now().date():
                        risks.append(f"{t.title} overdue")
                except Exception:
                    pass

        # include blockers from dependencies where the depended-on ticket isn't DONE
        for t in tickets.exclude(status='DONE').filter(dependencies__isnull=False).distinct():
            waiting = [d.depends_on.key for d in t.dependencies.all() if d.depends_on.status != 'DONE']
            if waiting:
                risks.append(f"{t.key} blocked by {waiting}")

        overview = "The project is progressing; see milestones and risks."
        return {"overview": overview, "progress": progress, "milestones": milestones, "risks": risks}

    # fallback to JSON behavior
    tickets = _load_json("jira_tickets.json")
    commits = _load_json("git_activity.json")
    slack = _load_json("slack_messages.json")

    total = len(tickets)
    done = sum(1 for t in tickets if t.get("status", "").lower() == "done")
    progress = f"{int((done / total) * 100) if total>0 else 0}%"

    milestones = [t.get("title") for t in tickets if t.get("status", "").lower() == "done"]

    risks = []
    for t in tickets:
        if t.get("status", "").lower() not in ("done", "completed"):
            # due date check
            due = t.get("due_date")
            if due:
                try:
                    d = datetime.fromisoformat(due)
                    if d.date() < datetime.utcnow().date():
                        risks.append(f"{t.get('title')} overdue")
                except Exception:
                    pass
    # Slack blockers
    for m in slack:
        msg = m.get("message", "")
        if "block" in msg.lower() or "waiting for" in msg.lower():
            risks.append(msg)

    overview = "The project is progressing; see milestones and risks."

    return {
        "overview": overview,
        "progress": progress,
        "milestones": milestones,
        "risks": risks,
    }


_TONE_TEMPLATES = {
    "client": {
        "prefix": "This week, your team delivered strong results.",
        "suffix": "We remain committed to timely delivery and quality outcomes.",
        "style": "professional and reassuring",
    },
    "technical": {
        "prefix": "Sprint update: engineering metrics and progress follow.",
        "suffix": "Next sprint will focus on resolving blockers and technical debt.",
        "style": "engineering-focused with metrics",
    },
    "executive": {
        "prefix": "Project status: on-track. Key highlights below.",
        "suffix": "Investment is delivering expected ROI. No critical escalations.",
        "style": "concise and outcome-focused",
    },
}

_CLIENT_REPLACEMENTS = [
    ("IN_PROGRESS", "actively in development"),
    ("BLOCKED", "pending resolution"),
    ("DONE", "successfully completed"),
    ("PR", "pull request"),
    ("API", "integration layer"),
    ("backend", "server infrastructure"),
    ("frontend", "user interface"),
    ("bug", "issue"),
    ("error", "anomaly"),
    ("crash", "unexpected behaviour"),
]


def _transform_text_for_tone(tone: str, text: str) -> str:
    result = text
    if tone == "client":
        for tech, friendly in _CLIENT_REPLACEMENTS:
            result = result.replace(tech, friendly)
        result = result.replace("fix", "resolve").replace("Fix", "Resolve")
    elif tone == "technical":
        result = result.replace("issue", "bug").replace("resolve", "fix").replace("Resolve", "Fix")
    elif tone == "executive":
        # Keep it short — truncate to first 2 sentences
        sentences = result.replace("  ", " ").split(". ")
        result = ". ".join(sentences[:3]).strip()
        if not result.endswith("."):
            result += "."
    return result


def rewrite_summary(tone: str, text: str = None):
    base = text or "This week we made solid progress. Several features were completed and blockers were resolved. The team is on track for the upcoming milestone."

    if tone == "all":
        results = {}
        for t in ["client", "technical", "executive"]:
            tmpl = _TONE_TEMPLATES[t]
            transformed = _transform_text_for_tone(t, base)
            rewritten = f"{tmpl['prefix']} {transformed} {tmpl['suffix']}"
            results[t] = {"tone": t, "style": tmpl["style"], "rewritten_summary": rewritten}
        return {"all_tones": results}

    tone = tone if tone in _TONE_TEMPLATES else "client"
    tmpl = _TONE_TEMPLATES[tone]
    transformed = _transform_text_for_tone(tone, base)
    rewritten = f"{tmpl['prefix']} {transformed} {tmpl['suffix']}"
    return {"tone": tone, "style": tmpl["style"], "rewritten_summary": rewritten}


def analyze_risks():
    Ticket, PullRequest, Member = _try_import_workboard()
    risks = []

    if Ticket:
        from django.utils import timezone as djtz
        today = djtz.now().date()

        # Overdue tickets
        for t in Ticket.objects.exclude(status="DONE"):
            if t.due_date and t.due_date < today:
                days_overdue = (today - t.due_date).days
                severity = "critical" if days_overdue > 7 else "high" if days_overdue > 3 else "medium"
                risks.append({
                    "type": "overdue",
                    "severity": severity,
                    "ticket": t.key,
                    "description": f"{t.key} '{t.title}' is {days_overdue} day(s) overdue",
                    "assignee": t.assignee.name if t.assignee else "Unassigned",
                })

        # Blocked tickets
        for t in Ticket.objects.filter(status="BLOCKED"):
            risks.append({
                "type": "blocked",
                "severity": "high",
                "ticket": t.key,
                "description": f"{t.key} '{t.title}' is blocked",
                "assignee": t.assignee.name if t.assignee else "Unassigned",
            })

        # Dependency blockers
        for t in Ticket.objects.exclude(status="DONE").filter(dependencies__isnull=False).distinct():
            blocking_deps = [d.depends_on for d in t.dependencies.all() if d.depends_on.status != "DONE"]
            if blocking_deps:
                keys = [d.key for d in blocking_deps]
                risks.append({
                    "type": "dependency",
                    "severity": "medium",
                    "ticket": t.key,
                    "description": f"{t.key} '{t.title}' is waiting on {keys}",
                    "assignee": t.assignee.name if t.assignee else "Unassigned",
                })

        # High priority in-progress tickets
        for t in Ticket.objects.filter(status="IN_PROGRESS", priority="HIGH"):
            risks.append({
                "type": "high_priority",
                "severity": "low",
                "ticket": t.key,
                "description": f"{t.key} '{t.title}' is high-priority and still in progress",
                "assignee": t.assignee.name if t.assignee else "Unassigned",
            })

    else:
        # JSON fallback
        tickets = _load_json("jira_tickets.json")
        slack = _load_json("slack_messages.json")
        for t in tickets:
            if t.get("status", "").lower() not in ("done", "completed"):
                due = t.get("due_date")
                if due:
                    try:
                        d = datetime.fromisoformat(due)
                        if d.date() < datetime.utcnow().date():
                            risks.append({"type": "overdue", "severity": "high", "ticket": t.get("key", ""), "description": f"{t.get('title')} overdue"})
                    except Exception:
                        pass
        for m in slack:
            msg = m.get("message", "")
            if "block" in msg.lower() or "waiting for" in msg.lower():
                risks.append({"type": "blocked", "severity": "medium", "ticket": "", "description": msg})

    if not risks:
        risks = [{"type": "none", "severity": "low", "ticket": "", "description": "No immediate risks detected", "assignee": "N/A"}]

    # Sort by severity
    order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    risks.sort(key=lambda r: order.get(r.get("severity", "low"), 3))

    return {"risks": risks, "summary": {"total": len(risks), "by_type": {r["type"]: sum(1 for x in risks if x["type"] == r["type"]) for r in risks}}}


def get_dashboard_stats():
    Ticket, PullRequest, Member = _try_import_workboard()
    from django.utils import timezone as djtz

    if not Ticket:
        return {
            "total_tickets": 0, "done": 0, "in_progress": 0, "blocked": 0, "todo": 0,
            "total_prs": 0, "open_prs": 0, "merged_prs": 0,
            "total_members": 0, "overdue_tickets": 0,
            "progress_percent": 0, "health": "unknown",
            "recent_activity": [], "top_risks": [],
        }

    today = djtz.now().date()
    tickets = Ticket.objects.all()
    total = tickets.count()
    done = tickets.filter(status="DONE").count()
    in_progress = tickets.filter(status="IN_PROGRESS").count()
    blocked = tickets.filter(status="BLOCKED").count()
    todo = tickets.filter(status="TODO").count()
    overdue = tickets.exclude(status="DONE").filter(due_date__lt=today).count()

    prs = PullRequest.objects.all()
    total_prs = prs.count()
    open_prs = prs.filter(status="OPEN").count()
    merged_prs = prs.filter(status="MERGED").count()

    total_members = Member.objects.count()

    progress_percent = int((done / total) * 100) if total > 0 else 0

    # Health indicator
    if overdue > 3 or blocked > 2:
        health = "at_risk"
    elif overdue > 1 or blocked > 0:
        health = "needs_attention"
    else:
        health = "on_track"

    # Recent activity: last 5 merged PRs or recent tickets
    recent_activity = []
    for pr in PullRequest.objects.order_by("-created_at")[:5]:
        recent_activity.append({
            "type": "pr",
            "title": pr.title,
            "author": pr.author.name if pr.author else "Unknown",
            "status": pr.status,
            "date": pr.created_at.strftime("%Y-%m-%d") if pr.created_at else "",
        })

    # Top risks (overdue + blocked)
    top_risks = []
    for t in tickets.exclude(status="DONE").filter(due_date__lt=today).order_by("due_date")[:3]:
        days = (today - t.due_date).days
        top_risks.append({
            "key": t.key,
            "title": t.title,
            "type": "overdue",
            "severity": "critical" if days > 7 else "high",
            "detail": f"{days}d overdue",
            "assignee": t.assignee.name if t.assignee else "Unassigned",
        })
    for t in tickets.filter(status="BLOCKED")[:3]:
        top_risks.append({
            "key": t.key,
            "title": t.title,
            "type": "blocked",
            "severity": "high",
            "detail": "Blocked",
            "assignee": t.assignee.name if t.assignee else "Unassigned",
        })

    return {
        "total_tickets": total,
        "done": done,
        "in_progress": in_progress,
        "blocked": blocked,
        "todo": todo,
        "total_prs": total_prs,
        "open_prs": open_prs,
        "merged_prs": merged_prs,
        "total_members": total_members,
        "overdue_tickets": overdue,
        "progress_percent": progress_percent,
        "health": health,
        "recent_activity": recent_activity,
        "top_risks": top_risks,
    }
