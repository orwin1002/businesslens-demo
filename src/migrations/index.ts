import * as migration_20261027_100511_initial from './20261027_100511_initial';
import * as migration_20261027_101500_seed_demo_firms from './20261027_101500_seed_demo_firms';

export const migrations = [
  {
    up: migration_20261027_100511_initial.up,
    down: migration_20261027_100511_initial.down,
    name: '20261027_100511_initial',
  },
  {
    up: migration_20261027_101500_seed_demo_firms.up,
    down: migration_20261027_101500_seed_demo_firms.down,
    name: '20261027_101500_seed_demo_firms',
  },
];
