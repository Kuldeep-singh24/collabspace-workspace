
"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCaret from "@tiptap/extension-collaboration-caret";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { useEffect, useState, useMemo, useRef } from "react";

export default function CollaborativeEditor({
  docId,
  username,
  userColor,
}) {
  const ydoc = useMemo(() => new Y.Doc(), [docId]);
  const [provider, setProvider] = useState(null);

  useEffect(() => {
    if (!docId) return;

    const wsProvider = new WebsocketProvider(
      "ws://127.0.0.1:1234",
      `doc-${docId}`,
      ydoc
    );

    wsProvider.awareness.setLocalStateField("user", {
      name: username || "User",
      color: userColor || "#8b7cff",
    });

    setProvider(wsProvider);

    return () => {
      setProvider(null);
      wsProvider.destroy();
      ydoc.destroy();
    };
  }, [docId, ydoc, username, userColor]);

  if (!provider) {
    return (
      <div style={{ padding: "30px", color: "#a2aec4" }}>
        Connecting live WebSocket session...
      </div>
    );
  }

  return (
    <ActiveEditor
      key={docId}
      docId={docId}
      ydoc={ydoc}
      provider={provider}
      username={username}
      userColor={userColor}
    />
  );
}

function ActiveEditor({
  docId,
  ydoc,
  provider,
  username,
  userColor,
}) {
  const saveTimeoutRef = useRef(null);

  const [activeUsers, setActiveUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  // Track active users and WebSocket connection
  useEffect(() => {
    if (!provider) return;

    const updateUsers = () => {
      const states = Array.from(
        provider.awareness.getStates().values()
      );

      const users = states
        .map((state) => state.user)
        .filter(Boolean);

      setActiveUsers(users);
    };

    const handleStatus = (event) => {
      setIsConnected(event.status === "connected");
    };

    provider.on("status", handleStatus);
    provider.awareness.on("change", updateUsers);

    updateUsers();
    setIsConnected(provider.wsconnected);

    return () => {
      provider.off("status", handleStatus);
      provider.awareness.off("change", updateUsers);
    };
  }, [provider]);

  // Initialize TipTap editor
  const editor = useEditor({
    immediatelyRender: false,

    extensions: [
      StarterKit.configure({
        history: false,
      }),

      Collaboration.configure({
        document: ydoc,
      }),

      CollaborationCaret.configure({
        provider: provider,
        user: {
          name: username || "User",
          color: userColor || "#8b7cff",
        },
      }),
    ],

    onUpdate: ({ editor }) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(async () => {
        const jsonContent = JSON.stringify(editor.getJSON());

        try {
          const response = await fetch(`/api/pages/${docId}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              content: jsonContent,
            }),
          });

          if (!response.ok) {
            throw new Error("Failed to save document");
          }

          console.log("Document auto-saved to PostgreSQL");
        } catch (err) {
          console.error("Save error:", err);
        }
      }, 1500);
    },
  });

  // Clean up pending autosave
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Export editor content as Markdown
  const exportAsMarkdown = () => {
    if (!editor) return;

    const text = editor.getText();

    const blob = new Blob([text], {
      type: "text/markdown",
    });

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `document-${docId}.md`;

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
  };

  if (!editor) {
    return (
      <div style={{ padding: "30px", color: "#a2aec4" }}>
        Initializing TipTap editor...
      </div>
    );
  }

  return (
    <div className="tiptap-editor-wrapper">

      {/* Presence and Connection Status Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px",
          borderBottom: "1px solid var(--border)",
          background: "#0d1425",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "12px",
            color: "var(--muted)",
          }}
        >
          <span
            className="online-dot"
            style={{
              backgroundColor: isConnected
                ? "#4bd6a0"
                : "#ff4d4d",

              boxShadow: isConnected
                ? "0 0 6px #4bd6a0"
                : "none",
            }}
          />

          {isConnected
            ? "WebSocket & Yjs Active"
            : "Disconnected"}
        </div>

        {/* Active User Avatars */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
          }}
        >
          {activeUsers.map((user, i) => (
            <div
              key={i}
              className="user-avatar"
              style={{
                backgroundColor: user.color || "#8b7cff",
                marginLeft: i > 0 ? "-8px" : "0",
                border: "2px solid #0d1425",
                fontSize: "13px",
              }}
              title={user.name}
            >
              {user.name
                ? user.name.charAt(0).toUpperCase()
                : "U"}
            </div>
          ))}
        </div>
      </div>

      {/* Editor Toolbar */}
      <div
        className="editor-toolbar"
        style={{
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "8px",
          }}
        >
          {/* Bold */}
          <button
            type="button"
            className={
              editor.isActive("bold") ? "is-active" : ""
            }
            onClick={() =>
              editor.chain().focus().toggleBold().run()
            }
          >
            Bold
          </button>

          {/* Italic */}
          <button
            type="button"
            className={
              editor.isActive("italic") ? "is-active" : ""
            }
            onClick={() =>
              editor.chain().focus().toggleItalic().run()
            }
          >
            Italic
          </button>

          {/* Heading */}
          <button
            type="button"
            className={
              editor.isActive("heading", { level: 1 })
                ? "is-active"
                : ""
            }
            onClick={() =>
              editor
                .chain()
                .focus()
                .toggleHeading({ level: 1 })
                .run()
            }
          >
            H1
          </button>

          {/* Bullet List */}
          <button
            type="button"
            className={
              editor.isActive("bulletList")
                ? "is-active"
                : ""
            }
            onClick={() =>
              editor.chain().focus().toggleBulletList().run()
            }
          >
            Bullet List
          </button>
        </div>

        {/* Export Markdown */}
        <button
          type="button"
          onClick={exportAsMarkdown}
          style={{
            background: "#262344",
            borderColor: "#39365f",
          }}
        >
          Export .md
        </button>
      </div>

      {/* TipTap Editor */}
      <EditorContent
        editor={editor}
        className="tiptap-editor-body"
      />

    </div>
  );
}
