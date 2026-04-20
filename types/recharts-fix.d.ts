// Patch temporaire pour EmptyObject manquant
declare module "redux" {
  export type EmptyObject = Record<string, never>;
  export type ActionCreator = (...args: any[]) => any;
}
