import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { NewsEntity } from './entities/news.entity'; // Adjust path
import { UserEntity } from '../user/entities/user.entity'; // Adjust path
import { CommonResponse, CreateCommentModel, CreateNewsModel, UpdateNewsModel } from '@in-one/shared-models';
import { promises as fs } from 'fs';
import { join } from 'path';
import { CommentEntity } from '../masters/common-entities/comment.entity';
import { LikeEntity } from '../masters/common-entities/like.entity';
import { GenericTransactionManager } from 'src/database/trasanction-manager';

@Injectable()
export class NewsService {
  constructor(
    @InjectRepository(NewsEntity) private readonly newsRepository: Repository<NewsEntity>,
    @InjectRepository(CommentEntity) private readonly commentRepository: Repository<CommentEntity>,
    @InjectRepository(LikeEntity) private readonly likeRepository: Repository<LikeEntity>,
    @InjectRepository(UserEntity) private readonly userRepository: Repository<UserEntity>,
    private readonly transactionManager: GenericTransactionManager,
  ) { }

  async createNews(createNewsDto: CreateNewsModel): Promise<CommonResponse> {
    await this.transactionManager.startTransaction();
    try {
      const newsRepo = this.transactionManager.getRepository(this.newsRepository);
      const userRepo = this.transactionManager.getRepository(this.userRepository);

      if (!createNewsDto.title || createNewsDto.title.trim() === '') {
        throw new Error('Title is required');
      }
      if (!createNewsDto.authorId) {
        throw new Error('Author ID is required');
      }

      // Validate authorId exists
      const author = await userRepo.findOne({ where: { id: createNewsDto.authorId } });
      if (!author) {
        throw new Error('Author not found');
      }

      let processedImages: string[] | undefined;
      if (createNewsDto.images?.length) {
        processedImages = await Promise.all(
          createNewsDto.images.map(async (base64, index) => {
            const matches = base64.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
            if (!matches) throw new Error('Invalid base64 image format');
            const ext = matches[1];
            const buffer = new Uint8Array(Buffer.from(matches[2], 'base64'));
            const fileName = `news_${Date.now()}_${index}.${ext}`;
            const filePath = join(__dirname, 'Uploads', fileName);
            await fs.writeFile(filePath, buffer);
            return `/uploads/${fileName}`;
          }),
        );
      }

      let processedThumbnail: string | undefined;
      if (createNewsDto.thumbnail) {
        const matches = createNewsDto.thumbnail.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
        if (!matches) throw new Error('Invalid base64 thumbnail format');
        const ext = matches[1];
        const buffer = new Uint8Array(Buffer.from(matches[2], 'base64'));
        const fileName = `thumbnail_${Date.now()}.${ext}`;
        const filePath = join(__dirname, 'Uploads', fileName);
        await fs.writeFile(filePath, buffer);
        processedThumbnail = `/uploads/${fileName}`;
      }

      const newNews = newsRepo.create({
        title: createNewsDto.title.trim(),
        content: createNewsDto.content ?? '',
        summary: createNewsDto.summary ?? '',
        category: createNewsDto.category ?? 'Uncategorized',
        tags: createNewsDto.tags ?? [],
        images: processedImages ?? [],
        thumbnail: processedThumbnail ?? '',
        status: createNewsDto.status ?? 'draft',
        visibility: createNewsDto.visibility ?? 'public',
        isFeatured: createNewsDto.isFeatured ?? false,
        isBreaking: createNewsDto.isBreaking ?? false,
        publishedAt: createNewsDto.publishedAt ?? new Date(),
        authorId: createNewsDto.authorId,
        commentIds: [],
      });

      const savedNews = await newsRepo.save(newNews);
      await this.transactionManager.commitTransaction();
      return new CommonResponse(true, 201, 'News created successfully', savedNews);
    } catch (error) {
      await this.transactionManager.rollbackTransaction();
      console.error('❌ Error creating news:', error);
      return new CommonResponse(false, 500, 'Error creating news', error);
    }
  }

  async createMultipleNews(createNewsDtos: CreateNewsModel[]): Promise<CommonResponse> {
    await this.transactionManager.startTransaction();
    try {
      const newsRepo = this.transactionManager.getRepository(this.newsRepository);
      const userRepo = this.transactionManager.getRepository(this.userRepository);
      const results = [];
      const errors = [];

      for (const dto of createNewsDtos) {
        try {
          if (!dto.title || dto.title.trim() === '') {
            throw new Error('Title is required');
          }
          if (!dto.authorId) {
            throw new Error('Author ID is required');
          }

          // Validate authorId exists
          const author = await userRepo.findOne({ where: { id: dto.authorId } });
          if (!author) {
            throw new Error(`Author not found for ID: ${dto.authorId}`);
          }

          let processedImages: string[] | undefined;
          if (dto.images?.length) {
            processedImages = await Promise.all(
              dto.images.map(async (image, index) => {
                const base64Match = image.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
                if (base64Match) {
                  const ext = base64Match[1];
                  const buffer = new Uint8Array(Buffer.from(base64Match[2], 'base64'));
                  const fileName = `news_${Date.now()}_${index}.${ext}`;
                  const filePath = join(__dirname, 'Uploads', fileName);
                  await fs.writeFile(filePath, buffer);
                  return `/uploads/${fileName}`;
                }
                return image;
              }),
            );
          }

          let processedThumbnail: string | undefined;
          if (dto.thumbnail) {
            const base64Match = dto.thumbnail.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
            if (base64Match) {
              const ext = base64Match[1];
              const buffer = new Uint8Array(Buffer.from(base64Match[2], 'base64'));
              const fileName = `thumbnail_${Date.now()}.${ext}`;
              const filePath = join(__dirname, 'Uploads', fileName);
              await fs.writeFile(filePath, buffer);
              processedThumbnail = `/uploads/${fileName}`;
            } else {
              processedThumbnail = dto.thumbnail;
            }
          }

          const newNews = newsRepo.create({
            title: dto.title.trim(),
            content: dto.content ?? '',
            summary: dto.summary ?? '',
            category: dto.category ?? 'Uncategorized',
            tags: dto.tags ?? [],
            images: processedImages ?? [],
            thumbnail: processedThumbnail ?? '',
            status: dto.status ?? 'draft',
            visibility: dto.visibility ?? 'public',
            isFeatured: dto.isFeatured ?? false,
            isBreaking: dto.isBreaking ?? false,
            publishedAt: dto.publishedAt ?? new Date(),
            authorId: dto.authorId,
            commentIds: [],
          });

          const savedNews = await newsRepo.save(newNews);
          results.push(savedNews);
        } catch (error) {
          console.error(`Error processing news item "${dto.title}":`, error);
          errors.push({
            item: dto,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      await this.transactionManager.commitTransaction();
      if (errors.length > 0) {
        return new CommonResponse(false, 207, 'Some news items failed to create', { successful: results, failed: errors });
      }
      return new CommonResponse(true, 201, 'All news items created successfully', results);
    } catch (error) {
      await this.transactionManager.rollbackTransaction();
      console.error('❌ Critical error creating multiple news:', error);
      return new CommonResponse(false, 500, 'Error creating multiple news', String(error));
    }
  }

  async updateNews(id: string, updateNewsDto: UpdateNewsModel): Promise<CommonResponse> {
    await this.transactionManager.startTransaction();
    try {
      const newsRepo = this.transactionManager.getRepository(this.newsRepository);
      const userRepo = this.transactionManager.getRepository(this.userRepository);

      const existingNews = await newsRepo.findOne({ where: { id } });
      if (!existingNews) throw new Error('News not found');

      // Validate authorId if provided
      if (id) {
        const author = await userRepo.findOne({ where: { id: id } });
        if (!author) {
          throw new Error('Author not found');
        }
      }

      let processedImages: string[] | undefined;
      if (updateNewsDto.images?.length) {
        processedImages = await Promise.all(
          updateNewsDto.images.map(async (image, index) => {
            const base64Match = image.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
            if (base64Match) {
              const ext = base64Match[1];
              const buffer = new Uint8Array(Buffer.from(base64Match[2], 'base64'));
              const fileName = `news_${Date.now()}_${index}.${ext}`;
              const filePath = join(__dirname, 'Uploads', fileName);
              await fs.writeFile(filePath, buffer);
              return `/uploads/${fileName}`;
            }
            return image;
          }),
        );
      }

      let processedThumbnail: string | undefined;
      if (updateNewsDto.thumbnail) {
        const base64Match = updateNewsDto.thumbnail.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
        if (base64Match) {
          const ext = base64Match[1];
          const buffer = new Uint8Array(Buffer.from(base64Match[2], 'base64'));
          const fileName = `thumbnail_${Date.now()}.${ext}`;
          const filePath = join(__dirname, 'Uploads', fileName);
          await fs.writeFile(filePath, buffer);
          processedThumbnail = `/uploads/${fileName}`;
        } else {
          processedThumbnail = updateNewsDto.thumbnail;
        }
      }

      const updatedNews = newsRepo.merge(existingNews, {
        ...updateNewsDto,
        images: processedImages ?? existingNews.images,
        thumbnail: processedThumbnail ?? existingNews.thumbnail,
        authorId: id ?? existingNews.authorId,
      });

      const savedNews = await newsRepo.save(updatedNews);
      await this.transactionManager.commitTransaction();
      return new CommonResponse(true, 200, 'News updated successfully', savedNews);
    } catch (error) {
      await this.transactionManager.rollbackTransaction();
      console.error('❌ Error updating news:', error);
      return new CommonResponse(false, 500, 'Error updating news', error);
    }
  }

  async deleteNews(id: string): Promise<CommonResponse> {
    await this.transactionManager.startTransaction();
    try {
      const newsRepo = this.transactionManager.getRepository(this.newsRepository);
      const commentRepo = this.transactionManager.getRepository(this.commentRepository);
      const likeRepo = this.transactionManager.getRepository(this.likeRepository);

      const news = await newsRepo.findOne({ where: { id } });
      if (!news) throw new Error('News not found');

      await commentRepo.delete({ newsId: id });
      await likeRepo.delete({ newsId: id });
      await newsRepo.remove(news);

      await this.transactionManager.commitTransaction();
      return new CommonResponse(true, 200, 'News deleted successfully', null);
    } catch (error) {
      await this.transactionManager.rollbackTransaction();
      console.error('❌ Error deleting news:', error);
      return new CommonResponse(false, 500, 'Error deleting news', error);
    }
  }

  async addComment(createCommentDto: CreateCommentModel): Promise<CommonResponse> {
    await this.transactionManager.startTransaction();
    try {
      const commentRepo = this.transactionManager.getRepository(this.commentRepository);
      const newsRepo = this.transactionManager.getRepository(this.newsRepository);
      const userRepo = this.transactionManager.getRepository(this.userRepository);

      const news = await newsRepo.findOne({ where: { id: createCommentDto.newsId } });
      if (!news) throw new Error('News not found');
      if (!createCommentDto.authorId) throw new Error('Author ID is required');

      // Validate authorId exists
      const author = await userRepo.findOne({ where: { id: createCommentDto.authorId } });
      if (!author) {
        throw new Error('Author not found');
      }

      const newComment = commentRepo.create({
        content: createCommentDto.content,
        userId: createCommentDto.authorId,
        newsId: createCommentDto.newsId,
      });

      const savedComment = await commentRepo.save(newComment);

      news.commentIds = [...(news.commentIds || []), savedComment.id];
      await newsRepo.save(news);

      await this.transactionManager.commitTransaction();
      return new CommonResponse(true, 201, 'Comment added successfully', savedComment);
    } catch (error) {
      await this.transactionManager.rollbackTransaction();
      console.error('❌ Error adding comment:', error);
      return new CommonResponse(false, 500, 'Error adding comment', error);
    }
  }

  async deleteComment(id: string): Promise<CommonResponse> {
    await this.transactionManager.startTransaction();
    try {
      const commentRepo = this.transactionManager.getRepository(this.commentRepository);
      const newsRepo = this.transactionManager.getRepository(this.newsRepository);

      const comment = await commentRepo.findOne({ where: { id } });
      if (!comment) throw new Error('Comment not found');

      const news = await newsRepo.findOne({ where: { id: comment.newsId } });
      if (news) {
        news.commentIds = (news.commentIds || []).filter((commentId) => commentId !== id);
        await newsRepo.save(news);
      }

      await commentRepo.remove(comment);
      await this.transactionManager.commitTransaction();
      return new CommonResponse(true, 200, 'Comment deleted successfully', null);
    } catch (error) {
      await this.transactionManager.rollbackTransaction();
      console.error('❌ Error deleting comment:', error);
      return new CommonResponse(false, 500, 'Error deleting comment', error);
    }
  }

  async toggleLikeNews(id: string, userId: string): Promise<CommonResponse> {
    await this.transactionManager.startTransaction();
    try {
      const newsRepo = this.transactionManager.getRepository(this.newsRepository);
      const likeRepo = this.transactionManager.getRepository(this.likeRepository);
      const userRepo = this.transactionManager.getRepository(this.userRepository);

      const news = await newsRepo.findOne({ where: { id } });
      if (!news) throw new Error('News not found');
      if (!userId) throw new Error('User ID is required');

      // Validate userId exists
      const user = await userRepo.findOne({ where: { id: userId } });
      if (!user) {
        throw new Error('User not found');
      }

      const existingLike = await likeRepo.findOne({ where: { newsId: id, userId } });
      if (existingLike) {
        await likeRepo.remove(existingLike);
        news.likes = Math.max(0, (news.likes || 0) - 1);
      } else {
        const newLike = likeRepo.create({ userId, newsId: id });
        await likeRepo.save(newLike);
        news.likes = (news.likes || 0) + 1;
      }

      const updatedNews = await newsRepo.save(news);
      await this.transactionManager.commitTransaction();
      return new CommonResponse(true, 200, existingLike ? 'News unliked successfully' : 'News liked successfully', updatedNews);
    } catch (error) {
      await this.transactionManager.rollbackTransaction();
      console.error('❌ Error toggling like:', error);
      return new CommonResponse(false, 500, 'Error toggling like', error);
    }
  }

  async searchNews(query: string): Promise<CommonResponse> {
    try {
      const news = await this.newsRepository.find({
        where: [{ title: Like(`%${query}%`) }, { content: Like(`%${query}%`) }],
      });
      return new CommonResponse(true, 200, 'Search results retrieved', news);
    } catch (error) {
      console.error('❌ Error searching news:', error);
      return new CommonResponse(false, 500, 'Error searching news', error);
    }
  }

  async getAllNews(page: number, limit: number): Promise<CommonResponse> {
    try {
      const [news, total] = await this.newsRepository.findAndCount({
        skip: (page - 1) * limit,
        take: limit,
        order: { createdAt: 'DESC' },
      });

      const newsWithComments = await Promise.all(
        news.map(async (newsItem) => {
          const comments = await this.commentRepository.find({ where: { newsId: newsItem.id } });
          const author = await this.userRepository.findOne({ where: { id: newsItem.authorId } });
          return {
            ...newsItem,
            comments,
            author: author ? { id: author.id, username: author.username, email: author.email } : null,
          };
        }),
      );

      return new CommonResponse(true, 200, 'News retrieved successfully', { news: newsWithComments, total });
    } catch (error) {
      console.error('❌ Error retrieving news:', error);
      return new CommonResponse(false, 500, 'Error retrieving news', error);
    }
  }

  async toggleDislikeNews(id: string, userId: string): Promise<CommonResponse> {
    await this.transactionManager.startTransaction();
    try {
      const newsRepo = this.transactionManager.getRepository(this.newsRepository);
      const likeRepo = this.transactionManager.getRepository(this.likeRepository);
      const userRepo = this.transactionManager.getRepository(this.userRepository);

      const news = await newsRepo.findOne({ where: { id } });
      if (!news) throw new Error('News not found');
      if (!userId) throw new Error('User ID is required');

      // Validate userId exists
      const user = await userRepo.findOne({ where: { id: userId } });
      if (!user) {
        throw new Error('User not found');
      }

      const existingDislike = await likeRepo.findOne({ where: { newsId: id, userId } });
      if (existingDislike) {
        await likeRepo.remove(existingDislike);
        news.dislikes = Math.max(0, (news.dislikes || 0) - 1);
      } else {
        const newDislike = likeRepo.create({ userId, newsId: id });
        await likeRepo.save(newDislike);
        news.dislikes = (news.dislikes || 0) + 1;
      }

      const updatedNews = await newsRepo.save(news);
      await this.transactionManager.commitTransaction();
      return new CommonResponse(true, 200, existingDislike ? 'News undisliked successfully' : 'News disliked successfully', updatedNews);
    } catch (error) {
      await this.transactionManager.rollbackTransaction();
      console.error('❌ Error toggling dislike:', error);
      return new CommonResponse(false, 500, 'Error toggling dislike', error);
    }
  }

  async shareNews(id: string, platform: string): Promise<CommonResponse> {
    try {
      const news = await this.newsRepository.findOne({ where: { id } });
      if (!news) throw new Error('News not found');

      news.shares = (news.shares || 0) + 1;
      const shareData = { newsId: id, platform, sharedAt: new Date(), title: news.title, url: `/news/${id}` };
      await this.newsRepository.save(news);

      return new CommonResponse(true, 200, `News shared successfully on ${platform}`, shareData);
    } catch (error) {
      console.error('❌ Error sharing news:', error);
      return new CommonResponse(false, 500, 'Error sharing news', error);
    }
  }

  async markNewsAsImportant(id: string, isImportant: boolean): Promise<CommonResponse> {
    await this.transactionManager.startTransaction();
    try {
      const newsRepo = this.transactionManager.getRepository(this.newsRepository);
      const news = await newsRepo.findOne({ where: { id } });
      if (!news) throw new Error('News not found');

      news.isImportant = isImportant;
      const updatedNews = await newsRepo.save(news);
      await this.transactionManager.commitTransaction();
      return new CommonResponse(true, 200, `News marked as ${isImportant ? 'important' : 'not important'} successfully`, updatedNews);
    } catch (error) {
      await this.transactionManager.rollbackTransaction();
      console.error('❌ Error marking news as important:', error);
      return new CommonResponse(false, 500, 'Error marking news as important', error);
    }
  }
}
