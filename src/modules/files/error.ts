export class InvalidCommandInput extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidCommandInput";
    Object.setPrototypeOf(this, InvalidCommandInput.prototype);
  }
}
