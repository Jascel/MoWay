// Clears everything MoWay saved in this browser (profile, photo, added-event changes, alert, welcome flag)
// so a practice run starts clean. The sign-in session and the Supabase database are not touched.
// The caller then sends the person to the home screen, which starts the welcome flow again.
export function resetLocalDemo() {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith("moway.")) keys.push(key);
  }
  keys.forEach((key) => localStorage.removeItem(key));
}
