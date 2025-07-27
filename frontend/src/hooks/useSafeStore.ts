// Simplified hook for store compatibility
const useSafeStore = <T, F>(
  store: () => T,
  callback: (state: T) => F
) => {
  const result = store();
  return callback(result);
};

export default useSafeStore;
