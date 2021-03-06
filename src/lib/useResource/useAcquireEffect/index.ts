import { useEffect, useMemo } from "react";
import useGetterActionWithCache from "../useGetterActionWithCache";
import { TtlCallback } from "../types";
import useStoredResource from "../useStoredResource";
import useActions from "../useActions";
import { uniqueIdentifier } from "../utils";

const useAcquireEffect = ({
  acquireImmediately,
  resourceId,
  getResource,
  ttl,
}: {
  acquireImmediately: boolean;
  resourceId: string;
  getResource: () => Promise<any>;
  ttl: number | TtlCallback;
}) => {
  const hookId = useMemo<string>(() => uniqueIdentifier(), []);
  const getResourceWithCache = useGetterActionWithCache(
    resourceId,
    getResource
  );
  const {
    acquiredDate,
    data,
    isInStore,
    isLoading,
    assignedHookId,
  } = useStoredResource(resourceId, acquireImmediately);
  const { assign, unassign } = useActions(resourceId);
  useEffect(() => {
    if (assignedHookId === undefined && !isInStore && acquireImmediately) {
      assign(hookId, acquireImmediately);
    }
  }, [
    acquireImmediately,
    assign,
    assignedHookId,
    hookId,
    isInStore,
    isLoading,
  ]);
  useEffect(
    () => () => {
      unassign(hookId);
    },
    [hookId, unassign]
  );
  useEffect(() => {
    if (assignedHookId === hookId) {
      getResourceWithCache();
    } else if (acquiredDate && ttl) {
      const timeLeft =
        typeof ttl === "function"
          ? ttl(resourceId, data)
          : ttl - (Date.now() - new Date(acquiredDate).getTime());
      if (timeLeft > 0) {
        const timeoutId = setTimeout(() => {
          getResourceWithCache();
        }, timeLeft);
        return () => clearTimeout(timeoutId);
      } else {
        getResourceWithCache();
      }
    }
  }, [
    acquiredDate,
    assignedHookId,
    data,
    getResourceWithCache,
    hookId,
    resourceId,
    ttl,
  ]);
};

export default useAcquireEffect;
