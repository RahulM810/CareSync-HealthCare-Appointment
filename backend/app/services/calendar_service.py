import asyncio
from typing import Optional, Tuple
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from app.config import settings

class CalendarService:
    def _build_service(self, access_token: str, refresh_token: Optional[str] = None):
        creds = Credentials(
            token=access_token,
            refresh_token=refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=settings.GOOGLE_CLIENT_ID,
            client_secret=settings.GOOGLE_CLIENT_SECRET,
            scopes=["https://www.googleapis.com/auth/calendar.events"]
        )
        return build("calendar", "v3", credentials=creds)

    async def create_event(
        self,
        access_token: str,
        refresh_token: Optional[str],
        title: str,
        description: str,
        start_time_iso: str,
        end_time_iso: str,
        location: str = "Main Clinic - Consultation Room"
    ) -> Optional[str]:
        """
        Creates an event in the user's primary Google Calendar.
        Returns event_id if successful, None otherwise.
        """
        def _sync_create():
            service = self._build_service(access_token, refresh_token)
            event_body = {
                "summary": title,
                "description": description,
                "location": location,
                "start": {"dateTime": start_time_iso, "timeZone": "UTC"},
                "end": {"dateTime": end_time_iso, "timeZone": "UTC"},
                "reminders": {
                    "useDefault": False,
                    "overrides": [
                        {"method": "email", "minutes": 24 * 60},
                        {"method": "popup", "minutes": 30},
                    ],
                },
            }
            created_event = service.events().insert(calendarId="primary", body=event_body).execute()
            return created_event.get("id")

        try:
            return await asyncio.to_thread(_sync_create)
        except Exception as e:
            print(f"[CalendarService Error] Create event failed: {e}")
            return None

    async def update_event(
        self,
        access_token: str,
        refresh_token: Optional[str],
        event_id: str,
        title: str,
        description: str,
        start_time_iso: str,
        end_time_iso: str
    ) -> bool:
        """
        Updates an existing event in the user's Google Calendar.
        """
        def _sync_update():
            service = self._build_service(access_token, refresh_token)
            event_body = {
                "summary": title,
                "description": description,
                "start": {"dateTime": start_time_iso, "timeZone": "UTC"},
                "end": {"dateTime": end_time_iso, "timeZone": "UTC"},
            }
            service.events().patch(calendarId="primary", eventId=event_id, body=event_body).execute()
            return True

        try:
            return await asyncio.to_thread(_sync_update)
        except Exception as e:
            print(f"[CalendarService Error] Update event failed: {e}")
            return False

    async def delete_event(
        self,
        access_token: str,
        refresh_token: Optional[str],
        event_id: str
    ) -> bool:
        """
        Deletes an event from user's Google Calendar.
        """
        def _sync_delete():
            service = self._build_service(access_token, refresh_token)
            service.events().delete(calendarId="primary", eventId=event_id).execute()
            return True

        try:
            return await asyncio.to_thread(_sync_delete)
        except Exception as e:
            print(f"[CalendarService Error] Delete event failed: {e}")
            return False

calendar_service = CalendarService()
