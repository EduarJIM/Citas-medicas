from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import time, timedelta
from apps.medicos.models import Medico
from apps.horarios.models import Horario


class Command(BaseCommand):
    help = 'Genera horarios para las próximas 12 semanas para todos los médicos activos'

    def add_arguments(self, parser):
        parser.add_argument('--semanas', type=int, default=12, help='Número de semanas a generar')

    def handle(self, *args, **options):
        semanas = options['semanas']
        hoy = timezone.localdate()
        start = hoy + timedelta(days=1)
        if start.weekday() >= 5:
            start += timedelta(days=(7 - start.weekday()))

        total_created = 0
        total_skipped = 0
        for medico in Medico.objects.filter(estado='activo'):
            for semana in range(semanas):
                for dia_offset in range(5):
                    dia = start + timedelta(weeks=semana, days=dia_offset)
                    for h_inicio, h_fin in [(time(8, 0), time(12, 0)), (time(14, 0), time(17, 0))]:
                        current = h_inicio
                        while current < h_fin:
                            slot_fin = (timedelta(hours=current.hour, minutes=current.minute) + timedelta(minutes=30))
                            h_fin_slot = time(slot_fin.seconds // 3600, (slot_fin.seconds // 60) % 60)
                            _, created = Horario.objects.get_or_create(
                                id_medico=medico, fecha=dia, hora_inicio=current, hora_fin=h_fin_slot,
                                defaults={'disponible': True},
                            )
                            if created:
                                total_created += 1
                            else:
                                total_skipped += 1
                            current = h_fin_slot

        self.stdout.write(self.style.SUCCESS(
            f'Generados {total_created} horarios nuevos ({total_skipped} ya existentes)'
        ))
