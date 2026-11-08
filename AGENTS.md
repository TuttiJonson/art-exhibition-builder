# AGENTS.md

Rules for any agent working in this project. They apply to every task, including after the project is built.

1. **Use the simplest code that works.** Plain, readable code. No extra abstractions, libraries, or cleverness unless the task needs them.
2. **Plain HTML, CSS, and JavaScript only.** No React, no Tailwind, no other framework or library, and nothing loaded from a CDN. No build step.
3. **Add nothing I didn't ask for.** No extra features, files, dependencies, or refactors. If something seems missing, ask.
4. **Follow the design.** Match [DESIGN.md](DESIGN.md) for layout, colors, type, and spacing.
5. **Follow the PRD.** Match [PRD.md](PRD.md) for features and scope. If a request conflicts with it, say so.
6. **Understand the proposal first.** Read [PROPOSAL.md](PROPOSAL.md) before creating anything, so the work fits the project's purpose.^
7. **Stick to the API.** Use only the [Art Institute of Chicago API](https://api.artic.edu/docs/) (free, no key). Don't add other data sources or API keys. Request only the fields needed, show only public-domain paintings with images, and always handle failed requests (check `response.ok`, catch errors, show a clear message).
