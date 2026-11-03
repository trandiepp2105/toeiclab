import React, { useCallback, useEffect, useMemo, useState } from "react";
import adminService from "../../services/adminService";
import "./AdminDashboardPage.scss";

const SECTIONS = [
  ["overview", "Tổng quan"],
  ["users", "Người dùng"],
  ["roles", "Vai trò & quyền"],
  ["vocabulary", "Từ vựng"],
  ["grammar", "Ngữ pháp & mẹo"],
  ["exams", "Ngân hàng đề"],
];

const EMPTY_PAGE = { count: 0, page: 1, pages: 1, results: [] };
const SECTION_PERMISSION = { overview: "dashboard.view", users: "users.view", roles: "roles.view", vocabulary: "vocabulary.view", grammar: "knowledge.view", exams: "exams.view" };
const fmt = (value) => new Intl.NumberFormat("vi-VN").format(value || 0);
const dateLabel = (value) => value ? new Date(value).toLocaleDateString("vi-VN") : "—";
const dateTimeLabel = (value) => value ? new Date(value).toLocaleString("vi-VN", { dateStyle: "medium", timeStyle: "short" }) : "—";
const providerLabel = (provider) => ({ google: "Google", facebook: "Facebook", apple: "Apple" }[provider?.toLowerCase()] || provider || "Đăng nhập liên kết");
const loginMethodSummary = (row) => [row.password_enabled && "Email/mật khẩu", ...(row.providers || []).map(providerLabel)].filter(Boolean).join(" · ") || "Chưa thiết lập";

function AdminPageTitle({ eyebrow, title, description, action }) {
  return (
    <div className="admin-page-title">
      <div>
        <div className="admin-page-eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}

function getErrorMessage(error) {
  return error?.message || "Không tải được dữ liệu. Vui lòng thử lại.";
}

function AdminDashboardPage({ user }) {
  const [section, setSection] = useState(() => user?.permissions?.includes("dashboard.view") ? "overview" : (SECTIONS.find(([key]) => user?.permissions?.includes(SECTION_PERMISSION[key]))?.[0] || "overview"));
  const [vocabularyMode, setVocabularyMode] = useState("terms");
  const [grammarMode, setGrammarMode] = useState("notes");
  const [overview, setOverview] = useState(null);
  const [pageData, setPageData] = useState(EMPTY_PAGE);
  const [topics, setTopics] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editor, setEditor] = useState(null);
  const [editorError, setEditorError] = useState("");
  const [userDetail, setUserDetail] = useState(null);
  const [userDetailLoading, setUserDetailLoading] = useState(false);
  const [userDetailSaving, setUserDetailSaving] = useState(false);
  const [userDetailError, setUserDetailError] = useState("");
  const [roleCatalog, setRoleCatalog] = useState([]);
  const [permissionCatalog, setPermissionCatalog] = useState([]);
  const [roleEditor, setRoleEditor] = useState(null);

  const permissions = new Set(user?.permissions || []);
  const can = (permission) => permissions.has(permission) || (permission.endsWith(".view") && permissions.has(`${permission.slice(0, -5)}.manage`));
  const allowedSections = SECTIONS.filter(([key]) => can(SECTION_PERMISSION[key]));

  const loadOverview = useCallback(async () => {
    const result = await adminService.getOverview();
    setOverview(result);
  }, []);

  const loadSection = useCallback(async () => {
    if (section === "overview") {
      await loadOverview();
      setPageData(EMPTY_PAGE);
      return;
    }

    const params = { page, page_size: 25, q: search.trim() };
    let result;
    if (section === "roles") {
      result = await adminService.listRoles(params);
      setPermissionCatalog(result.available_permissions || []);
    } else if (section === "users") {
      result = await adminService.listUsers(params);
    } else if (section === "vocabulary" && vocabularyMode === "topics") {
      result = await adminService.listTopics(params);
    } else if (section === "vocabulary") {
      result = await adminService.listTerms(params);
      const topicResult = await adminService.listTopics({ page_size: 100 });
      setTopics(topicResult.results || []);
    } else if (section === "grammar" && grammarMode === "tips") {
      result = await adminService.listTips(params);
    } else if (section === "grammar") {
      result = await adminService.listGrammar(params);
    } else if (section === "exams" && selectedExam) {
      result = await adminService.listQuestions({ ...params, exam: selectedExam.id });
    } else {
      result = await adminService.listExams(params);
    }
    setPageData(result);
  }, [section, page, search, vocabularyMode, grammarMode, selectedExam, loadOverview]);

  useEffect(() => {
    let isCurrent = true;
    setLoading(true);
    setError("");
    loadSection()
      .catch((requestError) => {
        if (isCurrent) setError(getErrorMessage(requestError));
      })
      .finally(() => {
        if (isCurrent) setLoading(false);
      });
    return () => { isCurrent = false; };
  }, [loadSection]);

  const refresh = useCallback(async () => {
    await loadSection();
    if ((user?.permissions || []).includes("dashboard.view")) await loadOverview();
  }, [loadSection, loadOverview, user]);

  function changeSection(nextSection) {
    setSection(nextSection);
    setSelectedExam(null);
    setSearch("");
    setPage(1);
    setNotice("");
  }

  function changeMode(setMode, mode) {
    setMode(mode);
    setSearch("");
    setPage(1);
  }

  async function handleSave(payload) {
    if (!editor) return;
    setSaving(true);
    setError("");
    setEditorError("");
    try {
      const { kind, record } = editor;
      if (kind === "topic") await adminService.saveTopic(record?.id, payload);
      if (kind === "term") await adminService.saveTerm(record?.id, payload);
      if (kind === "grammar") await adminService.saveGrammar(record?.id, payload);
      if (kind === "tip") await adminService.saveTip(record?.id, payload);
      if (kind === "exam") await adminService.updateExam(record.id, payload);
      if (kind === "question") await adminService.updateQuestion(record.id, payload);
      setEditor(null);
      setNotice("Đã lưu thay đổi.");
      await refresh();
    } catch (requestError) {
      setEditorError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(kind, record) {
    const name = record.name || record.word || record.title;
    if (!window.confirm(`Xóa “${name}”? Thao tác này không thể hoàn tác.`)) return;
    setSaving(true);
    setError("");
    try {
      if (kind === "topic") await adminService.deleteTopic(record.id);
      if (kind === "term") await adminService.deleteTerm(record.id);
      if (kind === "grammar") await adminService.deleteGrammar(record.id);
      if (kind === "tip") await adminService.deleteTip(record.id);
      setNotice("Đã xóa dữ liệu.");
      await refresh();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  async function toggleUser(userRecord) {
    setSaving(true);
    setError("");
    try {
      await adminService.updateUser(userRecord.id, { is_active: !userRecord.is_active });
      setNotice(userRecord.is_active ? "Đã khóa tài khoản." : "Đã mở lại tài khoản.");
      await refresh();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  async function openUserDetails(userRecord) {
    setUserDetail({ user: userRecord, stats: null, login_methods: null, recent_attempts: [] });
    setUserDetailLoading(true);
    setUserDetailError("");
    try {
      setUserDetail(await adminService.getUser(userRecord.id));
      if (can("roles.view")) {
        const catalog = await adminService.listRoles({ page_size: 100 });
        setRoleCatalog(catalog.results || []);
      }
    } catch (requestError) {
      setUserDetailError(getErrorMessage(requestError));
    } finally {
      setUserDetailLoading(false);
    }
  }

  async function saveUserRoles(roleIds) {
    if (!userDetail?.user) return;
    setUserDetailSaving(true);
    setUserDetailError("");
    try {
      const updated = await adminService.updateUserRoles(userDetail.user.id, roleIds);
      setUserDetail(updated);
      setNotice("Đã cập nhật vai trò cho người dùng.");
      await loadSection();
    } catch (requestError) {
      setUserDetailError(requestError.response?.data?.error || getErrorMessage(requestError));
    } finally {
      setUserDetailSaving(false);
    }
  }

  async function unlinkProvider(provider) {
    if (!userDetail?.user || !window.confirm(`Gỡ liên kết ${providerLabel(provider)} khỏi tài khoản này?`)) return;
    setUserDetailSaving(true);
    setUserDetailError("");
    try {
      const updated = await adminService.unlinkUserProvider(userDetail.user.id, provider);
      setUserDetail(updated);
      setNotice(`Đã gỡ liên kết ${providerLabel(provider)}.`);
      await loadSection();
    } catch (requestError) {
      setUserDetailError(requestError.response?.data?.error || getErrorMessage(requestError));
    } finally {
      setUserDetailSaving(false);
    }
  }

  const heading = useMemo(() => SECTIONS.find(([key]) => key === section)?.[1], [section]);
  const isAdmin = Boolean(user?.is_staff);

  if (!isAdmin) {
    return (
      <section className="admin-denied">
        <span className="admin-denied-icon">⌑</span>
        <h1>Khu vực dành cho quản trị viên</h1>
        <p>Tài khoản của bạn chưa được cấp quyền quản lý TOEIC Lab.</p>
      </section>
    );
  }

  if (!allowedSections.length) {
    return <section className="admin-denied"><span className="admin-denied-icon">⌑</span><h1>Chưa được cấp quyền chức năng</h1><p>Tài khoản có thể truy cập admin nhưng chưa được gán quyền xem khu vực nào.</p></section>;
  }

  if (loading && !overview && section === "overview") {
    return <div className="admin-loading" role="status">Đang tải bảng quản trị…</div>;
  }

  return (
    <div className="admin-page">
      <AdminPageTitle
        eyebrow="TOEIC LAB · ADMIN"
        title={selectedExam ? selectedExam.title : heading}
        description={selectedExam ? "Quản lý nội dung và đáp án trong đề thi." : "Quản lý tài khoản, nội dung học và ngân hàng đề thi."}
        action={<span className="admin-role"><span /> Quản trị viên</span>}
      />

      <div className="admin-shell">
        <aside className="admin-rail" aria-label="Mục quản trị">
          {allowedSections.map(([key, label], index) => (
            <button
              type="button"
              key={key}
              className={section === key ? "selected" : ""}
              onClick={() => changeSection(key)}
            >
              <span className="admin-rail-icon">{["◫", "♙", "♧", "文", "✎", "▤"][index]}</span>
              {label}
              {section === key && <span className="admin-rail-dot" />}
            </button>
          ))}
          <div className="admin-rail-note">
            <b>Không gian quản trị</b>
            <span>Cập nhật nội dung sẽ có hiệu lực trên ứng dụng học.</span>
          </div>
        </aside>

        <section className="admin-workspace">
          {error && <div className="admin-alert admin-alert-error" role="alert">{error}</div>}
          {notice && <div className="admin-alert admin-alert-success" role="status">{notice}</div>}
          {section === "overview" && <Overview data={overview} onOpen={changeSection} />}
          {section !== "overview" && (
            <>
              {selectedExam && section === "exams" && (
                <button className="admin-back" type="button" onClick={() => { setSelectedExam(null); setPage(1); setSearch(""); }}>
                  ← Tất cả đề thi
                </button>
              )}
              <div className="admin-toolbar">
                {section === "vocabulary" && !selectedExam && (
                  <div className="admin-segment">
                    <button className={vocabularyMode === "terms" ? "active" : ""} onClick={() => changeMode(setVocabularyMode, "terms")}>Từ vựng</button>
                    <button className={vocabularyMode === "topics" ? "active" : ""} onClick={() => changeMode(setVocabularyMode, "topics")}>Chủ đề</button>
                  </div>
                )}
                {section === "grammar" && (
                  <div className="admin-segment">
                    <button className={grammarMode === "notes" ? "active" : ""} onClick={() => changeMode(setGrammarMode, "notes")}>Ngữ pháp</button>
                    <button className={grammarMode === "tips" ? "active" : ""} onClick={() => changeMode(setGrammarMode, "tips")}>Mẹo theo Part</button>
                  </div>
                )}
                <label className="admin-search">
                  <span aria-hidden="true">⌕</span>
                  <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder={searchPlaceholder(section, selectedExam, vocabularyMode, grammarMode)} />
                  {search && <button type="button" aria-label="Xóa tìm kiếm" onClick={() => setSearch("")}>×</button>}
                </label>
                <div className="admin-toolbar-spacer" />
                {(section === "roles" ? can("roles.manage") : can(`${section === "vocabulary" ? "vocabulary" : section === "grammar" ? "knowledge" : "exams"}.manage`) && createEditor(section, selectedExam, vocabularyMode, grammarMode)) && (
                  <button className="admin-primary" type="button" onClick={() => { setEditorError(""); if (section === "roles") setRoleEditor({}); else setEditor(createEditor(section, selectedExam, vocabularyMode, grammarMode)); }}>
                    <span>＋</span> {section === "roles" ? "Thêm vai trò" : createLabel(section, vocabularyMode, grammarMode)}
                  </button>
                )}
              </div>

              {loading ? <div className="admin-table-loading"><span className="spinner" /> Đang tải dữ liệu…</div> : (
                <DataTable
                  section={section}
                  vocabularyMode={vocabularyMode}
                  grammarMode={grammarMode}
                  selectedExam={selectedExam}
                  data={pageData}
                  saving={saving}
                  onEdit={(kind, record) => { setEditorError(""); setEditor({ kind, record }); }}
                  onDelete={handleDelete}
                  onToggleUser={toggleUser}
                  onOpenUser={openUserDetails}
                  onOpenExam={setSelectedExam}
                  canViewUsers={can("users.view")}
                  canManageUsers={can("users.manage")}
                  canManageContent={can(`${section === "vocabulary" ? "vocabulary" : section === "grammar" ? "knowledge" : "exams"}.manage`)}
                  canManageRoles={can("roles.manage")}
                  onEditRole={(record) => setRoleEditor(record)}
                  onDeleteRole={async (record) => {
                    if (!window.confirm(`Xóa vai trò “${record.name}”?`)) return;
                    try { await adminService.deleteRole(record.id); setNotice("Đã xóa vai trò."); await refresh(); }
                    catch (requestError) { setError(requestError.response?.data?.error || getErrorMessage(requestError)); }
                  }}
                />
              )}
              <Pagination data={pageData} onChange={setPage} />
            </>
          )}
        </section>
      </div>

      {editor && (
        <EditorDialog
          editor={editor}
          topics={topics}
          saving={saving}
          error={editorError}
          onClose={() => { setEditor(null); setEditorError(""); }}
          onSave={handleSave}
        />
      )}
      {roleEditor && <RoleEditorDialog role={roleEditor} permissions={permissionCatalog} saving={saving} error={editorError} onClose={() => { setRoleEditor(null); setEditorError(""); }} onSave={async (payload) => {
        setSaving(true); setEditorError("");
        try { await adminService.saveRole(roleEditor.id, payload); setRoleEditor(null); setNotice("Đã lưu vai trò và quyền."); await refresh(); }
        catch (requestError) { setEditorError(getErrorMessage(requestError)); }
        finally { setSaving(false); }
      }} />}
      {userDetail && (
        <UserDetailDialog
          detail={userDetail}
          loading={userDetailLoading}
          saving={userDetailSaving}
          error={userDetailError}
          roles={roleCatalog}
          canManageRoles={can("roles.manage")}
          canManageUsers={can("users.manage")}
          onSaveRoles={saveUserRoles}
          onUnlink={unlinkProvider}
          onClose={() => { setUserDetail(null); setUserDetailError(""); }}
        />
      )}
    </div>
  );
}

function Overview({ data, onOpen }) {
  if (!data) return null;
  const cards = [
    { label: "Tài khoản", value: data.users.total, note: `${fmt(data.users.active)} đang hoạt động`, icon: "♙", tone: "blue", section: "users" },
    { label: "Từ vựng", value: data.vocabulary.terms, note: `${fmt(data.vocabulary.topics)} chủ đề`, icon: "文", tone: "violet", section: "vocabulary" },
    { label: "Bài học", value: data.knowledge.grammar_notes + data.knowledge.part_tips, note: "ngữ pháp và mẹo TOEIC", icon: "✎", tone: "amber", section: "grammar" },
    { label: "Ngân hàng đề", value: data.exams.total, note: `${fmt(data.exams.questions)} câu hỏi`, icon: "▤", tone: "green", section: "exams" },
  ];
  const completion = data.exams.questions ? Math.round(data.exams.answered_questions * 100 / data.exams.questions) : 0;
  return (
    <div className="admin-overview">
      <div className="admin-welcome">
        <div><span className="admin-welcome-kicker">KHÔNG GIAN VẬN HÀNH</span><h2>Chào mừng trở lại 👋</h2><p>Tổng quan nội dung và hoạt động trên TOEIC Lab.</p></div>
        <div className="admin-welcome-mark">T<span>L</span></div>
      </div>
      <div className="admin-stat-grid">
        {cards.map((card) => <button type="button" className="admin-stat-card" key={card.label} onClick={() => onOpen(card.section)}>
          <span className={`admin-stat-icon ${card.tone}`}>{card.icon}</span><span className="admin-stat-label">{card.label}</span><b>{fmt(card.value)}</b><small>{card.note}</small><span className="admin-stat-arrow">↗</span>
        </button>)}
      </div>
      <div className="admin-overview-grid">
        <section className="admin-panel admin-readiness">
          <div className="admin-panel-heading"><div><span className="admin-caption">CHẤT LƯỢNG NỘI DUNG</span><h3>Độ hoàn thiện đáp án</h3></div><span className="admin-readiness-value">{completion}%</span></div>
          <div className="admin-progress"><span style={{ width: `${completion}%` }} /></div>
          <p>{fmt(data.exams.answered_questions)} / {fmt(data.exams.questions)} câu hỏi đã có đáp án chính xác.</p>
          <button type="button" className="admin-text-link" onClick={() => onOpen("exams")}>Rà soát ngân hàng đề <span>→</span></button>
          <div className="admin-readiness-footer"><span>{fmt(data.exams.published)} đề đang xuất bản</span><span>{fmt(data.vocabulary.published_topics)} chủ đề công khai</span></div>
        </section>
        <section className="admin-panel">
          <div className="admin-panel-heading"><div><span className="admin-caption">TÀI KHOẢN MỚI</span><h3>Người dùng gần đây</h3></div><button type="button" className="admin-text-link" onClick={() => onOpen("users")}>Xem tất cả →</button></div>
          <div className="admin-recent-users">{(data.recent_users || []).map((item) => <div className="admin-recent-user" key={item.id}><span className="admin-user-avatar">{(item.display_name || item.email)[0].toUpperCase()}</span><span><b>{item.display_name || "Học viên"}</b><small>{item.email}</small></span><time>{dateLabel(item.date_joined)}</time></div>)}</div>
        </section>
        <section className="admin-panel admin-recent-attempts">
          <div className="admin-panel-heading"><div><span className="admin-caption">HOẠT ĐỘNG HỌC</span><h3>Lượt thi gần đây</h3></div></div>
          {(data.recent_attempts || []).length ? <div className="admin-attempt-list">{data.recent_attempts.map((attempt) => <div className="admin-attempt-row" key={attempt.id}><span className="admin-attempt-mark">✓</span><span><b>{attempt.exam__title}</b><small>{attempt.user__email || "Khách"} · {attempt.mode === "full" ? "Thi thử" : "Luyện tập"}</small></span><time>{dateLabel(attempt.started_at)}</time><em className={`admin-attempt-status ${attempt.status === "submitted" ? "done" : ""}`}>{attempt.status === "submitted" ? "Đã nộp" : attempt.status === "in_progress" ? "Đang làm" : "Đã dừng"}</em></div>)}</div> : <p className="admin-attempt-empty">Chưa có lượt thi được ghi nhận.</p>}
        </section>
      </div>
    </div>
  );
}

function DataTable({ section, vocabularyMode, grammarMode, selectedExam, data, saving, onEdit, onDelete, onToggleUser, onOpenUser, onOpenExam, canManageUsers, canManageContent, canManageRoles, onEditRole, onDeleteRole }) {
  const rows = data?.results || [];
  if (!rows.length) return <div className="admin-empty"><span>⌕</span><b>Chưa có dữ liệu phù hợp</b><small>Thử đổi từ khóa tìm kiếm hoặc thêm nội dung mới.</small></div>;
  return <div className="admin-table-wrap"><table className="admin-table"><thead><tr>{getColumns(section, vocabularyMode, grammarMode, selectedExam)}</tr></thead><tbody>
    {section === "users" && rows.map((row) => <tr key={row.id}>
      <td><button type="button" className="admin-user-detail-trigger" onClick={() => onOpenUser(row)}><span className="admin-user-avatar small">{(row.display_name || row.email)[0].toUpperCase()}</span><span><b>{row.display_name || "Học viên"}</b><small>{row.email}</small></span></button></td>
      <td><span className={`admin-status ${row.is_active ? "good" : "muted"}`}><i />{row.is_active ? "Hoạt động" : "Đã khóa"}</span>{row.is_staff && <span className="admin-mini-tag">Admin</span>}</td>
      <td>{loginMethodSummary(row)}</td><td>{fmt(row.attempt_count)} bài</td><td>{dateLabel(row.date_joined)}</td>
      <td>{canManageUsers && <button type="button" className={`admin-row-action ${row.is_active ? "danger" : ""}`} disabled={saving} onClick={() => onToggleUser(row)}>{row.is_active ? "Khóa" : "Mở lại"}</button>}</td>
    </tr>)}
    {section === "roles" && rows.map((row) => <tr key={row.id}>
      <td><b>{row.name}</b><small className="admin-cell-sub">{row.code}{row.is_system ? " · hệ thống" : ""}</small></td>
      <td>{fmt(row.user_count)} người</td><td>{(row.permission_names || []).map((item) => item.name).join(" · ") || "Không có quyền"}</td>
      <td>{canManageRoles && !row.is_system ? <RowActions onEdit={() => onEditRole(row)} onDelete={() => onDeleteRole(row)} /> : <span className="admin-status muted"><i />{row.is_system ? "Vai trò hệ thống" : "Chỉ xem"}</span>}</td>
    </tr>)}
    {section === "vocabulary" && vocabularyMode === "topics" && rows.map((row) => <tr key={row.id}>
      <td><b>{row.name}</b><small className="admin-cell-sub">/{row.slug}</small></td><td>{fmt(row.term_count)} từ</td><td><StatusBadge active={row.is_published} /></td>
      <td>{canManageContent && <RowActions onEdit={() => onEdit("topic", row)} onDelete={() => onDelete("topic", row)} />}</td>
    </tr>)}
    {section === "vocabulary" && vocabularyMode === "terms" && rows.map((row) => <tr key={row.id}>
      <td><b className="admin-word">{row.word}</b><small className="admin-cell-sub">{row.pronunciation || row.part_of_speech || "Từ vựng"}</small></td><td className="admin-truncate">{row.meaning_vi}</td><td>{row.level || "—"}</td><td>{row.topics?.length || 0} chủ đề</td><td><StatusBadge active={row.is_active} /></td>
      <td>{canManageContent && <RowActions onEdit={() => onEdit("term", row)} onDelete={() => onDelete("term", row)} />}</td>
    </tr>)}
    {section === "grammar" && grammarMode === "notes" && rows.map((row) => <tr key={row.id}>
      <td><b>{row.title}</b><small className="admin-cell-sub admin-truncate">{row.quick_rule || row.body}</small></td><td>{row.sort_order}</td><td><StatusBadge active={row.is_published} /></td><td>{canManageContent && <RowActions onEdit={() => onEdit("grammar", row)} onDelete={() => onDelete("grammar", row)} />}</td>
    </tr>)}
    {section === "grammar" && grammarMode === "tips" && rows.map((row) => <tr key={row.id}>
      <td><span className="admin-part-chip">Part {row.part_number}</span></td><td><b>{row.title}</b><small className="admin-cell-sub admin-truncate">{row.body}</small></td><td><StatusBadge active={row.is_published} /></td><td>{canManageContent && <RowActions onEdit={() => onEdit("tip", row)} onDelete={() => onDelete("tip", row)} />}</td>
    </tr>)}
    {section === "exams" && !selectedExam && rows.map((row) => <tr key={row.id}>
      <td><b>{row.title}</b><small className="admin-cell-sub">{row.external_id} · {row.year || "Năm chưa đặt"}</small></td><td>{fmt(row.question_count)} câu</td>
      <td><div className="admin-answer-cell"><span>{fmt(row.answer_count)} / {fmt(row.question_count)}</span><i><b style={{ width: `${row.completion_percent}%` }} /></i></div></td>
      <td><StatusBadge active={row.status === "published"} label={row.status === "published" ? "Đang xuất bản" : row.status === "archived" ? "Đã lưu trữ" : "Bản nháp"} /></td>
      <td><div className="admin-exam-actions">{canManageContent && <button type="button" className="admin-row-action" onClick={() => onEdit("exam", row)}>Sửa đề</button>}<button type="button" className="admin-row-action primary" onClick={() => onOpenExam(row)}>Câu hỏi →</button></div></td>
    </tr>)}
    {section === "exams" && selectedExam && rows.map((row) => <tr key={row.id}>
      <td><span className="admin-part-chip">Part {row.part_number}</span></td><td><b>Câu {row.number}</b><small className="admin-cell-sub">{row.part_title}</small></td>
      <td className="admin-truncate">{row.prompt || row.title || "(Chưa có nội dung câu hỏi)"}</td><td><span className={`admin-answer-key ${row.correct_option ? "filled" : ""}`}>{row.correct_option || "Chưa có"}</span></td>
      <td>{canManageContent && <button type="button" className="admin-row-action primary" onClick={() => onEdit("question", row)}>Chỉnh câu</button>}</td>
    </tr>)}
  </tbody></table></div>;
}

function UserDetailDialog({ detail, loading, saving, error, roles, canManageRoles, canManageUsers, onSaveRoles, onUnlink, onClose }) {
  const user = detail.user;
  const methods = detail.login_methods;
  const stats = detail.stats;
  const dashboard = detail.dashboard;
  const vocabulary = dashboard?.vocabulary;
  const score = dashboard?.score;
  const latestScore = score?.latest;
  const recommendations = dashboard?.recommendations || [];
  return (
    <div className="admin-modal-scrim" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="admin-modal admin-user-modal" role="dialog" aria-modal="true" aria-labelledby="admin-user-title">
        <header><div><span className="admin-caption">HỒ SƠ TÀI KHOẢN</span><h2 id="admin-user-title">{user.display_name || "Học viên"}</h2><small>{user.email}</small></div><button type="button" className="admin-modal-close" aria-label="Đóng" onClick={onClose}>×</button></header>
        <div className="admin-modal-body">
          {error && <div className="admin-alert admin-alert-error" role="alert">{error}</div>}
          {loading ? <div className="admin-table-loading"><span className="spinner" /> Đang tải hồ sơ…</div> : <>
            <section className="admin-user-detail-section">
              <div className="admin-panel-heading"><div><span className="admin-caption">PHÂN QUYỀN</span><h3>Vai trò được gán</h3></div></div>
              {canManageRoles ? <RoleAssignment roles={roles} selected={user.roles || []} saving={saving} onSave={onSaveRoles} /> : <div className="admin-login-method-list">{(user.roles || []).map((role) => <div className="admin-login-method" key={role.id}><span className="admin-method-icon">♙</span><span><b>{role.name}</b><small>{role.code}</small></span></div>)}</div>}
            </section>
            <div className="admin-user-detail-stats">
              <DetailStat label="Full test" value={dashboard?.full_test_count} note="Lượt thi hoàn chỉnh" />
              <DetailStat label="Luyện từng Part" value={dashboard?.part_practice_count} note="Lượt đã nộp" />
              <DetailStat label="Quiz từ vựng" value={vocabulary?.quiz_count} note={`${vocabulary?.quiz_accuracy == null ? "Chưa có điểm" : `${vocabulary.quiz_accuracy}% đúng`} · ${fmt(vocabulary?.quiz_correct_count)}/${fmt(vocabulary?.quiz_answered_count)} câu`} />
              <DetailStat label="Ngân hàng từ" value={vocabulary?.total_count} note={`${fmt(vocabulary?.topic_count)} chủ đề · ${fmt(stats?.vocabulary_tracked)} theo dõi · ${fmt(stats?.vocabulary_learned)} đã thuộc`} />
              <DetailStat label="Chuỗi ngày học" value={detail.streak?.current_streak} note={`Ngày học gần nhất: ${dateLabel(detail.streak?.last_study_date)}`} />
              <DetailStat label="Điểm Full test gần nhất" value={latestScore?.is_valid ? latestScore.total_score : "—"} note={latestScore?.is_valid ? `Mục tiêu ${score.target} · ${score.target_progress}%` : "Chưa có điểm quy đổi TOEIC"} />
            </div>
            <section className="admin-user-detail-section">
              <div className="admin-panel-heading"><div><span className="admin-caption">TIẾN ĐỘ THEO PART</span><h3>Luyện tập 7 Part TOEIC</h3></div></div>
              <div className="admin-user-part-list">{(dashboard?.parts || []).map((part) => <div className="admin-user-part" key={part.part_number}><b>Part {part.part_number}</b><span>{part.name}</span><div><i style={{ width: `${part.accuracy || 0}%` }} /></div><strong>{part.accuracy == null ? "—" : `${part.accuracy}%`}</strong><small>{fmt(part.answered_count)} / {fmt(part.question_count)} câu</small></div>)}</div>
            </section>
            <section className="admin-user-detail-section">
              <div className="admin-panel-heading"><div><span className="admin-caption">KẾT QUẢ FULL TEST</span><h3>Điểm TOEIC ước tính</h3></div><span className="admin-user-last-login">{dashboard?.latest_full_test?.exam_title || "Chưa có full test đã nộp"}</span></div>
              {latestScore?.is_valid ? <div className="admin-user-score-summary"><div className="admin-user-total-score"><b>{latestScore.total_score}</b><span>/ {score?.target || 900} điểm</span></div><div className="admin-user-score-progress"><span><b style={{ width: `${Math.min(score?.target_progress || 0, 100)}%` }} /></span><small>{score?.target_progress || 0}% tiến độ mục tiêu</small></div><div className="admin-user-score-split"><span>Listening <b>{latestScore.listening?.score ?? "—"}</b></span><span>Reading <b>{latestScore.reading?.score ?? "—"}</b></span></div></div> : <p className="admin-attempt-empty">{dashboard?.latest_full_test ? `Full test ${dashboard.latest_full_test.exam_title} chưa đủ dữ liệu để quy đổi điểm TOEIC.` : "Chưa có full test đã nộp để quy đổi điểm TOEIC."}</p>}
              {recommendations.length > 0 && <p className="admin-user-recommendation">Gợi ý luyện thêm: {recommendations.map((part) => `Part ${part.part_number}${part.accuracy == null ? "" : ` (${part.accuracy}%)`}`).join(" · ")}</p>}
            </section>
            <section className="admin-user-detail-section">
              <div className="admin-panel-heading"><div><span className="admin-caption">BẢO MẬT TÀI KHOẢN</span><h3>Phương thức đăng nhập</h3></div></div>
              <div className="admin-login-method-list">
                {methods?.password_enabled && <div className="admin-login-method"><span className="admin-method-icon">@</span><span><b>Email và mật khẩu</b><small>{user.email}</small></span><em>Đang bật</em></div>}
                {(methods?.identities || []).map((identity) => <div className="admin-login-method" key={identity.id}><span className="admin-method-icon google">G</span><span><b>{providerLabel(identity.provider)}</b><small>{identity.email_at_provider || "Tài khoản liên kết"} · liên kết {dateLabel(identity.created_at)}</small></span>{canManageUsers && <button type="button" className="admin-row-action danger" disabled={saving} onClick={() => onUnlink(identity.provider)}>Gỡ liên kết</button>}</div>)}
                {!methods?.password_enabled && !methods?.identities?.length && <p className="admin-attempt-empty">Không có phương thức đăng nhập đang hoạt động.</p>}
              </div>
              <p className="admin-user-security-note">Không thể gỡ phương thức cuối cùng đang dùng để đăng nhập.</p>
            </section>
            <section className="admin-user-detail-section">
              <div className="admin-panel-heading"><div><span className="admin-caption">HOẠT ĐỘNG HỌC TẬP</span><h3>Lượt thi gần đây</h3></div><span className="admin-user-last-login">Đăng nhập gần nhất: {dateTimeLabel(stats?.last_login)}</span></div>
              {(detail.recent_attempts || []).length ? <div className="admin-user-attempt-list">{detail.recent_attempts.map((attempt) => <div className="admin-user-attempt" key={attempt.id}><span><b>{attempt.exam_title}</b><small>{attempt.mode === "full" ? "Thi thử" : "Luyện tập"} · {dateTimeLabel(attempt.started_at)}</small></span><span className={`admin-attempt-status ${attempt.status === "submitted" ? "done" : ""}`}>{attempt.accuracy_percent == null ? (attempt.status === "in_progress" ? "Đang làm" : "Chưa chấm") : `${attempt.accuracy_percent}% đúng`}</span></div>)}</div> : <p className="admin-attempt-empty">Tài khoản chưa có lượt thi.</p>}
            </section>
            <section className="admin-user-detail-section">
              <div className="admin-panel-heading"><div><span className="admin-caption">TỪ VỰNG</span><h3>Quiz gần đây</h3></div></div>
              {(detail.recent_quizzes || []).length ? <div className="admin-user-attempt-list">{detail.recent_quizzes.map((quiz) => <div className="admin-user-attempt" key={quiz.id}><span><b>Quiz {quiz.scope === "topic" ? `· ${quiz.topic_name || "Theo chủ đề"}` : quiz.scope === "review" ? "· Từ cần ôn" : "· Tất cả từ"}</b><small>{fmt(quiz.correct_count)} đúng · {fmt(quiz.answered_count)}/{fmt(quiz.question_count)} câu · {dateTimeLabel(quiz.started_at)}</small></span><span className={`admin-attempt-status ${quiz.status === "submitted" ? "done" : ""}`}>{quiz.status === "submitted" ? "Hoàn thành" : "Đang làm"}</span></div>)}</div> : <p className="admin-attempt-empty">Tài khoản chưa có quiz từ vựng.</p>}
            </section>
          </>}
        </div>
        <footer><button type="button" className="admin-secondary" onClick={onClose}>Đóng</button></footer>
      </section>
    </div>
  );
}

function RoleEditorDialog({ role, permissions, saving, error, onClose, onSave }) {
  const [name, setName] = useState(role.name || "");
  const [code, setCode] = useState(role.code || "");
  const [description, setDescription] = useState(role.description || "");
  const [selected, setSelected] = useState(role.permission_codes || []);
  const grouped = permissions.reduce((result, permission) => {
    (result[permission.module] ||= []).push(permission);
    return result;
  }, {});
  function toggle(codeValue) {
    setSelected((current) => current.includes(codeValue) ? current.filter((value) => value !== codeValue) : [...current, codeValue]);
  }
  return <div className="admin-modal-scrim" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <form className="admin-modal" role="dialog" aria-modal="true" onSubmit={(event) => { event.preventDefault(); onSave({ code, name, description, permission_codes: selected }); }}>
      <header><div><span className="admin-caption">PHÂN QUYỀN</span><h2>{role.id ? "Chỉnh sửa vai trò" : "Tạo vai trò"}</h2></div><button type="button" className="admin-modal-close" onClick={onClose} aria-label="Đóng">×</button></header>
      <div className="admin-modal-body">
        <Field label="Tên vai trò" value={name} onChange={setName} required />
        <Field label="Mã vai trò" value={code} onChange={setCode} required hint="Chữ thường, số, dấu gạch ngang hoặc gạch dưới." />
        <Field label="Mô tả" value={description} onChange={setDescription} multiline />
        <div className="admin-permission-groups">{Object.entries(grouped).map(([module, items]) => <section key={module}><b>{module}</b>{items.map((permission) => <label key={permission.code}><input type="checkbox" checked={selected.includes(permission.code)} onChange={() => toggle(permission.code)} /><span><strong>{permission.name}</strong><small>{permission.description}</small></span></label>)}</section>)}</div>
        {error && <div className="admin-alert admin-alert-error" role="alert">{error}</div>}
      </div>
      <footer><button type="button" className="admin-secondary" onClick={onClose}>Hủy</button><button type="submit" className="admin-primary" disabled={saving}>{saving ? "Đang lưu…" : "Lưu vai trò"}</button></footer>
    </form>
  </div>;
}

function RoleAssignment({ roles, selected, saving, onSave }) {
  const [selectedIds, setSelectedIds] = useState((selected || []).map((role) => role.id));
  const currentIds = (selected || []).map((role) => role.id);
  const dirty = selectedIds.length !== currentIds.length || selectedIds.some((id) => !currentIds.includes(id));
  return <div className="admin-role-assignment"><label className="admin-field"><span>Vai trò</span><select multiple value={selectedIds.map(String)} onChange={(event) => setSelectedIds(Array.from(event.target.selectedOptions, (option) => Number(option.value)))}>{roles.map((role) => <option key={role.id} value={role.id}>{role.name} ({role.code})</option>)}</select><small>Chọn một hoặc nhiều vai trò. Quyền hiệu lực là tổng quyền của các vai trò.</small></label><button type="button" className="admin-primary" disabled={!dirty || saving} onClick={() => onSave(selectedIds)}>{saving ? "Đang lưu…" : "Lưu vai trò"}</button></div>;
}

function DetailStat({ label, value, note }) {
  const displayValue = value === "—" ? "—" : fmt(value);
  return <div className="admin-user-detail-stat"><small>{label}</small><b>{displayValue}</b><span>{note}</span></div>;
}

function getColumns(section, vocabularyMode, grammarMode, selectedExam) {
  if (section === "users") return <><th>TÀI KHOẢN</th><th>TRẠNG THÁI</th><th>ĐĂNG NHẬP</th><th>HOẠT ĐỘNG</th><th>NGÀY THAM GIA</th><th /></>;
  if (section === "roles") return <><th>VAI TRÒ</th><th>NGƯỜI DÙNG</th><th>QUYỀN</th><th /></>;
  if (section === "vocabulary" && vocabularyMode === "topics") return <><th>CHỦ ĐỀ</th><th>SỐ TỪ</th><th>TRẠNG THÁI</th><th /></>;
  if (section === "vocabulary") return <><th>TỪ VỰNG</th><th>NGHĨA</th><th>TRÌNH ĐỘ</th><th>CHỦ ĐỀ</th><th>TRẠNG THÁI</th><th /></>;
  if (section === "grammar" && grammarMode === "tips") return <><th>PART</th><th>MẸO TOEIC</th><th>TRẠNG THÁI</th><th /></>;
  if (section === "grammar") return <><th>BÀI NGỮ PHÁP</th><th>THỨ TỰ</th><th>TRẠNG THÁI</th><th /></>;
  if (section === "exams" && selectedExam) return <><th>PART</th><th>CÂU HỎI</th><th>NỘI DUNG</th><th>ĐÁP ÁN</th><th /></>;
  return <><th>ĐỀ THI</th><th>NGÂN HÀNG</th><th>ĐÁP ÁN</th><th>TRẠNG THÁI</th><th /></>;
}

function StatusBadge({ active, label }) {
  return <span className={`admin-status ${active ? "good" : "muted"}`}><i />{label || (active ? "Đang dùng" : "Đã ẩn")}</span>;
}

function RowActions({ onEdit, onDelete }) {
  return <div className="admin-row-actions"><button type="button" className="admin-row-action" onClick={onEdit}>Sửa</button><button type="button" className="admin-row-action danger" onClick={onDelete}>Xóa</button></div>;
}

function Pagination({ data, onChange }) {
  if (!data || data.pages <= 1) return null;
  return <div className="admin-pagination"><span>{fmt(data.count)} bản ghi</span><div><button type="button" disabled={data.page <= 1} onClick={() => onChange(data.page - 1)}>← Trước</button><b>{data.page} / {data.pages}</b><button type="button" disabled={data.page >= data.pages} onClick={() => onChange(data.page + 1)}>Sau →</button></div></div>;
}

function createEditor(section, selectedExam, vocabularyMode, grammarMode) {
  if (section === "vocabulary" && vocabularyMode === "topics") return { kind: "topic", record: null };
  if (section === "vocabulary" && vocabularyMode === "terms") return { kind: "term", record: null };
  if (section === "grammar" && grammarMode === "notes") return { kind: "grammar", record: null };
  if (section === "grammar" && grammarMode === "tips") return { kind: "tip", record: null };
  if (section === "exams" && !selectedExam) return null;
  return null;
}

function createLabel(section, vocabularyMode, grammarMode) {
  if (section === "vocabulary") return vocabularyMode === "topics" ? "Thêm chủ đề" : "Thêm từ vựng";
  return grammarMode === "tips" ? "Thêm mẹo TOEIC" : "Thêm bài ngữ pháp";
}

function searchPlaceholder(section, selectedExam, vocabularyMode, grammarMode) {
  if (section === "users") return "Tìm theo email hoặc tên…";
  if (section === "vocabulary") return vocabularyMode === "topics" ? "Tìm chủ đề…" : "Tìm từ hoặc nghĩa…";
  if (section === "grammar") return grammarMode === "tips" ? "Tìm mẹo theo Part…" : "Tìm bài ngữ pháp…";
  return selectedExam ? "Tìm câu hỏi trong đề…" : "Tìm đề thi…";
}

function EditorDialog({ editor, topics, saving, error, onClose, onSave }) {
  const { kind, record } = editor;
  const [values, setValues] = useState(() => initialValues(kind, record));
  const [validationError, setValidationError] = useState("");
  const title = `${record ? "Chỉnh sửa" : "Thêm mới"} ${editorTitle(kind)}`;
  const topicIds = kind === "term" ? (values.topic_ids || []) : [];

  function update(name, value) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  function submit(event) {
    event.preventDefault();
    setValidationError("");
    const payload = { ...values };
    if (kind === "question") {
      payload.options = { A: payload.option_A, B: payload.option_B, C: payload.option_C, D: payload.option_D };
      delete payload.option_A; delete payload.option_B; delete payload.option_C; delete payload.option_D;
    }
    if (kind === "term") payload.topic_ids = topicIds.map(Number);
    if (["topic", "grammar", "tip"].includes(kind)) payload.sort_order = Number(payload.sort_order || 0);
    if (kind === "tip") payload.part_number = Number(payload.part_number);
    if (kind === "exam") {
      payload.year = payload.year ? Number(payload.year) : null;
      payload.time_limit_seconds = Number(payload.time_limit_seconds || 7200);
    }
    if (kind === "question" && !payload.correct_option) payload.correct_option = "";
    if ((kind === "grammar" || kind === "tip") && !payload.title?.trim()) return setValidationError("Nhập tiêu đề trước khi lưu.");
    if (kind === "question" && Object.values(payload.options).filter(Boolean).length < 2) return setValidationError("Cần nhập ít nhất hai lựa chọn đáp án.");
    if (kind === "question" && payload.correct_option && !payload.options[payload.correct_option]) return setValidationError("Lựa chọn đúng cần có nội dung.");
    onSave(payload);
  }

  return <div className="admin-modal-scrim" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <form className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="admin-editor-title" onSubmit={submit}>
      <header><div><span className="admin-caption">QUẢN LÝ NỘI DUNG</span><h2 id="admin-editor-title">{title}</h2></div><button type="button" className="admin-modal-close" onClick={onClose} aria-label="Đóng">×</button></header>
      <div className="admin-modal-body">
        {kind === "topic" && <>
          <Field label="Tên chủ đề" value={values.name} onChange={(v) => update("name", v)} required />
          <Field label="Đường dẫn (slug)" value={values.slug} onChange={(v) => update("slug", v)} required hint="Ví dụ: business" />
          <Field label="Mô tả" value={values.description} onChange={(v) => update("description", v)} multiline />
          <Field label="Nguồn tham khảo" value={values.source_url} onChange={(v) => update("source_url", v)} />
          <div className="admin-form-pair"><Field label="Thứ tự" value={values.sort_order} onChange={(v) => update("sort_order", v)} type="number" /><CheckField label="Hiển thị công khai" checked={values.is_published} onChange={(v) => update("is_published", v)} /></div>
        </>}
        {kind === "term" && <>
          <div className="admin-form-pair"><Field label="Từ vựng" value={values.word} onChange={(v) => update("word", v)} required /><Field label="Trình độ" value={values.level} onChange={(v) => update("level", v)} placeholder="A1, B2…" /></div>
          <div className="admin-form-pair"><Field label="Từ loại" value={values.part_of_speech} onChange={(v) => update("part_of_speech", v)} /><Field label="Phiên âm" value={values.pronunciation} onChange={(v) => update("pronunciation", v)} /></div>
          <Field label="Nghĩa tiếng Việt" value={values.meaning_vi} onChange={(v) => update("meaning_vi", v)} multiline required />
          <Field label="Ví dụ tiếng Anh" value={values.example_en} onChange={(v) => update("example_en", v)} multiline />
          <label className="admin-field"><span>Chủ đề</span><select multiple value={topicIds.map(String)} onChange={(event) => update("topic_ids", Array.from(event.target.selectedOptions, (option) => option.value))}>{topics.map((topic) => <option key={topic.id} value={topic.id}>{topic.name}</option>)}</select><small>Giữ Ctrl hoặc ⌘ để chọn nhiều chủ đề.</small></label>
          <CheckField label="Đang sử dụng" checked={values.is_active} onChange={(v) => update("is_active", v)} />
        </>}
        {kind === "grammar" && <>
          <Field label="Tiêu đề" value={values.title} onChange={(v) => update("title", v)} required />
          <Field label="Quy tắc nhanh" value={values.quick_rule} onChange={(v) => update("quick_rule", v)} multiline />
          <Field label="Nội dung bài học" value={values.body} onChange={(v) => update("body", v)} multiline required />
          <Field label="Ví dụ" value={values.example} onChange={(v) => update("example", v)} multiline />
          <div className="admin-form-pair"><Field label="Thứ tự" value={values.sort_order} onChange={(v) => update("sort_order", v)} type="number" /><CheckField label="Xuất bản" checked={values.is_published} onChange={(v) => update("is_published", v)} /></div>
        </>}
        {kind === "tip" && <>
          <div className="admin-form-pair"><label className="admin-field"><span>Part</span><select value={values.part_number} onChange={(event) => update("part_number", event.target.value)}>{[1, 2, 3, 4, 5, 6, 7].map((part) => <option key={part} value={part}>Part {part}</option>)}</select></label><Field label="Thứ tự" value={values.sort_order} onChange={(v) => update("sort_order", v)} type="number" /></div>
          <Field label="Tiêu đề" value={values.title} onChange={(v) => update("title", v)} required />
          <Field label="Nội dung mẹo" value={values.body} onChange={(v) => update("body", v)} multiline required />
          <CheckField label="Xuất bản" checked={values.is_published} onChange={(v) => update("is_published", v)} />
        </>}
        {kind === "exam" && <>
          <Field label="Tên đề thi" value={values.title} onChange={(v) => update("title", v)} required />
          <div className="admin-form-pair"><Field label="Năm" value={values.year} onChange={(v) => update("year", v)} type="number" /><Field label="Thời lượng (giây)" value={values.time_limit_seconds} onChange={(v) => update("time_limit_seconds", v)} type="number" /></div>
          <Field label="Nguồn đề" value={values.source_url} onChange={(v) => update("source_url", v)} />
          <label className="admin-field"><span>Trạng thái</span><select value={values.status} onChange={(event) => update("status", event.target.value)}><option value="draft">Bản nháp</option><option value="published">Đang xuất bản</option><option value="archived">Đã lưu trữ</option></select></label>
        </>}
        {kind === "question" && <>
          <div className="admin-question-context">Part {record.part_number} <span>·</span> Câu {record.number}</div>
          <Field label="Tiêu đề / nhóm câu" value={values.title} onChange={(v) => update("title", v)} />
          <Field label="Nội dung câu hỏi" value={values.prompt} onChange={(v) => update("prompt", v)} multiline />
          {values.prompt_html && <Field label="Nội dung HTML (nếu cần)" value={values.prompt_html} onChange={(v) => update("prompt_html", v)} multiline />}
          <div className="admin-option-fields">{["A", "B", "C", "D"].map((key) => <Field key={key} label={`Lựa chọn ${key}`} value={values[`option_${key}`]} onChange={(v) => update(`option_${key}`, v)} multiline />)}</div>
          <label className="admin-field"><span>Đáp án đúng</span><select value={values.correct_option} onChange={(event) => update("correct_option", event.target.value)}><option value="">Chưa có đáp án</option>{["A", "B", "C", "D"].map((key) => <option key={key} value={key}>{key}</option>)}</select></label>
          <Field label="Giải thích đáp án" value={values.explanation_reason} onChange={(v) => update("explanation_reason", v)} multiline />
          <Field label="Mẹo làm bài" value={values.explanation_tip} onChange={(v) => update("explanation_tip", v)} multiline />
          <Field label="Transcript" value={values.transcript} onChange={(v) => update("transcript", v)} multiline />
        </>}
        {(validationError || error) && <div className="admin-alert admin-alert-error" role="alert">{validationError || error}</div>}
      </div>
      <footer><button type="button" className="admin-secondary" onClick={onClose}>Hủy</button><button type="submit" className="admin-primary" disabled={saving}>{saving ? "Đang lưu…" : "Lưu thay đổi"}</button></footer>
    </form>
  </div>;
}

function Field({ label, value, onChange, type = "text", multiline = false, required = false, placeholder = "", hint = "" }) {
  return <label className="admin-field"><span>{label}{required && <i> *</i>}</span>{multiline ? <textarea value={value ?? ""} onChange={(event) => onChange(event.target.value)} required={required} placeholder={placeholder} rows={3} /> : <input type={type} value={value ?? ""} onChange={(event) => onChange(event.target.value)} required={required} placeholder={placeholder} />}{hint && <small>{hint}</small>}</label>;
}

function CheckField({ label, checked, onChange }) {
  return <label className="admin-check"><input type="checkbox" checked={Boolean(checked)} onChange={(event) => onChange(event.target.checked)} /><span>{label}</span></label>;
}

function initialValues(kind, record) {
  if (kind === "topic") return { slug: "", name: "", description: "", source_url: "", sort_order: 0, is_published: true, ...record };
  if (kind === "term") {
    return {
      word: "", level: "", part_of_speech: "", pronunciation: "", meaning_vi: "",
      example_en: "", is_active: true, ...record, topic_ids: record?.topics || [],
    };
  }
  if (kind === "grammar") return { title: "", body: "", quick_rule: "", example: "", sort_order: 0, is_published: true, ...record };
  if (kind === "tip") return { part_number: 1, title: "", body: "", sort_order: 0, is_published: true, ...record };
  if (kind === "exam") return { title: "", year: "", source_url: "", time_limit_seconds: 7200, status: "published", ...record };
  return {
    title: "", prompt: "", prompt_html: "", correct_option: "", explanation_reason: "",
    explanation_tip: "", transcript: "", ...record,
    option_A: record?.options?.A || "", option_B: record?.options?.B || "",
    option_C: record?.options?.C || "", option_D: record?.options?.D || "",
  };
}

function editorTitle(kind) {
  return { topic: "chủ đề từ vựng", term: "từ vựng", grammar: "bài ngữ pháp", tip: "mẹo TOEIC", exam: "đề thi", question: "câu hỏi" }[kind];
}

export default AdminDashboardPage;
