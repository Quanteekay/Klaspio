import { useEffect, useState } from "react";
import SafeAreaContainer from "@/src/components/SafeAreaContainer";
import ViewTitle from "@/src/components/ViewTitle";
import Loader from "@/src/components/Loader";
import LessonsCalendar from "@/src/components/Calendar/LessonsCalendar";
import { auth } from "@/FirebaseConfig";

export default function StudentCalendar() {
  const [uid, setUid] = useState<string | null>(auth.currentUser?.uid ?? null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUid(user?.uid ?? null);
    });
    return () => unsubscribe();
  }, []);

  return (
    <SafeAreaContainer>
      <ViewTitle back>Kalendarz</ViewTitle>
      {uid ? <LessonsCalendar studentId={uid} /> : <Loader />}
    </SafeAreaContainer>
  );
}
