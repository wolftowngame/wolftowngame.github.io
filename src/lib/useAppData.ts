export class EventBus {
  private _events: Record<string, Function[]> = {};
  private _once: Record<string, Function[]> = {};

  on(type: string, fn: Function) {
    const handler = this._events[type];
    if (!handler) this._events[type] = [];
    this._events[type].push(fn);
  }

  emit(type: string, ...args: any[]) {
    const handler = this._events[type];
    if (!handler) return false;
    const queue = [...handler];
    const once = this._once[type];
    queue.forEach((fn) => {
      fn.call(this, ...args);
      if (once && once.includes(fn)) this.off(type, fn);
    });
    return true;
  }

  off(type: string, fn: Function) {
    const handler = this._events[type];
    if (!handler) return;
    if (this._once[type]) this._once[type].splice(this._once[type].indexOf(fn), 1);
    handler.splice(handler.indexOf(fn), 1);
  }

  once(type: string, fn: Function) {
    const handler = this._once[type];
    if (!handler) this._once[type] = [];
    this._once[type].push(fn);
    this.on(type, fn);
  }
}

export const AppEvent = new EventBus();
