/** Read `key`, migrating once from `legacyKey` when the new key is absent. */
export function getItemWithMigration(key, legacyKey) {
  const current = localStorage.getItem(key)
  if (current != null) return current
  const legacy = localStorage.getItem(legacyKey)
  if (legacy == null) return null
  localStorage.setItem(key, legacy)
  localStorage.removeItem(legacyKey)
  return legacy
}
