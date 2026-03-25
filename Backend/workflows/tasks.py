from django_q.tasks import async_task
from .services import WorkflowExecutionService

def execute_workflow_run_task(workflow_run_id):
    """Entry point for Django-Q to execute a workflow run"""
    service = WorkflowExecutionService()
    service.execute_workflow_run(workflow_run_id)

def queue_workflow_run(workflow_run_id):
    """Helper to queue a workflow run for async execution"""
    return async_task('workflows.tasks.execute_workflow_run_task', workflow_run_id)
