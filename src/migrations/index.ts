import * as migration_20260904_164258_initial from './20260904_164258_initial';

export const migrations = [
  {
    up: migration_20260904_164258_initial.up,
    down: migration_20260904_164258_initial.down,
    name: '20260904_164258_initial'
  },
];
