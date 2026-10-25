"""
Events API Views: Campus Event Catalog & Administrative Management
"""

import logging
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from accounts.permissions import IsAdminRole
from .models import Event
from .serializers import EventSerializer, EventCreateUpdateSerializer

logger = logging.getLogger(__name__)


@api_view(['GET', 'POST'])
def events_list_or_create(request):
    """
    GET: List all campus events and workshops (Open to all, annotated with registration status)
    POST: Create a new event (Restricted to Administrators with IsAdminRole)
    """
    if request.method == 'GET':
        events = Event.objects.all().order_by('-created_at')
        
        # Optional query filter
        category = request.query_params.get('category')
        if category and category.lower() != 'all':
            events = events.filter(category__iexact=category)

        search = request.query_params.get('search')
        if search:
            events = events.filter(title__icontains=search)

        serializer = EventSerializer(events, many=True, context={'request': request})
        count = len(events) if isinstance(events, list) else events.count()
        return Response({
            "status": "success",
            "count": count,
            "events": serializer.data
        }, status=status.HTTP_200_OK)

    elif request.method == 'POST':
        # Backend role enforcement: Administrators only
        if not request.user.is_authenticated or not getattr(request.user, 'is_admin_role', False):
            return Response({
                "status": "error",
                "message": "Access Denied: Only administrators can schedule new events."
            }, status=status.HTTP_403_FORBIDDEN)

        serializer = EventCreateUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                "status": "error",
                "message": "Invalid event data.",
                "errors": serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        event = serializer.save(created_by=request.user)
        return Response({
            "status": "success",
            "message": f"Event '{event.title}' scheduled successfully.",
            "event": EventSerializer(event, context={'request': request}).data
        }, status=status.HTTP_201_CREATED)


@api_view(['GET', 'PATCH', 'PUT', 'DELETE'])
def event_detail_manage(request, pk):
    """
    GET: Retrieve single event details
    PATCH/PUT: Update event properties (Admin only)
    DELETE: Remove event (Admin only)
    """
    try:
        event = Event.objects.get(pk=pk)
    except Event.DoesNotExist:
        return Response({
            "status": "error",
            "message": "Event not found."
        }, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = EventSerializer(event, context={'request': request})
        return Response({
            "status": "success",
            "event": serializer.data
        }, status=status.HTTP_200_OK)

    # All mutating actions require Admin role
    if not request.user.is_authenticated or not getattr(request.user, 'is_admin_role', False):
        return Response({
            "status": "error",
            "message": "Access Denied: Administrator privileges required to manage events."
        }, status=status.HTTP_403_FORBIDDEN)

    if request.method in ('PATCH', 'PUT'):
        serializer = EventCreateUpdateSerializer(event, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response({
                "status": "error",
                "message": "Invalid event update data.",
                "errors": serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        updated_event = serializer.save()
        return Response({
            "status": "success",
            "message": "Event updated successfully.",
            "event": EventSerializer(updated_event, context={'request': request}).data
        }, status=status.HTTP_200_OK)

    elif request.method == 'DELETE':
        event_title = event.title
        event.delete()
        return Response({
            "status": "success",
            "message": f"Event '{event_title}' deleted successfully."
        }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminRole])
def event_cancel(request, pk):
    """
    Admin endpoint to mark an event as Cancelled without deleting records.
    """
    try:
        event = Event.objects.get(pk=pk)
    except Event.DoesNotExist:
        return Response({
            "status": "error",
            "message": "Event not found."
        }, status=status.HTTP_404_NOT_FOUND)

    event.status = 'Cancelled'
    event.save(update_fields=['status'])

    return Response({
        "status": "success",
        "message": f"Event '{event.title}' status changed to Cancelled.",
        "event": EventSerializer(event, context={'request': request}).data
    }, status=status.HTTP_200_OK)
