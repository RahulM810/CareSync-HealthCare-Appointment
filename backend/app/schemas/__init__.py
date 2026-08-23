from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse, UserProfileResponse
from app.schemas.appointment import (
    HoldSlotRequest,
    HoldSlotResponse,
    BookAppointmentRequest,
    RescheduleAppointmentRequest,
    SubmitClinicalNotesRequest,
    AppointmentResponse,
    SlotItem,
)
from app.schemas.doctor import (
    CreateDoctorRequest,
    UpdateDoctorRequest,
    DoctorResponse,
    DoctorLeaveRequest,
    DoctorLeaveResponse,
)
from app.schemas.common import ApiResponse, NotificationStatsResponse

__all__ = [
    "RegisterRequest",
    "LoginRequest",
    "TokenResponse",
    "UserProfileResponse",
    "HoldSlotRequest",
    "HoldSlotResponse",
    "BookAppointmentRequest",
    "RescheduleAppointmentRequest",
    "SubmitClinicalNotesRequest",
    "AppointmentResponse",
    "SlotItem",
    "CreateDoctorRequest",
    "UpdateDoctorRequest",
    "DoctorResponse",
    "DoctorLeaveRequest",
    "DoctorLeaveResponse",
    "ApiResponse",
    "NotificationStatsResponse",
]
