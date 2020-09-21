/**
 * A simplified representation of the JBlog post data
 */
export interface PostData {
  /** Post unique identifier */
  postId: number;

  /** Post date, in unix timestamp  */
  date: number;

  /** Post title */
  title: string;

  /** Post content */
  content: string;

  /** Post tags */
  tags: string[];

  /** Post slug, used in the URL */
  slug: string;
}
