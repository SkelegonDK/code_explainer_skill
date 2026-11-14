# Pull request video

Describes what a pull request changes and how the change fits the codebase it merges into. The video reports and does not judge: the viewer should finish it knowing what is different after the merge, and form their own opinion. For an opinion, make a code review video (`code-review.md`).

Every step of `SKILL.md` applies as written, except for the changes below. Concept topics and `long-form.md` do not apply.

## Base and head

`<head>` is the last commit of the pull request and `<base>` is the commit it branched from: `git merge-base <base branch> <head>`. A branch compared with another branch is a pull request too, with no number.

- Never change the user's checkout. Fetch what is missing (`git fetch origin <base branch> pull/<n>/head` on GitHub) and take the description from `gh pr view <n> --json number,title,body,baseRefName,headRefOid,commits`.
- Read the code after the change in place when the checkout is at `<head>` with no uncommitted changes. Otherwise read it in a worktree: `git worktree add --detach "${TMPDIR:-/tmp}/<name>-head" <head>`. Remove it with `git worktree remove` when the video is delivered or the work stops.
- Read the code before the change with `git show <base>:<path>`, and the change with `git diff <base> <head>`.
- `commit.txt` names both commits: `echo "<repo>#<n> <base>..<head>" > <name>-draft/commit.txt`, with the short hashes, which writes e.g. `shop-api#128 3f9c2e1..a1b2c3d`. `<repo>` is the name of the user's checkout folder, not of the worktree. Leave out `#<n>` when there is no number.

## Step 1: intake

- Question 1 is **Which pull request?** Get its number or URL, or the two branches. Do not ask for a reason.
- Question 2: the subject is the part of the codebase the pull request touches.
- Question 3: offer ~1 min, ~2 min and ~5 min. Recommend the shortest that holds every change in behaviour: ~1 min holds one change, ~2 min two to four, ~5 min more.
- Question 5: the question the video answers is always "what does this pull request change, and what does that touch?". The title is the pull request's own title, shortened if needed. Add the left-out list (step 2) to the outline.

## Step 2: research

- Sort the diff into **changes**: one change is everything done for one purpose. A change can span several files, and one file can hold two.
- For each change, record in `notes.md` what the code did at `<base>`, what it does at `<head>`, and each with its `path:line`.
- Then leave the diff. Search the code at `<head>` for every function, type, field, route, config key and table the change touches, and record each caller and reader, with what is different for it after the merge and what is not. A caller outside the diff whose behaviour changes is the most important thing this video can show.
- Record what a reviewer would ask, as facts with their `path:line`: which changed lines the changed or added tests run and which no test runs, new dependencies, config keys and migrations, changed public signatures, and removed code that something still refers to.
- Take the stated purpose and the reason for the change only from the pull request's title, description, commit messages and linked issue, and record where each is stated. A comment in the diff is code, not the author's statement about the pull request. Where the description and the diff disagree (it promises something the diff does not do, or the diff does something it does not mention), record both.
- Keep `<name>-draft/left-out.md`: every changed file that no beat shows, with the reason (a lock file, generated code, formatting only, a rename, or shown only as a diagram node), and every change in behaviour the video does not show. Leaving out a change in behaviour for length is a last resort: recommend a longer video first.

## Step 3: plan the beats

1. Open on a diagram of the area the pull request touches, as it is at `<head>`, with the highlight on the parts that change. Its nodes can be files, commands and documents as well as code. The narration says what the pull request is for, in its author's words and attributed to them.
2. One group of beats per change, in the order a reader needs: a change that others build on comes first.
   - A **before** beat shows the code at `<base>` and an **after** beat shows the same region at `<head>`, with the same cuts, so that the code morphs from one into the other. Mark the new or changed lines in the after beat. The viewer has just seen this code, so a mark may be lit from the first sentence.
   - A title ends in ` · before` when the excerpt is read at `<base>`, and in ` · after` when it is code the pull request changed or added, read at `<head>`: `src/auth/session.ts:31-44 · before`, with the line range of that commit. Code that the pull request does not change, such as a caller, takes a plain title and is read at `<head>`.
   - Code that is only added needs no before beat. Code that is only removed needs no after beat: say what now does its work, or that nothing does.
3. After a change, show what it touches: the caller whose behaviour is different, or a diagram of the callers with the highlight on those affected.
4. Close on the opening diagram with a recap of what is different after the merge, and how many changes in behaviour the video left out, if any. No verdict.

In ~1 min that is the opening diagram, one before and after pair, one beat on what it touches, and the recap.

The narration describes and does not grade:

- No word that rates the change: "better", "cleaner", "simpler", "improves", "correctly", "unfortunately", "risky". Say what is different. Not "this improves performance", but "the lookup now reads from the cache", and a number only when it was measured (chart beats, step 3 of `SKILL.md`).
- A purpose or a reason is always attributed ("the description says", "the commit message gives the reason as") and never inferred. When the pull request text says only what changed, report that and add no reason.
- "Fixes" is the author's claim. Say what the code did before and what it does now.
- What the pull request removes or costs is stated as plainly as what it adds: a dropped check, a new dependency, a changed result for an existing caller.
- A fact that reads as criticism stays when it is a fact: "no test calls the new branch" can be checked. "This is undertested" is a verdict.
- No recommendation to merge or not, and no suggested changes.
- The story follows the diff. Do not give a change more or less weight than it has to make the video flow.

## Step 5: check

Also check coverage: every file in `git diff --name-only <base> <head>` appears in a beat's title or in `left-out.md`.

## Step 6: fact-check

Give the reviewer `<base>`, `<head>`, the pull request's title, description and commit messages, and `left-out.md`. Add this to the brief:

> This script describes a pull request. `<base>` is the code before it and `<head>` is the code after it. Check each excerpt whose title ends in `· before` against `git show <base>:<path>`, and every other excerpt against `<head>`. Check that every purpose or reason given for a change is attributed, and is stated in the pull request text you were given. Read the whole of `git diff <base> <head>` and report every change in behaviour that the script neither shows nor lists in `left-out.md`. Search the code at `<head>` for callers and readers of what changed, and report each one whose behaviour changes and that the script does not mention. Report as `wrong` every sentence that judges the change rather than describes it: praise, criticism, a recommendation, or a word that rates it, such as "better" or "cleaner".

## Step 11: hand over

Name the pull request and both commits, and give the contents of `left-out.md`. Say that the video describes `<head>`: commits pushed to the pull request later are not in it.
