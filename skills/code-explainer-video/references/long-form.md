# Long form (15-30 min): chapters built in parallel

Work in a folder `<name>/` inside `Code explainer video/` (see `SKILL.md`), and start it with `mkdir -p "Code explainer video/<name>/chapters" && echo '*' > "Code explainer video/.gitignore"` so that it stays out of the user's repository. Paths below are relative to `<name>/`.

1. **Plan (lead agent).** Run the intake (all five questions) and map the codebase, fanning out one read-only subagent per area if your agent supports subagents. Write `plan.md` with:
   - the chapter list: 3-5 min each, ordered from big picture to details, one question per chapter;
   - a glossary of terms and the names to use for them;
   - the overall title and `<name>`, a title for each chapter, and each chapter's `NN-slug` (its number and its title in kebab-case);
   - the commit line from step 2 of `SKILL.md`, which every chapter copies to its `commit.txt`, so all chapters name the same commit;
   - the level, the format, the colour theme, the voice, and whether there is music and sound effects, the same for every chapter. Choose the theme with the user as in step 8 of `SKILL.md`, on the first chapter that has a code beat, before the others are built.

   Confirm the chapter plan with the user (intake question 5), then build.
2. **Chapter 00** is a 1-minute map: one architecture diagram with each later chapter as a node. With more than 8 later chapters, make each node a group of related chapters, because a diagram has at most 8 nodes.
3. **Write chapters.** If your agent supports subagents, start one per chapter, in parallel. Give each `plan.md`, its chapter's scope and question, and steps 2-5 of `SKILL.md`. Each works in `chapters/` in place of `Code explainer video/`, with the chapter's `NN-slug` as its `<name>` (draft in `chapters/NN-slug-draft/`) and stops after step 5, before any Remotion code. Without subagents, write the chapters one after another yourself.
4. **Fact-check each chapter (lead agent).** Run step 6 of `SKILL.md` on every chapter's script and diagrams, with a fresh reviewer per chapter. Chapter agents may not be able to start subagents of their own, so the lead runs this step. Also check the narration against the glossary.
5. **Build each chapter** with steps 7-10 of `SKILL.md`, in `chapters/NN-slug/`, titled with the chapter title, using the same voice everywhere. Render each chapter to `../../../export/<name>/NN-slug.mp4`, where `<name>` is the whole video's. Resume the chapter agents or start new ones with the same brief. A chapter whose narration, code, diagram or chart changes here goes back to step 4.
6. **Join.** Every chapter uses identical render settings, so stream copy works. In `Code explainer video/export/`:

   ```bash
   for f in <name>/*.mp4; do echo "file '$f'"; done > <name>.txt
   ffmpeg -f concat -i <name>.txt -c copy -metadata title="<title>" -metadata comment="<commit line>" <name>.mp4 && rm <name>.txt
   ```

   Run step 11 of `SKILL.md` once, on the joined file `export/<name>.mp4`, and run `scripts/clean.sh` on every chapter, in `chapters/`. Also deliver the chapter files in `export/<name>/`, because people skip around.
