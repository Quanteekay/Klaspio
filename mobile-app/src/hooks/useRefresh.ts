import { useCallback, useState } from "react";

/**
 * Stan + handler dla pull-to-refresh.
 * Użycie:
 *   const { refreshing, onRefresh } = useRefresh(fetchData);
 *   <FlatList refreshControl={<ThemedRefreshControl {...{refreshing,onRefresh}} />} ... />
 */
export function useRefresh(fetcher: () => Promise<void> | void) {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetcher();
    } finally {
      setRefreshing(false);
    }
  }, [fetcher]);

  return { refreshing, onRefresh };
}
