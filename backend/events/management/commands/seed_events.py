"""
Seed Initial Campus Events and Workshops for SmartAttend AI
Usage: python manage.py seed_events
"""

from django.core.management.base import BaseCommand
from events.models import Event


class Command(BaseCommand):
    help = 'Seeds initial campus events and workshops into the database'

    def handle(self, *args, **options):
        initial_events = [
            {
                'title': 'AI & Deep Learning Hands-on Workshop',
                'category': 'Workshop',
                'date': 'Oct 28, 2026',
                'time': '10:00 AM - 04:30 PM',
                'venue': 'APJ Abdul Kalam Auditorium, Main Block',
                'organizer': 'Department of Artificial Intelligence & Data Science',
                'speaker': 'Dr. Aris Thorne',
                'speaker_role': 'Principal AI Scientist, Google Research',
                'capacity': 120,
                'status': 'Upcoming',
                'description': 'Comprehensive hands-on workshop covering deep neural architectures, PyTorch, and model deployment on edge devices.',
                'tags': 'AI,PyTorch,Hands-on,Deep Learning',
            },
            {
                'title': 'Smart City 24-Hour Hackathon 2026',
                'category': 'Hackathon',
                'date': 'Nov 05-06, 2026',
                'time': '09:00 AM (24 Hours)',
                'venue': 'Campus Innovation Hub, 3rd Floor',
                'organizer': 'Student Technical Committee & ACM Chapter',
                'speaker': 'Prof. Rajesh Kulkarni',
                'speaker_role': 'Dean of Innovation & Industry Partnerships',
                'capacity': 150,
                'status': 'Upcoming',
                'description': 'Annual flagship hackathon to build intelligent solutions for urban mobility, waste segregation, and renewable energy.',
                'tags': 'Hackathon,IoT,CleanTech,Prizes',
            },
            {
                'title': 'Cloud Computing & DevOps Masterclass',
                'category': 'Workshop',
                'date': 'Nov 12, 2026',
                'time': '02:00 PM - 05:30 PM',
                'venue': 'CS Department Lab 4',
                'organizer': 'Department of Computer Science',
                'speaker': 'Siddharth Rao',
                'speaker_role': 'Lead Site Reliability Engineer',
                'capacity': 80,
                'status': 'Upcoming',
                'description': 'Master Docker, Kubernetes orchestration, and GitOps CI/CD pipelines with real-world infrastructure demos.',
                'tags': 'Docker,Kubernetes,DevOps,Cloud',
            },
            {
                'title': 'Next-Gen Cybersecurity & Ethical Hacking Symposium',
                'category': 'Seminar',
                'date': 'Nov 19, 2026',
                'time': '11:00 AM - 01:30 PM',
                'venue': 'Turing Seminar Hall, Block B',
                'organizer': 'Cyber Defense Club',
                'speaker': 'Maya Sharma',
                'speaker_role': 'Certified Ethical Hacker & Security Consultant',
                'capacity': 100,
                'status': 'Upcoming',
                'description': 'Exploring zero-trust architecture, threat surface analysis, and modern vulnerability assessment methodologies.',
                'tags': 'Cybersecurity,Ethical Hacking,Zero Trust',
            },
        ]

        created_count = 0
        for data in initial_events:
            obj, created = Event.objects.get_or_create(
                title=data['title'],
                defaults=data
            )
            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f"Created event: {obj.title}"))
            else:
                self.stdout.write(f"Event already exists: {obj.title}")

        self.stdout.write(self.style.SUCCESS(f"Seeding completed. {created_count} events created."))
