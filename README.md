# Scopia

Scopia is a browser-based workspace for planning and conducting an independent scoping review. It follows a staged workflow from PCC question development through protocol, searches, screening, data charting, appraisal, synthesis and PRISMA-ScR reporting.

The initial workspace is tailored to the review:

> Identifying and Monitoring Psychological and Cognitive Difficulties in Youth-Onset Type 2 Diabetes: A Scoping Review

## What it does

- Builds and freezes a versioned scoping-review protocol
- Records reproducible database searches
- Imports bibliographic records from RIS or CSV files
- Supports title/abstract and full-text screening
- Records delayed human verification of screening decisions
- Charts study, measurement, clinical and outcome data
- Records design-appropriate appraisal judgements
- Organises narrative synthesis and evidence gaps
- Tracks PRISMA-ScR reporting completion
- Exports protocol, search, screening, charting, audit and report files
- Exports verified title/abstract decisions as JSONL for later agent evaluation or training

## Privacy and storage

Scopia is a static GitHub Pages application. Project data is stored in the browser's local storage and is not sent to a server. Use **Save backup** regularly and keep exported files in a secure research folder.

Clearing browser data, switching browsers or using a different device will not carry the project across automatically. Import a Scopia backup to continue elsewhere.

## Run locally

Open `index.html` in a modern browser. No build step or package installation is required.

## Publish with GitHub Pages

1. Push the files to the repository's `main` branch.
2. In the repository, open **Settings → Pages**.
3. Under **Build and deployment**, select **Deploy from a branch**.
4. Choose the `main` branch and `/ (root)` folder, then save.

The published URL will follow the pattern:

`https://<username>.github.io/<repository>/`

## Research safeguards

- Scopia supports transparent record-keeping; it does not replace methodological judgement.
- The agent JSONL export includes only title/abstract decisions marked as delayed-rechecked by the human reviewer.
- An AI agent is not treated as an independent second reviewer.
- Use the official JBI, PRISMA-ScR and chosen critical-appraisal guidance alongside the workspace.
- Do not store identifiable participant or confidential clinical data in this public-site application.

## Files

- `index.html` — application structure
- `styles.css` — responsive visual design
- `app.js` — state, workflow, imports, exports and local persistence

