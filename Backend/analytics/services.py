from django.db.models import Avg, Min, Max
from django.utils import timezone
from workflows.models import WorkflowRunLog
from agents.models import AgentCallLog
from .models import PerformanceMetric

class LoggingService:
    @staticmethod
    def log_workflow(workflow_run, level, message, metadata=None, node_execution=None):
        WorkflowRunLog.objects.create(
            workflow_run=workflow_run,
            node_execution=node_execution,
            level=level,
            message=message,
            metadata=metadata or {}
        )
    
    @staticmethod
    def log_agent_call(agent_definition, provider, model, tokens_in, tokens_out, 
                       latency_ms, prompt, response, workflow_run=None, node_execution=None, **kwargs):
        # We'll assume costs are calculated elsewhere or simplified here for now
        # Cost calculation logic would go here
        
        AgentCallLog.objects.create(
            agent_definition=agent_definition,
            workflow_run=workflow_run,
            node_execution=node_execution,
            provider=provider,
            model=model,
            tokens_input=tokens_in,
            tokens_output=tokens_out,
            tokens_total=tokens_in + tokens_out,
            latency_ms=latency_ms,
            prompt=prompt,
            response=response,
            **kwargs
        )

class MetricsService:
    @staticmethod
    def record_metric(metric_type, resource_id, resource_type, value, organization, metadata=None):
        PerformanceMetric.objects.create(
            metric_type=metric_type,
            resource_id=resource_id,
            resource_type=resource_type,
            value=value,
            organization=organization,
            metadata=metadata or {}
        )
    
    @staticmethod
    def get_metrics_summary(organization, metric_type, start_date, end_date):
        metrics = PerformanceMetric.objects.filter(
            organization=organization,
            metric_type=metric_type,
            timestamp__range=[start_date, end_date]
        )
        
        if not metrics.exists():
            return {
                'count': 0, 'avg': 0, 'min': 0, 'max': 0, 'p50': 0, 'p95': 0
            }
            
        return {
            'count': metrics.count(),
            'avg': metrics.aggregate(Avg('value'))['value__avg'],
            'min': metrics.aggregate(Min('value'))['value__min'],
            'max': metrics.aggregate(Max('value'))['value__max'],
            # Simplified percentile calculation for SQLite/Dev
            'p50': metrics.order_by('value')[metrics.count() // 2].value,
            'p95': metrics.order_by('value')[int(metrics.count() * 0.95)].value,
        }
