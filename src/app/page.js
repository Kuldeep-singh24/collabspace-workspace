"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

const CollaborativeEditor = dynamic(() => import("@/components/Editor"), {
  ssr: false,
  loading: () => (
    <div style={{ padding: "30px", color: "#a2aec4" }}>
      Connecting live WebSocket session...
    </div>
  ),
});

export default function HomePage() {
  const [documents, setDocuments] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [loading, setLoading] = useState(true);

  const [role, setRole] = useState("ADMIN");
  const [snapshots, setSnapshots] = useState([]);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");

  useEffect(() => {
    fetchPages();
  }, []);

  useEffect(() => {
    if (activeId) {
      fetchSnapshots(activeId);
      fetchComments(activeId);
    }
  }, [activeId]);

  async function fetchPages() {
    try {
      const res = await fetch("/api/pages");
      if (!res.ok) return setDocuments([]);
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json"))
        return setDocuments([]);
      const data = await res.json();
      if (Array.isArray(data)) {
        setDocuments(data);
        if (data.length > 0 && !activeId) {
          setActiveId(data[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load pages:", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchSnapshots(id) {
    try {
      const res = await fetch(`/api/pages/${id}/versions`);
      if (res.ok) {
        const data = await res.json();
        setSnapshots(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to load snapshots:", err);
    }
  }

  async function saveSnapshot() {
    if (!activeId || !activeDocument) return;
    try {
      const res = await fetch(`/api/pages/${activeId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content:
            activeDocument.content ||
            `Snapshot of "${activeDocument.title}" saved by Kuldeep`,
        }),
      });
      if (res.ok) {
        fetchSnapshots(activeId);
      }
    } catch (err) {
      console.error("Failed to save snapshot:", err);
    }
  }

  async function fetchComments(id) {
    try {
      const res = await fetch(`/api/pages/${id}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to load comments:", err);
    }
  }

  async function addComment(e) {
    e.preventDefault();
    if (!activeId || !commentText.trim()) return;
    try {
      const res = await fetch(`/api/pages/${activeId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: commentText.trim() }),
      });
      if (res.ok) {
        setCommentText("");
        fetchComments(activeId);
      }
    } catch (err) {
      console.error("Failed to post comment:", err);
    }
  }

  const activeDocument = documents.find((doc) => doc.id === activeId);

  async function createDocument() {
    try {
      const res = await fetch("/api/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Untitled Document" }),
      });
      const newDoc = await res.json();
      if (newDoc && newDoc.id) {
        setDocuments((prev) => [newDoc, ...prev]);
        setActiveId(newDoc.id);
      }
    } catch (err) {
      console.error("Failed to create page:", err);
    }
  }

  async function deleteDocument(id, event) {
    event.stopPropagation();
    try {
      await fetch(`/api/pages/${id}`, { method: "DELETE" });
      setDocuments((prev) => {
        const filtered = prev.filter((doc) => doc.id !== id);
        if (activeId === id && filtered.length > 0) {
          setActiveId(filtered[0].id);
        } else if (filtered.length === 0) {
          setActiveId(null);
        }
        return filtered;
      });
    } catch (err) {
      console.error("Failed to delete page:", err);
    }
  }

  async function updateTitle(value) {
    if (!activeId) return;
    setDocuments((prev) =>
      prev.map((doc) => (doc.id === activeId ? { ...doc, title: value } : doc))
    );
    try {
      await fetch(`/api/pages/${activeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: value }),
      });
    } catch (err) {
      console.error("Failed to update title:", err);
    }
  }

  return (
    <main className="workspace-app">
      <header className="workspace-topbar">
        <a className="workspace-brand" href="/">
          <span className="brand-icon">C</span>
          <span>CollabSpace</span>
        </a>

        <div className="topbar-right">
          <span className="connection-indicator" />
          <span>WebSocket & Yjs Active</span>
          <div className="user-avatar" title="Kuldeep (Admin)">
            K
          </div>
        </div>
      </header>

      <div className="workspace-layout">
        <aside className="sidebar">
          <div className="workspace-selector">
            <span className="workspace-symbol">W</span>

            <div className="workspace-selector-text">
              <span className="sidebar-label">WORKSPACE</span>
              <strong>My Workspace</strong>
            </div>

            <span className="selector-arrow">⌄</span>
          </div>

          <div className="sidebar-section-heading">
            <span>YOUR PAGES</span>

            <button
              className="icon-button"
              onClick={createDocument}
              aria-label="Create a new page"
              title="Create a new page"
            >
              +
            </button>
          </div>

          <div className="document-list">
            {loading ? (
              <div style={{ padding: "10px", color: "#a2aec4" }}>
                Loading...
              </div>
            ) : documents.length === 0 ? (
              <div style={{ padding: "10px", color: "#a2aec4" }}>
                No pages yet
              </div>
            ) : (
              documents.map((document) => (
                <div
                  key={document.id}
                  className={
                    "document-item-wrapper" +
                    (document.id === activeId ? " active" : "")
                  }
                  onClick={() => setActiveId(document.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                  }}
                >
                  <button
                    className="document-item"
                    style={{ flex: 1, textAlign: "left" }}
                  >
                    <span className="document-icon">▤</span>
                    <span className="document-title">
                      {document.title || "Untitled Document"}
                    </span>
                  </button>

                  <button
                    className="delete-doc-btn"
                    onClick={(e) => deleteDocument(document.id, e)}
                    title="Delete page"
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#ff6b6b",
                      cursor: "pointer",
                      padding: "0 8px",
                      fontSize: "14px",
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>

          <button className="new-page-button" onClick={createDocument}>
            <span>+</span> New page
          </button>

          <div className="sidebar-bottom">
            <span className="online-dot" />
            Yjs CRDT Real-time Engine
          </div>
        </aside>

        <section className="editor-area">
          {activeDocument ? (
            <>
              <div
                className="breadcrumbs"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  My Workspace <span>/</span>{" "}
                  {activeDocument.title || "Untitled Document"}
                </div>

                {/* Role-Based Access Permissions Selector */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "12px", color: "#a2aec4" }}>
                    Access Role:
                  </span>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    style={{
                      background: "#131c31",
                      color: "#fff",
                      border: "1px solid #2b3856",
                      borderRadius: "6px",
                      padding: "4px 10px",
                      fontSize: "12px",
                    }}
                  >
                    <option value="ADMIN">ADMIN (Full Access)</option>
                    <option value="EDITOR">EDITOR (Can Edit)</option>
                    <option value="COMMENTER">COMMENTER (Comment Only)</option>
                    <option value="VIEWER">VIEWER (Read Only)</option>
                  </select>
                </div>
              </div>

              <div className="editor-content">
                <div
                  className="document-status"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span>▤ LIVE COLLABORATIVE DOCUMENT</span>
                  <span style={{ fontSize: "12px", color: "#8b7cff" }}>
                    ● Synced with PostgreSQL & Redis
                  </span>
                </div>

                <input
                  className="document-title-input"
                  value={activeDocument.title || ""}
                  onChange={(event) => updateTitle(event.target.value)}
                  placeholder="Untitled Document"
                  aria-label="Document title"
                  disabled={role === "VIEWER" || role === "COMMENTER"}
                />

                <CollaborativeEditor
                  key={activeDocument.id}
                  docId={activeDocument.id}
                  username="Kuldeep"
                  userColor="#8b7cff"
                />

                {/* Version History & Comments Panels */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "16px",
                    marginTop: "24px",
                  }}
                >
                  {/* Version History Snapshots */}
                  <div
                    style={{
                      background: "#0d1425",
                      border: "1px solid #1e2942",
                      borderRadius: "10px",
                      padding: "16px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "12px",
                      }}
                    >
                      <strong style={{ fontSize: "14px" }}>
                        Version History ({snapshots.length})
                      </strong>
                      <button
                        type="button"
                        onClick={saveSnapshot}
                        style={{
                          background: "#5b4df7",
                          color: "#fff",
                          border: "none",
                          borderRadius: "6px",
                          padding: "6px 12px",
                          fontSize: "12px",
                          cursor: "pointer",
                        }}
                      >
                        + Save Snapshot
                      </button>
                    </div>

                    {snapshots.length === 0 ? (
                      <p style={{ fontSize: "12px", color: "#a2aec4" }}>
                        No snapshots saved yet. Click "+ Save Snapshot" to
                        record a version.
                      </p>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {snapshots.map((snap, idx) => (
                          <div
                            key={snap.id}
                            style={{
                              background: "#131c31",
                              padding: "8px 10px",
                              borderRadius: "6px",
                              fontSize: "12px",
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <span>Version #{snapshots.length - idx}</span>
                            <span style={{ color: "#a2aec4" }}>
                              {new Date(snap.createdAt).toLocaleTimeString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Document Comments */}
                  <div
                    style={{
                      background: "#0d1425",
                      border: "1px solid #1e2942",
                      borderRadius: "10px",
                      padding: "16px",
                    }}
                  >
                    <strong style={{ display: "block", fontSize: "14px", marginBottom: "12px" }}>
                      Comments ({comments.length})
                    </strong>

                    <form
                      onSubmit={addComment}
                      style={{ display: "flex", gap: "8px", marginBottom: "12px" }}
                    >
                      <input
                        type="text"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Write a review comment..."
                        disabled={role === "VIEWER"}
                        style={{
                          flex: 1,
                          background: "#131c31",
                          border: "1px solid #2b3856",
                          borderRadius: "6px",
                          padding: "6px 10px",
                          color: "#fff",
                          fontSize: "12px",
                        }}
                      />
                      <button
                        type="submit"
                        disabled={role === "VIEWER"}
                        style={{
                          background: "#262344",
                          color: "#fff",
                          border: "1px solid #39365f",
                          borderRadius: "6px",
                          padding: "6px 12px",
                          fontSize: "12px",
                          cursor: "pointer",
                        }}
                      >
                        Post
                      </button>
                    </form>

                    {comments.length === 0 ? (
                      <p style={{ fontSize: "12px", color: "#a2aec4" }}>
                        No comments on this document yet.
                      </p>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {comments.map((c) => (
                          <div
                            key={c.id}
                            style={{
                              background: "#131c31",
                              padding: "8px 10px",
                              borderRadius: "6px",
                              fontSize: "12px",
                            }}
                          >
                            <div style={{ color: "#8b7cff", fontWeight: "600" }}>
                              {c.author?.name || "Kuldeep"}
                            </div>
                            <div style={{ marginTop: "2px" }}>{c.content}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <h2>No document selected</h2>
              <p>Create a page to start writing with real-time collaboration.</p>

              <button className="new-page-button" onClick={createDocument}>
                + Create page
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}