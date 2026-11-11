# Long form (15-30 min): chapters built in parallel

Work in a folder `<name>/`, in the current directory unless the user names a place, and start it with `mkdir -p <name>/chapters && echo '*' > <name>/.gitignore` so that it stays out of the user's repository. Paths below are relative to it.

1. **Plan (lead agent).** Run the intake (all four questions) and map the codebase, fanning out one read-only subagent per area if your agent supports subagents. Write `plan.md` with:
   - the chapter list: 3-5 min each, ordered from big picture to details, one question per chapter;
   - a glossary of terms and the names to use for them;
   - the overall title and `<name>`, a title for each chapter, and each chapter's `NN-slug` (its number and its title in kebab-case);
   - the level and the voice, the same for every chapter.

   Confirm the chapter plan with the user (intake question 4), then build.
2. **Chapter 00** is a 1-minute map: one architecture diagram with each later chapter as a node. With more than 8 later chapters, make each node a group of related chapters, because a diagram has at most 8 nodes.
3. **Write chapters.** If your agent supports subagents, start one per chapter, in parallel. Give each `plan.md`, its chapter's scope and question, and steps 2-5 of `SKILL.md`. Each works in `chapters/`, with the chapter's `NN-slug` as its `<name>` (draft in `chapters/NN-slug-draft/`) and stops after step 5, before any Remotion code. Without subagents, write the chapters one after another yourself.
4. **Fact-check each chapter (lead agent).** Run step 6 of `SKILL.md` on every chapter's script and diagrams, with a fresh reviewer per chapter. Chapter agents may not be able to start subagents of their own, so the lead runs this step. Also check the narration against the glossary.
5. **Build each chapter** with steps 7-10 of `SKILL.md`, in `chapters/NN-slug/`, titled with the chapter title, using the same voice everywhere. Resume the chapter agents or start new ones with the same brief. A chapter whose narration, code, diagram or chart changes here goes back to step 4.
6. **Join.** Every chapter uses identical render settings, so stream copy works. Join only each chapter's own video, not the test clips in its `out/`:

   ```bash
   for d in chapters/*/; do n=$(basename "$d"); echo "file '$PWD/chapters/$n/out/$n.mp4'"; done > list.txt
   ffmpeg -f concat -safe 0 -i list.txt -c copy -metadata title="<title>" <name>.mp4
   ```

   Run step 11 of `SKILL.md` once, on the joined file. Also deliver the individual chapter files, because people skip around.
