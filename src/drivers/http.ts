import { HTTPSource, RequestInput } from "@cycle/http";
import { Driver } from "@cycle/run";
import { Stream } from "xstream";

export type HTTPDriver = Driver<Stream<RequestInput>, HTTPSource>;
export { makeHTTPDriver } from "@cycle/http";
