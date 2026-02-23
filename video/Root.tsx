import { Composition } from "remotion";
import { CapitalAccessVol4 } from "./CapitalAccessVol4";
import { CapitalAccessVol5 } from "./CapitalAccessVol5";
import { CapitalAccessVol6 } from "./CapitalAccessVol6";
import { CapitalAccessVol7 } from "./CapitalAccessVol7";
import { SearchLaunch } from "./SearchLaunch";
import { HowTo } from "./HowTo";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="CapitalAccessVol4"
        component={CapitalAccessVol4}
        durationInFrames={450}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="CapitalAccessVol5"
        component={CapitalAccessVol5}
        durationInFrames={345}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="CapitalAccessVol6"
        component={CapitalAccessVol6}
        durationInFrames={585}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="CapitalAccessVol7"
        component={CapitalAccessVol7}
        durationInFrames={615}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="SearchLaunch"
        component={SearchLaunch}
        durationInFrames={810}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="HowTo"
        component={HowTo}
        durationInFrames={1170}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
