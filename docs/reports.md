# Test Reports

AI-UI can generate test reports in three formats via the `save_report` MCP tool
or the `POST /report` HTTP endpoint.

---

## Formats

### JSON (`format: "json"`)

Machine-readable report with aggregate counts and full step details.

```json
{
  "generatedAt": "2026-03-19T10:00:00.000Z",
  "totalRuns": 3,
  "passed": 2,
  "failed": 1,
  "skipped": 0,
  "totalDurationMs": 4521,
  "results": [ ... ]
}
```

**Best for:** CI pipelines, dashboards, custom processing.

---

### HTML (`format: "html"`)

Self-contained single-file report with inline CSS. No external dependencies — open in any browser.

**Features:**
- Summary cards: total / passed / failed / skipped / duration
- One collapsible section per scenario with status badge
- Per-step table with ✓ / ✗ / — icons and error messages
- XSS-safe (all user strings are HTML-escaped)

**Best for:** sharing with teammates, attaching to PRs, quick visual review.

---

### JUnit XML (`format: "junit"`)

Standard JUnit XML compatible with all major CI/CD systems.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<testsuites name="AI-UI Tests" tests="12" failures="1" skipped="2" time="4.521">
  <testsuite name="Login flow" tests="3" failures="0" skipped="0" time="1.234">
    <testcase name="navigate https://example.com/login" time="0.400"/>
    <testcase name="fill #email" time="0.200"/>
    <testcase name="click #submit" time="0.634"/>
  </testsuite>
  ...
</testsuites>
```

Step times are reported in **seconds** (`durationMs / 1000`).

**Best for:** GitHub Actions, Jenkins, GitLab CI, Azure DevOps.

---

## Using `save_report` (MCP)

```
# Single run
Save a JUnit report for run abc-123 to ./reports/abc-123.xml

# All stored runs
Save an HTML report of all runs to ./reports/run-2026-03-19.html
```

The tool returns:
```json
{
  "path": "/absolute/path/to/reports/run.html",
  "format": "html",
  "bytes": 14823,
  "runs": 3,
  "hint": "Open the file in a browser to view the formatted report."
}
```

---

## CI/CD Integration

### GitHub Actions

```yaml
- name: Run AI-UI tests and save JUnit report
  run: |
    node server/dist/index.js --port 3100 &
    sleep 2
    curl -X POST http://localhost:3100/report \
      -H "Content-Type: application/json" \
      -d '{"format":"junit"}' \
      > reports/results.xml

- name: Upload JUnit results
  uses: actions/upload-artifact@v4
  with:
    name: test-results
    path: reports/results.xml

- name: Publish test report
  uses: mikepenz/action-junit-report@v4
  if: always()
  with:
    report_paths: reports/results.xml
```

---

### Jenkins

```groovy
pipeline {
  stages {
    stage('Test') {
      steps {
        sh 'node server/dist/index.js --port 3100 &'
        sh 'sleep 2 && curl -X POST http://localhost:3100/report -d \'{"format":"junit"}\' -H "Content-Type: application/json" > reports/results.xml'
      }
      post {
        always {
          junit 'reports/results.xml'
        }
      }
    }
  }
}
```

---

### GitLab CI

```yaml
test:
  script:
    - node server/dist/index.js --port 3100 &
    - sleep 2
    - |
      curl -X POST http://localhost:3100/report \
        -H "Content-Type: application/json" \
        -d '{"format":"junit"}' > reports/results.xml
  artifacts:
    when: always
    reports:
      junit: reports/results.xml
```
