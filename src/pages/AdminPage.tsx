import { useState, useEffect, useRef, useCallback } from "react";
import type { ResearchPaper } from "../data/researchPapers";
import styles from "./AdminPage.module.css";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [papers, setPapers] = useState<ResearchPaper[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const [title, setTitle] = useState("");
  const [authors, setAuthors] = useState("Dr. Brij Behari Dave");
  const [journal, setJournal] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [abstract, setAbstract] = useState("");
  const [doi, setDoi] = useState("");
  const [tags, setTags] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchPapers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/papers");
      if (res.ok) setPapers(await res.json());
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authenticated) fetchPapers();
  }, [authenticated, fetchPapers]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthenticated(true);
    setError("");
  };

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file?.type === "application/pdf") {
      setPdfFile(file);
    } else {
      setError("Please drop a PDF file");
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setPdfFile(file);
  };

  const resetForm = () => {
    setTitle("");
    setJournal("");
    setYear(new Date().getFullYear());
    setAbstract("");
    setDoi("");
    setTags("");
    setPdfFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    setError("");
    setSuccess("");
    setUploading(true);

    const metadata = {
      id: `paper-${Date.now()}`,
      title: title.trim(),
      authors: authors.split(",").map((a) => a.trim()).filter(Boolean),
      journal: journal.trim() || undefined,
      year,
      abstract: abstract.trim() || undefined,
      doi: doi.trim() || undefined,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
    };

    const formData = new FormData();
    formData.append("metadata", JSON.stringify(metadata));
    if (pdfFile) formData.append("pdf", pdfFile);

    try {
      const res = await fetch("/api/papers", {
        method: "POST",
        headers: { "x-admin-password": password },
        body: formData,
      });

      if (res.status === 401) {
        setError("Invalid password. Please check your admin password.");
        setAuthenticated(false);
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Upload failed");
      }

      setSuccess(`"${title}" uploaded successfully!`);
      resetForm();
      fetchPapers();
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string, paperTitle: string) => {
    if (!confirm(`Delete "${paperTitle}"?`)) return;

    try {
      const res = await fetch(`/api/papers?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { "x-admin-password": password },
      });
      if (res.status === 401) {
        setError("Invalid password");
        setAuthenticated(false);
        return;
      }
      if (res.ok) {
        setSuccess(`Deleted "${paperTitle}"`);
        fetchPapers();
      }
    } catch {
      setError("Delete failed");
    }
  };

  if (!authenticated) {
    return (
      <section className="section">
        <div className="container">
          <div className={styles.loginBox}>
            <h1 className={styles.loginTitle}>Admin Access</h1>
            <p className={styles.loginHint}>Enter the admin password to manage research papers.</p>
            <form onSubmit={handleLogin} className={styles.loginForm}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Admin password"
                className={styles.input}
                autoFocus
              />
              <button type="submit" className="btn btn--primary">
                Sign In
              </button>
            </form>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <header className={styles.header}>
        <div className="container">
          <p className="section__label">Admin</p>
          <h1 className={styles.pageTitle}>Manage Research Papers</h1>
        </div>
      </header>

      <section className="section">
        <div className="container">
          {error && <div className={styles.alert + " " + styles.alertError}>{error}</div>}
          {success && <div className={styles.alert + " " + styles.alertSuccess}>{success}</div>}

          <form onSubmit={handleSubmit} className={styles.form}>
            <h2 className={styles.formTitle}>Add New Paper</h2>

            <div
              className={`${styles.dropZone} ${dragOver ? styles.dropZoneActive : ""} ${pdfFile ? styles.dropZoneHasFile : ""}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className={styles.fileInput}
              />
              {pdfFile ? (
                <div className={styles.fileInfo}>
                  <span className={styles.fileIcon}>PDF</span>
                  <span className={styles.fileName}>{pdfFile.name}</span>
                  <span className={styles.fileSize}>
                    {(pdfFile.size / 1024 / 1024).toFixed(1)} MB
                  </span>
                  <button
                    type="button"
                    className={styles.removeFile}
                    onClick={(e) => {
                      e.stopPropagation();
                      setPdfFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className={styles.dropPrompt}>
                  <span className={styles.dropIcon}>+</span>
                  <span>Drop PDF here or click to browse</span>
                </div>
              )}
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                Title <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={styles.input}
                placeholder="Full title of the research paper"
                required
              />
            </div>

            <div className={styles.fieldRow}>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Authors</label>
                <input
                  type="text"
                  value={authors}
                  onChange={(e) => setAuthors(e.target.value)}
                  className={styles.input}
                  placeholder="Comma-separated names"
                />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Year</label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className={styles.input}
                  min={1950}
                  max={2030}
                />
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>Journal / Conference</label>
              <input
                type="text"
                value={journal}
                onChange={(e) => setJournal(e.target.value)}
                className={styles.input}
                placeholder="Name of journal or conference"
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>Abstract</label>
              <textarea
                value={abstract}
                onChange={(e) => setAbstract(e.target.value)}
                className={styles.textarea}
                rows={4}
                placeholder="Brief abstract of the paper"
              />
            </div>

            <div className={styles.fieldRow}>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>DOI</label>
                <input
                  type="text"
                  value={doi}
                  onChange={(e) => setDoi(e.target.value)}
                  className={styles.input}
                  placeholder="10.xxxx/xxxxx"
                />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Tags</label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className={styles.input}
                  placeholder="Comma-separated tags"
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn--primary"
              disabled={uploading}
            >
              {uploading ? "Uploading..." : "Upload Paper"}
            </button>
          </form>

          <div className={styles.paperList}>
            <h2 className={styles.formTitle}>
              Uploaded Papers {!loading && `(${papers.length})`}
            </h2>
            {loading ? (
              <p className={styles.loadingText}>Loading papers...</p>
            ) : papers.length === 0 ? (
              <p className={styles.emptyText}>No papers uploaded yet.</p>
            ) : (
              papers.map((paper) => (
                <div key={paper.id} className={styles.paperItem}>
                  <div className={styles.paperInfo}>
                    <strong>{paper.title}</strong>
                    <span className={styles.paperMeta}>
                      {paper.year} {paper.journal && `— ${paper.journal}`}
                    </span>
                  </div>
                  <div className={styles.paperActions}>
                    {paper.pdfUrl && (
                      <a
                        href={paper.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.viewLink}
                      >
                        View PDF
                      </a>
                    )}
                    <button
                      onClick={() => handleDelete(paper.id, paper.title)}
                      className={styles.deleteBtn}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </>
  );
}
