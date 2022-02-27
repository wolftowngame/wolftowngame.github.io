import { useRef, useState } from 'react';
export class Queue {
  value = 0;
  get() {
    return ++this.value;
  }
  is(value: number) {
    return this.value === value;
  }
  not(value: number) {
    return this.value !== value;
  }
}
