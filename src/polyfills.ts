import { Buffer } from 'buffer';
(window as any).global = window;
(window as any).Buffer = Buffer;
(window as any).process = {
  env: { DEBUG: undefined },
  version: '',
  versions: {},
  browser: true,
  nextTick: (cb: any) => setTimeout(cb, 0)
};
