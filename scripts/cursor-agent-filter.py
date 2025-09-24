#!/usr/bin/env python3
"""
Cursor Agent Issue Filter and Prioritizer
Advanced filtering and scoring system for GitHub issues
"""

import json
import sys
import argparse
import yaml
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple
import subprocess

class IssueFilter:
    """Filter and prioritize GitHub issues for automated processing"""

    def __init__(self, config_path: Optional[str] = None):
        """Initialize with configuration"""
        self.config = self._load_config(config_path)

    def _load_config(self, config_path: Optional[str]) -> Dict[str, Any]:
        """Load configuration from YAML file"""
        if config_path is None:
            config_path = Path.home() / ".cursor-agent-config.yaml"
            if not config_path.exists():
                # Look for config in same directory as script
                script_dir = Path(__file__).parent
                config_path = script_dir / "cursor-agent-config.yaml"

        config_path = Path(config_path)
        if not config_path.exists():
            print(f"Warning: Config file not found at {config_path}", file=sys.stderr)
            return self._default_config()

        with open(config_path, 'r') as f:
            return yaml.safe_load(f)

    def _default_config(self) -> Dict[str, Any]:
        """Return default configuration"""
        return {
            'issue_filters': {
                'include_labels': ['good first issue', 'bug', 'enhancement'],
                'exclude_labels': ['wontfix', 'duplicate', 'blocked'],
                'max_age_days': 30,
                'complexity_score': {'min': 1, 'max': 7}
            },
            'prioritization': {
                'weights': {
                    'label_priority': 0.4,
                    'age_factor': 0.2,
                    'complexity_factor': 0.2,
                    'engagement_factor': 0.2
                },
                'label_priorities': {
                    'good first issue': 10,
                    'bug': 8,
                    'typo': 9,
                    'documentation': 6
                }
            }
        }

    def estimate_complexity(self, issue: Dict[str, Any]) -> int:
        """Estimate issue complexity on a scale of 1-10"""
        title = issue.get('title', '').lower()
        body = issue.get('body', '').lower() if issue.get('body') else ''
        labels = [label.get('name', '').lower() for label in issue.get('labels', [])]

        complexity_score = 1

        # Simple text-based complexity indicators
        simple_indicators = [
            'typo', 'spelling', 'fix text', 'update readme',
            'add comment', 'remove comment', 'format'
        ]

        medium_indicators = [
            'bug', 'fix', 'update', 'improve', 'refactor',
            'test', 'validation', 'error handling'
        ]

        complex_indicators = [
            'implement', 'architecture', 'design', 'performance',
            'security', 'database', 'api', 'integration'
        ]

        text_content = f"{title} {body} {' '.join(labels)}"

        # Check for complexity indicators
        if any(indicator in text_content for indicator in simple_indicators):
            complexity_score = min(complexity_score + 1, 10)

        if any(indicator in text_content for indicator in medium_indicators):
            complexity_score = min(complexity_score + 3, 10)

        if any(indicator in text_content for indicator in complex_indicators):
            complexity_score = min(complexity_score + 6, 10)

        # Adjust based on body length (longer descriptions often mean more complex issues)
        body_length = len(body) if body else 0
        if body_length > 1000:
            complexity_score = min(complexity_score + 2, 10)
        elif body_length > 500:
            complexity_score = min(complexity_score + 1, 10)

        # Adjust based on number of labels
        if len(labels) > 3:
            complexity_score = min(complexity_score + 1, 10)

        return min(complexity_score, 10)

    def calculate_age_days(self, issue: Dict[str, Any]) -> int:
        """Calculate issue age in days"""
        created_at = issue.get('created_at')
        if not created_at:
            return 0

        # Parse GitHub datetime format
        created = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
        now = datetime.now(timezone.utc)

        return (now - created).days

    def calculate_priority_score(self, issue: Dict[str, Any]) -> float:
        """Calculate priority score for an issue"""
        config = self.config.get('prioritization', {})
        weights = config.get('weights', {})
        label_priorities = config.get('label_priorities', {})

        # Label priority score
        labels = [label.get('name', '') for label in issue.get('labels', [])]
        label_score = max([label_priorities.get(label.lower(), 0) for label in labels] or [0])

        # Age factor (newer issues get higher priority)
        age_days = self.calculate_age_days(issue)
        age_score = max(0, 10 - (age_days / 3))  # Decrease by ~3.3 points per day

        # Complexity factor (simpler issues get higher priority)
        complexity = self.estimate_complexity(issue)
        complexity_score = max(0, 11 - complexity)  # Invert complexity (1->10, 10->1)

        # Engagement factor (comments, reactions)
        comments_count = issue.get('comments', 0)
        engagement_score = min(10, comments_count)  # Cap at 10

        # Calculate weighted score
        total_score = (
            weights.get('label_priority', 0.4) * label_score +
            weights.get('age_factor', 0.2) * age_score +
            weights.get('complexity_factor', 0.2) * complexity_score +
            weights.get('engagement_factor', 0.2) * engagement_score
        )

        return round(total_score, 2)

    def is_suitable_for_automation(self, issue: Dict[str, Any]) -> Tuple[bool, str]:
        """Check if issue is suitable for automated processing"""
        filters = self.config.get('issue_filters', {})

        # Skip if already assigned
        if issue.get('assignee'):
            return False, "Issue already assigned"

        # Skip if it's a pull request
        if issue.get('pull_request'):
            return False, "Item is a pull request, not an issue"

        # Check state
        if issue.get('state') != 'open':
            return False, f"Issue state is {issue.get('state')}"

        # Check age
        age_days = self.calculate_age_days(issue)
        max_age = filters.get('max_age_days', 30)
        if age_days > max_age:
            return False, f"Issue too old ({age_days} days > {max_age} days)"

        # Check labels
        labels = [label.get('name', '').lower() for label in issue.get('labels', [])]

        include_labels = [l.lower() for l in filters.get('include_labels', [])]
        exclude_labels = [l.lower() for l in filters.get('exclude_labels', [])]

        # Must have at least one include label (if specified)
        if include_labels and not any(label in include_labels for label in labels):
            return False, f"No matching include labels (has: {labels})"

        # Must not have any exclude labels
        if any(label in exclude_labels for label in labels):
            excluded = [l for l in labels if l in exclude_labels]
            return False, f"Has exclude labels: {excluded}"

        # Check complexity
        complexity = self.estimate_complexity(issue)
        complexity_config = filters.get('complexity_score', {})
        min_complexity = complexity_config.get('min', 1)
        max_complexity = complexity_config.get('max', 10)

        if complexity < min_complexity or complexity > max_complexity:
            return False, f"Complexity {complexity} outside range [{min_complexity}, {max_complexity}]"

        # Check title/body keywords if configured
        title_keywords = filters.get('title_keywords', {})
        if title_keywords:
            title_lower = issue.get('title', '').lower()

            # Check include keywords
            include_keywords = [k.lower() for k in title_keywords.get('include', [])]
            if include_keywords and not any(keyword in title_lower for keyword in include_keywords):
                return False, f"Title doesn't contain required keywords: {include_keywords}"

            # Check exclude keywords
            exclude_keywords = [k.lower() for k in title_keywords.get('exclude', [])]
            if any(keyword in title_lower for keyword in exclude_keywords):
                found_keywords = [k for k in exclude_keywords if k in title_lower]
                return False, f"Title contains excluded keywords: {found_keywords}"

        return True, "Suitable for automation"

    def filter_and_prioritize(self, issues: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Filter issues and add priority scores"""
        suitable_issues = []

        for issue in issues:
            suitable, reason = self.is_suitable_for_automation(issue)

            # Add metadata
            issue['automation_suitable'] = suitable
            issue['automation_reason'] = reason
            issue['priority_score'] = self.calculate_priority_score(issue) if suitable else 0
            issue['complexity_estimate'] = self.estimate_complexity(issue)
            issue['age_days'] = self.calculate_age_days(issue)

            if suitable:
                suitable_issues.append(issue)

        # Sort by priority score (highest first)
        suitable_issues.sort(key=lambda x: x['priority_score'], reverse=True)

        return suitable_issues

    def print_issue_summary(self, issue: Dict[str, Any]) -> None:
        """Print a formatted summary of an issue"""
        number = issue.get('number')
        title = issue.get('title', 'No title')
        labels = [label.get('name', '') for label in issue.get('labels', [])]
        priority = issue.get('priority_score', 0)
        complexity = issue.get('complexity_estimate', 0)
        age = issue.get('age_days', 0)

        print(f"#{number}: {title}")
        print(f"  Priority: {priority:.2f} | Complexity: {complexity} | Age: {age} days")
        print(f"  Labels: {', '.join(labels) if labels else 'None'}")
        print(f"  Status: {issue.get('automation_reason', 'Unknown')}")
        print()


def main():
    """Main CLI entry point"""
    parser = argparse.ArgumentParser(description='Filter and prioritize GitHub issues for automation')
    parser.add_argument('--config', help='Path to configuration file')
    parser.add_argument('--repo', help='Repository in format owner/name')
    parser.add_argument('--input', help='JSON file with issues (default: stdin)')
    parser.add_argument('--output', help='JSON file for filtered issues (default: stdout)')
    parser.add_argument('--limit', type=int, default=10, help='Maximum number of issues to return')
    parser.add_argument('--summary', action='store_true', help='Print human-readable summary')
    parser.add_argument('--fetch', action='store_true', help='Fetch issues from GitHub API')

    args = parser.parse_args()

    # Initialize filter
    issue_filter = IssueFilter(args.config)

    # Get issues data
    issues_data = []

    if args.fetch and args.repo:
        # Fetch from GitHub API using gh CLI
        try:
            cmd = [
                'gh', 'api', f'repos/{args.repo}/issues',
                '--jq', '.',
                '-f', 'state=open',
                '-f', 'per_page=100'
            ]
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            issues_data = json.loads(result.stdout)
        except subprocess.CalledProcessError as e:
            print(f"Error fetching issues: {e}", file=sys.stderr)
            sys.exit(1)
    elif args.input:
        # Read from file
        with open(args.input, 'r') as f:
            issues_data = json.load(f)
    else:
        # Read from stdin
        issues_data = json.load(sys.stdin)

    # Ensure issues_data is a list
    if not isinstance(issues_data, list):
        print("Error: Input must be a list of issues", file=sys.stderr)
        sys.exit(1)

    # Filter and prioritize
    filtered_issues = issue_filter.filter_and_prioritize(issues_data)

    # Limit results
    if args.limit > 0:
        filtered_issues = filtered_issues[:args.limit]

    # Output results
    if args.summary:
        print(f"Filtered {len(filtered_issues)} suitable issues from {len(issues_data)} total:")
        print("=" * 60)
        for issue in filtered_issues:
            issue_filter.print_issue_summary(issue)
    else:
        output_data = filtered_issues
        if args.output:
            with open(args.output, 'w') as f:
                json.dump(output_data, f, indent=2)
        else:
            json.dump(output_data, sys.stdout, indent=2)


if __name__ == '__main__':
    main()