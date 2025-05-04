import { Injectable } from '@nestjs/common';
import { DataSource, Like, Repository } from 'typeorm';
import { NewsEntity } from './entities/news.entity';
import { UserEntity } from '../user/entities/user.entity';
import { CommentIdRequestModel, CommonResponse, CreateCommentModel, CreateNewsModel, ErrorResponse, NewsIdRequestModel, ToggleReactionModel, UpdateNewsModel, UpdateViewModel } from '@in-one/shared-models';
import { existsSync, promises as fs } from 'fs';
import { join } from 'path';
import { CommentEntity } from '../masters/common-entities/comment.entity';
import { LikeEntity } from '../masters/common-entities/like.entity';
import { GenericTransactionManager } from 'src/database/trasanction-manager';
import { NewsRepository } from './repository/news.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { mkdir } from 'fs/promises';
import { writeFile } from 'fs/promises';

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
  
    // Util: Validate base64 string
    function isValidBase64Image(data: string): boolean {
      return /^data:image\/[a-zA-Z]+;base64,[A-Za-z0-9+/=]+$/.test(data);
    }
  
    // Util: Save base64 image to file
    async function saveBase64Image(base64: string, filenamePrefix: string, index: number, uploadDir: string): Promise<string> {
      if (!isValidBase64Image(base64)) throw new Error('Invalid base64 image format');
  
      const [, mimeType, base64Data] = base64.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/) || [];
      const buffer = Buffer.from(base64Data, 'base64');
      const extension = mimeType;
      const fileName = `${filenamePrefix}_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 10)}.${extension}`;
      const filePath = join(uploadDir, fileName);
      await writeFile(filePath, buffer);
      return `/uploads/${fileName}`;
    }
  
    try {
      // Basic validation
      if (!reqModel.title || !reqModel.authorId) {
        const missingField = !reqModel.title ? 'Title' : 'Author ID';
        const errorCode = !reqModel.title ? 1 : 2;
        throw new ErrorResponse(errorCode, `${missingField} is required`);
      }
  
      // Validate author exists
      const author = await this.userRepository.findOne({ where: { id: reqModel.authorId } });
      if (!author) throw new ErrorResponse(3, `Author with ID ${reqModel.authorId} not found`);
  
      // Setup uploads directory
      const uploadsDir = join(process.cwd(), 'uploads');
      if (!existsSync(uploadsDir)) {
        await mkdir(uploadsDir, { recursive: true });
      }
  
      await transactionManager.startTransaction();
  
      // Process images
      const processedImages = reqModel.images
        ? await Promise.all(reqModel.images.map((img, i) => saveBase64Image(img, 'news_img', i, uploadsDir)))
        : [];
  
      // Process thumbnail
      const processedThumbnail = reqModel.thumbnail
        ? await saveBase64Image(reqModel.thumbnail, 'news_thumb', -1, uploadsDir)
        : '';
  
      // Create entity
      const newsEntity = new NewsEntity();
      Object.assign(newsEntity, {
        title: reqModel.title.trim(),
        content: reqModel.content,
        summary: reqModel.summary,
        category: reqModel.category,
        tags: reqModel.tags,
        images: processedImages,
        thumbnail: processedThumbnail,
        status: reqModel.status,
        visibility: reqModel.visibility ?? 'public',
        isFeatured: reqModel.isFeatured ?? false,
        isBreaking: reqModel.isBreaking ?? false,
        publishedAt: reqModel.publishedAt ?? new Date(),
        authorId: reqModel.authorId,
        commentIds: [],
      });
  
      const saved = await transactionManager.getRepository(NewsEntity).save(newsEntity);
      await transactionManager.commitTransaction();
  
      return new CommonResponse(true, 201, 'News created successfully', saved);
    } catch (error) {
      await transactionManager.rollbackTransaction();
      return new CommonResponse(false, 500, 'Error creating news', error instanceof Error ? error.message : error);
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
      await this.likeRepository.delete({ entityId: reqModel.newsId });
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

  async toggleReactionNews(reqModel: ToggleReactionModel): Promise<CommonResponse> {
    const transactionManager = new GenericTransactionManager(this.dataSource);
    try {
      await transactionManager.startTransaction();

      // Check for existing reaction
      const existing = await this.likeRepository.findOne({
        where: {
          entityId: reqModel.newsId,
          userId: reqModel.userId,
          entityType: 'news',
        },
      });

      // Validate news
      const news = await this.newsRepo.findOne({
        where: { id: reqModel.newsId },
      });
      if (!news) {
        throw new Error('News not found');
      }

      // Validate user
      const user = await this.userRepository.findOne({
        where: { id: reqModel.userId },
      });
      if (!user) {
        throw new Error('User not found');
      }

      let updatedLikes = news.likes || 0;
      let updatedDislikes = news.dislikes || 0;
      // let isLiked = news.isLiked || false;
      // let isDisliked = news.isDisliked || false;

      if (existing) {
        // Remove existing reaction (toggle off)
        await this.likeRepository.delete({
          entityId: reqModel.newsId,
          userId: reqModel.userId,
          entityType: 'news',
        });
        if (reqModel.reactionType === 'like') {
          updatedLikes = Math.max(0, news.likes - 1);
          // isLiked = false;
        } else {
          updatedDislikes = Math.max(0, news.dislikes - 1);
          // isDisliked = false;
        }
      } else {
        // Create new reaction
        const reaction = this.likeRepository.create({
          entityId: reqModel.newsId,
          userId: reqModel.userId,
          entityType: 'news',
        });
        await this.likeRepository.save(reaction);
        if (reqModel.reactionType === 'like') {
          updatedLikes = news.likes + 1;
          // isLiked = true;
        } else {
          updatedDislikes = news.dislikes + 1;
          // isDisliked = true;
        }
      }

      // Update news counters
      await this.newsRepo.update(reqModel.newsId, {
        likes: updatedLikes,
        dislikes: updatedDislikes,
      });

      await transactionManager.commitTransaction();
      return new CommonResponse(
        true,
        200,
        '',
        {
          id: news.id,
          likes: updatedLikes,
          dislikes: updatedDislikes,
        }
      );
    } catch (error) {
      await transactionManager.rollbackTransaction();
      return new CommonResponse(
        false,
        500,
        `News ${reqModel.reactionType === 'like' ? 'like' : 'dislike'} failed`,
        error
      );
    }
  }

}
