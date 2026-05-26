import type {
  Checkin,
  Exam,
  Goal,
  Profile,
  StudyData,
  StudyTask,
  TargetUnit,
} from "../types";
import { addDays, todayKey } from "../lib/dates";

export const LOCAL_USER_ID = "00000000-0000-4000-8000-000000000001";

export function randomId() {
  return crypto.randomUUID();
}

export function createDefaultProfile(userId: string): Profile {
  return {
    id: userId,
    display_name: "小满",
    home_area: "合肥",
    commute_minutes: 45,
    education: "",
    major: "",
    age: null,
    certificates: "",
    political_status: "",
    work_years: 0,
    target_note: "优先通勤近、稳定性强、岗位条件匹配的单位。",
  };
}

export function createDefaultExams(userId: string): Exam[] {
  return [
    {
      id: randomId(),
      user_id: userId,
      name: "国家公务员考试涉合肥岗位",
      category: "国考",
      target_date: null,
      date_status: "pending",
      source_url: "https://www.scs.gov.cn/",
      notes: "关注驻肥垂管单位、税务、海关、统计调查等岗位。",
      priority: 1,
    },
    {
      id: randomId(),
      user_id: userId,
      name: "安徽省考合肥岗位",
      category: "安徽省考",
      target_date: null,
      date_status: "pending",
      source_url: "https://www.hfxf.gov.cn/rsks/gwy/18913707.html",
      notes: "2026年笔试为3月14日至15日，下一轮日期待官方确认。",
      priority: 1,
    },
    {
      id: randomId(),
      user_id: userId,
      name: "合肥市直事业单位",
      category: "事业单位",
      target_date: null,
      date_status: "pending",
      source_url: "https://www.hfxf.gov.cn/tzgg/18917431.html",
      notes: "2026年上半年笔试为3月28日，下一轮日期待官方确认。",
      priority: 1,
    },
  ];
}

export function createDefaultTasks(userId: string): StudyTask[] {
  const today = todayKey();
  return [
    {
      id: randomId(),
      user_id: userId,
      title: "判断推理专项 20 题",
      track: "行测",
      task_date: today,
      duration_minutes: 40,
      status: "todo",
      review_note: "",
      wrong_note: "",
    },
    {
      id: randomId(),
      user_id: userId,
      title: "申论素材摘记与小题复盘",
      track: "申论",
      task_date: today,
      duration_minutes: 35,
      status: "todo",
      review_note: "",
      wrong_note: "",
    },
    {
      id: randomId(),
      user_id: userId,
      title: "资料分析限时练习",
      track: "职测",
      task_date: addDays(today, 1),
      duration_minutes: 45,
      status: "todo",
      review_note: "",
      wrong_note: "",
    },
    {
      id: randomId(),
      user_id: userId,
      title: "综应 A 类案例拆解",
      track: "综应A",
      task_date: addDays(today, 2),
      duration_minutes: 45,
      status: "todo",
      review_note: "",
      wrong_note: "",
    },
  ];
}

export function createDefaultGoals(userId: string): Goal[] {
  return [
    {
      id: randomId(),
      user_id: userId,
      title: "本月稳定学习",
      metric: "分钟",
      target: 1800,
      current: 0,
      due_date: addDays(todayKey(), 30),
      notes: "先把节奏养起来，再逐步提强度。",
    },
    {
      id: randomId(),
      user_id: userId,
      title: "核心模块过一轮",
      metric: "模块",
      target: 8,
      current: 0,
      due_date: addDays(todayKey(), 45),
      notes: "行测、申论、职测、综应按薄弱项滚动推进。",
    },
  ];
}

export function createDefaultTargetUnits(userId: string): TargetUnit[] {
  return [
    {
      id: randomId(),
      user_id: userId,
      name: "合肥市直事业单位",
      kind: "事业单位",
      area: "市直",
      commute_score: 4,
      stability_score: 4,
      fit_note: "通勤和稳定性比较均衡，关注综合管理 A 类岗位。",
      priority: 1,
      status: "watching",
      source_url: "https://www.hfpta.com/",
    },
    {
      id: randomId(),
      user_id: userId,
      name: "安徽省直驻合肥单位",
      kind: "省直/事业单位",
      area: "合肥",
      commute_score: 4,
      stability_score: 5,
      fit_note: "稳定性强，岗位门槛和专业限制需要重点核对。",
      priority: 1,
      status: "watching",
      source_url: "https://www.apta.gov.cn/",
    },
    {
      id: randomId(),
      user_id: userId,
      name: "主城区区直机关与事业单位",
      kind: "区直",
      area: "蜀山/包河/庐阳/瑶海",
      commute_score: 5,
      stability_score: 4,
      fit_note: "离家近优先，后续按家附近区域细化。",
      priority: 1,
      status: "watching",
      source_url: "https://www.hfxf.gov.cn/",
    },
    {
      id: randomId(),
      user_id: userId,
      name: "国考驻肥垂管单位",
      kind: "国考",
      area: "合肥",
      commute_score: 4,
      stability_score: 5,
      fit_note: "重点关注税务、海关、统计调查等驻地在合肥的岗位。",
      priority: 2,
      status: "watching",
      source_url: "https://www.scs.gov.cn/",
    },
    {
      id: randomId(),
      user_id: userId,
      name: "家附近街道/乡镇单位",
      kind: "基层",
      area: "按家庭地址筛选",
      commute_score: 5,
      stability_score: 3,
      fit_note: "通勤友好，但要结合岗位强度、服务期和发展空间判断。",
      priority: 2,
      status: "watching",
      source_url: "https://www.hfxf.gov.cn/",
    },
  ];
}

export function createDefaultData(userId = LOCAL_USER_ID): StudyData {
  return {
    profile: createDefaultProfile(userId),
    exams: createDefaultExams(userId),
    study_tasks: createDefaultTasks(userId),
    checkins: [] satisfies Checkin[],
    goals: createDefaultGoals(userId),
    target_units: createDefaultTargetUnits(userId),
  };
}
