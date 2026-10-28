import * as migration_20261028_164411_full_schema from './20261028_164411_full_schema';
import * as migration_20261028_164500_seed_full_demo from './20261028_164500_seed_full_demo';

export const migrations = [
  {
    up: migration_20261028_164411_full_schema.up,
    down: migration_20261028_164411_full_schema.down,
    name: '20261028_164411_full_schema',
  },
  {
    up: migration_20261028_164500_seed_full_demo.up,
    down: migration_20261028_164500_seed_full_demo.down,
    name: '20261028_164500_seed_full_demo',
  },
];
