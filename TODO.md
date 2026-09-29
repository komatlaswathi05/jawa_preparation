# Remaining Modules

Topics that are missing or only mentioned in passing in the existing material.
Implement **one module at a time**: create the topic file, register it in the category file, add the sidebar entry, then run `npm run lint` and `npm run build`.

## Checklist

_No remaining modules. Add new ones in this format:_

- [ ] **Module N — Category: Title** (`topic-id`)
  - Subtopic
  - Subtopic
  - Subtopic

## Per-module steps

1. Create `src/data/topics/<topic-id>.js` (same shape as existing topics).
2. Import it in the category file (e.g. `src/data/sqlData.js`).
3. Add the sidebar item in `src/data/navigation.js`.
4. `npm run lint && npm run build`.
5. Tick the box above.
