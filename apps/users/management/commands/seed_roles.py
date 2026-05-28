from django.core.management.base import BaseCommand
from apps.users.models import Rol


class Command(BaseCommand):
    help = 'Crea los roles por defecto'

    def handle(self, *args, **options):
        roles = ['admin', 'medico', 'paciente']
        for r in roles:
            Rol.objects.get_or_create(nombre=r)
        self.stdout.write(self.style.SUCCESS(f'{len(roles)} roles creados'))
