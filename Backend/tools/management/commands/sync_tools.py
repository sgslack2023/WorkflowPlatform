import os
import inspect
import importlib.util
from pathlib import Path
from django.core.management.base import BaseCommand
from django.conf import settings
from tools.models import Tool
from tools.library.base import BaseTool

class Command(BaseCommand):
    help = 'Scans tools/library and registers all BaseTool subclasses in the database'

    def handle(self, *args, **options):
        library_path = Path(settings.BASE_DIR) / 'tools' / 'library'
        created_count = 0
        updated_count = 0
        
        self.stdout.write(f"Scanning {library_path}...")

        # Walk through all python files in tools/library
        for root, dirs, files in os.walk(library_path):
            for file in files:
                if file.endswith('.py') and file != '__init__.py' and file != 'base.py':
                    full_path = Path(root) / file
                    
                    try:
                        rel_path = full_path.relative_to(settings.BASE_DIR)
                        module_name = str(rel_path).replace(os.sep, '.')[:-3] # remove .py
                        self.register_module(module_name)
                    except Exception as e:
                        self.stderr.write(self.style.ERROR(f"Failed to load {file}: {e}"))

        self.stdout.write(self.style.SUCCESS(f"Sync Complete."))

    def register_module(self, module_name):
        self.stdout.write(f"Registering module: {module_name}")
        try:
            spec = importlib.util.find_spec(module_name)
            if spec is None:
                self.stdout.write(self.style.WARNING(f"Could not find spec for {module_name}"))
                return

            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)

            # Find subclasses of BaseTool
            for name, obj in inspect.getmembers(module):
                if inspect.isclass(obj):
                     # self.stdout.write(f"  Checking class: {name}")
                     if issubclass(obj, BaseTool) and obj is not BaseTool:
                        self.sync_tool_to_db(obj, module_name, name)
        except Exception as e:
            self.stderr.write(self.style.ERROR(f"Failed to load {module_name}: {e}"))

    def sync_tool_to_db(self, tool_class, module_name, class_name):
        full_python_path = f"{module_name}.{class_name}"
        
        if not tool_class.key:
            return

        # Default Schema if missing
        input_schema = tool_class.input_schema or {}
        output_schema = tool_class.output_schema or {}
        algo_params = tool_class.algo_parameters or {}

        # Upsert
        tool, created = Tool.objects.update_or_create(
            key=tool_class.key,
            defaults={
                'name': tool_class.name or class_name,
                'description': tool_class.description,
                'python_path': full_python_path,
                'execution_mode': tool_class.execution_mode,
                'input_schema': input_schema,
                'output_schema': output_schema,
                'algo_parameters': algo_params,
            }
        )
        
        action = "Created" if created else "Updated"
        self.stdout.write(self.style.SUCCESS(f"{action} tool: {tool.name} ({tool.key})"))
