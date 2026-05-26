import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase, type Session } from "../lib/supabase";
import type {
  Checkin,
  Exam,
  Goal,
  Profile,
  StudyData,
  StudyTask,
  SyncMode,
  TargetUnit,
} from "../types";
import {
  createDefaultData,
  createDefaultExams,
  createDefaultGoals,
  createDefaultProfile,
  createDefaultTargetUnits,
  createDefaultTasks,
  LOCAL_USER_ID,
} from "./defaults";

const LOCAL_STORAGE_KEY = "xiaoman-study-data-v1";

type CollectionName =
  | "exams"
  | "study_tasks"
  | "checkins"
  | "goals"
  | "target_units";

type CollectionItem = Exam | StudyTask | Checkin | Goal | TargetUnit;
type SupabasePayload =
  | Record<string, unknown>
  | Array<Record<string, unknown>>;

interface StudyActions {
  reload: () => Promise<void>;
  saveProfile: (profile: Profile) => Promise<void>;
  saveExam: (exam: Exam) => Promise<void>;
  deleteExam: (id: string) => Promise<void>;
  saveTask: (task: StudyTask) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  saveCheckin: (checkin: Checkin) => Promise<void>;
  saveGoal: (goal: Goal) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  saveTargetUnit: (unit: TargetUnit) => Promise<void>;
  deleteTargetUnit: (id: string) => Promise<void>;
}

interface StudyContextValue {
  data: StudyData;
  loading: boolean;
  syncing: boolean;
  error: string;
  mode: SyncMode;
  userId: string;
  actions: StudyActions;
}

const StudyContext = createContext<StudyContextValue | null>(null);

function sortData(data: StudyData): StudyData {
  return {
    ...data,
    exams: [...data.exams].sort((a, b) => a.priority - b.priority),
    study_tasks: [...data.study_tasks].sort((a, b) =>
      `${a.task_date}${a.created_at ?? ""}`.localeCompare(
        `${b.task_date}${b.created_at ?? ""}`,
      ),
    ),
    checkins: [...data.checkins].sort((a, b) =>
      b.checkin_date.localeCompare(a.checkin_date),
    ),
    goals: [...data.goals].sort((a, b) =>
      (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999"),
    ),
    target_units: [...data.target_units].sort((a, b) => {
      const scoreA = a.priority * 10 - a.commute_score - a.stability_score;
      const scoreB = b.priority * 10 - b.commute_score - b.stability_score;
      return scoreA - scoreB;
    }),
  };
}

function loadLocalData() {
  const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!raw) return createDefaultData();

  try {
    return sortData(JSON.parse(raw) as StudyData);
  } catch {
    return createDefaultData();
  }
}

function replaceById<T extends { id: string }>(items: T[], item: T) {
  const exists = items.some((current) => current.id === item.id);
  return exists
    ? items.map((current) => (current.id === item.id ? item : current))
    : [item, ...items];
}

export function StudyDataProvider({
  children,
  cloudEnabled,
  session,
}: {
  children: ReactNode;
  cloudEnabled: boolean;
  session: Session | null;
}) {
  const [data, setData] = useState<StudyData>(() => loadLocalData());
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");
  const mode: SyncMode = cloudEnabled && session ? "cloud" : "local";
  const userId = session?.user.id ?? LOCAL_USER_ID;

  const persistCloud = useCallback(
    async (table: CollectionName | "profiles", payload: SupabasePayload) => {
      if (mode !== "cloud" || !supabase) return;
      setSyncing(true);
      setError("");
      const { error: saveError } = await supabase.from(table).upsert(payload);
      setSyncing(false);
      if (saveError) {
        setError(saveError.message);
        throw saveError;
      }
    },
    [mode],
  );

  const deleteCloud = useCallback(
    async (table: CollectionName, id: string) => {
      if (mode !== "cloud" || !supabase) return;
      setSyncing(true);
      setError("");
      const { error: deleteError } = await supabase
        .from(table)
        .delete()
        .eq("id", id);
      setSyncing(false);
      if (deleteError) {
        setError(deleteError.message);
        throw deleteError;
      }
    },
    [mode],
  );

  const loadCloudData = useCallback(async () => {
    if (!supabase || !session) return;
    setLoading(true);
    setError("");

    const [
      profileResult,
      examsResult,
      tasksResult,
      checkinsResult,
      goalsResult,
      unitsResult,
    ] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", session.user.id).maybeSingle(),
      supabase.from("exams").select("*").eq("user_id", session.user.id),
      supabase.from("study_tasks").select("*").eq("user_id", session.user.id),
      supabase.from("checkins").select("*").eq("user_id", session.user.id),
      supabase.from("goals").select("*").eq("user_id", session.user.id),
      supabase.from("target_units").select("*").eq("user_id", session.user.id),
    ]);

    const firstError =
      profileResult.error ??
      examsResult.error ??
      tasksResult.error ??
      checkinsResult.error ??
      goalsResult.error ??
      unitsResult.error;

    if (firstError) {
      setError(firstError.message);
      setLoading(false);
      return;
    }

    const profile =
      profileResult.data ?? createDefaultProfile(session.user.id);
    const exams =
      examsResult.data?.length ? examsResult.data : createDefaultExams(session.user.id);
    const studyTasks = tasksResult.data?.length
      ? tasksResult.data
      : createDefaultTasks(session.user.id);
    const goals =
      goalsResult.data?.length ? goalsResult.data : createDefaultGoals(session.user.id);
    const targetUnits = unitsResult.data?.length
      ? unitsResult.data
      : createDefaultTargetUnits(session.user.id);

    const nextData = sortData({
      profile,
      exams,
      study_tasks: studyTasks,
      checkins: checkinsResult.data ?? [],
      goals,
      target_units: targetUnits,
    });

    setData(nextData);
    setLoading(false);

    await Promise.all([
      profileResult.data
        ? Promise.resolve()
        : supabase.from("profiles").upsert(profile),
      examsResult.data?.length
        ? Promise.resolve()
        : supabase.from("exams").insert(exams),
      tasksResult.data?.length
        ? Promise.resolve()
        : supabase.from("study_tasks").insert(studyTasks),
      goalsResult.data?.length
        ? Promise.resolve()
        : supabase.from("goals").insert(goals),
      unitsResult.data?.length
        ? Promise.resolve()
        : supabase.from("target_units").insert(targetUnits),
    ]);
  }, [session]);

  const reload = useCallback(async () => {
    if (mode === "cloud") {
      await loadCloudData();
      return;
    }
    setData(loadLocalData());
    setLoading(false);
  }, [loadCloudData, mode]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (mode === "local" && !loading) {
      window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    }
  }, [data, loading, mode]);

  const saveProfile = useCallback(
    async (profile: Profile) => {
      const nextProfile = { ...profile, id: userId };
      setData((current) => sortData({ ...current, profile: nextProfile }));
      await persistCloud("profiles", nextProfile as unknown as SupabasePayload);
    },
    [persistCloud, userId],
  );

  const saveCollectionItem = useCallback(
    async <T extends CollectionItem>(
      table: CollectionName,
      item: T,
    ) => {
      const nextItem = { ...item, user_id: userId };
      setData((current) =>
        sortData({
          ...current,
          [table]: replaceById(
            current[table] as T[],
            nextItem as T,
          ),
        } as StudyData),
      );
      await persistCloud(table, nextItem as unknown as SupabasePayload);
    },
    [persistCloud, userId],
  );

  const deleteCollectionItem = useCallback(
    async (table: CollectionName, id: string) => {
      setData((current) =>
        sortData({
          ...current,
          [table]: (current[table] as CollectionItem[]).filter(
            (item) => item.id !== id,
          ),
        } as StudyData),
      );
      await deleteCloud(table, id);
    },
    [deleteCloud],
  );

  const actions = useMemo<StudyActions>(
    () => ({
      reload,
      saveProfile,
      saveExam: (exam) => saveCollectionItem("exams", exam),
      deleteExam: (id) => deleteCollectionItem("exams", id),
      saveTask: (task) => saveCollectionItem("study_tasks", task),
      deleteTask: (id) => deleteCollectionItem("study_tasks", id),
      saveCheckin: (checkin) => saveCollectionItem("checkins", checkin),
      saveGoal: (goal) => saveCollectionItem("goals", goal),
      deleteGoal: (id) => deleteCollectionItem("goals", id),
      saveTargetUnit: (unit) => saveCollectionItem("target_units", unit),
      deleteTargetUnit: (id) => deleteCollectionItem("target_units", id),
    }),
    [deleteCollectionItem, reload, saveCollectionItem, saveProfile],
  );

  const value = useMemo<StudyContextValue>(
    () => ({
      actions,
      data,
      error,
      loading,
      mode,
      syncing,
      userId,
    }),
    [actions, data, error, loading, mode, syncing, userId],
  );

  return (
    <StudyContext.Provider value={value}>{children}</StudyContext.Provider>
  );
}

export function useStudyData() {
  const value = useContext(StudyContext);
  if (!value) {
    throw new Error("useStudyData must be used within StudyDataProvider");
  }
  return value;
}
