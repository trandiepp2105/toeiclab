import React, { useEffect, useState } from "react";
import AdminDashboardPage from "./pages/AdminDashboardPage/AdminDashboardPage";
import authService from "./services/authService";

function App() {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    let isCurrent = true;
    authService
      .me()
      .then((currentUser) => {
        if (!currentUser.is_staff) throw new Error("Tài khoản chưa được cấp quyền quản trị.");
        if (isCurrent) setUser(currentUser);
      })
      .catch(() => {
        if (isCurrent) setUser(null);
      })
      .finally(() => {
        if (isCurrent) setBooting(false);
      });

    return () => { isCurrent = false; };
  }, []);

  async function handleLogin(email, password) {
    const authenticatedUser = await authService.login(email, password);
    if (!authenticatedUser?.is_staff) {
      await authService.logout();
      throw new Error("Tài khoản này chưa có quyền quản trị TOEIC Lab.");
    }
    setUser(authenticatedUser);
  }

  async function handleLogout() {
    try {
      await authService.logout();
    } finally {
      setUser(null);
    }
  }

  if (booting) {
    return <main className="admin-boot" role="status">Đang kiểm tra phiên quản trị…</main>;
  }

  if (!user) return <AdminLogin onLogin={handleLogin} />;

  return (
    <div className="admin-app-shell">
      <header className="admin-topbar">
        <a className="admin-brand" href="/manage/" aria-label="TOEIC Lab Admin">
          <img className="admin-brand-logo" src="/manage/logo.png" alt="" />
          <span><b>TOEIC<span>Lab</span></b><small>ADMIN CONSOLE</small></span>
        </a>
        <div className="admin-account">
          <span className="admin-account-avatar">{(user.display_name || user.email)[0].toUpperCase()}</span>
          <span className="admin-account-copy"><b>{user.display_name || "Quản trị viên"}</b><small>{user.email}</small></span>
          <button type="button" onClick={handleLogout}>Đăng xuất</button>
        </div>
      </header>
      <main className="admin-main">
        <AdminDashboardPage user={user} />
        <footer className="admin-footer"><span>© 2026 TOEIC Lab Admin</span><span>Quản lý nội dung học tập</span></footer>
      </main>
    </div>
  );
}

function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await onLogin(email.trim(), password);
    } catch (loginError) {
      setError(loginError.response?.data?.error || loginError.response?.data?.detail || loginError.message || "Đăng nhập thất bại.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="admin-login-page">
      <section className="admin-login-card">
        <div className="admin-login-brand"><img className="admin-brand-logo" src="/manage/logo.png" alt="" /><span><b>TOEIC<span>Lab</span></b><small>ADMIN CONSOLE</small></span></div>
        <span className="admin-login-kicker">KHÔNG GIAN VẬN HÀNH</span>
        <h1>Đăng nhập quản trị</h1>
        <p>Dùng tài khoản staff để quản lý dữ liệu TOEIC Lab.</p>
        <form onSubmit={submit}>
          <label>Email<input type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
          <label>Mật khẩu<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
          {error && <div className="admin-login-error" role="alert">{error}</div>}
          <button type="submit" disabled={submitting}>{submitting ? "Đang đăng nhập…" : "Đăng nhập vào bảng quản trị"}</button>
        </form>
        <small className="admin-login-footnote">Phiên quản trị tách riêng với ứng dụng học tập.</small>
      </section>
    </main>
  );
}

export default App;
