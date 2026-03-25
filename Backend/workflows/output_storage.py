import json
import os
from django.conf import settings
from django.core.serializers.json import DjangoJSONEncoder
from .models import NodeExecution

class OutputStorageService:
    INLINE_THRESHOLD_BYTES = 10 * 1024  # 10KB
    
    def store_output(self, node_execution: NodeExecution, output_data):
        """Store output using appropriate storage backend"""
        
        # Serialize to measure size
        output_json = json.dumps(output_data, cls=DjangoJSONEncoder)
        size_bytes = len(output_json.encode('utf-8'))
        
        node_execution.output_size_bytes = size_bytes
        
        if size_bytes <= self.INLINE_THRESHOLD_BYTES:
            # Store inline
            node_execution.output_inline = output_data
            node_execution.output_ref = None
        else:
            # Store in object storage (local filesystem for now)
            ref = self._store_in_storage(node_execution.id, output_data)
            node_execution.output_inline = None
            node_execution.output_ref = ref
        
        node_execution.save()
    
    def get_output(self, node_execution: NodeExecution):
        """Retrieve output from appropriate storage"""
        
        if node_execution.output_inline is not None:
            return node_execution.output_inline
        
        if node_execution.output_ref:
            return self._fetch_from_storage(node_execution.output_ref)
        
        return None
    
    def _store_in_storage(self, execution_id, data):
        """Store in local filesystem (mocking S3/MinIO)"""
        output_dir = getattr(settings, 'WORKFLOW_OUTPUT_DIR', os.path.join(settings.BASE_DIR, 'workflow_outputs'))
        os.makedirs(output_dir, exist_ok=True)
        
        file_path = os.path.join(output_dir, f"{execution_id}.json")
        with open(file_path, 'w') as f:
            json.dump(data, f, cls=DjangoJSONEncoder)
        
        return f"file://{file_path}"
    
    def _fetch_from_storage(self, ref):
        """Fetch from local filesystem"""
        if ref.startswith('file://'):
            file_path = ref.replace('file://', '')
            if os.path.exists(file_path):
                with open(file_path, 'r') as f:
                    return json.load(f)
        
        raise ValueError(f"Unknown or missing storage ref: {ref}")
