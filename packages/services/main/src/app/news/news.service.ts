import { Injectable } from '@nestjs/common';
import { DataSource, Like, Repository } from 'typeorm';
import { NewsEntity } from './entities/news.entity';
import { UserEntity } from '../user/entities/user.entity';
import { CommentIdRequestModel, CommonResponse, CreateCommentModel, CreateNewsModel, ErrorResponse, NewsIdRequestModel, UpdateNewsModel, UpdateViewModel } from '@in-one/shared-models';
import { promises as fs } from 'fs';
import { join } from 'path';
import { CommentEntity } from '../masters/common-entities/comment.entity';
import { LikeEntity } from '../masters/common-entities/like.entity';
import { GenericTransactionManager } from 'src/database/trasanction-manager';
import { NewsRepository } from './repository/news.repository';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class NewsService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(NewsRepository)
    private readonly newsRepo: NewsRepository,
    @InjectRepository(CommentEntity)
    private readonly commentRepository: Repository<CommentEntity>,
    @InjectRepository(LikeEntity)
    private readonly likeRepository: Repository<LikeEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) { }

  async createNews(reqModel: CreateNewsModel): Promise<CommonResponse> {
    const transactionManager = new GenericTransactionManager(this.dataSource);
    try {
      if (!reqModel.title || !reqModel.authorId) {
        const missingField = !reqModel.title ? 'Title' : 'Author ID';
        const errorCode = !reqModel.title ? 1 : 2;
        throw new ErrorResponse(errorCode, `${missingField} is required`);
      }

      // Validate authorId exists
      const author = await this.userRepository.findOne({ where: { id: reqModel.authorId } });
      if (!author) {
        throw new Error('Author not found');
      }

      await transactionManager.startTransaction();

      let processedImages: string[] = [];
      if (reqModel.images?.length) {
        processedImages = await Promise.all(
          reqModel.images.map(async (base64, index) => {
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

      let processedThumbnail: string = '';
      if (reqModel.thumbnail) {
        const matches = reqModel.thumbnail.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
        if (!matches) throw new Error('Invalid base64 thumbnail format');
        const ext = matches[1];
        const buffer = new Uint8Array(Buffer.from(matches[2], 'base64'));
        const fileName = `thumbnail_${Date.now()}.${ext}`;
        const filePath = join(__dirname, 'Uploads', fileName);
        await fs.writeFile(filePath, buffer);
        processedThumbnail = `/uploads/${fileName}`;
      }

      const newsEntity = new NewsEntity();
      newsEntity.title = reqModel.title.trim();
      newsEntity.content = reqModel.content;
      newsEntity.summary = reqModel.summary;
      newsEntity.category = reqModel.category;
      newsEntity.tags = reqModel.tags;
      newsEntity.images = processedImages;
      newsEntity.thumbnail = processedThumbnail;
      newsEntity.status = reqModel.status;
      newsEntity.visibility = reqModel.visibility ?? 'public';
      newsEntity.isFeatured = reqModel.isFeatured ?? false;
      newsEntity.isBreaking = reqModel.isBreaking ?? false;
      newsEntity.publishedAt = reqModel.publishedAt ?? new Date();
      newsEntity.authorId = reqModel.authorId;
      newsEntity.commentIds = [];

      const saveNews = await transactionManager.getRepository(NewsEntity).save(newsEntity)
      await transactionManager.commitTransaction();
      return new CommonResponse(true, 201, 'News created successfully', saveNews);
    } catch (error) {
      await transactionManager.rollbackTransaction();
      return new CommonResponse(false, 500, 'Error creating news', error);
    }
  }

  async updateNews(reqModel: UpdateNewsModel): Promise<CommonResponse> {
    const transactionManager = new GenericTransactionManager(this.dataSource);
    try {
      const existingNews = await this.newsRepo.findOne({ where: { id: reqModel.newsId } });
      if (!existingNews) {
        throw new ErrorResponse(3, 'News not found');
      }
      const author = await this.userRepository.findOne({ where: { id: reqModel.authorId } });
      if (!author) {
        throw new Error('Author not found');
      }

      await transactionManager.startTransaction()

      let processedImages: string[] | undefined;
      if (reqModel.images?.length) {
        processedImages = await Promise.all(
          reqModel.images.map(async (image, index) => {
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
      if (reqModel.thumbnail) {
        const base64Match = reqModel.thumbnail.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
        if (base64Match) {
          const ext = base64Match[1];
          const buffer = new Uint8Array(Buffer.from(base64Match[2], 'base64'));
          const fileName = `thumbnail_${Date.now()}.${ext}`;
          const filePath = join(__dirname, 'Uploads', fileName);
          await fs.writeFile(filePath, buffer);
          processedThumbnail = `/uploads/${fileName}`;
        } else {
          processedThumbnail = reqModel.thumbnail;
        }
      }

      const updatedNews = this.newsRepo.merge(existingNews, {
        ...reqModel,
        images: processedImages ?? existingNews.images,
        thumbnail: processedThumbnail ?? existingNews.thumbnail,
        authorId: reqModel.authorId ?? existingNews.authorId,
      });

      const updateNews = await this.newsRepo.save(updatedNews);
      await transactionManager.commitTransaction();
      return new CommonResponse(true, 200, 'News updated successfully', updateNews);
    } catch (error) {
      await transactionManager.rollbackTransaction();
      return new CommonResponse(false, 500, 'Error updating news', error);
    }
  }

  async deleteNews(reqModel: NewsIdRequestModel): Promise<CommonResponse> {
    const transactionManager = new GenericTransactionManager(this.dataSource);
    try {
      const news = await this.newsRepo.findOne({ where: { id: reqModel.newsId } });
      if (!news) {
        throw new Error('News not found');
      }
      await transactionManager.startTransaction()

      await this.commentRepository.delete({ newsId: reqModel.newsId });
      await this.likeRepository.delete({ newsId: reqModel.newsId });
      await this.newsRepo.remove(news);

      await transactionManager.commitTransaction();
      return new CommonResponse(true, 200, 'News deleted successfully', null);
    } catch (error) {
      await transactionManager.rollbackTransaction();
      return new CommonResponse(false, 500, 'Error deleting news', error);
    }
  }

  async addComment(reqModel: CreateCommentModel): Promise<CommonResponse> {
    const transactionManager = new GenericTransactionManager(this.dataSource);
    try {
      const news = await this.newsRepo.findOne({ where: { id: reqModel.newsId } });
      if (!news) {
        throw new ErrorResponse(4, 'News not found');
      }

      // Validate authorId exists
      const author = await this.userRepository.findOne({ where: { id: reqModel.authorId } });
      if (!author) {
        throw new ErrorResponse(5, 'Author not found');
      }

      const newComment = await transactionManager.getRepository(CommentEntity).create({ content: reqModel.content, userId: reqModel.authorId, newsId: reqModel.newsId, })
      const savedComment = await this.commentRepository.save(newComment);
      news.commentIds = [...(news.commentIds || []), savedComment.id];
      await this.newsRepo.save(news);
      await transactionManager.commitTransaction();
      return new CommonResponse(true, 201, 'Comment added successfully', savedComment);
    } catch (error) {
      await transactionManager.rollbackTransaction();
      return new CommonResponse(false, 500, 'Error adding comment', error);
    }
  }

  async deleteComment(reqModel: CommentIdRequestModel): Promise<CommonResponse> {
    const transactionManager = new GenericTransactionManager(this.dataSource);
    try {

      const comment = await this.commentRepository.findOne({ where: { id: reqModel.commentId } });
      if (!comment) {
        throw new ErrorResponse(5, 'Comment not found');
      }
      const news = await this.newsRepo.findOne({ where: { id: comment.newsId } });
      if (news) {
        news.commentIds = (news.commentIds || []).filter((commentId: string) => commentId !== commentId);
        await this.newsRepo.save(news);
      }

      await this.commentRepository.remove(comment);
      await transactionManager.commitTransaction();
      return new CommonResponse(true, 200, 'Comment deleted successfully', null);
    } catch (error) {
      await transactionManager.rollbackTransaction();
      return new CommonResponse(false, 500, 'Error deleting comment', error);
    }
  }

  async toggleLikeNews(id: string, userId: string): Promise<CommonResponse> {
    const transactionManager = new GenericTransactionManager(this.dataSource);
    try {

      const news = await this.newsRepo.findOne({ where: { id } });
      if (!news) {
        throw new ErrorResponse(6, 'News not found');
      }
      if (!userId) {
        throw new Error('User ID is required');
      }
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new Error('User not found');
      }

      await transactionManager.startTransaction()

      const existingLike = await this.likeRepository.findOne({ where: { newsId: id, userId } });
      if (existingLike) {
        await this.likeRepository.remove(existingLike);
        news.likes = Math.max(0, (news.likes || 0) - 1);
      } else {
        const newLike = this.likeRepository.create({ userId, newsId: id });
        await this.likeRepository.save(newLike);
        news.likes = (news.likes || 0) + 1;
      }

      const updatedNews = await this.newsRepo.save(news);
      await transactionManager.commitTransaction();
      return new CommonResponse(true, 200, existingLike ? 'News unliked successfully' : 'News liked successfully', updatedNews);
    } catch (error) {
      await transactionManager.rollbackTransaction();
      return new CommonResponse(false, 500, 'Error toggling like', error);
    }
  }

  async searchNews(query: string): Promise<CommonResponse> {
    try {
      const news = await this.newsRepo.find({
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
      const [news, total] = await this.newsRepo.findAndCount({
        skip: (page - 1) * limit,
        take: limit,
        order: { createdAt: 'DESC' },
      });

      const newsWithComments = await Promise.all(
        news.map(async (newsItem: { id: any; authorId: any; }) => {
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
      return new CommonResponse(false, 500, 'Error retrieving news', error);
    }
  }

  async toggleDislikeNews(id: string, userId: string): Promise<CommonResponse> {
    const transactionManager = new GenericTransactionManager(this.dataSource);
    try {
      const news = await this.newsRepo.findOne({ where: { id } });
      if (!news) {
        throw new ErrorResponse(1, 'News not found');
      }
      if (!userId) {
        throw new Error('User ID is required');
      }

      // Validate userId exists
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new Error('User not found');
      }

      await transactionManager.startTransaction()

      const existingDislike = await this.likeRepository.findOne({ where: { newsId: id, userId } });
      if (existingDislike) {
        await this.likeRepository.remove(existingDislike);
        news.dislikes = Math.max(0, (news.dislikes || 0) - 1);
      } else {
        const newDislike = this.likeRepository.create({ userId, newsId: id });
        await this.likeRepository.save(newDislike);
        news.dislikes = (news.dislikes || 0) + 1;
      }
      const updatedNews = await this.newsRepo.save(news);
      await transactionManager.commitTransaction();
      return new CommonResponse(true, 200, existingDislike ? 'News undisliked successfully' : 'News disliked successfully', updatedNews);
    } catch (error) {
      await transactionManager.rollbackTransaction();
      return new CommonResponse(false, 500, 'Error toggling dislike', error);
    }
  }

  async shareNews(id: string, platform: string): Promise<CommonResponse> {
    try {
      const news = await this.newsRepo.findOne({ where: { id } });
      if (!news) throw new Error('News not found');

      news.shares = (news.shares || 0) + 1;
      const shareData = { newsId: id, platform, sharedAt: new Date(), title: news.title, url: `/news/${id}` };
      await this.newsRepo.save(news);

      return new CommonResponse(true, 200, `News shared successfully on ${platform}`, shareData);
    } catch (error) {
      console.error('❌ Error sharing news:', error);
      return new CommonResponse(false, 500, 'Error sharing news', error);
    }
  }

  async markNewsAsImportant(id: string, isImportant: boolean): Promise<CommonResponse> {
    const transactionManager = new GenericTransactionManager(this.dataSource);
    try {
      const news = await this.newsRepo.findOne({ where: { id } });
      if (!news) {
        throw new Error('News not found');
      }
      await transactionManager.startTransaction()
      news.isImportant = isImportant;
      const updatedNews = await this.newsRepo.save(news);
      await transactionManager.commitTransaction();
      return new CommonResponse(true, 200, `News marked as ${isImportant ? 'important' : 'not important'} successfully`, updatedNews);
    } catch (error) {
      await transactionManager.rollbackTransaction();
      return new CommonResponse(false, 500, 'Error marking news as important', error);
    }
  }

  async updateView(req: UpdateViewModel): Promise<CommonResponse> {
    const transactionManager = new GenericTransactionManager(this.dataSource);
    try {
      const news = await this.newsRepo.findOne({ where: { id: req.newsId } });
      if (!news) {
        throw new ErrorResponse(1, 'News Id Not Found');
      }
      await transactionManager.startTransaction();
      const updateView = await transactionManager.getRepository(NewsEntity).update({ id: req.newsId }, { views: req.view });
      await transactionManager.commitTransaction();
      return new CommonResponse(true, 0, 'View Update', updateView)
    } catch (error) {
      await transactionManager.rollbackTransaction();
      return new CommonResponse(false, 1, 'Error Updating View', error)
    }
  }

}
