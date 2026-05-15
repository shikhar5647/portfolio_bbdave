import BlogCard from "../components/BlogCard";
import { blogs } from "../data/blogs";
import styles from "./BlogPage.module.css";

export default function BlogPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className="container">
          <p className="section__label">Writing</p>
          <h1 className={styles.title}>The World Today</h1>
          <p className={styles.subtitle}>
            Analysis without noise — essays on geopolitics, economics, and public policy.
          </p>
        </div>
      </header>
      <section className="section">
        <div className={`container ${styles.grid}`}>
          {blogs.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
      </section>
    </div>
  );
}
