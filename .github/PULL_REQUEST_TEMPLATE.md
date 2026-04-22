## Summary

<!-- One or two sentences: what does this PR do? -->

## Motivation

<!-- Why is this change needed? Link to issue / spec section if relevant. -->

## Changes

<!-- Bullet list of the concrete changes in this PR. -->
-
-

## How was this tested?

<!-- Did you run any of the following? Tick the ones that apply. -->
- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm run build`
- [ ] Manual UI walkthrough (login → create → filter → edit → complete → delete → logout)
- [ ] API smoke tests with `curl` (see README "REST API reference")

## Checklist

- [ ] Code follows the layer boundaries described in spec §1.4.1
  (presentation never touches the filesystem directly).
- [ ] New / changed API routes return appropriate HTTP status codes
  (200 / 201 / 400 / 401 / 404).
- [ ] Task routes still require the `prismtask_user` session cookie.
- [ ] No secrets, credentials, or personal data added to the repository.
- [ ] Commit messages follow Conventional Commits (`feat:` / `fix:` /
  `refactor:` / `docs:` / `test:` / `chore:`).

## Screenshots / recordings

<!-- Optional — especially helpful for UI changes. -->
