import { makeHTTPDriver, RequestOptions, Response } from "@cycle/http";
import xs, { Stream } from "xstream";
import { Driver } from "@cycle/run";

// Define request and response types
export interface HTTPRequest extends RequestOptions {
  category: string;
  retry?: boolean;
  retryCount?: number;
}

export interface HTTPResponse {
  id: string;
  success: boolean;
  status?: number;
  body?: unknown;
  error?: string;
  request: RequestOptions;
}

// Define source and sink types
export interface HTTPSources {
  select(category: string): Stream<Stream<Response>>;
}

export interface HTTPSinks {
  Request: Stream<HTTPRequest>;
}

// Define the driver type
export type HTTPDriver = Driver<HTTPSinks, HTTPSources>;

// Make the HTTP driver
export function makeHTTPDriver(): HTTPDriver {
  return makeHTTPDriver();
}
