import { HelpSources } from "./types";

import { view } from "./view";
import { intent } from "./intent";
import { model } from "./model";
import { ApplicationOutput } from "../../types";

export function Help(sources: HelpSources): ApplicationOutput {
  return view(model(intent(sources)));
}
