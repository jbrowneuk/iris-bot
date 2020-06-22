/**
 * A simplified representation of the JBlog post data
 */
export interface PostData {
  postId: number;
  date: number;
  title: string;
  content: string;
  tags: string[];
  slug: string;
}
