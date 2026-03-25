import logging
import ipaddress
import json
from django.core.exceptions import PermissionDenied
from django.http import HttpResponseForbidden
from django.utils.deprecation import MiddlewareMixin
from .models import AuditLog, IPAllowlist, Organization

logger = logging.getLogger(__name__)

def get_client_ip(request):
    """
    Get client IP address from request.
    Handles standard headers and proxy setups.
    """
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip

class IPAllowlistMiddleware:
    """
    Middleware to restrict access based on IP Allowlist per Organization.
    
    Strategy:
    1. If user is not authenticated, pass (allow public endpoints).
    2. If user is authenticated, check all organizations they belong to.
    3. If ANY of their organizations have an active IP Allowlist, 
       the user MUST be connecting from an allowed IP for at least one of those lists.
       
    This is a strict security measure. If a user belongs to a secure organization,
    their session is subject to IP validation.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.user.is_authenticated:
            self.check_ip_allowlist(request)
        return self.get_response(request)

    def check_ip_allowlist(self, request):
        user = request.user
        ip_addr = get_client_ip(request)
        
        # Get all active IPs/Ranges for user's organizations
        # We filter for active organizations and active allowlist entries
        allowlists = IPAllowlist.objects.filter(
            organization__memberships__user=user,
            organization__is_active=True,
            is_active=True
        ).select_related('organization')

        # If no allowlists exist for any of the user's orgs, allow access
        if not allowlists.exists():
            return

        # Check if current IP matches any allowed entry
        allowed = False
        for entry in allowlists:
            # Check exact match
            if entry.ip_address and entry.ip_address == ip_addr:
                allowed = True
                break
            
            # Check CIDR range
            if entry.ip_range_cidr:
                try:
                    network = ipaddress.ip_network(entry.ip_range_cidr, strict=False)
                    if ipaddress.ip_address(ip_addr) in network:
                        allowed = True
                        break
                except ValueError:
                    logger.error(f"Invalid CIDR format in IPAllowlist ID {entry.id}: {entry.ip_range_cidr}")
                    continue
        
        if not allowed:
            logger.warning(f"Access denied for user {user.username} from IP {ip_addr} due to IP Allowlist restrictions.")
            raise PermissionDenied("Access denied by Organization IP Allowlist.")


class AuditMiddleware:
    """
    Middleware to log user actions to the AuditLog.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Process request
        response = self.get_response(request)
        
        # Log action after response
        if request.user.is_authenticated:
            try:
                self.log_action(request, response)
            except Exception as e:
                logger.error(f"Error logging audit entry: {e}")
                
        return response

    def log_action(self, request, response):
        user = request.user
        ip_addr = get_client_ip(request)
        method = request.method
        path = request.path
        
        # Map method to action type
        action_map = {
            'GET': 'read',
            'POST': 'create',
            'PUT': 'update',
            'PATCH': 'update',
            'DELETE': 'delete'
        }
        action = action_map.get(method, 'read')
        
        # Skip logging for static files or common noise if needed
        if path.startswith('/static/') or path.startswith('/admin/jsi18n/'):
            return

        # Try to determine the primary organization (for simple cases)
        # This is a heuristic; in a real app, this might come from the view or context
        organization = None
        if user.memberships.count() == 1:
            organization = user.memberships.first().organization
            
        success = 200 <= response.status_code < 400
        
        # Capture simple metadata
        metadata = {
            'status_code': response.status_code,
            'query_params': dict(request.GET),
        }

        # Create the log entry
        AuditLog.objects.create(
            user=user,
            organization=organization,
            action=action,
            request_method=method,
            request_path=path,
            ip_address=ip_addr,
            user_agent=request.META.get('HTTP_USER_AGENT', '')[:255], # Truncate if needed or use TextField
            success=success,
            metadata=metadata
        )
