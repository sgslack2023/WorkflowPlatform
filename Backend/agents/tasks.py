from django.utils import timezone
from .models import AgentMemory
from .services import MemoryManagementService

def cleanup_expired_memories():
    """Periodic task to clean up expired memories"""
    expired = AgentMemory.objects.filter(expires_at__lt=timezone.now())
    count = expired.count()
    expired.delete()
    return f"Deleted {count} expired memories"

def summarize_large_memories():
    """Periodic task to summarize large memories"""
    # Find memories > 100KB that aren't summarized
    large_memories = AgentMemory.objects.filter(
        size_bytes__gt=102400,
        is_summarized=False
    )
    
    service = MemoryManagementService()
    for memory in large_memories:
        service.summarize_memory(memory.id)
    
    return f"Summarized {large_memories.count()} memories"
