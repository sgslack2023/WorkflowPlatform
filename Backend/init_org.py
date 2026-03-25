import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'platform_back.settings')
django.setup()

from core.models import Organization, Membership, User
from apps_runtime.models import AppDefinition

# 1. Create Default Organization if not exists
org, created = Organization.objects.get_or_create(
    slug='default-org',
    defaults={'name': 'Default Organization'}
)
if created:
    print(f"Created Default Organization: {org.name}")
else:
    print(f"Using existing Organization: {org.name}")

# 2. Add all users to this organization
for user in User.objects.all():
    membership, created = Membership.objects.get_or_create(
        user=user,
        organization=org,
        defaults={'role': 'owner'}
    )
    if created:
        print(f"Added user {user.username} to {org.name}")

# 3. Update existing apps with no organization
orphans = AppDefinition.objects.filter(organization__isnull=True)
count = orphans.count()
orphans.update(organization=org)
print(f"Updated {count} orphaned apps with the default organization.")

# 4. Update existing workflows with no organization
from workflows.models import Workflow
wf_orphans = Workflow.objects.filter(organization__isnull=True)
wf_count = wf_orphans.count()
wf_orphans.update(organization=org)
print(f"Updated {wf_count} orphaned workflows with the default organization.")
