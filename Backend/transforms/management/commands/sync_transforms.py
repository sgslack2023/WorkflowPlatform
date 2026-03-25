import os
import importlib
import inspect
from django.core.management.base import BaseCommand
from transforms.models import TransformDefinition
from transforms.library.base import BaseTransform
from django.conf import settings

class Command(BaseCommand):
    help = 'Auto-discovers and registers Data Transformations from the library.'

    def handle(self, *args, **options):
        self.stdout.write("Syncing Data Transformations...")
        
        library_path = os.path.join(settings.BASE_DIR, 'transforms', 'library')
        
        # Track synced keys to cleanup old ones later if needed
        synced_keys = []
        
        for filename in os.listdir(library_path):
            if filename.endswith('.py') and filename != 'base.py' and filename != '__init__.py':
                module_name = f"transforms.library.{filename[:-3]}"
                try:
                    module = importlib.import_module(module_name)
                    # Force reload to pick up changes
                    importlib.reload(module)
                    
                    for name, obj in inspect.getmembers(module):
                        if inspect.isclass(obj) and issubclass(obj, BaseTransform) and obj != BaseTransform:
                            full_path = f"{module_name}.{name}"
                            self.register_transform(obj, full_path)
                            synced_keys.append(obj.key)
                except Exception as e:
                    self.stderr.write(f"Failed to load module {module_name}: {str(e)}")

        self.stdout.write(self.style.SUCCESS(f"Successfully synced {len(synced_keys)} transformations."))

    def register_transform(self, transform_class, python_path):
        key = transform_class.key
        if not key:
            self.stderr.write(f"Skipping {transform_class.__name__}: No key defined.")
            return

        self.stdout.write(f"Registering: {transform_class.name} ({key})")
        
        # We assume organization=None implies a System Transform
        TransformDefinition.objects.update_or_create(
            key=key,
            defaults={
                "name": transform_class.name,
                "description": transform_class.description,
                "input_schema": transform_class.input_schema,
                "output_schema": transform_class.output_schema,
                "python_path": python_path,
                "auto_discovered": True,
                "organization": None # System global
            }
        )
