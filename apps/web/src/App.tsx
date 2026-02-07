import { FormEvent, Fragment, useMemo, useState } from "react";
import {
  createApplication,
  createNote,
  deleteApplication,
  deleteNote,
  listApplications,
  listNotes,
  login,
  register,
  setToken,
  updateApplication,
  updateNote
} from "./api";
import {
  APPLICATION_STATUSES,
  type Application,
  type ApplicationStatus,
  type Note,
  type User
} from "./types";

function Logo() {
  return (
    <span className="brand-logo" aria-label="CareerFlow">
      <svg viewBox="0 0 64 64" role="img" aria-hidden="true">
        <defs>
          <linearGradient id="careerflow-logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0b5fb5" />
            <stop offset="100%" stopColor="#2e8dd8" />
          </linearGradient>
        </defs>
        <rect x="4" y="4" width="56" height="56" rx="16" fill="url(#careerflow-logo-gradient)" />
        <path
          d="M18 40.5h6.8l6.2-11.8 6.8 7.2 8.2-14.1"
          fill="none"
          stroke="#f7fbff"
          strokeWidth="4.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span>CareerFlow</span>
    </span>
  );
}

function App() {
  const [mode, setMode] = useState<"login" | "register">("register");
  const [showAuth, setShowAuth] = useState(false);
  const [token, setTokenState] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [editingApplicationId, setEditingApplicationId] = useState<string | null>(null);
  const [notesApplicationId, setNotesApplicationId] = useState<string | null>(null);
  const [applicationNotes, setApplicationNotes] = useState<Note[]>([]);
  const [noteDraft, setNoteDraft] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteContent, setEditingNoteContent] = useState("");

  const [authForm, setAuthForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: ""
  });

  const [createForm, setCreateForm] = useState({
    company: "",
    role: "",
    status: "Applied" as ApplicationStatus,
    location: "remote" as "remote" | "on-site" | "hybrid",
    resumeUrl: "",
    coverUrl: ""
  });

  const [editForm, setEditForm] = useState({
    company: "",
    role: "",
    status: "Applied" as ApplicationStatus,
    location: "remote" as "remote" | "on-site" | "hybrid",
    resumeUrl: "",
    coverUrl: ""
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
          ? await register({
              email: authForm.email,
              password: authForm.password,
              name: `${authForm.firstName} ${authForm.lastName}`.trim()
            })
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
      await createApplication({
        ...createForm,
        resumeUrl: createForm.resumeUrl.trim() ? createForm.resumeUrl.trim() : null,
        coverUrl: createForm.coverUrl.trim() ? createForm.coverUrl.trim() : null
      });
      setCreateForm({
        company: "",
        role: "",
        status: "Applied",
        location: "remote",
        resumeUrl: "",
        coverUrl: ""
      });
      await refreshApplications();
    } catch {
      setError("Could not create application.");
    }
  }

  function startEditingApplication(app: Application) {
    setEditingApplicationId(app.id);
    setEditForm({
      company: app.company,
      role: app.role,
      status: app.status,
      location: app.location,
      resumeUrl: app.resumeUrl ?? "",
      coverUrl: app.coverUrl ?? ""
    });
  }

  async function saveEditedApplication(id: string) {
    setError(null);
    try {
      await updateApplication(id, {
        ...editForm,
        resumeUrl: editForm.resumeUrl.trim() ? editForm.resumeUrl.trim() : null,
        coverUrl: editForm.coverUrl.trim() ? editForm.coverUrl.trim() : null
      });
      setEditingApplicationId(null);
      await refreshApplications();
    } catch {
      setError("Could not update application.");
    }
  }

  async function handleDeleteApplication(id: string) {
    if (!window.confirm("Delete this application?")) {
      return;
    }

    setError(null);
    try {
      await deleteApplication(id);
      if (notesApplicationId === id) {
        setNotesApplicationId(null);
        setApplicationNotes([]);
      }
      await refreshApplications();
    } catch {
      setError("Could not delete application.");
    }
  }

  async function openNotes(applicationId: string) {
    setError(null);
    try {
      const notes = await listNotes(applicationId);
      setNotesApplicationId(applicationId);
      setApplicationNotes(notes);
      setNoteDraft("");
      setEditingNoteId(null);
      setEditingNoteContent("");
    } catch {
      setError("Could not load notes.");
    }
  }

  async function handleAddNote(e: FormEvent) {
    e.preventDefault();
    if (!notesApplicationId || !noteDraft.trim()) {
      return;
    }

    setError(null);
    try {
      await createNote(notesApplicationId, noteDraft);
      const notes = await listNotes(notesApplicationId);
      setApplicationNotes(notes);
      setNoteDraft("");
    } catch {
      setError("Could not add note.");
    }
  }

  async function handleSaveNote(noteId: string) {
    if (!notesApplicationId || !editingNoteContent.trim()) {
      return;
    }

    setError(null);
    try {
      await updateNote(notesApplicationId, noteId, editingNoteContent);
      const notes = await listNotes(notesApplicationId);
      setApplicationNotes(notes);
      setEditingNoteId(null);
      setEditingNoteContent("");
    } catch {
      setError("Could not update note.");
    }
  }

  async function handleDeleteNote(noteId: string) {
    if (!notesApplicationId) {
      return;
    }

    setError(null);
    try {
      await deleteNote(notesApplicationId, noteId);
      const notes = await listNotes(notesApplicationId);
      setApplicationNotes(notes);
    } catch {
      setError("Could not delete note.");
    }
  }

  function handleLogout() {
    setToken(null);
    setTokenState(null);
    setUser(null);
    setApplications([]);
    setNotesApplicationId(null);
    setApplicationNotes([]);
  }

  if (!token || !user) {
    if (!showAuth) {
      return (
        <main className="container marketing-shell">
          <header className="hero-nav">
            <Logo />
            <div className="hero-nav-actions">
              <button
                className="secondary"
                onClick={() => {
                  setMode("login");
                  setShowAuth(true);
                }}
              >
                Log in
              </button>
              <button
                onClick={() => {
                  setMode("register");
                  setShowAuth(true);
                }}
              >
                Start free
              </button>
            </div>
          </header>

          <section className="hero">
            <p className="hero-kicker">Built for focused job hunts</p>
            <h1 className="hero-title">Turn application chaos into calm momentum.</h1>
            <p className="hero-subtitle">
              CareerFlow keeps every role, stage, and note in one elegant command center so you can
              spend less time tracking and more time landing interviews.
            </p>
            <div className="hero-cta-row">
              <button
                className="hero-cta-primary"
                onClick={() => {
                  setMode("register");
                  setShowAuth(true);
                }}
              >
                Create your workspace
              </button>
              <button
                className="hero-cta-secondary"
                onClick={() => {
                  setMode("login");
                  setShowAuth(true);
                }}
              >
                I already have an account
              </button>
            </div>
          </section>

          <section className="hero-highlights">
            <article className="hero-highlight-card">
              <h3>Pipeline clarity</h3>
              <p>See every stage at a glance, from Draft to Offer, without juggling spreadsheets.</p>
            </article>
            <article className="hero-highlight-card">
              <h3>Actionable notes</h3>
              <p>Capture interview feedback, recruiter details, and next steps where they belong.</p>
            </article>
            <article className="hero-highlight-card">
              <h3>Fast decisions</h3>
              <p>Filter and edit instantly so your application strategy stays sharp and intentional.</p>
            </article>
          </section>
          <p className="credit-line">Built by Romina Pouya</p>
        </main>
      );
    }

    return (
      <main className="container narrow">
        <button className="secondary" onClick={() => setShowAuth(false)}>
          Back to home
        </button>
        <h1 className="title-logo">
          <Logo />
        </h1>
        <p>Track every application with a clear, structured pipeline.</p>

        <div className="toggle-row">
          <button className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>Register</button>
          <button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>Login</button>
        </div>

        <form onSubmit={handleAuthSubmit} className="card form-grid">
          {mode === "register" && (
            <>
              <label>
                First name
                <input
                  value={authForm.firstName}
                  onChange={(e) => setAuthForm((prev) => ({ ...prev, firstName: e.target.value }))}
                  required
                />
              </label>
              <label>
                Last name
                <input
                  value={authForm.lastName}
                  onChange={(e) => setAuthForm((prev) => ({ ...prev, lastName: e.target.value }))}
                  required
                />
              </label>
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
            </>
          )}

          {mode === "login" && (
            <>
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
            </>
          )}

          <button type="submit">{mode === "register" ? "Create account" : "Sign in"}</button>
        </form>

        {error && <p className="error">{error}</p>}
        <p className="credit-line">Built by Romina Pouya</p>
      </main>
    );
  }

  return (
    <main className="container">
      <header className="header-row">
        <div>
          <h1 className="title-logo">
            <Logo />
          </h1>
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
          <label className="span-two">
            Resume link (optional)
            <input
              type="url"
              placeholder="https://drive.google.com/..."
              value={createForm.resumeUrl}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, resumeUrl: e.target.value }))}
            />
          </label>
          <label className="span-two">
            Cover letter link (optional)
            <input
              type="url"
              placeholder="https://drive.google.com/..."
              value={createForm.coverUrl}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, coverUrl: e.target.value }))}
            />
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
                <th>Files</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => {
                const isEditing = editingApplicationId === app.id;
                return (
                  <Fragment key={app.id}>
                    <tr key={app.id}>
                      <td>
                        {isEditing ? (
                          <input
                            value={editForm.company}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, company: e.target.value }))}
                          />
                        ) : (
                          app.company
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            value={editForm.role}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, role: e.target.value }))}
                          />
                        ) : (
                          app.role
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <select
                            value={editForm.status}
                            onChange={(e) =>
                              setEditForm((prev) => ({ ...prev, status: e.target.value as ApplicationStatus }))
                            }
                          >
                            {APPLICATION_STATUSES.map((status) => (
                              <option key={status}>{status}</option>
                            ))}
                          </select>
                        ) : (
                          app.status
                        )}
                      </td>
                      <td>{new Date(app.appliedDate).toLocaleDateString()}</td>
                      <td>
                        <div className="file-links">
                          {app.resumeUrl ? (
                            <a href={app.resumeUrl} target="_blank" rel="noreferrer">Resume</a>
                          ) : (
                            <span className="muted">—</span>
                          )}
                          {app.coverUrl ? (
                            <a href={app.coverUrl} target="_blank" rel="noreferrer">Cover</a>
                          ) : (
                            <span className="muted">—</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="row-actions">
                          {isEditing ? (
                            <>
                              <button onClick={() => void saveEditedApplication(app.id)}>Save</button>
                              <button className="secondary" onClick={() => setEditingApplicationId(null)}>Cancel</button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => startEditingApplication(app)}>Edit</button>
                              <button className="secondary" onClick={() => void handleDeleteApplication(app.id)}>Delete</button>
                              <button className="secondary" onClick={() => void openNotes(app.id)}>Notes</button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                    {isEditing && (
                      <tr className="edit-row">
                        <td colSpan={6}>
                          <div className="edit-attachments">
                            <label>
                              Resume link
                              <input
                                type="url"
                                placeholder="https://drive.google.com/..."
                                value={editForm.resumeUrl}
                                onChange={(e) => setEditForm((prev) => ({ ...prev, resumeUrl: e.target.value }))}
                              />
                            </label>
                            <label>
                              Cover letter link
                              <input
                                type="url"
                                placeholder="https://drive.google.com/..."
                                value={editForm.coverUrl}
                                onChange={(e) => setEditForm((prev) => ({ ...prev, coverUrl: e.target.value }))}
                              />
                            </label>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
              {applications.length === 0 && (
                <tr>
                  <td colSpan={6}>No applications yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {notesApplicationId && (
        <section className="card">
          <h2>Notes</h2>
          <form onSubmit={handleAddNote} className="note-form">
            <textarea
              placeholder="Add a note"
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
            />
            <button type="submit">Add note</button>
          </form>
          <div className="notes-list">
            {applicationNotes.map((note) => (
              <article key={note.id} className="note-item">
                {editingNoteId === note.id ? (
                  <>
                    <textarea
                      value={editingNoteContent}
                      onChange={(e) => setEditingNoteContent(e.target.value)}
                    />
                    <div className="row-actions">
                      <button onClick={() => void handleSaveNote(note.id)}>Save</button>
                      <button className="secondary" onClick={() => setEditingNoteId(null)}>Cancel</button>
                    </div>
                  </>
                ) : (
                  <>
                    <p>{note.content}</p>
                    <small>{new Date(note.createdAt).toLocaleString()}</small>
                    <div className="row-actions">
                      <button
                        className="secondary"
                        onClick={() => {
                          setEditingNoteId(note.id);
                          setEditingNoteContent(note.content);
                        }}
                      >
                        Edit
                      </button>
                      <button className="secondary" onClick={() => void handleDeleteNote(note.id)}>Delete</button>
                    </div>
                  </>
                )}
              </article>
            ))}
            {applicationNotes.length === 0 && <p>No notes yet.</p>}
          </div>
        </section>
      )}

      {error && <p className="error">{error}</p>}
      <p className="credit-line">Built by Romina Pouya</p>
    </main>
  );
}

export default App;
