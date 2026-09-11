# Taste

- Wants to be told to "check the current project state and implement per the documented conventions/spec" — treats repo docs as the authoritative source of process, not ad-hoc decisions. Confidence: 0.85
- Wants agent actions, logs, and notes persisted into documentation rather than living only in chat; suggests dedicating a separate directory for this. Confidence: 0.8
- Prefers a "commit first, then document" rhythm: commit the current changes, then record the next-step action plan and acceptance criteria in the docs. Confidence: 0.8
- Prefers acceptance criteria that are automatable/scriptable (e.g. CLI-based end-to-end verification and regression tests) rather than manual browser testing. Confidence: 0.8
- Likes to benchmark a project against a reference project's documented process/standards and close the gaps ("对标 X 项目的流程和规范"). Confidence: 0.7
- Wants commits to follow the repo's documented git workflow and open-source commit conventions, with changes ultimately rebased onto main. Confidence: 0.8
- Dislikes decorative characters around commit messages (e.g. stray `@` tags before/after the subject) — keep commit messages plain. Confidence: 0.85
- Prefers cleaning up stale local git branches that are already abandoned/merged. Confidence: 0.7
- Before release/merge, wants a review of the diff between the current work and remote main to confirm no changes to core logic or other pages that could break existing behavior. Confidence: 0.7
- Prefers a real `CLAUDE.md` file over `AGENTS.md`; if `CLAUDE.md` is a symlink it should be converted to a regular file. Confidence: 0.9
- Expects the agent to reach for the skills already installed in the environment (e.g. `jina` for web reading, `github` / GitHub CLI for repo & API access) instead of raw `web_fetch` / ad-hoc shell calls; assumes these are available by default. Confidence: 0.75
- Wants repo skills maintained per the ecosystem-wide convention (agentskills.io SKILL.md spec, `.agents/skills/` layout) so they stay installable by third-party tooling like `npx skills` / skills-manager-cli, rather than a repo-local ad-hoc setup. Confidence: 0.6
- Doesn't want to be asked for confirmation on routine/mechanical actions (e.g. committing): says "commit everything per convention, no need to check with me" and expects the agent to just proceed; when the agent later excluded something and asked again, the answer was again "just commit it, it's fine". Confidence: 0.7
- Prefers leaving the working tree fully clean: agent/tooling artifacts (agent settings, learned taste files) should be committed or explicitly gitignored rather than left dangling as untracked leftovers. Confidence: 0.6
- Iterates agent skills in their global user-level skills dir (`~/.agents/skills/<name>`) and then expects the agent to sync those updates back into the repo's `.agents/skills/` (repo stays the committed source of truth), keeping files byte-identical to the local source. Confidence: 0.7
