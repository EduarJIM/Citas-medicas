from django.core.management.base import BaseCommand
from apps.citas.models import EstadoCita


class Command(BaseCommand):
    help = 'Crea los estados de cita por defecto'

    def handle(self, *args, **options):
        estados = ['pendiente', 'confirmada', 'realizada', 'cancelada', 'no_asistio']
        for e in estados:
            EstadoCita.objects.get_or_create(nombre=e)
        self.stdout.write(self.style.SUCCESS(f'{len(estados)} estados de cita creados'))
