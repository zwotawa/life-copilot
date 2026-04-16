export interface BackendVersionInfo {
  appName: string;
  environment: string;
  version: string;
  commitSha?: string | null;
  buildTimestampUtc?: string | null;
  serverTimeUtc: string;
}