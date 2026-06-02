import { useEffect, useState } from "react";
import { getUserDataByUid } from "@/src/services/userApi";
import type UserData from "@/src/models/UserData";

/** Ładuje dane dziecka (po UID) na potrzeby nagłówków ekranów rodzica. */
export function useChild(childId?: string): UserData | null {
  const [child, setChild] = useState<UserData | null>(null);

  useEffect(() => {
    let active = true;

    if (!childId) {
      setChild(null);
      return;
    }

    getUserDataByUid(childId)
      .then((c) => {
        if (active) setChild(c);
      })
      .catch(() => {
        if (active) setChild(null);
      });

    return () => {
      active = false;
    };
  }, [childId]);

  return child;
}
