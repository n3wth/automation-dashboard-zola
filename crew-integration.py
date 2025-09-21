#!/usr/bin/env python3
"""
Crew Integration for Zola Automation Dashboard
Sends automation execution data to Supabase via Zola's chat interface
"""

import os
import json
import requests
import uuid
from datetime import datetime
from typing import Dict, Any

class ZolaDashboardReporter:
    """Reports crew executions to Zola dashboard via chat messages"""

    def __init__(self):
        self.zola_url = "http://localhost:3005"  # Zola is running on 3005
        self.api_endpoint = f"{self.zola_url}/api/chat"

    def report_execution(self, agent_name: str, task: str, result: str,
                        duration_ms: int = None, status: str = "completed"):
        """Report automation execution as chat message"""

        # Format as automation-enhanced chat message
        message_content = self._format_automation_message(
            agent_name, task, result, status, duration_ms
        )

        # Send to Zola chat API with required parameters
        try:
            payload = {
                "messages": [
                    {
                        "role": "user",
                        "content": f"🤖 {agent_name}: {task}"
                    },
                    {
                        "role": "assistant",
                        "content": message_content
                    }
                ],
                "chatId": str(uuid.uuid4()),
                "userId": "00000000-0000-0000-0000-000000000001",
                "model": "gpt-4.1-nano",
                "isAuthenticated": False,
                "systemPrompt": "You are an automation dashboard assistant tracking crew executions.",
                "enableSearch": False
            }

            response = requests.post(self.api_endpoint, json=payload)
            if response.status_code == 200:
                print(f"✅ Reported {agent_name} execution to dashboard")
            else:
                print(f"⚠️ Failed to report to dashboard: {response.status_code}")

        except Exception as e:
            print(f"⚠️ Dashboard connection failed: {e}")

    def _format_automation_message(self, agent_name: str, task: str,
                                  result: str, status: str, duration_ms: int) -> str:
        """Format execution result as rich chat message"""

        status_emoji = {
            "completed": "✅",
            "running": "🔄",
            "failed": "❌",
            "cancelled": "⏹️"
        }

        duration_text = f" ({duration_ms}ms)" if duration_ms else ""

        return f"""**{status_emoji.get(status, '🤖')} {agent_name} Automation {status.title()}**{duration_text}

**Task**: {task}

**Result**:
{result}

---
*Automation executed at {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC*"""

# Example usage
if __name__ == "__main__":
    reporter = ZolaDashboardReporter()

    # Test automation report
    reporter.report_execution(
        agent_name="AI_Monitor",
        task="Check latest AI industry news",
        result="Found 3 major AI developments: OpenAI model updates, Anthropic safety breakthrough, Google-Meta collaboration",
        duration_ms=2500,
        status="completed"
    )