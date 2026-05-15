import { Link } from "react-router-dom";
import type { BlogPost } from "../data/blogs";
import styles from "./BlogCard.module.css";

interface BlogCardProps {
  post: BlogPost;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function BlogCard({ post }: BlogCardProps) {
  return (
    <article className={styles.card}>
      <time className={styles.date} dateTime={post.date}>
        {formatDate(post.date)}
      </time>
      <h3 className={styles.title}>
        <Link to={`/blog/${post.slug}`}>{post.title}</Link>
      </h3>
      <p className={styles.excerpt}>{post.excerpt}</p>
      <Link to={`/blog/${post.slug}`} className={styles.readMore}>
        Read article →
      </Link>
    </article>
  );
}
