export class UpdateViewModel {
  authorId: string;
  newsId: string;
  view: number;
  constructor(authorId: string, newsId: string, view: number) {
    this.authorId = authorId
    this.newsId = newsId
    this.view = view
  }
}
