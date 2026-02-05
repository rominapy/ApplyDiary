import { FormEvent, useMemo, useState } from "react";
import { createApplication, listApplications, login, register, setToken } from "./api";
import { APPLICATION_STATUSES, type Application, type ApplicationStatus, type User } from "./types";

function App() {
  const [mode, setMode] = useState<"login" | "register">("register");
  const [token, setTokenState] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [authForm, setAuthForm] = useState({
    email: "",
    password: "",
    name: "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
  });

  const [createForm, setCreateForm] = useState({
    company: "",
    role: "",
    status: "Applied" as ApplicationStatus,
    location: "remote" as "remote" | "on-site" | "hybrid"
  });

  const dashboard = useMemo(() => {
    return APPLICATION_STATUSES.map((status) => ({
      status,
      count: applications.filter((app) => app.status === status).length
    }));
  }, [applications]);

  async function handleAuthSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    try {
      const response =
        mode === "register"
          ? await register(authForm)
          : await login({ email: authForm.email, password: authForm.password });

      setToken(response.token);
      setTokenState(response.token);
      setUser(response.user);
      await refreshApplications();
    } catch {
      setError("Unable to authenticate. Please check your details.");
    }
  }

  async function refreshApplications() {
    try {
      const data = await listApplications({ status: statusFilter || undefined, search: search || undefined });
      setApplications(data);
    } catch {
      setError("Could not load applications.");
    }
  }

  async function handleCreateApplication(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!createForm.company.trim() || !createForm.role.trim()) {
      setError("Company and role are required.");
      return;
    }

    try {
      await createApplication(createForm);
      setCreateForm({ company: "", role: "", status: "Applied", location: "remote" });
      await refreshApplications();
    } catch {
      setError("Could not create application.");
    }
  }

  function handleLogout() {
    setToken(null);
    setTokenState(null);
    setUser(null);
    setApplications([]);
  }

  if (!token || !user) {
    return (
      <main className="container narrow">
        <h1>CareerFlow</h1>
        <p>Track every application with a clear, structured pipeline.</p>

        <div className="toggle-row">
          <button className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>Register</button>
          <button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>Login</button>
        </div>

        <form onSubmit={handleAuthSubmit} className="card form-grid">
          <label>
            Email
            <input
              type="email"
              value={authForm.email}
              onChange={(e) => setAuthForm((prev) => ({ ...prev, email: e.target.value }))}
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              minLength={8}
              value={authForm.password}
              onChange={(e) => setAuthForm((prev) => ({ ...prev, password: e.target.value }))}
              required
            />
          </label>

          {mode === "register" && (
            <>
              <label>
                Name
                <input
                  value={authForm.name}
                  onChange={(e) => setAuthForm((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
              </label>
              <label>
                Timezone
                <input
                  value={authForm.timezone}
                  onChange={(e) => setAuthForm((prev) => ({ ...prev, timezone: e.target.value }))}
                  required
                />
              </label>
            </>
          )}

          <button type="submit">{mode === "register" ? "Create account" : "Sign in"}</button>
        </form>

        {error && <p className="error">{error}</p>}
      </main>
    );
  }

  return (
    <main className="container">
      <header className="header-row">
        <div>
          <h1>CareerFlow</h1>
          <p>Welcome back, {user.name}.</p>
        </div>
        <button onClick={handleLogout}>Log out</button>
      </header>

      <section className="card">
        <h2>Dashboard</h2>
        <div className="dashboard-grid">
          {dashboard.map((item) => (
            <article key={item.status} className="metric-card">
              <strong>{item.count}</strong>
              <span>{item.status}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>Add Application</h2>
        <form onSubmit={handleCreateApplication} className="form-grid two-col">
          <label>
            Company
            <input
              value={createForm.company}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, company: e.target.value }))}
              required
            />
          </label>
          <label>
            Role
            <input
              value={createForm.role}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, role: e.target.value }))}
              required
            />
          </label>
          <label>
            Status
            <select
              value={createForm.status}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, status: e.target.value as ApplicationStatus }))}
            >
              {APPLICATION_STATUSES.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </label>
          <label>
            Location
            <select
              value={createForm.location}
              onChange={(e) =>
                setCreateForm((prev) => ({
                  ...prev,
                  location: e.target.value as "remote" | "on-site" | "hybrid"
                }))
              }
            >
              <option value="remote">Remote</option>
              <option value="on-site">On-site</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </label>
          <button type="submit">Save application</button>
        </form>
      </section>

      <section className="card">
        <h2>Applications</h2>
        <div className="toolbar">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            {APPLICATION_STATUSES.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
          <input
            placeholder="Search company or role"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button onClick={refreshApplications}>Apply filters</button>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Company</th>
                <th>Role</th>
                <th>Status</th>
                <th>Applied</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app.id}>
                  <td>{app.company}</td>
                  <td>{app.role}</td>
                  <td>{app.status}</td>
                  <td>{new Date(app.appliedDate).toLocaleDateString()}</td>
                </tr>
              ))}
              {applications.length === 0 && (
                <tr>
                  <td colSpan={4}>No applications yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {error && <p className="error">{error}</p>}
    </main>
  );
}

export default App;
