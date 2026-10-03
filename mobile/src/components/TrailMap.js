import { gardenMapAvailable } from "../map/availability.js";
import { GardenMapGate } from "../map/GardenMapGate.js";
import { StandardTrailMap } from "./StandardTrailMap.js";

export function TrailMap({ state, onOpenLandmark, onUserExplore }) {
  if (gardenMapAvailable(state)) {
    return <GardenMapGate state={state} onOpenLandmark={onOpenLandmark} onUserExplore={onUserExplore} />;
  }
  return <StandardTrailMap state={state} onOpenLandmark={onOpenLandmark} />;
}
