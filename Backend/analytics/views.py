from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .services import MetricsService
from core.models import Organization

class AnalyticsViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    
    def _get_organization(self, request):
        # Implementation depends on how organization is passed (header or default membership)
        # For now, get the first active membership
        membership = request.user.memberships.filter(is_active=True).first()
        return membership.organization if membership else None

    @action(detail=False, methods=['get'])
    def workflow_metrics(self, request):
        """Get workflow execution metrics"""
        org = self._get_organization(request)
        if not org:
            return Response({'error': 'Organization not found'}, status=status.HTTP_404_NOT_FOUND)
            
        # Get last 7 days summary by default
        from django.utils import timezone
        from datetime import timedelta
        end_date = timezone.now()
        start_date = end_date - timedelta(days=7)
        
        summary = MetricsService.get_metrics_summary(org, 'workflow_duration', start_date, end_date)
        return Response(summary)
        
    @action(detail=False, methods=['get'])
    def cost_summary(self, request):
        """Get cost breakdown by period"""
        org = self._get_organization(request)
        if not org:
            return Response({'error': 'Organization not found'}, status=status.HTTP_404_NOT_FOUND)
            
        costs = org.costs.all().order_by('-period_start')[:10]
        # Map to simple list for now
        data = [{
            'period_start': c.period_start,
            'total_cost': c.total_cost,
            'workflow_runs': c.total_workflow_runs,
            'tokens': c.total_tokens
        } for c in costs]
        
        return Response(data)
        
    @action(detail=False, methods=['get'])
    def performance_dashboard(self, request):
        """Get comprehensive performance dashboard"""
        org = self._get_organization(request)
        return Response({'message': 'Dashboard data would be aggregated here'})
