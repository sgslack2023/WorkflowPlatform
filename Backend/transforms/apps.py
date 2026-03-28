from django.apps import AppConfig


class TransformsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'transforms'
    
    def ready(self):
        """Auto-sync transforms on app startup"""
        import os
        import sys
        
        # Only run sync in the main process (not in reloader child process)
        if os.environ.get('RUN_MAIN') == 'true' or 'runserver' not in sys.argv:
            try:
                from django.core.management import call_command
                print("[Transforms] Auto-syncing transform definitions...")
                call_command('sync_transforms', verbosity=0)
                print("[Transforms] Sync complete.")
            except Exception as e:
                print(f"[Transforms] Auto-sync failed: {e}")
