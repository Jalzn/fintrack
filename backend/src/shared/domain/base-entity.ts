export abstract class BaseEntity {
  private readonly _id: string;

  constructor(_id: string) {
    this._id = _id;
  }

  get id() {
    return this._id;
  }

  equals(other: BaseEntity): boolean {
    if (this.id === other.id) {
      return true;
    }
    return false;
  }
}
