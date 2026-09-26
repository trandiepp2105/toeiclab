import React, { useCallback, useEffect, useState } from "react";
import {
  BrowserRouter,
  Link,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import "./App.scss";

import authService from "./services/authService";
import dashboardService from "./services/dashboardService";
import { navItems, Button, Loading } from "./shared/ui";
import LoginModal from "./components/auth/LoginModal/LoginModal";

import DashboardPage from "./pages/DashboardPage/DashboardPage";
import VocabularyHomePage from "./pages/VocabularyHomePage/VocabularyHomePage";
import TopicListPage from "./pages/TopicListPage/TopicListPage";
import TopicDetailPage from "./pages/TopicDetailPage/TopicDetailPage";
import VocabularyQuizSetupPage from "./pages/VocabularyQuizSetupPage/VocabularyQuizSetupPage";
import VocabularyQuizRunPage from "./pages/VocabularyQuizRunPage/VocabularyQuizRunPage";
import VocabularyQuizResultPage from "./pages/VocabularyQuizResultPage/VocabularyQuizResultPage";
import TestListPage from "./pages/TestListPage/TestListPage";
import TestSetupPage from "./pages/TestSetupPage/TestSetupPage";
import TestRunPage from "./pages/TestRunPage/TestRunPage";
import TestReviewPage from "./pages/TestReviewPage/TestReviewPage";
import TestResultPage from "./pages/TestResultPage/TestResultPage";
import PartPracticePage from "./pages/PartPracticePage/PartPracticePage";
import PartPracticeRunPage from "./pages/PartPracticeRunPage/PartPracticeRunPage";
import HistoryPage from "./pages/HistoryPage/HistoryPage";
import GrammarPage from "./pages/GrammarPage/GrammarPage";
import TipsPage from "./pages/TipsPage/TipsPage";
import AccountPage from "./pages/AccountPage/AccountPage";
import ChangePasswordPage from "./pages/ChangePasswordPage/ChangePasswordPage";
import NotFoundPage from "./pages/NotFoundPage/NotFoundPage";

/**
 * Render một page và truyền route params/navigation về page cũ.
 *
 * Wrapper này giúp các page tiếp tục dùng prop go trong khi routing
 * được quản lý bởi React Router.
 */
function PageRoute({
  Component,
  requiresAuth = false,
  user,
  openLogin,
  ...pageProps
}) {
  const navigate = useNavigate();
  const routeParams = useParams();
  const requiresLogin = requiresAuth && !user;

  useEffect(() => {
    if (requiresLogin) openLogin?.();
  }, [requiresLogin, openLogin]);

  if (requiresLogin) {
    return (
      <section className="panel auth-required-prompt">
        <h1>Đăng nhập để tiếp tục</h1>
        <p>Tính năng này cần tài khoản để lưu và đồng bộ tiến độ của bạn.</p>
        <Button onClick={openLogin}>Đăng nhập hoặc đăng ký</Button>
      </section>
    );
  }

  return (
    <Component
      {...routeParams}
      {...pageProps}
      user={user}
      openLogin={openLogin}
      go={navigate}
    />
  );
}

/**
 * Khai báo toàn bộ route của ứng dụng.
 */
function AppRoutes({ user, openLogin, logout }) {
  const protectedPage = (Component, extraProps = {}) => (
    <PageRoute
      Component={Component}
      requiresAuth
      user={user}
      openLogin={openLogin}
      {...extraProps}
    />
  );

  return (
    <Routes>
      <Route path="/" element={protectedPage(DashboardPage)} />
      <Route
        path="/vocabulary"
        element={<PageRoute Component={VocabularyHomePage} />}
      />
      <Route
        path="/vocabulary/topics"
        element={<PageRoute Component={TopicListPage} />}
      />
      <Route
        path="/vocabulary/topics/:slug"
        element={
          <PageRoute Component={TopicDetailPage} />
        }
      />
      <Route
        path="/vocabulary/quiz"
        element={protectedPage(VocabularyQuizSetupPage)}
      />
      <Route
        path="/vocabulary/quiz/:attemptId"
        element={protectedPage(VocabularyQuizRunPage)}
      />
      <Route
        path="/vocabulary/quiz/:attemptId/result"
        element={protectedPage(VocabularyQuizResultPage)}
      />
      <Route path="/tests" element={<PageRoute Component={TestListPage} />} />
      <Route
        path="/tests/:testId/setup"
        element={protectedPage(TestSetupPage)}
      />
      <Route
        path="/tests/:testId/run/:attemptId"
        element={protectedPage(TestRunPage)}
      />
      <Route
        path="/tests/:testId/result/:attemptId"
        element={protectedPage(TestResultPage)}
      />
      <Route
        path="/tests/:testId/review/:attemptId"
        element={protectedPage(TestReviewPage)}
      />
      <Route
        path="/parts"
        element={protectedPage(PartPracticePage)}
      />
      <Route
        path="/parts/:partNumber"
        element={protectedPage(PartPracticeRunPage)}
      />
      <Route
        path="/history"
        element={protectedPage(HistoryPage)}
      />
      <Route path="/grammar" element={<PageRoute Component={GrammarPage} />} />
      <Route path="/tips" element={<PageRoute Component={TipsPage} />} />
      <Route
        path="/account"
        element={protectedPage(AccountPage, { logout })}
      />
      <Route
        path="/account/change-password"
        element={protectedPage(ChangePasswordPage)}
      />
      <Route path="*" element={<PageRoute Component={NotFoundPage} />} />
    </Routes>
  );
}

/**
 * Layout chung của toàn bộ ứng dụng.
 */
function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [boot, setBoot] = useState(true);
  const [studyStreak, setStudyStreak] = useState(null);

  useEffect(() => {
    authService
      .me()
      .then(setUser)
      .catch(() => {})
      .finally(() => setBoot(false));
  }, []);

  useEffect(() => {
    document.title = "TOEICLab — Thống kê kết quả luyện tập";
    window.scrollTo(0, 0);
    setMobileNav(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!user) {
      setStudyStreak(null);
      return undefined;
    }

    let isActive = true;
    let refreshTimer;

    const loadStudyStreak = () => {
      dashboardService
        .getStudyStreak()
        .then((result) => {
          if (isActive) setStudyStreak(result.current_streak);
        })
        .catch(() => {
          if (isActive) setStudyStreak(null);
        });
    };

    const scheduleStreakRefresh = () => {
      window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(loadStudyStreak, 500);
    };

    loadStudyStreak();
    window.addEventListener("toeiclab:study-activity", scheduleStreakRefresh);

    return () => {
      isActive = false;
      window.clearTimeout(refreshTimer);
      window.removeEventListener("toeiclab:study-activity", scheduleStreakRefresh);
    };
  }, [user, location.pathname]);

  const openLogin = useCallback(() => {
    setAuthOpen(true);
  }, []);

  const logout = async () => {
    try {
      await authService.logout();
    } catch (_) {
      // Luôn xóa user local dù API logout thất bại.
    }

    setUser(null);
    navigate("/tests");
  };

  const activeNav =
    navItems.find(([href]) => {
      if (href === "/") {
        return location.pathname === "/";
      }

      return (
        location.pathname === href || location.pathname.startsWith(href + "/")
      );
    })?.[0] || "/";

  if (boot) {
    return <Loading />;
  }

  return (
    <div className="app-shell">
      <aside className={"sidebar " + (mobileNav ? "sidebar-open" : "")}>
        <Link className="brand" to="/">
          <img className="brand-logo" src="/logo.png" alt="TOEICLab" />
          <span>
            <b>
              <span className="brand-word-toeic">TOEIC</span><span className="brand-word-lab">Lab</span>
            </b>
            <small>Learn with purpose</small>
          </span>
        </Link>

        <div className="nav-label">KHÔNG GIAN HỌC</div>

        <nav>
          {navItems.map(([href, iconFile, label]) => (
            <NavLink
              key={href}
              to={href}
              end={href === "/"}
              className={({ isActive }) =>
                "nav-item " + (isActive ? "active" : "")
              }
              onClick={() => setMobileNav(false)}
            >
              <img
                className="nav-icon"
                src={`/icons/${iconFile}`}
                alt=""
                aria-hidden="true"
              />
              {label}
              {href === "/tests" && <span className="nav-count">77</span>}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <span>✦</span>
            <b>Học một chút mỗi ngày</b>
            <small>Tiến bộ lớn bắt đầu từ những bước nhỏ.</small>
          </div>

          <button
            className="profile-button"
            onClick={() => (user ? navigate("/account") : openLogin())}
          >
            <span className="avatar">
              {user ? (user.display_name || user.email)[0].toUpperCase() : "👤"}
            </span>
            <span className="profile-copy">
              <b>{user?.display_name || user?.email || "Khách học tập"}</b>
              <small>
                {user ? "Tài khoản TOEICLab" : "Đăng nhập để đồng bộ"}
              </small>
            </span>
            {/* <span>···</span> */}
          </button>
        </div>
      </aside>

      {mobileNav && (
        <button
          className="nav-scrim"
          aria-label="Đóng menu"
          onClick={() => setMobileNav(false)}
        />
      )}

      <main className="main-shell">
        {/* <header className="topbar">
          <button className="mobile-menu" onClick={() => setMobileNav(true)}>
            ☰
          </button>

          <div className="breadcrumbs">
            Học tập <span>/</span>{" "}
            {navItems.find(([href]) => href === activeNav)?.[2] || "Tổng quan"}
          </div>

          <div className="topbar-actions">
            {user && studyStreak !== null ? (
              <span className="streak">
                <img
                  className="streak-icon"
                  src={studyStreak > 0 ? "/icons/active-streak.svg" : "/icons/inactive-streak.svg"}
                  alt=""
                />
                <b>{studyStreak} ngày</b> liên tục
              </span>
            ) : !user ? (
              <button
                className="streak streak-login"
                onClick={openLogin}
                aria-label="Đăng nhập để xem chuỗi ngày học"
              >
                <img className="streak-icon" src="/icons/inactive-streak.svg" alt="" />
                <span>Đăng nhập để xem streak</span>
              </button>
            ) : null}

            {user ? (
              <button
                className="top-avatar"
                onClick={() => navigate("/account")}
              >
                {(user.display_name || user.email)[0].toUpperCase()}
              </button>
            ) : (
              <Button onClick={openLogin}>
                Đăng nhập
              </Button>
            )}
          </div>
        </header> */}

        <div className="page-content">
          <AppRoutes user={user} openLogin={openLogin} logout={logout} />
        </div>

        <footer className="footer">
          © 2026 TOEICLab <span>Học thông minh · Thi tự tin</span>
        </footer>
      </main>

      {authOpen && (
        <LoginModal onClose={() => setAuthOpen(false)} onUser={setUser} />
      )}
    </div>
  );
}

/**
 * Root component bật BrowserRouter cho toàn bộ ứng dụng.
 */
function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}

export default App;
