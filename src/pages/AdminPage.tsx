import { useState, useEffect, useRef, useCallback } from "react";
import type { ResearchPaper } from "../data/researchPapers";
import type { BlogPost } from "../data/blogs";
import styles from "./AdminPage.module.css";

type Tab = "papers" | "blogs";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("papers");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const clearMessages = () => { setError(""); setSuccess(""); };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthenticated(true);
    setError("");
  };

  if (!authenticated) {
    return (
      <section className="section">
        <div className="container">
          <div className={styles.loginBox}>
            <h1 className={styles.loginTitle}>Admin Access</h1>
            <p className={styles.loginHint}>Enter the admin password to manage content.</p>
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
          <h1 className={styles.pageTitle}>Content Manager</h1>
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${activeTab === "papers" ? styles.tabActive : ""}`}
              onClick={() => { setActiveTab("papers"); clearMessages(); }}
            >
              Research Papers
            </button>
            <button
              className={`${styles.tab} ${activeTab === "blogs" ? styles.tabActive : ""}`}
              onClick={() => { setActiveTab("blogs"); clearMessages(); }}
            >
              Blog Posts
            </button>
          </div>
        </div>
      </header>

      <section className="section">
        <div className="container">
          {error && <div className={styles.alert + " " + styles.alertError}>{error}</div>}
          {success && <div className={styles.alert + " " + styles.alertSuccess}>{success}</div>}

          {activeTab === "papers" ? (
            <PapersManager
              password={password}
              setError={setError}
              setSuccess={setSuccess}
              setAuthenticated={setAuthenticated}
            />
          ) : (
            <BlogsManager
              password={password}
              setError={setError}
              setSuccess={setSuccess}
              setAuthenticated={setAuthenticated}
            />
          )}
        </div>
      </section>
    </>
  );
}

/* ───── Papers Manager ───── */

interface ManagerProps {
  password: string;
  setError: (msg: string) => void;
  setSuccess: (msg: string) => void;
  setAuthenticated: (v: boolean) => void;
}

function PapersManager({ password, setError, setSuccess, setAuthenticated }: ManagerProps) {
  const [papers, setPapers] = useState<ResearchPaper[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
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
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPapers(); }, [fetchPapers]);

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file?.type === "application/pdf") {
      setPdfFile(file);
      setError("");
    } else {
      setError("Please drop a PDF file");
    }
  }, [setError]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPdfFile(file);
      setError("");
    }
  };

  const resetForm = () => {
    setTitle(""); setJournal(""); setYear(new Date().getFullYear());
    setAbstract(""); setDoi(""); setTags(""); setPdfFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError("Title is required"); return; }
    if (!pdfFile) { setError("Please select a PDF file to upload"); return; }
    setError(""); setSuccess(""); setUploading(true);

    try {
      const id = `paper-${Date.now()}`;

      const uploadRes = await fetch("/api/upload-pdf", {
        method: "POST",
        headers: {
          "x-admin-password": password,
          "x-filename": `${id}.pdf`,
        },
        body: pdfFile,
      });
      if (uploadRes.status === 401) { setError("Invalid password."); setAuthenticated(false); return; }
      const uploadData = await uploadRes.json().catch(() => null);
      if (!uploadRes.ok) { throw new Error(uploadData?.error || "PDF upload failed"); }

      const metadata = {
        id,
        title: title.trim(),
        authors: authors.split(",").map((a) => a.trim()).filter(Boolean),
        journal: journal.trim() || undefined,
        year,
        abstract: abstract.trim() || undefined,
        doi: doi.trim() || undefined,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        pdfUrl: uploadData.url,
      };

      const res = await fetch("/api/papers", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-password": password },
        body: JSON.stringify(metadata),
      });
      if (res.status === 401) { setError("Invalid password."); setAuthenticated(false); return; }
      const data = await res.json().catch(() => null);
      if (!res.ok) { throw new Error(data?.error || `Save failed (status ${res.status})`); }
      setSuccess(`"${data.title}" uploaded successfully! PDF saved.`);

      resetForm();
      fetchPapers();
    } catch (err: any) {
      setError(err.message || "Upload failed — please try again");
    } finally { setUploading(false); }
  };

  const handleDelete = async (id: string, paperTitle: string) => {
    if (!confirm(`Delete "${paperTitle}"?`)) return;
    try {
      const res = await fetch(`/api/papers?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { "x-admin-password": password },
      });
      if (res.status === 401) { setError("Invalid password"); setAuthenticated(false); return; }
      if (res.ok) { setSuccess(`Deleted "${paperTitle}"`); fetchPapers(); }
    } catch { setError("Delete failed"); }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className={styles.form}>
        <h2 className={styles.formTitle}>Upload Research Paper</h2>
        <p className={styles.formHint}>Upload a PDF and fill in the paper details. Title and PDF are required.</p>

        <div
          className={`${styles.dropZone} ${dragOver ? styles.dropZoneActive : ""} ${pdfFile ? styles.dropZoneHasFile : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleFileDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleFileSelect} className={styles.fileInput} />
          {pdfFile ? (
            <div className={styles.fileInfo}>
              <span className={styles.fileIcon}>PDF</span>
              <div className={styles.fileDetails}>
                <span className={styles.fileName}>{pdfFile.name}</span>
                <span className={styles.fileSize}>{(pdfFile.size / 1024 / 1024).toFixed(1)} MB</span>
              </div>
              <button type="button" className={styles.removeFile} onClick={(e) => { e.stopPropagation(); setPdfFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}>Remove</button>
            </div>
          ) : (
            <div className={styles.dropPrompt}>
              <span className={styles.dropIcon}>+</span>
              <span className={styles.dropLabel}>Drop PDF here or click to browse</span>
              <span className={styles.dropHint}>PDF files only</span>
            </div>
          )}
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label}>Paper Title <span className={styles.required}>*</span></label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={styles.input} placeholder="Full title of the research paper" required />
        </div>

        <div className={styles.fieldRow}>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Authors</label>
            <input type="text" value={authors} onChange={(e) => setAuthors(e.target.value)} className={styles.input} placeholder="Comma-separated names" />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Year</label>
            <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} className={styles.input} min={1950} max={2030} />
          </div>
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label}>Journal / Conference</label>
          <input type="text" value={journal} onChange={(e) => setJournal(e.target.value)} className={styles.input} placeholder="Name of journal or conference" />
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label}>Abstract</label>
          <textarea value={abstract} onChange={(e) => setAbstract(e.target.value)} className={styles.textarea} rows={3} placeholder="Brief abstract (optional)" />
        </div>

        <div className={styles.fieldRow}>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>DOI</label>
            <input type="text" value={doi} onChange={(e) => setDoi(e.target.value)} className={styles.input} placeholder="10.xxxx/xxxxx" />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Tags</label>
            <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} className={styles.input} placeholder="Comma-separated tags" />
          </div>
        </div>

        <button type="submit" className={`btn btn--primary ${styles.submitBtn}`} disabled={uploading}>
          {uploading ? "Uploading..." : "Upload Paper"}
        </button>
      </form>

      <div className={styles.paperList}>
        <h2 className={styles.formTitle}>Uploaded Papers {!loading && `(${papers.length})`}</h2>
        {loading ? (
          <p className={styles.loadingText}>Loading papers...</p>
        ) : papers.length === 0 ? (
          <p className={styles.emptyText}>No papers uploaded yet. Use the form above to add your first paper.</p>
        ) : (
          papers.map((paper) => (
            <div key={paper.id} className={styles.paperItem}>
              <div className={styles.paperInfo}>
                <strong>{paper.title}</strong>
                <span className={styles.paperMeta}>
                  {paper.year}
                  {paper.journal && ` — ${paper.journal}`}
                  {paper.pdfUrl && " — PDF attached"}
                </span>
              </div>
              <div className={styles.paperActions}>
                {paper.pdfUrl && <a href={paper.pdfUrl} target="_blank" rel="noopener noreferrer" className={styles.viewLink}>View PDF</a>}
                <button onClick={() => handleDelete(paper.id, paper.title)} className={styles.deleteBtn}>Delete</button>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}

/* ───── Blogs Manager ───── */

function BlogsManager({ password, setError, setSuccess, setAuthenticated }: ManagerProps) {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const [blogTitle, setBlogTitle] = useState("");
  const [blogDate, setBlogDate] = useState(new Date().toISOString().split("T")[0]);
  const [blogExcerpt, setBlogExcerpt] = useState("");
  const [blogContent, setBlogContent] = useState("");
  const [blogSourceUrl, setBlogSourceUrl] = useState("");

  const fetchBlogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/blogs");
      if (res.ok) setBlogs(await res.json());
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchBlogs(); }, [fetchBlogs]);

  const resetBlogForm = () => {
    setBlogTitle(""); setBlogDate(new Date().toISOString().split("T")[0]);
    setBlogExcerpt(""); setBlogContent(""); setBlogSourceUrl("");
  };

  const handleBlogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blogTitle.trim()) { setError("Title is required"); return; }
    if (!blogContent.trim()) { setError("Content is required"); return; }
    setError(""); setSuccess(""); setPublishing(true);

    let htmlContent = blogContent;
    if (!htmlContent.includes("<")) {
      htmlContent = blogContent
        .split(/\n\n+/)
        .filter((p) => p.trim())
        .map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`)
        .join("\n");
    }

    const body = {
      title: blogTitle.trim(),
      date: blogDate,
      excerpt: blogExcerpt.trim() || undefined,
      content: htmlContent,
      sourceUrl: blogSourceUrl.trim() || undefined,
    };

    try {
      const res = await fetch("/api/blogs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": password,
        },
        body: JSON.stringify(body),
      });
      if (res.status === 401) { setError("Invalid password."); setAuthenticated(false); return; }
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || "Publish failed"); }
      setSuccess(`"${blogTitle}" published successfully!`);
      resetBlogForm();
      fetchBlogs();
    } catch (err: any) {
      setError(err.message || "Publish failed");
    } finally { setPublishing(false); }
  };

  const handleBlogDelete = async (slug: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;
    try {
      const res = await fetch(`/api/blogs?slug=${encodeURIComponent(slug)}`, {
        method: "DELETE",
        headers: { "x-admin-password": password },
      });
      if (res.status === 401) { setError("Invalid password"); setAuthenticated(false); return; }
      if (res.ok) { setSuccess(`Deleted "${title}"`); fetchBlogs(); }
    } catch { setError("Delete failed"); }
  };

  return (
    <>
      <form onSubmit={handleBlogSubmit} className={styles.form}>
        <h2 className={styles.formTitle}>Write New Blog Post</h2>

        <div className={styles.fieldGroup}>
          <label className={styles.label}>Title <span className={styles.required}>*</span></label>
          <input type="text" value={blogTitle} onChange={(e) => setBlogTitle(e.target.value)} className={styles.input} placeholder="Blog post title" required />
        </div>

        <div className={styles.fieldRow}>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Date</label>
            <input type="date" value={blogDate} onChange={(e) => setBlogDate(e.target.value)} className={styles.input} />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Source URL</label>
            <input type="url" value={blogSourceUrl} onChange={(e) => setBlogSourceUrl(e.target.value)} className={styles.input} placeholder="https://..." />
          </div>
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label}>Excerpt</label>
          <textarea value={blogExcerpt} onChange={(e) => setBlogExcerpt(e.target.value)} className={styles.textarea} rows={2} placeholder="Short summary shown on the blog listing page (auto-generated from content if left blank)" />
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label}>Content <span className={styles.required}>*</span></label>
          <p className={styles.fieldHint}>Write in plain text (paragraphs separated by blank lines) or paste HTML.</p>
          <textarea value={blogContent} onChange={(e) => setBlogContent(e.target.value)} className={`${styles.textarea} ${styles.contentEditor}`} rows={14} placeholder="Write your blog post here...

Separate paragraphs with a blank line.

You can also paste HTML if you prefer." required />
        </div>

        <button type="submit" className={`btn btn--primary ${styles.submitBtn}`} disabled={publishing}>
          {publishing ? "Publishing..." : "Publish Post"}
        </button>
      </form>

      <div className={styles.paperList}>
        <h2 className={styles.formTitle}>Published Blog Posts {!loading && `(${blogs.length})`}</h2>
        {loading ? (
          <p className={styles.loadingText}>Loading posts...</p>
        ) : blogs.length === 0 ? (
          <p className={styles.emptyText}>No blog posts published from admin yet.</p>
        ) : (
          blogs.map((post) => (
            <div key={post.id} className={styles.paperItem}>
              <div className={styles.paperInfo}>
                <strong>{post.title}</strong>
                <span className={styles.paperMeta}>{post.date}</span>
              </div>
              <div className={styles.paperActions}>
                <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer" className={styles.viewLink}>View</a>
                <button onClick={() => handleBlogDelete(post.slug, post.title)} className={styles.deleteBtn}>Delete</button>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
