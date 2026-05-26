import {
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Flame,
  Heart,
  Home,
  Loader2,
  LogOut,
  MapPinned,
  Plus,
  Save,
  Sparkles,
  Target,
  Trash2,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import {
  NavLink,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import {
  isSupabaseConfigured,
  supabase,
  type Session,
} from "./lib/supabase";
import { StudyDataProvider, useStudyData } from "./data/store";
import { randomId } from "./data/defaults";
import {
  addDays,
  calculateStreak,
  completedMinutes,
  daysUntil,
  formatDateCN,
  isThisWeek,
  todayKey,
} from "./lib/dates";
import type {
  Checkin,
  DateStatus,
  Exam,
  Goal,
  Profile,
  StudyTask,
  TargetUnit,
} from "./types";

const navItems: Array<{
  to: string;
  label: string;
  icon: LucideIcon;
}> = [
  { to: "/", label: "今日", icon: Home },
  { to: "/plan", label: "计划", icon: ClipboardList },
  { to: "/stats", label: "统计", icon: BarChart3 },
  { to: "/exams", label: "倒计时", icon: CalendarDays },
  { to: "/targets", label: "单位", icon: MapPinned },
  { to: "/profile", label: "小香", icon: UserRound },
];

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured);

  useEffect(() => {
    if (!supabase) return;

    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!authReady) return <SplashScreen />;

  if (isSupabaseConfigured && !session) {
    return <AuthScreen />;
  }

  return (
    <StudyDataProvider
      cloudEnabled={isSupabaseConfigured}
      session={session}
    >
      <AppShell session={session} />
    </StudyDataProvider>
  );
}

function SplashScreen() {
  return (
    <main className="auth-page">
      <div className="auth-panel">
        <Loader2 className="spin" aria-hidden="true" />
        <h1>小香上岸计划</h1>
        <p>正在准备今日安排</p>
      </div>
    </main>
  );
}

function AuthScreen() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleAuth(event: FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setMessage("");

    const result =
      mode === "signin"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ 
            email, 
            password,
            options: {
              emailRedirectTo: window.location.origin,
            }
          });

    setBusy(false);

    if (result.error) {
      setMessage(result.error.message);
      return;
    }

    if (mode === "signup") {
      setMessage("账号已创建。如已开启邮箱验证，请确认邮件后登录。");
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <div className="brand-mark" aria-hidden="true">
          <BookOpen />
        </div>
        <h1>小香上岸计划</h1>
        <p>学习计划、每日打卡、考试倒计时和合肥目标单位。</p>

        <div className="segmented" role="tablist" aria-label="登录方式">
          <button
            className={mode === "signin" ? "active" : ""}
            onClick={() => setMode("signin")}
            type="button"
          >
            登录
          </button>
          <button
            className={mode === "signup" ? "active" : ""}
            onClick={() => setMode("signup")}
            type="button"
          >
            注册
          </button>
        </div>

        <form className="form-grid" onSubmit={handleAuth}>
          <label>
            邮箱
            <input
              autoComplete="email"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </label>
          <label>
            密码
            <input
              autoComplete={
                mode === "signin" ? "current-password" : "new-password"
              }
              minLength={6}
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>
          <button className="primary-action" disabled={busy} type="submit">
            {busy ? <Loader2 className="spin" /> : <Heart />}
            {mode === "signin" ? "进入计划" : "创建账号"}
          </button>
        </form>

        {message && <p className="inline-message">{message}</p>}
      </section>
    </main>
  );
}

function AppShell({ session }: { session: Session | null }) {
  const { data, error, loading, mode, syncing } = useStudyData();
  const location = useLocation();
  const current =
    navItems.find((item) => item.to === location.pathname)?.label ?? "今日";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            <BookOpen />
          </div>
          <div>
            <strong>小香上岸计划</strong>
            <span>{data.profile.display_name || "备考中"}</span>
          </div>
        </div>

        <nav className="side-nav" aria-label="主导航">
          {navItems.map((item) => (
            <NavigationItem key={item.to} {...item} />
          ))}
        </nav>

        <div className="sidebar-footer">
          <span className={`status-pill ${mode}`}>
            {mode === "cloud" ? (syncing ? "同步中" : "云同步") : "本地预览"}
          </span>
          {session && (
            <button
              aria-label="退出登录"
              className="icon-button"
              onClick={() => void supabase?.auth.signOut()}
              title="退出登录"
              type="button"
            >
              <LogOut />
            </button>
          )}
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <span className="eyebrow">合肥近距离目标</span>
            <h1>{current}</h1>
          </div>
          <div className="topbar-actions">
            <span className={`status-pill ${mode}`}>
              {mode === "cloud" ? (syncing ? "同步中" : "云同步") : "本地预览"}
            </span>
          </div>
        </header>

        {error && <div className="notice danger">{error}</div>}
        {!isSupabaseConfigured && (
          <div className="notice">
            当前为本地预览模式。填入 Supabase 环境变量后可启用邮箱登录和多设备同步。
          </div>
        )}

        {loading ? (
          <div className="loading-state">
            <Loader2 className="spin" />
            <span>正在整理计划</span>
          </div>
        ) : (
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/plan" element={<StudyPlanPage />} />
            <Route path="/stats" element={<StatsPage />} />
            <Route path="/exams" element={<ExamsPage />} />
            <Route path="/targets" element={<TargetsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="*" element={<Navigate replace to="/" />} />
          </Routes>
        )}
      </main>

      <nav className="bottom-nav" aria-label="底部导航">
        {navItems.map((item) => (
          <NavigationItem key={item.to} {...item} compact />
        ))}
      </nav>
    </div>
  );
}

function NavigationItem({
  compact = false,
  icon: Icon,
  label,
  to,
}: {
  compact?: boolean;
  icon: LucideIcon;
  label: string;
  to: string;
}) {
  return (
    <NavLink
      aria-label={label}
      className={({ isActive }) =>
        `${compact ? "bottom-nav-item" : "nav-item"} ${isActive ? "active" : ""}`
      }
      title={label}
      to={to}
    >
      <Icon />
      <span>{label}</span>
    </NavLink>
  );
}

function Dashboard() {
  const { actions, data, userId } = useStudyData();
  const today = todayKey();
  const todayTasks = data.study_tasks.filter(
    (task) => task.task_date === today,
  );
  const doneToday = todayTasks.filter((task) => task.status === "done").length;
  const weekTasks = data.study_tasks.filter((task) =>
    isThisWeek(task.task_date),
  );
  const weekDone = weekTasks.filter((task) => task.status === "done").length;
  const todayCheckin = data.checkins.find(
    (checkin) => checkin.checkin_date === today,
  );
  const totalMinutes =
    data.checkins.reduce((sum, checkin) => sum + checkin.minutes, 0) +
    completedMinutes(data.study_tasks);
  const streak = calculateStreak(data.checkins);
  const weekProgress = weekTasks.length
    ? Math.round((weekDone / weekTasks.length) * 100)
    : 0;
  const [mood, setMood] = useState(todayCheckin?.mood ?? "steady");
  const [minutes, setMinutes] = useState(todayCheckin?.minutes ?? 60);
  const [summary, setSummary] = useState(todayCheckin?.summary ?? "");

  useEffect(() => {
    setMood(todayCheckin?.mood ?? "steady");
    setMinutes(todayCheckin?.minutes ?? 60);
    setSummary(todayCheckin?.summary ?? "");
  }, [todayCheckin?.id, todayCheckin?.minutes, todayCheckin?.summary, todayCheckin?.mood]);

  const nearestExams = [...data.exams]
    .sort((a, b) => {
      const aDays = daysUntil(a.target_date) ?? 9999;
      const bDays = daysUntil(b.target_date) ?? 9999;
      return aDays - bDays;
    })
    .slice(0, 3);

  async function saveCheckin(event: FormEvent) {
    event.preventDefault();
    const record: Checkin = {
      id: todayCheckin?.id ?? randomId(),
      user_id: userId,
      checkin_date: today,
      mood,
      minutes,
      summary,
    };
    await actions.saveCheckin(record);
  }

  return (
    <div className="page-stack">
      <section className="welcome-band">
        <div>
          <span className="eyebrow">今天也慢慢变强</span>
          <h2>{data.profile.display_name || "小满"}的备考小站</h2>
          <p>
            今日完成 {doneToday}/{todayTasks.length || 0} 项，优先守住节奏。
          </p>
        </div>
        <StudyIllustration />
      </section>

      <section className="stat-grid" aria-label="学习概览">
        <StatCard
          icon={CheckCircle2}
          label="今日任务"
          value={`${doneToday}/${todayTasks.length || 0}`}
        />
        <StatCard icon={Flame} label="连续打卡" value={`${streak} 天`} />
        <StatCard icon={Clock3} label="累计学习" value={`${totalMinutes} 分钟`} />
        <StatCard icon={Target} label="本周进度" value={`${weekProgress}%`} />
      </section>

      <div className="two-column">
        <section className="section-block">
          <div className="section-heading">
            <div>
              <span className="eyebrow">今日清单</span>
              <h2>学习计划</h2>
            </div>
            <NavLink className="text-link" to="/plan">
              管理
            </NavLink>
          </div>

          <div className="item-list">
            {todayTasks.length ? (
              todayTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onToggle={() =>
                    void actions.saveTask({
                      ...task,
                      status: task.status === "done" ? "todo" : "done",
                    })
                  }
                />
              ))
            ) : (
              <EmptyState icon={ClipboardList} title="今天还没有任务" />
            )}
          </div>
        </section>

        <section className="tool-panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">每日打卡</span>
              <h2>{todayCheckin ? "已打卡" : "记录今天"}</h2>
            </div>
          </div>

          <form className="form-grid" onSubmit={saveCheckin}>
            <label>
              状态
              <select
                onChange={(event) => setMood(event.target.value)}
                value={mood}
              >
                <option value="steady">稳稳推进</option>
                <option value="focused">状态很好</option>
                <option value="tired">有点累</option>
                <option value="restart">重新找节奏</option>
              </select>
            </label>
            <label>
              学习分钟
              <input
                min={0}
                onChange={(event) => setMinutes(Number(event.target.value))}
                type="number"
                value={minutes}
              />
            </label>
            <label className="span-2">
              今日小结
              <textarea
                onChange={(event) => setSummary(event.target.value)}
                rows={3}
                value={summary}
              />
            </label>
            <button className="primary-action" type="submit">
              <CheckCircle2 />
              保存打卡
            </button>
          </form>
        </section>
      </div>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <span className="eyebrow">考试节点</span>
            <h2>倒计时</h2>
          </div>
          <NavLink className="text-link" to="/exams">
            编辑
          </NavLink>
        </div>
        <div className="exam-grid">
          {nearestExams.map((exam) => (
            <ExamCard key={exam.id} exam={exam} compact />
          ))}
        </div>
      </section>
    </div>
  );
}

function StudyPlanPage() {
  const { actions, data, userId } = useStudyData();
  const [filter, setFilter] = useState<"today" | "week" | "all">("week");

  const tasks = data.study_tasks.filter((task) => {
    if (filter === "today") return task.task_date === todayKey();
    if (filter === "week") return isThisWeek(task.task_date);
    return true;
  });

  return (
    <div className="page-stack">
      <section className="tool-panel">
        <div className="section-heading">
          <div>
            <span className="eyebrow">新增安排</span>
            <h2>学习任务</h2>
          </div>
        </div>
        <TaskForm userId={userId} onSave={actions.saveTask} />
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <span className="eyebrow">行测 申论 职测 综应A</span>
            <h2>任务列表</h2>
          </div>
          <div className="segmented compact">
            <button
              className={filter === "today" ? "active" : ""}
              onClick={() => setFilter("today")}
              type="button"
            >
              今日
            </button>
            <button
              className={filter === "week" ? "active" : ""}
              onClick={() => setFilter("week")}
              type="button"
            >
              本周
            </button>
            <button
              className={filter === "all" ? "active" : ""}
              onClick={() => setFilter("all")}
              type="button"
            >
              全部
            </button>
          </div>
        </div>
        <div className="item-list">
          {tasks.length ? (
            tasks.map((task) => (
              <TaskEditor
                key={task.id}
                task={task}
                onDelete={actions.deleteTask}
                onSave={actions.saveTask}
              />
            ))
          ) : (
            <EmptyState icon={Sparkles} title="这个范围里暂无任务" />
          )}
        </div>
      </section>

      <section className="two-column">
        <div className="tool-panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">学习目标</span>
              <h2>阶段目标</h2>
            </div>
          </div>
          <GoalForm userId={userId} onSave={actions.saveGoal} />
        </div>
        <div className="section-block">
          <div className="item-list">
            {data.goals.map((goal) => (
              <GoalCard
                goal={goal}
                key={goal.id}
                onDelete={actions.deleteGoal}
                onSave={actions.saveGoal}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function ExamsPage() {
  const { actions, data, userId } = useStudyData();

  return (
    <div className="page-stack">
      <section className="tool-panel">
        <div className="section-heading">
          <div>
            <span className="eyebrow">手动维护</span>
            <h2>考试倒计时</h2>
          </div>
        </div>
        <ExamForm userId={userId} onSave={actions.saveExam} />
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <span className="eyebrow">国考 安徽省考 合肥事业单位</span>
            <h2>考试列表</h2>
          </div>
        </div>
        <div className="exam-grid">
          {data.exams.map((exam) => (
            <ExamEditor
              exam={exam}
              key={exam.id}
              onDelete={actions.deleteExam}
              onSave={actions.saveExam}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function TargetsPage() {
  const { actions, data, userId } = useStudyData();

  return (
    <div className="page-stack">
      <section className="welcome-band slim">
        <div>
          <span className="eyebrow">通勤优先</span>
          <h2>{data.profile.home_area || "合肥"}附近目标池</h2>
          <p>
            可接受通勤 {data.profile.commute_minutes} 分钟，按距离、稳定性和匹配度滚动筛选。
          </p>
        </div>
        <MapPinned aria-hidden="true" className="band-icon" />
      </section>

      <section className="tool-panel">
        <div className="section-heading">
          <div>
            <span className="eyebrow">新增观察</span>
            <h2>目标单位</h2>
          </div>
        </div>
        <TargetUnitForm userId={userId} onSave={actions.saveTargetUnit} />
      </section>

      <section className="section-block">
        <div className="unit-grid">
          {data.target_units.map((unit) => (
            <TargetUnitCard
              key={unit.id}
              onDelete={actions.deleteTargetUnit}
              onSave={actions.saveTargetUnit}
              unit={unit}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function ProfilePage() {
  const { actions, data, mode } = useStudyData();
  const [profile, setProfile] = useState<Profile>(data.profile);

  useEffect(() => setProfile(data.profile), [data.profile]);

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    await actions.saveProfile(profile);
  }

  return (
    <div className="page-stack">
      <section className="tool-panel">
        <div className="section-heading">
          <div>
            <span className="eyebrow">个人条件</span>
            <h2>小香档案</h2>
          </div>
        </div>
        <form className="form-grid profile-form" onSubmit={handleSave}>
          <label>
            昵称
            <input
              onChange={(event) =>
                setProfile({ ...profile, display_name: event.target.value })
              }
              value={profile.display_name}
            />
          </label>
          <label>
            家附近区域
            <input
              onChange={(event) =>
                setProfile({ ...profile, home_area: event.target.value })
              }
              placeholder="例如：滨湖、政务、蜀山"
              value={profile.home_area}
            />
          </label>
          <label>
            可接受通勤分钟
            <input
              min={0}
              onChange={(event) =>
                setProfile({
                  ...profile,
                  commute_minutes: Number(event.target.value),
                })
              }
              type="number"
              value={profile.commute_minutes}
            />
          </label>
          <label>
            年龄
            <input
              min={18}
              onChange={(event) =>
                setProfile({
                  ...profile,
                  age: event.target.value ? Number(event.target.value) : null,
                })
              }
              type="number"
              value={profile.age ?? ""}
            />
          </label>
          <label>
            学历
            <input
              onChange={(event) =>
                setProfile({ ...profile, education: event.target.value })
              }
              placeholder="例如：本科/硕士"
              value={profile.education}
            />
          </label>
          <label>
            专业
            <input
              onChange={(event) =>
                setProfile({ ...profile, major: event.target.value })
              }
              value={profile.major}
            />
          </label>
          <label>
            政治面貌
            <input
              onChange={(event) =>
                setProfile({
                  ...profile,
                  political_status: event.target.value,
                })
              }
              value={profile.political_status}
            />
          </label>
          <label>
            工作年限
            <input
              min={0}
              onChange={(event) =>
                setProfile({
                  ...profile,
                  work_years: Number(event.target.value),
                })
              }
              step={0.5}
              type="number"
              value={profile.work_years}
            />
          </label>
          <label className="span-2">
            证书/资格
            <input
              onChange={(event) =>
                setProfile({ ...profile, certificates: event.target.value })
              }
              placeholder="例如：法律职业资格、教师资格、会计证"
              value={profile.certificates}
            />
          </label>
          <label className="span-2">
            目标备注
            <textarea
              onChange={(event) =>
                setProfile({ ...profile, target_note: event.target.value })
              }
              rows={4}
              value={profile.target_note}
            />
          </label>
          <button className="primary-action" type="submit">
            <Save />
            保存小香档案
          </button>
        </form>
      </section>

      <section className="section-block">
        <div className="settings-grid">
          <InfoTile label="同步状态" value={mode === "cloud" ? "云同步" : "本地预览"} />
          <InfoTile
            label="Supabase"
            value={isSupabaseConfigured ? "已配置" : "未配置"}
          />
          <InfoTile label="部署方式" value="GitHub Pages" />
        </div>
      </section>
    </div>
  );
}

function StatsPage() {
  const { data } = useStudyData();
  const today = todayKey();
  
  // 计算统计数据
  const totalTasks = data.study_tasks.length;
  const doneTasks = data.study_tasks.filter(t => t.status === "done").length;
  const taskRate = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0;
  
  const totalMinutes = data.checkins.reduce((sum, c) => sum + c.minutes, 0) + 
    completedMinutes(data.study_tasks);
  const totalHours = Math.round(totalMinutes / 60 * 10) / 10;
  
  const streak = calculateStreak(data.checkins);
  
  // 按科目统计学习时间
  const trackStats: Record<string, { minutes: number; tasks: number; done: number }> = {};
  data.study_tasks.forEach(task => {
    if (!trackStats[task.track]) {
      trackStats[task.track] = { minutes: 0, tasks: 0, done: 0 };
    }
    trackStats[task.track].minutes += task.duration_minutes;
    trackStats[task.track].tasks += 1;
    if (task.status === "done") {
      trackStats[task.track].done += 1;
    }
  });
  
  // 打卡天数统计
  const checkinDays = data.checkins.length;
  const moodCounts: Record<string, number> = {};
  data.checkins.forEach(c => {
    moodCounts[c.mood] = (moodCounts[c.mood] || 0) + 1;
  });
  
  // 最近7天学习时长
  const last7Days: Array<{ date: string; minutes: number }> = [];
  for (let i = 6; i >= 0; i--) {
    const d = addDays(today, -i);
    const checkin = data.checkins.find(c => c.checkin_date === d);
    const dayTasks = data.study_tasks.filter(t => t.task_date === d && t.status === "done");
    const dayMinutes = (checkin?.minutes || 0) + dayTasks.reduce((s, t) => s + t.duration_minutes, 0);
    last7Days.push({ date: d.slice(5), minutes: dayMinutes });
  }
  
  const maxDayMinutes = Math.max(...last7Days.map(d => d.minutes), 1);
  
  return (
    <div className="page-stack">
      <section className="welcome-band slim">
        <div>
          <span className="eyebrow">数据驱动</span>
          <h2>小香的学习统计</h2>
          <p>用数据看清进步，找到发力点。</p>
        </div>
        <BarChart3 aria-hidden="true" className="band-icon" />
      </section>
      
      {/* 核心指标 */}
      <section className="stat-grid" aria-label="核心指标">
        <StatCard icon={CheckCircle2} label="任务完成率" value={`${taskRate}%`} />
        <StatCard icon={Clock3} label="累计学习" value={`${totalHours}h`} />
        <StatCard icon={Flame} label="连续打卡" value={`${streak} 天`} />
        <StatCard icon={CalendarDays} label="打卡天数" value={`${checkinDays} 天`} />
      </section>
      
      {/* 最近7天柱状图 */}
      <section className="section-block">
        <div className="section-heading">
          <div>
            <span className="eyebrow">近7天</span>
            <h2>学习时长趋势</h2>
          </div>
        </div>
        <div className="chart-container">
          {last7Days.map((day, i) => (
            <div key={i} className="chart-bar-wrapper">
              <div 
                className="chart-bar" 
                style={{ height: `${(day.minutes / maxDayMinutes) * 100}%` }}
              />
              <span className="chart-label">{day.date}</span>
              <span className="chart-value">{day.minutes}m</span>
            </div>
          ))}
        </div>
      </section>
      
      {/* 科目分布 */}
      <section className="section-block">
        <div className="section-heading">
          <div>
            <span className="eyebrow">科目分析</span>
            <h2>学习分布</h2>
          </div>
        </div>
        <div className="track-stats">
          {Object.entries(trackStats).sort((a, b) => b[1].minutes - a[1].minutes).map(([track, stat]) => (
            <div key={track} className="track-stat-row">
              <div className="track-info">
                <strong>{track}</strong>
                <span>{stat.done}/{stat.tasks} 完成</span>
              </div>
              <div className="track-bar-bg">
                <div 
                  className="track-bar-fill" 
                  style={{ width: `${stat.tasks ? (stat.done / stat.tasks) * 100 : 0}%` }}
                />
              </div>
              <span className="track-minutes">{stat.minutes}分钟</span>
            </div>
          ))}
          {Object.keys(trackStats).length === 0 && (
            <EmptyState icon={BarChart3} title="还没有学习任务数据" />
          )}
        </div>
      </section>
      
      {/* 心情分布 */}
      {checkinDays > 0 && (
        <section className="section-block">
          <div className="section-heading">
            <div>
              <span className="eyebrow">状态追踪</span>
              <h2>打卡心情</h2>
            </div>
          </div>
          <div className="mood-grid">
            {Object.entries(moodCounts).map(([mood, count]) => {
              const moodLabels: Record<string, string> = {
                steady: "稳稳推进",
                focused: "状态很好",
                tired: "有点累",
                restart: "重新找节奏",
              };
              return (
                <div key={mood} className="mood-item">
                  <span className="mood-emoji">
                    {mood === "steady" ? "🐢" : mood === "focused" ? "🚀" : mood === "tired" ? "😴" : "🌱"}
                  </span>
                  <span className="mood-label">{moodLabels[mood] || mood}</span>
                  <strong>{count}次</strong>
                </div>
              );
            })}
          </div>
        </section>
      )}
      
      {/* 目标进度 */}
      <section className="section-block">
        <div className="section-heading">
          <div>
            <span className="eyebrow">阶段目标</span>
            <h2>目标进度</h2>
          </div>
        </div>
        <div className="goal-progress-list">
          {data.goals.map(goal => {
            const progress = goal.target ? Math.round((goal.current / goal.target) * 100) : 0;
            const daysLeft = goal.due_date ? daysUntil(goal.due_date) : null;
            return (
              <div key={goal.id} className="goal-progress-item">
                <div className="goal-header">
                  <strong>{goal.title}</strong>
                  <span>{goal.current}/{goal.target} {goal.metric}</span>
                </div>
                <div className="goal-bar-bg">
                  <div className="goal-bar-fill" style={{ width: `${Math.min(progress, 100)}%` }} />
                </div>
                <div className="goal-meta">
                  <span>进度 {progress}%</span>
                  {daysLeft !== null && (
                    <span className={daysLeft < 7 ? "urgent" : ""}>
                      {daysLeft > 0 ? `还剩 ${daysLeft} 天` : "已过期"}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          {data.goals.length === 0 && (
            <EmptyState icon={Target} title="还没有设置目标" />
          )}
        </div>
      </section>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <article className="stat-card">
      <Icon aria-hidden="true" />
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <article className="info-tile">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function StudyIllustration() {
  return (
    <div className="study-illustration" aria-hidden="true">
      <div className="sun" />
      <div className="window">
        <span />
        <span />
      </div>
      <div className="desk">
        <div className="book one" />
        <div className="book two" />
        <div className="mug" />
      </div>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
}: {
  icon: LucideIcon;
  title: string;
}) {
  return (
    <div className="empty-state">
      <Icon aria-hidden="true" />
      <span>{title}</span>
    </div>
  );
}

function TaskRow({
  onToggle,
  task,
}: {
  onToggle: () => void;
  task: StudyTask;
}) {
  return (
    <article className={`item-card task-row ${task.status}`}>
      <button
        aria-label={task.status === "done" ? "标记未完成" : "标记完成"}
        className="check-button"
        onClick={onToggle}
        title={task.status === "done" ? "标记未完成" : "标记完成"}
        type="button"
      >
        <CheckCircle2 />
      </button>
      <div>
        <strong>{task.title}</strong>
        <span>
          {task.track} · {task.duration_minutes} 分钟
        </span>
      </div>
    </article>
  );
}

function TaskForm({
  onSave,
  userId,
}: {
  onSave: (task: StudyTask) => Promise<void>;
  userId: string;
}) {
  const [title, setTitle] = useState("");
  const [track, setTrack] = useState("行测");
  const [taskDate, setTaskDate] = useState(todayKey());
  const [duration, setDuration] = useState(40);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    await onSave({
      id: randomId(),
      user_id: userId,
      title: title.trim(),
      track,
      task_date: taskDate,
      duration_minutes: duration,
      status: "todo",
      review_note: "",
      wrong_note: "",
    });
    setTitle("");
  }

  return (
    <form className="form-grid" onSubmit={handleSubmit}>
      <label className="span-2">
        任务
        <input
          onChange={(event) => setTitle(event.target.value)}
          placeholder="例如：资料分析 30 题"
          value={title}
        />
      </label>
      <label>
        科目
        <select onChange={(event) => setTrack(event.target.value)} value={track}>
          <option value="行测">行测</option>
          <option value="申论">申论</option>
          <option value="职测">职测</option>
          <option value="综应A">综应A</option>
          <option value="医学基础">医学基础</option>
          <option value="护理专业">护理专业</option>
          <option value="公共基础">公共基础</option>
        </select>
      </label>
      <label>
        日期
        <input
          onChange={(event) => setTaskDate(event.target.value)}
          type="date"
          value={taskDate}
        />
      </label>
      <label>
        分钟
        <input
          min={5}
          onChange={(event) => setDuration(Number(event.target.value))}
          type="number"
          value={duration}
        />
      </label>
      <button className="primary-action" type="submit">
        <Plus />
        添加任务
      </button>
    </form>
  );
}

function TaskEditor({
  onDelete,
  onSave,
  task,
}: {
  onDelete: (id: string) => Promise<void>;
  onSave: (task: StudyTask) => Promise<void>;
  task: StudyTask;
}) {
  const [review, setReview] = useState(task.review_note);
  const [wrong, setWrong] = useState(task.wrong_note);

  useEffect(() => {
    setReview(task.review_note);
    setWrong(task.wrong_note);
  }, [task.review_note, task.wrong_note]);

  return (
    <article className={`item-card task-editor ${task.status}`}>
      <div className="item-main">
        <div className="task-title-line">
          <button
            aria-label={task.status === "done" ? "标记未完成" : "标记完成"}
            className="check-button"
            onClick={() =>
              void onSave({
                ...task,
                status: task.status === "done" ? "todo" : "done",
              })
            }
            title={task.status === "done" ? "标记未完成" : "标记完成"}
            type="button"
          >
            <CheckCircle2 />
          </button>
          <div>
            <strong>{task.title}</strong>
            <span>
              {formatDateCN(task.task_date)} · {task.track} ·{" "}
              {task.duration_minutes} 分钟
            </span>
          </div>
        </div>
        <div className="note-grid">
          <label>
            复盘
            <textarea
              onBlur={() => void onSave({ ...task, review_note: review })}
              onChange={(event) => setReview(event.target.value)}
              rows={2}
              value={review}
            />
          </label>
          <label>
            错题/薄弱项
            <textarea
              onBlur={() => void onSave({ ...task, wrong_note: wrong })}
              onChange={(event) => setWrong(event.target.value)}
              rows={2}
              value={wrong}
            />
          </label>
        </div>
      </div>
      <button
        aria-label="删除任务"
        className="icon-button danger"
        onClick={() => void onDelete(task.id)}
        title="删除任务"
        type="button"
      >
        <Trash2 />
      </button>
    </article>
  );
}

function GoalForm({
  onSave,
  userId,
}: {
  onSave: (goal: Goal) => Promise<void>;
  userId: string;
}) {
  const [title, setTitle] = useState("");
  const [metric, setMetric] = useState("分钟");
  const [target, setTarget] = useState(600);
  const [dueDate, setDueDate] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    await onSave({
      id: randomId(),
      user_id: userId,
      title: title.trim(),
      metric,
      target,
      current: 0,
      due_date: dueDate || null,
      notes: "",
    });
    setTitle("");
  }

  return (
    <form className="form-grid" onSubmit={handleSubmit}>
      <label className="span-2">
        目标
        <input
          onChange={(event) => setTitle(event.target.value)}
          placeholder="例如：本周完成 600 分钟"
          value={title}
        />
      </label>
      <label>
        指标
        <input
          onChange={(event) => setMetric(event.target.value)}
          value={metric}
        />
      </label>
      <label>
        目标值
        <input
          min={1}
          onChange={(event) => setTarget(Number(event.target.value))}
          type="number"
          value={target}
        />
      </label>
      <label>
        截止日期
        <input
          onChange={(event) => setDueDate(event.target.value)}
          type="date"
          value={dueDate}
        />
      </label>
      <button className="primary-action" type="submit">
        <Plus />
        添加目标
      </button>
    </form>
  );
}

function GoalCard({
  goal,
  onDelete,
  onSave,
}: {
  goal: Goal;
  onDelete: (id: string) => Promise<void>;
  onSave: (goal: Goal) => Promise<void>;
}) {
  const progress = goal.target
    ? Math.min(100, Math.round((goal.current / goal.target) * 100))
    : 0;
  const [current, setCurrent] = useState(goal.current);

  useEffect(() => setCurrent(goal.current), [goal.current]);

  return (
    <article className="item-card goal-card">
      <div className="item-main">
        <div className="section-heading tight">
          <div>
            <strong>{goal.title}</strong>
            <span>
              {goal.current}/{goal.target} {goal.metric}
              {goal.due_date ? ` · ${formatDateCN(goal.due_date)}` : ""}
            </span>
          </div>
          <button
            aria-label="删除目标"
            className="icon-button danger"
            onClick={() => void onDelete(goal.id)}
            title="删除目标"
            type="button"
          >
            <Trash2 />
          </button>
        </div>
        <div className="progress-track">
          <span style={{ width: `${progress}%` }} />
        </div>
        <label>
          当前进度
          <input
            min={0}
            onBlur={() => void onSave({ ...goal, current })}
            onChange={(event) => setCurrent(Number(event.target.value))}
            type="number"
            value={current}
          />
        </label>
      </div>
    </article>
  );
}

function ExamCard({ compact = false, exam }: { compact?: boolean; exam: Exam }) {
  const days = daysUntil(exam.target_date);
  const past = days !== null && days < 0;
  const title =
    exam.date_status === "pending" || !exam.target_date
      ? "待官方确认"
      : past || exam.date_status === "past"
        ? `已过去 ${Math.abs(days ?? 0)} 天`
        : days === 0
          ? "今天"
          : `${days} 天`;

  return (
    <article className={`item-card exam-card ${compact ? "compact" : ""}`}>
      <span className="tag">{exam.category}</span>
      <h3>{exam.name}</h3>
      <strong>{title}</strong>
      <span>{formatDateCN(exam.target_date)}</span>
      {!compact && exam.notes && <p>{exam.notes}</p>}
      {!compact && exam.source_url && (
        <a href={exam.source_url} rel="noreferrer" target="_blank">
          官方来源
        </a>
      )}
    </article>
  );
}

function ExamForm({
  onSave,
  userId,
}: {
  onSave: (exam: Exam) => Promise<void>;
  userId: string;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("事业单位");
  const [targetDate, setTargetDate] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    await onSave({
      id: randomId(),
      user_id: userId,
      name: name.trim(),
      category,
      target_date: targetDate || null,
      date_status: targetDate ? "confirmed" : "pending",
      source_url: sourceUrl,
      notes: "",
      priority: 2,
    });
    setName("");
    setTargetDate("");
    setSourceUrl("");
  }

  return (
    <form className="form-grid" onSubmit={handleSubmit}>
      <label>
        考试名称
        <input
          onChange={(event) => setName(event.target.value)}
          value={name}
        />
      </label>
      <label>
        类型
        <select
          onChange={(event) => setCategory(event.target.value)}
          value={category}
        >
          <option value="国考">国考</option>
          <option value="安徽省考">安徽省考</option>
          <option value="事业单位">事业单位</option>
          <option value="其他">其他</option>
        </select>
      </label>
      <label>
        日期
        <input
          onChange={(event) => setTargetDate(event.target.value)}
          type="date"
          value={targetDate}
        />
      </label>
      <label>
        来源链接
        <input
          onChange={(event) => setSourceUrl(event.target.value)}
          type="url"
          value={sourceUrl}
        />
      </label>
      <button className="primary-action" type="submit">
        <Plus />
        添加考试
      </button>
    </form>
  );
}

function ExamEditor({
  exam,
  onDelete,
  onSave,
}: {
  exam: Exam;
  onDelete: (id: string) => Promise<void>;
  onSave: (exam: Exam) => Promise<void>;
}) {
  const [draft, setDraft] = useState<Exam>(exam);

  useEffect(() => setDraft(exam), [exam]);

  return (
    <article className="item-card exam-editor">
      <ExamCard exam={exam} compact />
      <div className="form-grid mini">
        <label>
          日期状态
          <select
            onChange={(event) =>
              setDraft({
                ...draft,
                date_status: event.target.value as DateStatus,
              })
            }
            value={draft.date_status}
          >
            <option value="pending">待官方确认</option>
            <option value="confirmed">已确认</option>
            <option value="past">已过去</option>
          </select>
        </label>
        <label>
          日期
          <input
            onChange={(event) =>
              setDraft({
                ...draft,
                target_date: event.target.value || null,
              })
            }
            type="date"
            value={draft.target_date ?? ""}
          />
        </label>
        <label>
          优先级
          <input
            min={1}
            onChange={(event) =>
              setDraft({ ...draft, priority: Number(event.target.value) })
            }
            type="number"
            value={draft.priority}
          />
        </label>
        <label className="span-2">
          备注
          <textarea
            onChange={(event) =>
              setDraft({ ...draft, notes: event.target.value })
            }
            rows={2}
            value={draft.notes}
          />
        </label>
      </div>
      <div className="card-actions">
        <button
          className="secondary-action"
          onClick={() => void onSave(draft)}
          type="button"
        >
          <Save />
          保存
        </button>
        <button
          className="icon-button danger"
          onClick={() => void onDelete(exam.id)}
          title="删除考试"
          type="button"
        >
          <Trash2 />
        </button>
      </div>
    </article>
  );
}

function TargetUnitForm({
  onSave,
  userId,
}: {
  onSave: (unit: TargetUnit) => Promise<void>;
  userId: string;
}) {
  const [name, setName] = useState("");
  const [kind, setKind] = useState("事业单位");
  const [area, setArea] = useState("合肥");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    await onSave({
      id: randomId(),
      user_id: userId,
      name: name.trim(),
      kind,
      area,
      commute_score: 4,
      stability_score: 4,
      fit_note: "",
      priority: 2,
      status: "watching",
      source_url: "",
    });
    setName("");
  }

  return (
    <form className="form-grid" onSubmit={handleSubmit}>
      <label>
        单位/岗位池
        <input
          onChange={(event) => setName(event.target.value)}
          value={name}
        />
      </label>
      <label>
        类型
        <select onChange={(event) => setKind(event.target.value)} value={kind}>
          <option value="公务员">公务员</option>
          <option value="事业单位">事业单位</option>
          <option value="省直/事业单位">省直/事业单位</option>
          <option value="基层">基层</option>
          <option value="国考">国考</option>
          <option value="医疗编">医疗编</option>
          <option value="护理岗">护理岗</option>
        </select>
      </label>
      <label>
        区域
        <input onChange={(event) => setArea(event.target.value)} value={area} />
      </label>
      <button className="primary-action" type="submit">
        <Plus />
        添加单位
      </button>
    </form>
  );
}

function TargetUnitCard({
  onDelete,
  onSave,
  unit,
}: {
  onDelete: (id: string) => Promise<void>;
  onSave: (unit: TargetUnit) => Promise<void>;
  unit: TargetUnit;
}) {
  const [draft, setDraft] = useState<TargetUnit>(unit);
  const score = unit.commute_score * 2 + unit.stability_score - unit.priority;

  useEffect(() => setDraft(unit), [unit]);

  return (
    <article className="item-card unit-card">
      <div className="section-heading tight">
        <div>
          <span className="tag">{unit.kind}</span>
          <h3>{unit.name}</h3>
        </div>
        <strong className="score">{score}</strong>
      </div>
      <p>{unit.fit_note || "待补充匹配备注"}</p>
      <div className="meta-row">
        <span>{unit.area}</span>
        <span>通勤 {unit.commute_score}/5</span>
        <span>稳定 {unit.stability_score}/5</span>
      </div>
      <div className="form-grid mini">
        <label>
          通勤
          <input
            max={5}
            min={1}
            onChange={(event) =>
              setDraft({ ...draft, commute_score: Number(event.target.value) })
            }
            type="number"
            value={draft.commute_score}
          />
        </label>
        <label>
          稳定
          <input
            max={5}
            min={1}
            onChange={(event) =>
              setDraft({ ...draft, stability_score: Number(event.target.value) })
            }
            type="number"
            value={draft.stability_score}
          />
        </label>
        <label>
          优先级
          <input
            min={1}
            onChange={(event) =>
              setDraft({ ...draft, priority: Number(event.target.value) })
            }
            type="number"
            value={draft.priority}
          />
        </label>
        <label className="span-2">
          匹配备注
          <textarea
            onChange={(event) =>
              setDraft({ ...draft, fit_note: event.target.value })
            }
            rows={2}
            value={draft.fit_note}
          />
        </label>
      </div>
      <div className="card-actions">
        <button
          className="secondary-action"
          onClick={() => void onSave(draft)}
          type="button"
        >
          <Save />
          保存
        </button>
        <button
          className="icon-button danger"
          onClick={() => void onDelete(unit.id)}
          title="删除单位"
          type="button"
        >
          <Trash2 />
        </button>
      </div>
    </article>
  );
}
