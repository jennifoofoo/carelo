"""AI Insights Engine for generating case insights."""
import json
import time
import concurrent.futures
from typing import List, Optional
from sqlmodel import Session, select

from src.config import settings
from src.db.models import Case, Note, Insight
from src.utils.ai_client import get_chat_client


def _call_with_retry(fn, *args, max_retries: int = 3, **kwargs):
    """Call fn(*args, **kwargs) with exponential backoff on 429 rate-limit errors."""
    delay = 5  # seconds
    for attempt in range(max_retries):
        try:
            return fn(*args, **kwargs)
        except Exception as e:
            err = str(e)
            is_rate_limit = "429" in err or "rate" in err.lower() or "quota" in err.lower()
            if is_rate_limit and attempt < max_retries - 1:
                print(f"⏳ Gemini rate limit hit, retrying in {delay}s (attempt {attempt + 1}/{max_retries})...")
                time.sleep(delay)
                delay *= 2
            else:
                raise


class InsightsEngine:
    """Engine for generating AI-powered insights for cases."""

    def __init__(self, session: Session):
        self.session = session
        self.client = get_chat_client()
        self.model = settings.GEMINI_CHAT_MODEL

    def generate_insights_for_case(self, case: Case) -> List[Insight]:
        """Generate comprehensive insights — runs 4 LLM calls in parallel."""
        # Load notes
        all_notes = self.session.exec(
            select(Note).where(Note.case_id == case.id).order_by(Note.created_at.desc())
        ).all()
        notes = [
            n for n in all_notes
            if (n.normalized and n.normalized.strip()) or (n.raw_content and n.raw_content.strip())
        ]
        if not notes:
            return []

        recent_5 = notes[:5]
        recent_10 = notes[:10]

        # Dedup checks + decide which LLM calls to make (main thread, uses self.session)
        tasks: dict = {}

        # 1. Risks
        risk_hash = "-".join(sorted(n.id for n in recent_5)[:3])
        existing_risks = self.session.exec(
            select(Insight).where(Insight.case_id == case.id, Insight.type == "risk")
        ).all()
        if not any(e.get_content().get("source_note_ids_hash") == risk_hash for e in existing_risks):
            tasks["risk"] = {"notes": recent_5, "hash": risk_hash}
        else:
            print("ℹ️  Risk insights up to date")

        # 2. Patterns (need ≥3 notes)
        if len(notes) >= 3:
            pattern_hash = "-".join(sorted(n.id for n in notes)[:5])
            existing_pattern = self.session.exec(
                select(Insight).where(Insight.case_id == case.id, Insight.type == "pattern")
            ).first()
            if not (existing_pattern and existing_pattern.get_content().get("source_note_ids_hash") == pattern_hash):
                tasks["pattern"] = {"notes": notes, "hash": pattern_hash}
            else:
                print("ℹ️  Pattern insight up to date")

        # 3. Summary (no dedup — always refresh)
        if any(n.normalized for n in recent_10):
            tasks["summary"] = {"notes": recent_10}

        # 4. Actions (no dedup — always refresh)
        if any(n.normalized for n in recent_5):
            tasks["action"] = {"notes": recent_5}

        if not tasks:
            return []

        # Run all LLM calls in parallel (pure HTTP, no DB access in these methods)
        llm_fn = {
            "risk": self._llm_risks,
            "pattern": self._llm_patterns,
            "summary": self._llm_summary,
            "action": self._llm_actions,
        }
        llm_results: dict = {}
        with concurrent.futures.ThreadPoolExecutor(max_workers=len(tasks)) as pool:
            future_to_key = {
                pool.submit(llm_fn[key], case, data["notes"]): key
                for key, data in tasks.items()
            }
            for future in concurrent.futures.as_completed(future_to_key):
                key = future_to_key[future]
                try:
                    llm_results[key] = future.result()
                except Exception as e:
                    print(f"❌ LLM call failed for {key}: {e}")

        # Save results to DB sequentially in main thread
        insights: List[Insight] = []
        try:
            if llm_results.get("risk") is not None:
                insights.extend(self._save_risks(case, tasks["risk"]["notes"], tasks["risk"]["hash"], llm_results["risk"]))
            if llm_results.get("pattern") is not None:
                insights.extend(self._save_pattern(case, tasks["pattern"]["notes"], tasks["pattern"]["hash"], llm_results["pattern"]))
            if llm_results.get("summary") is not None:
                insights.extend(self._save_summary(case, llm_results["summary"]))
            if llm_results.get("action") is not None:
                insights.extend(self._save_action(case, llm_results["action"]))
        except Exception as e:
            print(f"Error saving insights: {e}")

        return insights

    # ── LLM callers (thread-safe, no DB access) ──────────────────────────────

    def _llm_risks(self, case: Case, notes: List[Note]) -> Optional[dict]:
        """Risk assessment LLM call. Returns parsed JSON or None."""
        combined = "\n\n".join(
            f"Note {i+1}:\n{n.normalized or n.raw_content or ''}"
            for i, n in enumerate(notes)
            if n.normalized or n.raw_content
        )
        if not combined:
            return None

        prompt = f"""You are a risk assessment specialist for social work cases in Germany.

Analyze the following case notes and identify ALL risks or concerns.

Case: {case.client_name or 'Unknown'}

Notes:
{combined}

Identify risks in these categories:
1. Safety risks (immediate danger)
2. Health concerns
3. Financial instability
4. Housing insecurity
5. Mental health concerns
6. Substance abuse indicators
7. Family/relationship issues

CRITICAL: You MUST respond with VALID JSON only. Use this exact structure:

{{
  "risks": [
    {{
      "title": "Short risk title (e.g., 'Housing Instability')",
      "description": "Detailed description of the risk",
      "category": "One of: safety, health, financial, housing, mental_health, substance_abuse, family",
      "severity": "One of: critical, high, medium, low",
      "recommended_action": "What should be done"
    }}
  ]
}}

If NO risks are found, return: {{"risks": []}}

IMPORTANT:
- Be thorough - identify ALL potential risks, even minor ones
- Use "critical" only for immediate danger
- Use "high" for urgent issues requiring prompt attention
- Use "medium" for important concerns to monitor
- Use "low" for minor issues to be aware of
- Return ONLY valid JSON, no additional text"""

        try:
            response = _call_with_retry(
                self.client.chat.completions.create,
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a professional risk assessment specialist. Always respond with valid JSON only."},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.3,
                max_tokens=2000,
                response_format={"type": "json_object"},
            )
            return json.loads(response.choices[0].message.content.strip())
        except json.JSONDecodeError as e:
            print(f"⚠️  Failed to parse risk JSON: {e}")
            return None
        except Exception as e:
            print(f"❌ Error in risk LLM call: {e}")
            import traceback
            traceback.print_exc()
            return None

    def _llm_patterns(self, case: Case, notes: List[Note]) -> Optional[str]:
        """Pattern detection LLM call. Returns text or None."""
        combined = "\n\n".join(
            f"Note {i+1} ({n.created_at.strftime('%Y-%m-%d')}):\n{n.normalized}"
            for i, n in enumerate(notes)
            if n.normalized
        )
        if not combined:
            return None

        prompt = f"""Analyze the following case notes over time and identify any patterns or trends.

Case: {case.client_name or 'Unknown'}

Notes (chronologically):
{combined}

Identify:
1. Recurring themes or issues
2. Progress or deterioration over time
3. Behavioral patterns
4. Environmental factors
5. Support system changes

Provide insights on what these patterns indicate and what they mean for case management.

Format as a structured analysis."""

        try:
            response = _call_with_retry(
                self.client.chat.completions.create,
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.6,
                max_tokens=1500,
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"Error in pattern LLM call: {e}")
            return None

    def _llm_summary(self, case: Case, notes: List[Note]) -> Optional[str]:
        """Summary LLM call. Returns text or None."""
        combined = "\n\n".join(
            f"Note {i+1}:\n{n.normalized}"
            for i, n in enumerate(notes)
            if n.normalized
        )
        if not combined:
            return None

        prompt = f"""Create a comprehensive summary of the recent case activity.

Case: {case.client_name or 'Unknown'}
Status: {case.status}

Recent Notes:
{combined}

Provide:
1. Overview of case status
2. Key developments
3. Client progress
4. Current challenges
5. Next steps

Be concise but comprehensive."""

        try:
            response = _call_with_retry(
                self.client.chat.completions.create,
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.6,
                max_tokens=1000,
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"Error in summary LLM call: {e}")
            return None

    def _llm_actions(self, case: Case, notes: List[Note]) -> Optional[str]:
        """Action suggestions LLM call. Returns text or None."""
        combined = "\n\n".join(
            f"Note {i+1}:\n{n.normalized}"
            for i, n in enumerate(notes)
            if n.normalized
        )
        if not combined:
            return None

        prompt = f"""Based on the recent case notes, suggest specific actions the social worker should take.

Case: {case.client_name or 'Unknown'}

Recent Notes:
{combined}

Provide 3-5 specific, actionable recommendations:
- What should be done
- Why it's important
- Priority level (High, Medium, Low)
- Suggested timeline

Be practical and specific."""

        try:
            response = _call_with_retry(
                self.client.chat.completions.create,
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=1000,
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"Error in actions LLM call: {e}")
            return None

    # ── DB savers (main thread only, uses self.session) ──────────────────────

    def _save_risks(self, case: Case, notes: List[Note], note_ids_hash: str, llm_result: dict) -> List[Insight]:
        risks = llm_result.get("risks", [])
        if not risks:
            print("ℹ️  No risks identified in notes")
            return []

        insights = []
        for risk_data in risks:
            severity = risk_data.get("severity", "medium").lower()
            if severity not in ["critical", "high", "medium", "low"]:
                severity = "medium"

            insight = Insight(
                case_id=case.id,
                type="risk",
                title=risk_data.get("title", "Risk Detected"),
                severity=severity,
            )
            insight.set_content({
                "description": risk_data.get("description", ""),
                "category": risk_data.get("category", "unknown"),
                "recommended_action": risk_data.get("recommended_action", ""),
                "message": risk_data.get("description", ""),
                "source_note_ids": [n.id for n in notes],
                "source_note_ids_hash": note_ids_hash,
            })
            self.session.add(insight)
            insights.append(insight)

        self.session.commit()
        print(f"✅ Created {len(insights)} risk insights")
        return insights

    def _save_pattern(self, case: Case, notes: List[Note], note_ids_hash: str, text_result: str) -> List[Insight]:
        insight = Insight(case_id=case.id, type="pattern", title="Pattern Analysis")
        insight.set_content({
            "analysis": text_result,
            "source_note_ids": [n.id for n in notes],
            "source_note_ids_hash": note_ids_hash,
        })
        self.session.add(insight)
        self.session.commit()
        return [insight]

    def _save_summary(self, case: Case, text_result: str) -> List[Insight]:
        insight = Insight(case_id=case.id, type="summary", title="Case Summary")
        insight.set_content({"summary": text_result})
        self.session.add(insight)
        self.session.commit()
        return [insight]

    def _save_action(self, case: Case, text_result: str) -> List[Insight]:
        insight = Insight(case_id=case.id, type="suggestion", title="Suggested Actions")
        insight.set_content({"suggestions": text_result})
        self.session.add(insight)
        self.session.commit()
        return [insight]

    # ── Risk prioritization (unchanged) ──────────────────────────────────────

    def prioritize_risks(self, case: Case, max_risks: int = 5) -> List[Insight]:
        """Use LLM to identify and prioritize the most critical risks."""
        statement = select(Insight).where(
            Insight.case_id == case.id,
            Insight.type == "risk",
            Insight.is_read == False,
        )
        all_risks = self.session.exec(statement.order_by(Insight.created_at.desc())).all()

        if not all_risks:
            return []

        if len(all_risks) <= max_risks:
            severity_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
            return sorted(all_risks, key=lambda r: severity_order.get(r.severity or "low", 3))

        risks_summary = []
        for risk in all_risks:
            content = risk.get_content()
            risks_summary.append({
                "id": risk.id,
                "title": risk.title,
                "description": content.get("description", ""),
                "category": content.get("category", "unknown"),
                "severity": risk.severity or "medium",
                "created_at": risk.created_at.isoformat(),
            })

        prompt = f"""You are a risk assessment specialist for social work cases in Germany.

Case: {case.client_name or 'Unknown'}

You have identified {len(risks_summary)} risks. Your task is to identify the {max_risks} MOST CRITICAL and IMPORTANT risks that require immediate attention.

Risks:
{chr(10).join([f"{i+1}. {r['title']} ({r['severity']}): {r['description'][:200]}" for i, r in enumerate(risks_summary)])}

CRITICAL: You MUST respond with VALID JSON only. Use this exact structure:

{{
  "prioritized_risk_ids": [
    "risk_id_1",
    "risk_id_2",
    "risk_id_3"
  ],
  "reasoning": "Brief explanation of why these risks were prioritized"
}}

Prioritization criteria:
1. **Immediate danger** (safety risks) - HIGHEST PRIORITY
2. **Severity** (critical > high > medium > low)
3. **Urgency** (time-sensitive issues)
4. **Impact** (potential harm to client or others)
5. **Escalation potential** (risks that could worsen quickly)

Return ONLY valid JSON, no additional text."""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a professional risk prioritization specialist. Always respond with valid JSON only."},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.2,
                max_tokens=1000,
                response_format={"type": "json_object"},
            )
            result = json.loads(response.choices[0].message.content.strip())
            prioritized_ids = result.get("prioritized_risk_ids", [])
            risk_map = {risk.id: risk for risk in all_risks}
            prioritized_risks = [risk_map[rid] for rid in prioritized_ids if rid in risk_map]

            if len(prioritized_risks) < max_risks:
                prioritized_ids_set = set(prioritized_ids)
                remaining = [r for r in all_risks if r.id not in prioritized_ids_set]
                severity_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
                remaining.sort(key=lambda r: severity_order.get(r.severity or "low", 3))
                prioritized_risks.extend(remaining[:max_risks - len(prioritized_risks)])

            print(f"✅ Prioritized {len(prioritized_risks)} risks using LLM")
            return prioritized_risks[:max_risks]

        except Exception as e:
            print(f"⚠️ Error prioritizing risks with LLM: {e}")
            severity_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
            return sorted(all_risks, key=lambda r: severity_order.get(r.severity or "low", 3))[:max_risks]
