import { useState, useEffect } from "react";
import BlogCard from "../components/BlogCard";
import { blogs as staticBlogs, type BlogPost } from "../data/blogs";
import styles from "./BlogPage.module.css";

export default function BlogPage() {
  const [dynamicBlogs, setDynamicBlogs] = useState<BlogPost[]>([]);

  useEffect(() => {
    fetch("/api/blogs")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setDynamicBlogs(data))
      .catch(() => {});
  }, []);

  const allBlogs = [...staticBlogs, ...dynamicBlogs];
  allBlogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

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
          {allBlogs.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
      </section>
    </div>
  );
}
