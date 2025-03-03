import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { NewsRepository } from './repository/news.repository';
import { CommentRepository } from './repository/comment.repository';
import { UserEntity } from '../authentication/entities/user.entity';
import { GenericTransactionManager } from 'src/database/trasanction-manager';
import { CommonResponse, CreateCommentModel, CreateNewsModel, UpdateNewsModel } from '@in-one/shared-models';


@Injectable()
export class NewsService {
  constructor(
    @InjectRepository(NewsRepository) private readonly newsRepository: NewsRepository,
    @InjectRepository(CommentRepository) private readonly commentRepository: CommentRepository,
    @InjectRepository(UserEntity) private readonly userRepository: Repository<UserEntity>,
    private readonly transactionManager: GenericTransactionManager
  ) {}

  async createNews(createNewsDto: CreateNewsModel): Promise<CommonResponse> {
    await this.transactionManager.startTransaction();
    try {
      const newsRepo = this.transactionManager.getRepository(this.newsRepository);
      const userRepo = this.transactionManager.getRepository(this.userRepository);

      const author = await userRepo.findOne({ where: { id: createNewsDto.authorId } });
      if (!author) throw new Error('Author not found');

      const newNews = newsRepo.create({ ...createNewsDto, author });
      const savedNews = await newsRepo.save(newNews);

      await this.transactionManager.commitTransaction();
      return new CommonResponse(true, 201, 'News created successfully', savedNews);
    } catch (error) {
      await this.transactionManager.rollbackTransaction();
      console.error('❌ Error creating news:', error);
      return new CommonResponse(false, 500, 'Error creating news', error);
    }
  }

  async updateNews(id: string, updateNewsDto: UpdateNewsModel): Promise<CommonResponse> {
    await this.transactionManager.startTransaction();
    try {
      const newsRepo = this.transactionManager.getRepository(this.newsRepository);

      const existingNews = await newsRepo.findOne({ where: { id } });
      if (!existingNews) throw new Error('News not found');

      const updatedNews = newsRepo.merge(existingNews, updateNewsDto);
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

      const news = await newsRepo.findOne({ where: { id } });
      if (!news) throw new Error('News not found');

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

      const author = await userRepo.findOne({ where: { id: createCommentDto.authorId } });
      if (!author) throw new Error('Author not found');

      const newComment = commentRepo.create({
        ...createCommentDto,
        news,
        author,
      });
      const savedComment = await commentRepo.save(newComment);
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

      const comment = await commentRepo.findOne({ where: { id } });
      if (!comment) throw new Error('Comment not found');

      await commentRepo.remove(comment);
      await this.transactionManager.commitTransaction();
      return new CommonResponse(true, 200, 'Comment deleted successfully', null);
    } catch (error) {
      await this.transactionManager.rollbackTransaction();
      console.error('❌ Error deleting comment:', error);
      return new CommonResponse(false, 500, 'Error deleting comment', error);
    }
  }

  async toggleLikeNews(id: string): Promise<CommonResponse> {
    await this.transactionManager.startTransaction();
    try {
      const newsRepo = this.transactionManager.getRepository(this.newsRepository);

      const news = await newsRepo.findOne({ where: { id } });
      if (!news) throw new Error('News not found');

      news.likes += 1;
      const updatedNews = await newsRepo.save(news);

      await this.transactionManager.commitTransaction();
      return new CommonResponse(true, 200, 'News liked successfully', updatedNews);
    } catch (error) {
      await this.transactionManager.rollbackTransaction();
      return new CommonResponse(false, 500, 'Error liking news', error);
    }
  }

  async searchNews(query: string): Promise<CommonResponse> {
    try {
      const news = await this.newsRepository.find({
        where: [
          { title: Like(`%${query}%`) },
          { content: Like(`%${query}%`) },
        ],
      });

      return new CommonResponse(true, 200, 'Search results retrieved', news);
    } catch (error) {
      return new CommonResponse(false, 500, 'Error searching news', error);
    }
  }

  async getAllNews(page: number, limit: number): Promise<CommonResponse> {
    try {
      const [news, total] = await this.newsRepository.findAndCount({
        skip: (page - 1) * limit,
        take: limit,
        relations: ['author', 'comments'],
        order: { createdAt: 'DESC' },
      });

      return new CommonResponse(true, 200, 'News retrieved successfully', { news, total });
    } catch (error) {
      return new CommonResponse(false, 500, 'Error retrieving news', error);
    }
  }
}
