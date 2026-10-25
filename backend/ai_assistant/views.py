"""
AI Event Assistant API Views for SmartAttend AI
Provides contextual event guidance, venue directions, prerequisites, and system help.
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from events.models import Event


@api_view(['POST'])
@permission_classes([AllowAny])
def ai_assistant_query(request):
    """
    Campus AI Event Assistant query endpoint.
    Answers natural language queries regarding upcoming events, schedule timings,
    seating availability, venue directions, and QR check-in instructions.
    """
    user_query = request.data.get('query', '').strip()
    if not user_query:
        return Response({
            "status": "error",
            "message": "Query string is required."
        }, status=status.HTTP_400_BAD_REQUEST)

    q = user_query.lower()

    # Fetch live events from database for dynamic answers
    upcoming_events = list(Event.objects.exclude(status='Cancelled').values(
        'title', 'category', 'date', 'time', 'venue', 'speaker', 'capacity'
    ))

    # Pattern responses based on user queries
    if 'event' in q or 'upcoming' in q or 'workshop' in q or 'hackathon' in q or 'schedule' in q:
        if upcoming_events:
            event_bullets = "\n".join([
                f"• **{e['title']}** ({e['category']}) on {e['date']} at {e['time']} — Venue: {e['venue']}"
                for e in upcoming_events[:4]
            ])
            answer = (
                f"Here are the active college events scheduled in SmartAttend AI:\n\n{event_bullets}\n\n"
                "You can register for any session directly from the **Browse Events** tab in your Student Panel."
            )
        else:
            answer = (
                "Here are the featured upcoming college events:\n\n"
                "• **AI & Deep Learning Hands-on Workshop** — Oct 28, 2026 at APJ Hall\n"
                "• **Smart City 24h Hackathon** — Nov 05, 2026 at Innovation Hub\n"
                "• **Cloud Computing & DevOps Masterclass** — Nov 12, 2026 at Turing Auditorium\n\n"
                "Registration grants an instant QR Pass delivered directly to your profile and email."
            )
    elif 'qr' in q or 'pass' in q or 'scan' in q or 'attendance' in q or 'face' in q:
        answer = (
            "SmartAttend AI uses a **strictly QR-Code-Only** verification protocol. "
            "Biometric scans, facial recognition, and liveness checks are completely excluded for privacy and speed.\n\n"
            "**How to get attendance verified:**\n"
            "1. Register for an event in your Student Panel.\n"
            "2. Open **My QR Passes** to view your encrypted 2D QR matrix pass.\n"
            "3. Present your mobile screen to the Gate Scanner volunteer at the venue hall entrance.\n"
            "4. Your attendance is logged instantly in less than 0.5 seconds, and duplicate attempts are rejected automatically."
        )
    elif 'certificate' in q or 'cert' in q:
        answer = (
            "Certificates are issued automatically to your profile once your attendance is verified at the event entrance! "
            "You can view and verify all your credentials under the **Available Certificates** section."
        )
    elif 'venue' in q or 'hall' in q or 'location' in q or 'where' in q:
        answer = (
            "SmartAttend events take place in campus venues:\n"
            "• **APJ Abdul Kalam Auditorium**: Main Academic Block, 2nd Floor\n"
            "• **CS Department Lab 4**: Computer Science Wing, Ground Floor\n"
            "• **Campus Innovation Hub**: Tech Park Building, 3rd Floor\n"
            "• **Turing Seminar Hall**: Engineering Block B, Room 102"
        )
    else:
        answer = (
            f"Thanks for asking! As your SmartAttend AI Assistant, I can answer questions about college workshops, "
            f"event dates, venue directions, prerequisites, and your digital QR passes. "
            f"Try asking: *'What events are scheduled this week?'* or *'How do I use my QR pass?'*"
        )

    return Response({
        "status": "success",
        "query": user_query,
        "answer": answer,
        "suggested_questions": [
            "What upcoming events can I register for?",
            "How does the QR check-in work?",
            "Where is APJ Abdul Kalam Auditorium located?",
            "When do I receive my workshop certificate?"
        ]
    }, status=status.HTTP_200_OK)
