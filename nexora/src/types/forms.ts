export type FormState = { error?: string; message?: string; fieldErrors?: Record<string, string> };
export const zodFields = (e: { issues: { path: (string | number)[]; message: string }[] }): Record<string, string> =>
  Object.fromEntries(e.issues.map((i) => [String(i.path[0]), i.message]));
