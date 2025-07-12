import { Stream } from "xstream";

export interface ApplicationOutput {
  output$: Stream<string>;
}
