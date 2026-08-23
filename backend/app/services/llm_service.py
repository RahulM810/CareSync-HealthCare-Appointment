import os
import json
import asyncio
from typing import Tuple

from dotenv import load_dotenv
from groq import AsyncGroq

from app.models.appointment import PreVisitSummary, UrgencyLevel


# Load environment variables from .env
load_dotenv()

# Groq configuration
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-20b")


PRE_VISIT_PROMPT_TEMPLATE = """You are a medical triage assistant. Analyse the following patient symptoms and return a JSON object with exactly these fields:
- urgency_level: "Low" | "Medium" | "High"
- chief_complaint: a concise one-line summary of the primary concern
- suggested_questions: an array of exactly 3 questions the doctor should ask

Patient symptoms: {symptoms}

Respond ONLY with valid JSON. No markdown backticks, no explanation."""


POST_VISIT_PROMPT_TEMPLATE = """You are a patient communication assistant. Convert these clinical notes into a clear, patient-friendly summary. Include:
1. A plain-language explanation of the diagnosis (avoid medical jargon)
2. Medication schedule as a simple list: Medicine — Dosage — When to take — Duration
3. Follow-up steps: when to return, warning signs to watch for

Clinical notes: {notes}

Use warm, reassuring language. Keep it under 300 words."""


class LLMService:

    def __init__(self):
        self.api_key = GROQ_API_KEY
        self.model = GROQ_MODEL

    def _get_client(self) -> AsyncGroq:
        return AsyncGroq(api_key=self.api_key)

    async def generate_pre_visit_summary(
        self,
        symptoms: str
    ) -> Tuple[PreVisitSummary, bool]:
        """
        Calls Groq API to triage symptoms.

        Returns:
        (PreVisitSummary, is_failed_flag)
        """

        # Fallback if API key is not configured
        if (
            not self.api_key
            or self.api_key.startswith("gsk_placeholder")
        ):
            return (
                self._fallback_pre_visit_summary(symptoms),
                True
            )

        prompt = PRE_VISIT_PROMPT_TEMPLATE.format(
            symptoms=symptoms
        )

        # Try twice
        for attempt in range(2):
            try:
                client = self._get_client()

                response = await asyncio.wait_for(
                    client.chat.completions.create(
                        model=self.model,
                        messages=[
                            {
                                "role": "user",
                                "content": prompt
                            }
                        ],
                        response_format={
                            "type": "json_object"
                        },
                        temperature=0.2
                    ),
                    timeout=10.0
                )

                # Groq content can be None
                raw_text = response.choices[0].message.content

                if not raw_text:
                    raise ValueError(
                        "Groq returned an empty response"
                    )

                data = json.loads(raw_text)

                # Support snake_case and camelCase responses
                urgency = (
                    data.get("urgency_level")
                    or data.get("urgencyLevel")
                    or "Low"
                )

                chief = (
                    data.get("chief_complaint")
                    or data.get("chiefComplaint")
                    or symptoms[:100]
                )

                questions = (
                    data.get("suggested_questions")
                    or data.get("suggestedQuestions")
                    or []
                )

                # Validate urgency level
                if urgency not in [
                    "Low",
                    "Medium",
                    "High"
                ]:
                    urgency = "Medium"

                # Ensure exactly 3 questions
                if len(questions) < 3:
                    questions = [
                        "How long have you had these symptoms?",
                        "Have you taken any medication for this?",
                        "Is there any family history of related issues?"
                    ]

                return (
                    PreVisitSummary(
                        urgency_level=UrgencyLevel(urgency),
                        chief_complaint=chief,
                        suggested_questions=questions[:3]
                    ),
                    False
                )

            except Exception as e:

                print(
                    f"Groq Pre-Visit LLM "
                    f"Attempt {attempt + 1} failed: {e}"
                )

                # Retry once
                if attempt == 0:
                    await asyncio.sleep(2)

        # Use fallback if both attempts fail
        return (
            self._fallback_pre_visit_summary(symptoms),
            True
        )

    async def generate_post_visit_summary(
        self,
        notes: str
    ) -> Tuple[str, bool]:
        """
        Calls Groq API to simplify clinical notes.

        Returns:
        (summary_text, is_failed_flag)
        """

        # Fallback if API key is not configured
        if (
            not self.api_key
            or self.api_key.startswith("gsk_placeholder")
        ):
            return (
                self._fallback_post_visit_summary(notes),
                True
            )

        prompt = POST_VISIT_PROMPT_TEMPLATE.format(
            notes=notes
        )

        # Try twice
        for attempt in range(2):
            try:
                client = self._get_client()

                response = await asyncio.wait_for(
                    client.chat.completions.create(
                        model=self.model,
                        messages=[
                            {
                                "role": "user",
                                "content": prompt
                            }
                        ],
                        temperature=0.3
                    ),
                    timeout=10.0
                )

                # Groq content can be None
                raw_content = response.choices[0].message.content

                if not raw_content:
                    raise ValueError(
                        "Groq returned an empty response"
                    )

                summary_text = raw_content.strip()

                return summary_text, False

            except Exception as e:

                print(
                    f"Groq Post-Visit LLM "
                    f"Attempt {attempt + 1} failed: {e}"
                )

                # Retry once
                if attempt == 0:
                    await asyncio.sleep(2)

        # Use fallback if both attempts fail
        return (
            self._fallback_post_visit_summary(notes),
            True
        )

    def _fallback_pre_visit_summary(
        self,
        symptoms: str
    ) -> PreVisitSummary:
        """
        Creates a basic pre-visit summary
        when the Groq API is unavailable.
        """

        urgent_keywords = [
            "chest pain",
            "breathing difficulty",
            "severe",
            "blood",
            "unconscious",
            "stroke",
            "paralysis"
        ]

        medium_keywords = [
            "fever",
            "vomiting",
            "pain",
            "infection",
            "headache",
            "dizziness",
            "rash"
        ]

        lower_symptoms = symptoms.lower()

        if any(
            keyword in lower_symptoms
            for keyword in urgent_keywords
        ):
            level = UrgencyLevel.HIGH

        elif any(
            keyword in lower_symptoms
            for keyword in medium_keywords
        ):
            level = UrgencyLevel.MEDIUM

        else:
            level = UrgencyLevel.LOW

        return PreVisitSummary(
            urgency_level=level,
            chief_complaint=(
                symptoms[:120]
                if symptoms
                else "General consultation"
            ),
            suggested_questions=[
                "When did these symptoms first begin?",
                "Are symptoms constant or do they come and go?",
                (
                    "Have you taken any home remedies "
                    "or over-the-counter medication?"
                )
            ]
        )

    def _fallback_post_visit_summary(
        self,
        notes: str
    ) -> str:
        """
        Creates a fallback patient summary
        when the Groq API is unavailable.
        """

        return (
            "### Clinical Visit Summary\n"
            f"{notes}\n\n"
            "*Please follow all doctor prescriptions carefully "
            "and contact the clinic if symptoms persist.*"
        )


# Create a single reusable service instance
llm_service = LLMService()