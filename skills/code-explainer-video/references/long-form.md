# Long form (15-30 min): chapters built in parallel

1. **Plan (lead agent).** Run the intake (all three questions) and map the codebase, fanning out one read-only subagent per area if your agent supports subagents. Write `plan.md` with:
   - the chapter list: 3-5 min each, ordered from big picture to details, one question per chapter;
   - a glossary of terms and the names to use for them;
   - the voice (one for every chapter) and the theme.

   Confirm the chapter plan with the user (intake question 3), then build.
2. **Chapter 00** is a 1-minute map: one architecture diagram with each later chapter as a node.
3. **Build chapters.** If your agent supports subagents, start one per chapter, in parallel. Give each `plan.md`, its chapter's scope and question, and steps 2-6 of `SKILL.md`. Each builds its own project in `chapters/NN-slug/` and stops after the draft pass. Without subagents, build the chapters one after another yourself.
4. **Fact-check each chapter (lead agent).** Run step 7 of `SKILL.md` on every chapter, with a fresh reviewer per chapter. Chapter agents may not be able to start subagents of their own, so the lead runs this step. Also check the narration against the glossary.
5. **Voice and render** each chapter with step 8 of `SKILL.md`, using the same voice everywhere.
6. **Join.** Every chapter uses identical render settings, so stream copy works:

   ```bash
   for f in chapters/*/out/explainer.mp4; do echo "file '$PWD/$f'"; done > list.txt
   ffmpeg -f concat -safe 0 -i list.txt -c copy onboarding.mp4
   ```

   Run step 9 of `SKILL.md`. Also deliver the individual chapter files, because people skip around.
