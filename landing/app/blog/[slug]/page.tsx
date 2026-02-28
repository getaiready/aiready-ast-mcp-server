import { getPostBySlug, getAllPosts } from '@/lib/blog-tsx';
import { notFound } from 'next/navigation';
import { BlogPostClient } from '@/components/BlogPostClient';
import type { Metadata } from 'next';
import Script from 'next/script';
import { generateArticleSchema } from '@/lib/seo';

interface Params {
  params: { slug: string };
}

const imageMap: Record<string, string> = {
  'ai-code-debt-tsunami': '/series-1-the-ai-code-debt-tsunami.png',
  'invisible-codebase': '/series-2-invisible-to-ai.png',
  'metrics-that-actually-matter': '/series-3-metrics-that-matters.png',
  'semantic-duplicate-detection': '/series-4-semantic-duplicate-detection.png',
  'hidden-cost-import-chains': '/series-5-hidden-cost-import-chains.png',
  'visualizing-invisible': '/series-6-visualise-invisible-debt.png',
  'future-human-friendly-code': '/part-7-future-human-friendly-code.png',
};

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const resolvedParams = await params;
  const { slug } = resolvedParams;
  const post = await getPostBySlug(slug);

  if (!post) {
    return {
      title: 'Post Not Found',
    };
  }

  const ogImage = imageMap[slug] || '/logo-text.png';
  const fullImageUrl = `https://getaiready.dev${ogImage}`;
  const canonicalUrl = `https://getaiready.dev/blog/${slug}`;

  return {
    title: post.title,
    description: post.excerpt,
    authors: [{ name: post.author }],
    keywords: post.tags,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: canonicalUrl,
      siteName: 'AIReady',
      images: [
        {
          url: fullImageUrl,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
      locale: 'en_US',
      type: 'article',
      publishedTime: post.date,
      authors: [post.author],
      tags: post.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: [fullImageUrl],
      creator: '@aireadytools',
    },
    alternates: {
      canonical: canonicalUrl,
    },
    other: {
      'article:published_time': post.date,
      'article:author': post.author,
      'article:tag': post.tags.join(', '),
    },
  };
}

export default async function Page({ params }: Params) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;
  const post = await getPostBySlug(slug);

  if (!post) {
    return notFound();
  }

  // Render the post content on the server and pass it into the client component
  // as a ReactNode to avoid passing component functions to client components.
  const content = <post.Content />;

  // Only pass serializable post metadata to the client component —
  // omit the Content function to avoid sending functions to client.
  const postMeta = {
    title: post.title,
    date: post.date,
    author: post.author,
    excerpt: post.excerpt,
    readingTime: post.readingTime,
    tags: post.tags,
    slug: post.slug,
  };

  const ogImage = imageMap[slug] || '/logo-text.png';
  const articleSchema = generateArticleSchema({
    title: post.title,
    description: post.excerpt,
    datePublished: post.date,
    author: post.author,
    image: `https://getaiready.dev${ogImage}`,
  });

  return (
    <>
      <Script
        id="article-schema"
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950">
        <BlogPostClient post={postMeta} content={content} />
      </div>
    </>
  );
}

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((p) => ({ slug: p.slug }));
}
