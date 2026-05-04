export type LoginRouterState = {
  /** Set after `/auth/update-password` so the login shell can toast a success message. */
  passwordUpdated?: boolean;
};
