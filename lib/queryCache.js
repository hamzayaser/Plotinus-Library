export function withReadCache(client, ttl = 60000) {
  const cache = new Map();
  function wrap(query, signature, readOnly = true) {
    return new Proxy(query, {
      get(target, property) {
        if (property === 'then') return (resolve, reject) => {
          if (!readOnly) return target.then(resolve, reject);
          const key = JSON.stringify(signature);
          const existing = cache.get(key);
          if (existing && existing.expires > Date.now()) return existing.promise.then(resolve, reject);
          const promise = Promise.resolve(target).then(response => {
            if (response.error) cache.delete(key);
            return response;
          }).catch(error => {
            cache.delete(key);
            throw error;
          });
          if (cache.size >= 120) cache.delete(cache.keys().next().value);
          cache.set(key, {
            promise,
            expires: Date.now() + ttl
          });
          return promise.then(resolve, reject);
        };
        const value = Reflect.get(target, property);
        if (typeof value !== 'function') return value;
        return (...args) => {
          const mutation = ['insert', 'update', 'upsert', 'delete'].includes(property);
          if (mutation) cache.clear();
          const result = value.apply(target, args);
          return result && typeof result.then === 'function' ? wrap(result, [...signature, [property, args]], readOnly && !mutation) : result;
        };
      }
    });
  }
  return new Proxy(client, {
    get(target, property) {
      if (property === 'from') return table => wrap(target.from(table), [['from', table]]);
      const value = Reflect.get(target, property);
      return typeof value === 'function' ? value.bind(target) : value;
    }
  });
}
