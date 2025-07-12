import { Stream } from "xstream";
import { FileSources, FileOperation } from "../../modules/filesystem";
import { REPLSources } from "../../modules/repl";

export interface FilesSources {
  REPL: REPLSources;
  Files: FileSources;
}

export interface FilesOutput {
  command$: Stream<FileOperation>;
  error$: Stream<Error>;
  output$: Stream<string>;
}
