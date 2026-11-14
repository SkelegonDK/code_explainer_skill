# Code review video

Presents a review of code: what the review found, and the reasoning behind each finding, shown step by step so that the viewer can check it instead of trusting the verdict. The findings are the review's opinion and the video says so. The facts under them are checked like every other claim.

The review comes first and the video follows it. Nothing the video needs, such as a clear story, a shorter length or a strong ending, changes what the review found or how it judged it.

Every step of `SKILL.md` applies as written, except for the changes below. Concept topics and `long-form.md` do not apply.

## Step 1: intake

- Question 1 is **What should be reviewed?** Get the target: a pull request or branch, uncommitted changes, or existing code such as a file or a module. Ask what the review should look for only if the user has not said; without an answer, look for wrong behaviour first. If a review already exists (earlier in this conversation, in a file, or as comments on the pull request), the video presents that one, and step 2 still verifies every finding in it.
- Do the review (step 2) after question 1, because the findings set the length. Choose the title and `<name>` then; question 5 confirms them.
- Question 2: the subject is the code under review. Its author is "Expert in the subject".
- Question 3: recommend a length from the findings: about 45 s for each `blocker` or `should fix`, 15 s for each `consider`, and 40 s for the opening, what held up, and the close.
- Question 5: the outline lists the verdict in one sentence, then every finding with its severity and `path:line`, and says which ones the video shows and which it leaves to the written review.

## Step 2: review, and write down the reasoning

- For a pull request or a branch, set up `<base>`, `<head>` and `commit.txt` as in "Base and head" in `pull-request.md`. Uncommitted changes and existing code are read in place, and `commit.txt` is written as in `SKILL.md`.
- A review agent makes the review, on its own and before any beat is planned: your agent's review skill or command, or else a subagent whose brief is to review this code and does not mention a video. Without either, do the review yourself and finish it before you think about the video. Look first for wrong behaviour (bugs, unhandled errors, races, security holes, callers that break), then for what makes the code hard to change. Leave out what a linter or formatter would report.
- Never change the user's code. A proposed fix lives in the video and in `review.md`, and a reproduction runs on a copy outside the repository.

Write every finding in `<name>-draft/review.md` with:

- **Severity**: `blocker` (wrong behaviour that will happen), `should fix` (wrong behaviour under conditions that can happen, or a real cost to whoever changes this code next), `consider` (a judgement call). When the review agent rated the finding on a scale of its own, record that rating too, and the narration uses it.
- **Where**: `path:line`.
- **What the code does**: a fact that can be checked.
- **The failure scenario**: a concrete input or state, each step it takes through the code, and the wrong outcome. For a finding about maintenance, the concrete change that the code makes harder.
- **What would have prevented it, and does not**: the caller that does not validate, the type that allows the value, the `catch` that is not there, the test that does not cover it. Reviews are most often wrong here, so the viewer needs to hear it.
- **Evidence**: the `path:line` of every step, or better a command you ran, with its real output: a failing test, or a script in `<name>-draft/examples/`.
- **Confidence**: `verified` (reproduced by running it), `traced` (followed through the code, not run), `suspected` (could not be confirmed).
- **Proposed fix**, if you have one, and whether you ran the tests with it.

A finding with no concrete failure scenario is not a finding: cut it. Also record what the review checked and found sound, and what it did not look at.

`review.md` is the review agent's judgement, and from here on only evidence changes it: a finding that fails verification in this step, or that the fact-check refutes in step 6. Record each such change with its reason. Never change a severity, a confidence, the verdict or the order of the findings to suit the video.

## Step 3: plan the beats

1. Open with what was reviewed and the verdict in one sentence ("Three findings in the session renewal change. One of them loses sessions."), on a diagram of the reviewed code with the highlight on the parts that have findings. For a single script, the nodes are its steps.
2. The findings, most severe first. A `blocker` or `should fix` takes these beats, on one excerpt so that the viewer keeps their place:
   - **The finding.** What the code is for, the lines in question marked, and the problem in one plain sentence, with the severity the review gives it.
   - **The reasoning.** The failure scenario, walked through with its concrete values as mark labels (`s.expiresAt = 10:31, now = 10:45`). It ends on the outcome: `!error` with the real message when the code fails, or a label with the wrong result (`returns the expired session`). The last sentence says what would have prevented it and does not.
   - **The fix**, when there is one: the proposed code, directly after the reasoning so that it morphs from the current code. Its title is the current code's, ending in ` · proposed`, and the narration says that it is a proposal and whether it was run.

   When the viewer must see the code that fails to prevent it, such as a caller, give it a beat of its own between the finding and the reasoning. A `consider` takes one beat. For a review of a pull request, code at `<base>` is titled ` · before` as in `pull-request.md`.
3. One beat on what the review checked and found sound, and what it did not cover, on the opening diagram.
4. Close on the same diagram with the review's verdict and what to fix first.

When the findings do not fit the length, show the most severe, and say in the closing beat how many more are in the written review. Never leave out a `blocker` to fit: make the video longer.

The narration follows the review and keeps fact and judgement apart:

- Say each finding's severity, confidence and claim, and the verdict, as `review.md` has them. Do not sharpen a finding to make a better story, soften one to end well, or add a concern the review does not have.
- State what the code does as fact. Attribute every judgement to the review: "this review rates it a blocker, because…". Never state a judgement as a property of the code.
- Say the confidence: "running it with an expired session returns…" when verified, "following the call…" when traced. A `suspected` finding is put as an open question, not as a defect.
- Review the code, not its author. No "the author forgot".
- The beat on what held up lists what was checked. It is not praise.

## Step 5: check

Also compare the narration with `review.md`, finding by finding: the same severity, the same confidence, the same claim, and a verdict that says no more and no less.

## Step 6: fact-check

The reviewer tries to refute the review. Give it the beats, and for each finding the video leaves out one line with its `path:line` and its claim, but not `review.md`: its reasoning would lead the reviewer. For a pull request, also give `<base>` and `<head>`. Without a subagent, run each scenario again from the start instead of rereading `review.md`. Add this to the brief:

> This script presents a code review. Treat each finding, in the script and in the list of findings it leaves out, as a claim to refute. Follow its failure scenario through the code yourself, with the concrete values the script gives, and look for what would stop it: a guard in a caller, a type that rules the input out, a `catch`, a test that covers it. Run it if you can, on a copy outside the repository. Return one row per finding: `beat | finding | confirmed / refuted / unverifiable | path:line | why`. An excerpt whose title ends in `· proposed` is not in the repository: check that it differs from the code at its path only by the fix, that the fix prevents the scenario, and that it breaks no caller. An excerpt whose title ends in `· before` is checked against `git show <base>:<path>`. Report as `wrong` every judgement that the narration states as a fact, and every statement about the author instead of the code.

Remove a `refuted` finding from the video and mark it refuted in `review.md`, with the reviewer's reason. Make an `unverifiable` one `suspected`, or cut it. If the verdict changes, confirm the new outline with the user before building.

## Step 11: hand over

Deliver the video together with `<name>/review.md`: it holds every finding, including those the video leaves out and those the fact-check refuted. Say how many findings were verified, traced and suspected. Never post the review to the pull request without explicit permission.
