import asyncio
from app.services.auth_service import auth_service
from app.services.llm_service import llm_service
from app.models.user import Role
from app.models.appointment import UrgencyLevel

def test_password_hashing_and_verification():
    raw_pw = "SecretPass123!"
    hashed = auth_service.hash_password(raw_pw)
    assert hashed != raw_pw
    assert auth_service.verify_password(raw_pw, hashed) is True
    assert auth_service.verify_password("wrongpassword", hashed) is False

def test_jwt_creation_and_decoding():
    user_id = "64f1a2b3c4d5e6f7a8b9c0d1"
    email = "test@example.com"
    token = auth_service.create_jwt(user_id, Role.PATIENT, email)
    assert token is not None
    
    payload = auth_service.decode_jwt(token)
    assert payload is not None
    assert payload["sub"] == user_id
    assert payload["role"] == "PATIENT"
    assert payload["email"] == email

def test_llm_triage_fallback_high_urgency():
    async def _run():
        symptoms = "Patient collapsed with severe crushing chest pain and acute shortness of breath."
        summary, failed = await llm_service.generate_pre_visit_summary(symptoms)
        assert summary is not None
        assert summary.urgency_level == UrgencyLevel.HIGH
        assert len(summary.suggested_questions) == 3
    asyncio.run(_run())

def test_llm_triage_fallback_medium_urgency():
    async def _run():
        symptoms = "High fever of 102F and persistent headache since yesterday."
        summary, failed = await llm_service.generate_pre_visit_summary(symptoms)
        assert summary is not None
        assert summary.urgency_level == UrgencyLevel.MEDIUM
    asyncio.run(_run())

def test_llm_post_visit_summary_fallback():
    async def _run():
        notes = "Diagnosed acute pharyngitis. Prescribed Amoxicillin 500mg TID for 7 days."
        summary, failed = await llm_service.generate_post_visit_summary(notes)
        assert summary is not None
        assert "Clinical Visit Summary" in summary or "Amoxicillin" in summary
    asyncio.run(_run())
