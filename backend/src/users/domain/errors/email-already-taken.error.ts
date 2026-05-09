export class EmailAlreadyTakenError extends Error {
  readonly code = 'EMAIL_ALREADY_TAKEN';
  constructor(email: string) {
    super(`Email already taken: ${email}`);
    this.name = 'EmailAlreadyTakenError';
  }
}
