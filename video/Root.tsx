import { Composition } from "remotion";
import { CapitalAccessVol4 } from "./CapitalAccessVol4";
import { CapitalAccessVol5 } from "./CapitalAccessVol5";
import { SearchLaunch } from "./SearchLaunch";

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
        id="SearchLaunch"
        component={SearchLaunch}
        durationInFrames={810}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
