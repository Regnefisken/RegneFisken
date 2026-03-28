/** Per-visit: ambient Søuhyre hides after boss catch until player leaves Ørkensøen. */
export let soeUhyreCaughtThisVisit = false;

export function resetSoeuhyreCaughtThisVisit() {
  soeUhyreCaughtThisVisit = false;
}

export function markSoeuhyreCaughtThisVisit() {
  soeUhyreCaughtThisVisit = true;
}
