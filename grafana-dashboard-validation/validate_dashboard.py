#!/usr/bin/env python3
"""
Grafana Dashboard Pre-Deployment Validator

Validates dashboard JSON files before deployment by:
1. Checking JSON syntax
2. Testing PromQL queries against live Prometheus
3. Verifying metric existence
4. Validating datasource UIDs
5. Checking for common issues

Usage:
    python scripts/validate_dashboard.py monitoring/grafana/dashboards/visual-parser/14-multi-city.json
    python scripts/validate_dashboard.py --all  # Validate all dashboards
"""

import json
import sys
import os
import re
from pathlib import Path
from typing import Dict, List, Tuple, Optional, Any
import requests
from datetime import datetime
import argparse
from collections import defaultdict

# Configuration
PROMETHEUS_URL = os.getenv("PROMETHEUS_URL", "http://192.168.0.9:9090")
GRAFANA_URL = os.getenv("GRAFANA_URL", "http://192.168.0.9:3000")

class Colors:
    """Terminal colors for output"""
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    BOLD = '\033[1m'
    RESET = '\033[0m'

class ValidationIssue:
    """Represents a validation issue found in dashboard"""
    def __init__(self, severity: str, category: str, message: str, details: Optional[str] = None):
        self.severity = severity  # ERROR, WARNING, INFO
        self.category = category  # JSON, PROMQL, DATASOURCE, METRIC, etc.
        self.message = message
        self.details = details

    def __str__(self):
        color = Colors.RED if self.severity == "ERROR" else Colors.YELLOW if self.severity == "WARNING" else Colors.BLUE
        icon = "❌" if self.severity == "ERROR" else "⚠️" if self.severity == "WARNING" else "ℹ️"
        msg = f"{color}{icon} [{self.severity}] {self.category}: {self.message}{Colors.RESET}"
        if self.details:
            msg += f"\n    {Colors.RESET}Details: {self.details}"
        return msg

class DashboardValidator:
    def __init__(self, prometheus_url: str = PROMETHEUS_URL, quick_mode: bool = False):
        self.prometheus_url = prometheus_url.rstrip('/')
        self.quick_mode = quick_mode  # Skip Prometheus checks
        self.issues: List[ValidationIssue] = []
        self.metrics_cache: Dict[str, bool] = {}
        self.datasources: Dict[str, str] = {}

    def validate_file(self, filepath: str) -> Tuple[bool, List[ValidationIssue]]:
        """Validate a single dashboard file"""
        self.issues = []
        path = Path(filepath)

        print(f"\n{Colors.BOLD}Validating: {path.name}{Colors.RESET}")
        print("=" * 60)

        # Step 1: Validate JSON syntax
        dashboard = self._validate_json(path)
        if not dashboard:
            return False, self.issues

        # Step 2: Extract and validate dashboard metadata
        self._validate_metadata(dashboard)

        # Step 3: Validate panels
        panels = dashboard.get("panels", [])
        for panel in panels:
            self._validate_panel(panel)

        # Step 4: Validate templating variables
        templating = dashboard.get("templating", {})
        if templating:
            self._validate_templating(templating)

        # Print summary
        error_count = sum(1 for i in self.issues if i.severity == "ERROR")
        warning_count = sum(1 for i in self.issues if i.severity == "WARNING")
        info_count = sum(1 for i in self.issues if i.severity == "INFO")

        print(f"\n{Colors.BOLD}Summary:{Colors.RESET}")
        print(f"  Errors: {error_count}")
        print(f"  Warnings: {warning_count}")
        print(f"  Info: {info_count}")

        # Print issues by severity
        if self.issues:
            print(f"\n{Colors.BOLD}Issues found:{Colors.RESET}")
            for issue in sorted(self.issues, key=lambda x: (x.severity != "ERROR", x.severity != "WARNING", x.category)):
                print(f"  {issue}")

        success = error_count == 0
        if success:
            print(f"\n{Colors.GREEN}✅ Dashboard validation PASSED{Colors.RESET}")
        else:
            print(f"\n{Colors.RED}❌ Dashboard validation FAILED with {error_count} errors{Colors.RESET}")

        return success, self.issues

    def _validate_json(self, path: Path) -> Optional[Dict]:
        """Validate JSON syntax"""
        try:
            with open(path, 'r') as f:
                dashboard = json.load(f)
            print(f"{Colors.GREEN}✓{Colors.RESET} JSON syntax valid")
            return dashboard
        except json.JSONDecodeError as e:
            self.issues.append(ValidationIssue(
                "ERROR", "JSON", f"Invalid JSON syntax at line {e.lineno}, column {e.colno}", str(e)
            ))
            return None
        except Exception as e:
            self.issues.append(ValidationIssue(
                "ERROR", "FILE", f"Cannot read file: {e}"
            ))
            return None

    def _validate_metadata(self, dashboard: Dict):
        """Validate dashboard metadata"""
        # Check required fields
        if not dashboard.get("title"):
            self.issues.append(ValidationIssue(
                "WARNING", "METADATA", "Dashboard missing title"
            ))

        if not dashboard.get("uid"):
            self.issues.append(ValidationIssue(
                "WARNING", "METADATA", "Dashboard missing UID (will be auto-generated)"
            ))

        # Check for deprecated fields
        if dashboard.get("id") is not None and dashboard.get("id") != 0:
            self.issues.append(ValidationIssue(
                "WARNING", "METADATA", "Dashboard has hardcoded 'id' field",
                "Should be null or 0 for provisioned dashboards"
            ))

    def _validate_panel(self, panel: Dict):
        """Validate a single panel"""
        panel_title = panel.get("title", "Untitled")
        panel_type = panel.get("type", "unknown")

        # Handle different panel types
        if panel_type == "row":
            # Row panels may contain nested panels
            nested_panels = panel.get("panels", [])
            for nested in nested_panels:
                self._validate_panel(nested)
            return

        # Validate datasource
        datasource = panel.get("datasource")
        if datasource:
            self._validate_datasource(datasource, panel_title)

        # Validate queries/targets
        targets = panel.get("targets", [])
        for target in targets:
            self._validate_target(target, panel_title)

        # Check for common panel issues
        if panel_type == "graph" and not panel.get("yaxes"):
            self.issues.append(ValidationIssue(
                "WARNING", "PANEL", f"Panel '{panel_title}' missing yaxes configuration"
            ))

    def _validate_datasource(self, datasource: Any, panel_title: str):
        """Validate datasource configuration"""
        if isinstance(datasource, dict):
            uid = datasource.get("uid")
            ds_type = datasource.get("type")

            if not uid:
                self.issues.append(ValidationIssue(
                    "ERROR", "DATASOURCE", f"Panel '{panel_title}' has datasource without UID"
                ))

            # Common datasource UIDs
            known_uids = {
                "prometheus": ["prometheus", "PBFA97CFB590B2093"],  # Common Prometheus UIDs
                "postgres": ["postgres", "P6B9DDE46643D7D7B"],  # PostgreSQL
            }

            # Check if datasource type matches expected UIDs
            if ds_type and ds_type in known_uids:
                # This is just a sanity check, not an error if different
                if uid and uid not in known_uids[ds_type]:
                    self.issues.append(ValidationIssue(
                        "INFO", "DATASOURCE",
                        f"Panel '{panel_title}' uses non-standard {ds_type} UID: {uid}",
                        f"Common UIDs for {ds_type}: {', '.join(known_uids[ds_type])}"
                    ))

    def _validate_target(self, target: Dict, panel_title: str):
        """Validate a query target (PromQL, LogQL, or SQL)"""
        # Get datasource type
        datasource = target.get("datasource")
        ds_type = None
        if isinstance(datasource, dict):
            ds_type = datasource.get("type", "")

        # PromQL validation (for Prometheus datasource)
        expr = target.get("expr", "")
        if expr:
            # Only validate if it's actually a Prometheus query
            if ds_type == "loki":
                self.issues.append(ValidationIssue(
                    "INFO", "LOGQL", f"LogQL query in '{panel_title}' (not validated)",
                    expr[:100] + "..." if len(expr) > 100 else expr
                ))
            elif ds_type in ["postgres", "mysql", "mssql"]:
                self._validate_sql(expr, panel_title)
            else:
                # Default to PromQL validation if no datasource specified
                self._validate_promql(expr, panel_title)

        # SQL validation (basic)
        raw_sql = target.get("rawSql", "") or target.get("rawQuery", "")
        if raw_sql:
            self._validate_sql(raw_sql, panel_title)

        # Check for common issues
        if target.get("hide", False):
            self.issues.append(ValidationIssue(
                "INFO", "QUERY", f"Panel '{panel_title}' has hidden query"
            ))

    def _validate_promql(self, expr: str, context: str):
        """Validate PromQL expression"""
        if not expr or expr == "":
            return

        # Skip template variables for now
        if "$" in expr:
            self.issues.append(ValidationIssue(
                "INFO", "PROMQL", f"Query contains variables (skipping validation): {context}",
                expr[:100] + "..." if len(expr) > 100 else expr
            ))
            return

        # Skip LogQL queries (Loki queries use |= |~ != !~ operators)
        logql_operators = [' |= ', ' |~ ', ' != ', ' !~ ', '|=', '|~', '| pattern', '| regexp', '| json', '| logfmt']
        if any(op in expr for op in logql_operators):
            self.issues.append(ValidationIssue(
                "INFO", "LOGQL", f"LogQL query detected (skipping Prometheus validation): {context}",
                expr[:100] + "..." if len(expr) > 100 else expr
            ))
            return

        # In quick mode, only do syntax validation
        if self.quick_mode:
            # Basic syntax checks
            if expr.count('(') != expr.count(')'):
                self.issues.append(ValidationIssue(
                    "ERROR", "PROMQL", f"Unbalanced parentheses in '{context}'",
                    expr[:100] + "..." if len(expr) > 100 else expr
                ))
            if expr.count('[') != expr.count(']'):
                self.issues.append(ValidationIssue(
                    "ERROR", "PROMQL", f"Unbalanced brackets in '{context}'",
                    expr[:100] + "..." if len(expr) > 100 else expr
                ))
            if expr.count('{') != expr.count('}'):
                self.issues.append(ValidationIssue(
                    "ERROR", "PROMQL", f"Unbalanced braces in '{context}'",
                    expr[:100] + "..." if len(expr) > 100 else expr
                ))
            return

        # Extract metric names from PromQL
        metrics = self._extract_metrics_from_promql(expr)

        # Test query against Prometheus
        try:
            response = requests.get(
                f"{self.prometheus_url}/api/v1/query",
                params={"query": expr},
                timeout=5
            )

            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "error":
                    error_msg = data.get("error", "Unknown error")
                    self.issues.append(ValidationIssue(
                        "ERROR", "PROMQL", f"Invalid PromQL in '{context}'",
                        f"Query: {expr[:100]}...\nError: {error_msg}"
                    ))
                else:
                    # Query is valid
                    result = data.get("data", {}).get("result", [])
                    if len(result) == 0 and not self._is_expected_empty(expr):
                        self.issues.append(ValidationIssue(
                            "WARNING", "PROMQL", f"Query returns no data in '{context}'",
                            f"Query: {expr[:100]}..."
                        ))
            else:
                self.issues.append(ValidationIssue(
                    "ERROR", "PROMQL", f"Prometheus returned {response.status_code} for query in '{context}'",
                    expr[:100] + "..." if len(expr) > 100 else expr
                ))

        except requests.exceptions.Timeout:
            self.issues.append(ValidationIssue(
                "WARNING", "PROMETHEUS", f"Timeout testing query for '{context}'",
                "Prometheus might be slow or unreachable"
            ))
        except Exception as e:
            self.issues.append(ValidationIssue(
                "WARNING", "PROMETHEUS", f"Cannot connect to Prometheus for '{context}'",
                str(e)
            ))

        # Validate metric existence
        for metric in metrics:
            self._check_metric_exists(metric, context)

    def _extract_metrics_from_promql(self, expr: str) -> List[str]:
        """Extract metric names from PromQL expression"""
        # Simple regex to find metric names (not perfect but good enough)
        # Metrics are usually alphanumeric with underscores, followed by { or space
        pattern = r'\b([a-z_][a-z0-9_]*(?:_total|_count|_sum|_bucket)?)\b'
        matches = re.findall(pattern, expr.lower())

        # Filter out PromQL functions
        promql_functions = {
            'sum', 'rate', 'increase', 'avg', 'max', 'min', 'count',
            'histogram_quantile', 'by', 'without', 'group_left', 'group_right',
            'on', 'ignoring', 'and', 'or', 'unless', 'vector', 'scalar',
            'topk', 'bottomk', 'abs', 'ceil', 'floor', 'round', 'sort',
            'deriv', 'predict_linear', 'delta', 'idelta', 'irate'
        }

        metrics = [m for m in matches if m not in promql_functions]
        return list(set(metrics))

    def _check_metric_exists(self, metric: str, context: str):
        """Check if a metric exists in Prometheus"""
        # Use cache to avoid repeated checks
        if metric in self.metrics_cache:
            if not self.metrics_cache[metric]:
                self.issues.append(ValidationIssue(
                    "WARNING", "METRIC", f"Metric '{metric}' not found in '{context}'"
                ))
            return

        try:
            response = requests.get(
                f"{self.prometheus_url}/api/v1/label/__name__/values",
                timeout=5
            )

            if response.status_code == 200:
                data = response.json()
                metrics = data.get("data", [])
                exists = metric in metrics
                self.metrics_cache[metric] = exists

                if not exists:
                    # Check if it might be a pattern issue
                    similar = [m for m in metrics if metric in m or m in metric]
                    if similar:
                        self.issues.append(ValidationIssue(
                            "WARNING", "METRIC", f"Metric '{metric}' not found in '{context}'",
                            f"Similar metrics found: {', '.join(similar[:3])}"
                        ))
                    else:
                        self.issues.append(ValidationIssue(
                            "WARNING", "METRIC", f"Metric '{metric}' not found in '{context}'"
                        ))
        except Exception:
            # If we can't check, don't report as error
            pass

    def _is_expected_empty(self, expr: str) -> bool:
        """Check if a query is expected to return no data (e.g., for alerts)"""
        # Queries checking for absence or zero values might legitimately return empty
        patterns = [
            'absent(',
            '== 0',
            '!= 0',
            '< 0',
            'unless',
            'alert'
        ]
        return any(pattern in expr.lower() for pattern in patterns)

    def _validate_sql(self, sql: str, context: str):
        """Basic SQL validation"""
        if not sql:
            return

        # Check for common SQL issues
        sql_lower = sql.lower()

        # Check for missing table references
        if 'from' not in sql_lower and 'select' in sql_lower:
            self.issues.append(ValidationIssue(
                "WARNING", "SQL", f"SQL query might be missing FROM clause in '{context}'"
            ))

        # Check for hardcoded dates that might be outdated
        if re.search(r"'202[0-3]-", sql):
            self.issues.append(ValidationIssue(
                "WARNING", "SQL", f"SQL query contains hardcoded old dates in '{context}'",
                "Consider using relative date functions"
            ))

    def _validate_templating(self, templating: Dict):
        """Validate template variables"""
        variables = templating.get("list", [])

        for var in variables:
            var_name = var.get("name", "unnamed")
            var_type = var.get("type", "unknown")

            if var_type == "query":
                # Validate query variables
                query = var.get("query", "")
                datasource = var.get("datasource")

                # Handle both string and dict query formats
                if isinstance(query, dict):
                    query = query.get("query", "")

                # Skip validation for SQL queries (PostgreSQL datasource)
                if datasource and isinstance(datasource, dict):
                    ds_type = datasource.get("type", "")
                    if ds_type in ["postgres", "mysql", "mssql", "influxdb"]:
                        self._validate_sql(query, f"Variable '{var_name}'")
                        continue

                # Skip Grafana-specific template functions
                if query and isinstance(query, str):
                    # Check if it looks like SQL (common SQL keywords)
                    sql_keywords = ['SELECT ', 'INSERT ', 'UPDATE ', 'DELETE ', 'FROM ', 'WHERE ']
                    if any(keyword in query.upper() for keyword in sql_keywords):
                        self._validate_sql(query, f"Variable '{var_name}'")
                    # These are Grafana template functions, not regular PromQL
                    elif any(query.startswith(func) for func in ['label_values(', 'label_names(', 'metrics(', 'query_result(']):
                        self.issues.append(ValidationIssue(
                            "INFO", "VARIABLE", f"Grafana template function in '{var_name}' (skipping validation)",
                            query[:100]
                        ))
                    elif not query.startswith("$"):
                        self._validate_promql(query, f"Variable '{var_name}'")

            elif var_type == "datasource":
                # Check datasource variables
                if not var.get("regex") and not var.get("options"):
                    self.issues.append(ValidationIssue(
                        "INFO", "VARIABLE", f"Datasource variable '{var_name}' has no filter"
                    ))

def validate_all_dashboards(base_path: str = "monitoring/grafana/dashboards", quick_mode: bool = False) -> Dict[str, bool]:
    """Validate all dashboards in the directory"""
    validator = DashboardValidator(quick_mode=quick_mode)
    results = {}

    dashboard_path = Path(base_path)
    if not dashboard_path.exists():
        print(f"{Colors.RED}Error: Dashboard directory not found: {base_path}{Colors.RESET}")
        return results

    # Find all JSON files
    json_files = list(dashboard_path.rglob("*.json"))

    if not json_files:
        print(f"{Colors.YELLOW}No dashboard JSON files found in {base_path}{Colors.RESET}")
        return results

    print(f"\n{Colors.BOLD}Found {len(json_files)} dashboards to validate{Colors.RESET}")

    total_errors = 0
    total_warnings = 0

    for filepath in sorted(json_files):
        success, issues = validator.validate_file(str(filepath))
        results[str(filepath)] = success

        errors = sum(1 for i in issues if i.severity == "ERROR")
        warnings = sum(1 for i in issues if i.severity == "WARNING")
        total_errors += errors
        total_warnings += warnings

    # Print overall summary
    print(f"\n{Colors.BOLD}{'='*60}{Colors.RESET}")
    print(f"{Colors.BOLD}OVERALL SUMMARY{Colors.RESET}")
    print(f"{Colors.BOLD}{'='*60}{Colors.RESET}")

    passed = sum(1 for v in results.values() if v)
    failed = len(results) - passed

    print(f"Total dashboards: {len(results)}")
    print(f"  {Colors.GREEN}Passed: {passed}{Colors.RESET}")
    print(f"  {Colors.RED}Failed: {failed}{Colors.RESET}")
    print(f"Total issues:")
    print(f"  {Colors.RED}Errors: {total_errors}{Colors.RESET}")
    print(f"  {Colors.YELLOW}Warnings: {total_warnings}{Colors.RESET}")

    if failed > 0:
        print(f"\n{Colors.RED}❌ Validation FAILED - fix errors before deployment{Colors.RESET}")
        print("\nFailed dashboards:")
        for path, success in results.items():
            if not success:
                print(f"  - {path}")
    else:
        print(f"\n{Colors.GREEN}✅ All dashboards validation PASSED{Colors.RESET}")

    return results

def main():
    parser = argparse.ArgumentParser(description="Validate Grafana dashboard before deployment")
    parser.add_argument("dashboard", nargs="?", help="Path to dashboard JSON file")
    parser.add_argument("--all", action="store_true", help="Validate all dashboards")
    parser.add_argument("--prometheus", default=PROMETHEUS_URL, help="Prometheus URL")
    parser.add_argument("--quick", action="store_true", help="Quick mode - skip Prometheus checks (for CI/CD)")
    parser.add_argument("--json", action="store_true", help="Output results as JSON (for CI/CD)")

    args = parser.parse_args()

    # Handle JSON output for CI/CD
    if args.json:
        import json as json_lib
        results = {}

        if args.all:
            dashboard_results = validate_all_dashboards(quick_mode=args.quick)
            for path, success in dashboard_results.items():
                results[path] = {"success": success}
        elif args.dashboard:
            validator = DashboardValidator(args.prometheus, quick_mode=args.quick)
            success, issues = validator.validate_file(args.dashboard)
            results = {
                "file": args.dashboard,
                "success": success,
                "issues": [
                    {
                        "severity": i.severity,
                        "category": i.category,
                        "message": i.message,
                        "details": i.details
                    } for i in issues
                ]
            }

        print(json_lib.dumps(results, indent=2))
        sys.exit(0 if all(r.get("success", r) for r in (results.values() if isinstance(results, dict) and "file" not in results else [results])) else 1)

    # Normal output
    if args.quick:
        print(f"{Colors.YELLOW}⚡ Running in quick mode (no Prometheus checks){Colors.RESET}\n")

    if args.all:
        results = validate_all_dashboards(quick_mode=args.quick)
        sys.exit(0 if all(results.values()) else 1)
    elif args.dashboard:
        validator = DashboardValidator(args.prometheus, quick_mode=args.quick)
        success, _ = validator.validate_file(args.dashboard)
        sys.exit(0 if success else 1)
    else:
        parser.print_help()
        sys.exit(1)

if __name__ == "__main__":
    main()