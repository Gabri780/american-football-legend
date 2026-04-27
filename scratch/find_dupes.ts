import { LAST_NAMES } from '../src/data/lastNames';

const counts: Record<string, number> = {};
LAST_NAMES.forEach(name => {
  counts[name] = (counts[name] || 0) + 1;
});

Object.entries(counts).forEach(([name, count]) => {
  if (count > 1) {
    console.log(`Duplicate found: ${name} (${count} times)`);
  }
});
