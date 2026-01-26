import { Composition } from "remotion";
import { CapitalAccessVol4 } from "./CapitalAccessVol4";

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
    </>
  );
};
