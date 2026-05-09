import { AggregateRoot } from '@/shared/domain';
import { InvalidCredentialsError } from '../errors/invalid-credentials.error';
import { UserRegisteredEvent } from '../events/user-registered.event';

export interface UserProps {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
}

export class User extends AggregateRoot {
  private readonly _email: string;
  private readonly _passwordHash: string;
  private readonly _createdAt: Date;

  private constructor(props: UserProps) {
    super(props.id);
    this._email = props.email;
    this._passwordHash = props.passwordHash;
    this._createdAt = props.createdAt;
  }

  static create(props: { id: string; email: string; passwordHash: string }): User {
    if (!props.email.trim() || !props.email.includes('@')) {
      throw new InvalidCredentialsError('Invalid email format');
    }
    const createdAt = new Date();
    const user = new User({ ...props, createdAt });
    user.addDomainEvent(
      new UserRegisteredEvent({ userId: props.id, email: props.email, createdAt }),
    );
    return user;
  }

  static restore(props: UserProps): User {
    return new User(props);
  }

  get email(): string {
    return this._email;
  }
  get passwordHash(): string {
    return this._passwordHash;
  }
  get createdAt(): Date {
    return this._createdAt;
  }
}
