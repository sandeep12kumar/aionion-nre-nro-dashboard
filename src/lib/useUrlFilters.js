import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

// Filters kept in the URL (?search=..&page=..), so Back / refresh / a shared
// link keep them. Any change except to `page` goes back to page 1.
export function useUrlFilters(defaults) {
  const [params, setParams] = useSearchParams();
  const filters = useMemo(() => {
    const out = { ...defaults };
    for (const key of Object.keys(defaults)) {
      const value = params.get(key);
      if (value !== null) out[key] = typeof defaults[key] === "number" ? Number(value) || defaults[key] : value;
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const setFilters = useCallback((changes) => {
    setParams((current) => {
      const next = new URLSearchParams(current);
      const updates = { ...changes };
      if (!("page" in updates)) updates.page = 1;
      for (const [key, value] of Object.entries(updates)) {
        if (value === "" || value === null || value === undefined || value === defaults[key]) next.delete(key);
        else next.set(key, String(value));
      }
      return next;
    }, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setParams]);

  return [filters, setFilters];
}

// The value after the user stops typing for `ms`.
export function useDebounced(value, ms = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);
  return debounced;
}
