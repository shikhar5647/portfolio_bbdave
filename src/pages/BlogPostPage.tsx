import { Link, useParams } from "react-router-dom";
import { getBlogBySlug } from "../data/blogs";
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
  const post = slug ? getBlogBySlug(slug) : undefined;

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
        <footer className={styles.footer}>
          <p>
            Originally published on{" "}
            <a href={post.sourceUrl} target="_blank" rel="noopener noreferrer">
              WordPress
            </a>
          </p>
        </footer>
      </div>
    </article>
  );
}
