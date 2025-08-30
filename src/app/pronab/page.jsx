// app/page.js
"use client";
import Link from "next/link";
import { setPosts } from '../../../utils/postCache';


export default function Home() {
  const posts = [
    { id: "66d56ac132f4", title: "myposttitle" },
    { id: "77f89ac145f7", title: "anotherpost" },
  ];

  // cache এ save
  setPosts(posts);

  return (
    <div>
      {posts.map((post) => (
        <Link key={post.id} href={`/${post.title}`}>
          {post.title}
        </Link>
      ))}
    </div>
  );
}
