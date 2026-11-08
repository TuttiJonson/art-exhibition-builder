# AGENTS.md

Rules for any agent working in this project. They apply to every task, including after the project is built.

1. **Use the simplest code that works.** Plain, readable code. No extra abstractions, libraries, or cleverness unless the task needs them.
2. **Add nothing I didn't ask for.** No extra features, files, dependencies, or refactors. If something seems missing, ask.
3. **Follow the design.** Match [DESIGN.md](DESIGN.md) for layout, colors, type, and spacing.
4. **Follow the PRD.** Match [PRD.md](PRD.md) for features and scope. If a request conflicts with it, say so.
5. **Understand the proposal first.** Read [PROPOSAL.md](PROPOSAL.md) before creating anything, so the work fits the project's purpose.
6. **Be true to the CSS.** Reuse the existing styles and variables in `css/`. Don't add inline styles or one-off values, and don't restyle what already exists.
7. **Stick to the API.** Use only the [Art Institute of Chicago API](https://api.artic.edu/docs/) (free, no key). Don't add other data sources or API keys. Request only the fields needed, show only public-domain paintings with images, and always handle failed requests (check `response.ok`, catch errors, show a clear message).
