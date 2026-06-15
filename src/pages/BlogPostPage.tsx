import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { getBlogBySlug, type BlogPost } from "../data/blogs";
import styles from "./BlogPostPage.module.css";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const staticPost = slug ? getBlogBySlug(slug) : undefined;
  const [dynamicPost, setDynamicPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(!staticPost);

  useEffect(() => {
    if (staticPost || !slug) { setLoading(false); return; }
    fetch("/api/blogs")
      .then((res) => (res.ok ? res.json() : []))
      .then((posts: BlogPost[]) => {
        const found = posts.find((p) => p.slug === slug) || null;
        setDynamicPost(found);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug, staticPost]);

  const post = staticPost || dynamicPost;

  if (loading) {
    return (
      <div className={`container ${styles.notFound}`}>
        <p>Loading...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className={`container ${styles.notFound}`}>
        <h1>Article not found</h1>
        <Link to="/blog">← Back to blog</Link>
      </div>
    );
  }

  return (
    <article className={styles.article}>
      <header className={styles.header}>
        <div className="container">
          <Link to="/blog" className={styles.back}>
            ← All articles
          </Link>
          <time dateTime={post.date}>{formatDate(post.date)}</time>
          <h1>{post.title}</h1>
        </div>
      </header>
      <div className={`container ${styles.body}`}>
        <div
          className="blog-content"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
        {post.sourceUrl && (
          <footer className={styles.footer}>
            <p>
              Originally published on{" "}
              <a href={post.sourceUrl} target="_blank" rel="noopener noreferrer">
                WordPress
              </a>
            </p>
          </footer>
        )}
      </div>
    </article>
  );
}
