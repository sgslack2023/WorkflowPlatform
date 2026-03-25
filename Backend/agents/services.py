import json
from django.utils import timezone
from django.db.models import Sum
from .models import AgentMemory

class MemoryManagementService:
    MAX_MEMORY_SIZE_BYTES = 1024 * 1024  # 1MB per memory entry
    MAX_TOTAL_MEMORY_PER_AGENT = 100 * 1024 * 1024  # 100MB per agent
    
    def store_memory(self, agent_definition, key, value, memory_type, ttl_seconds=None, metadata=None):
        """Store memory with size limits and lifecycle tracking"""
        
        value_json = json.dumps(value)
        size_bytes = len(value_json.encode('utf-8'))
        
        if size_bytes > self.MAX_MEMORY_SIZE_BYTES:
            raise ValueError(f"Memory too large: {size_bytes} bytes")
        
        # Calculate expiry
        expires_at = None
        if ttl_seconds:
            expires_at = timezone.now() + timezone.timedelta(seconds=ttl_seconds)
        
        memory = AgentMemory.objects.create(
            agent_definition=agent_definition,
            key=key,
            value=value,
            memory_type=memory_type,
            ttl_seconds=ttl_seconds,
            expires_at=expires_at,
            size_bytes=size_bytes,
            metadata=metadata or {}
        )
        
        return memory
    
    def cleanup_old_memories(self, agent_definition):
        """Remove expired memories"""
        AgentMemory.objects.filter(
            agent_definition=agent_definition,
            expires_at__lt=timezone.now()
        ).delete()
    
    def summarize_memory(self, memory_id):
        """Placeholder for memory summarization logic using LLM"""
        memory = AgentMemory.objects.get(id=memory_id)
        # In a real implementation, call an LLM to summarize memory.value
        summary_value = {"summary": "Simulated memory summary"}
        
        summarized = AgentMemory.objects.create(
            agent_definition=memory.agent_definition,
            key=f"{memory.key}_summary",
            value=summary_value,
            memory_type=memory.memory_type,
            is_summarized=True,
            original_memory_id=memory.id,
            size_bytes=len(json.dumps(summary_value).encode('utf-8'))
        )
        
        memory.is_summarized = True
        memory.save()
        
        return summarized
