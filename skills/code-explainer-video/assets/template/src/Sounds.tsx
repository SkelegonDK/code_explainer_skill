import { Audio } from "@remotion/media";
import { createContext, useContext } from "react";
import { interpolate, Sequence, staticFile, useVideoConfig } from "remotion";

// The sound files in public/audio/ (the skill's assets/audio/), the one each event plays and its volume, from 0 to 1.
const SOUNDS = {
  whoosh: { file: "whoosh-3", volume: 0.2 }, // a new visual comes in
  pop: { file: "pop-2", volume: 0.5 }, // a diagram node or chart value appears
  click: { file: "click-2", volume: 0.3 }, // the highlight moves to something new
  nope: { file: "nope-3", volume: 0.4 }, // the highlight reaches an error
};
export type Sound = keyof typeof SOUNDS;
export type Cue = { at: number; sound: Sound | null }; // `at` is a frame of the current beat

const MUSIC = 0.1; // the music's volume, under the narration
const FADE = 30; // frames for the music to fade in at the start and out at the end

export const SoundsOn = createContext(true);

// The sound as the highlight moves from the items in `before` to those in `now`: a nope when it reaches an error,
// a click when it reaches anything else new, and none when it only lets go.
export const move = (now: string[], before: string[], error: (id: string) => boolean): Sound | null => {
  const reached = now.filter((id) => !before.includes(id));
  return reached.some(error) ? "nope" : reached.length ? "click" : null;
};

export const Cues: React.FC<{ cues: Cue[] }> = ({ cues }) =>
  useContext(SoundsOn) &&
  cues.map(({ at, sound }, i) =>
    sound && (
      <Sequence key={i} from={Math.round(at)} layout="none">
        <Audio src={staticFile(`audio/${SOUNDS[sound].file}.mp3`)} volume={SOUNDS[sound].volume} />
      </Sequence>
    ),
  );

// The music loops under the whole video.
export const Music = () => {
  const { durationInFrames: end } = useVideoConfig();
  const fade = (f: number) => interpolate(f, [0, FADE, end - FADE, end], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <Audio src={staticFile("audio/music-loop.mp3")} loop loopVolumeCurveBehavior="extend" volume={(f) => MUSIC * fade(f)} />;
};
