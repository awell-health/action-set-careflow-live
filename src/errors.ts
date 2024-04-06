export class ErrorWithData<T = any> extends Error {
  data: T
  constructor({ msg, data }: { msg: string; data: T }) {
    super(msg)
    this.data = data
    Object.setPrototypeOf(this, new.target.prototype)
    this.name = ErrorWithData.name
  }
}
