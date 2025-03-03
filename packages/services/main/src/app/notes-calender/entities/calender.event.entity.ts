import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { CalendarEntity } from './calender.entity';

@Entity('calendar_events')
export class CalendarEventEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => CalendarEntity, (calendar) => calendar.events)
  @JoinColumn({ name: 'calendar_id' })
  calendar: CalendarEntity; 

  @Column()
  title: string;

  @Column({ default: '' })
  description: string;

  @Column()
  startDate: Date;

  @Column()
  endDate: Date;

  @Column({ default: '' })
  location: string;

  @Column({ type: 'timestamp', nullable: true })
  reminder: Date | null;

  @Column({ default: false })
  isAllDay: boolean;

  @Column('text', { array: true, default: [] })
  participants: string[];

  @Column({ default: false })
  isRecurring: boolean;

  @Column({ type: 'jsonb', nullable: true })
  recurringRule: any; 

  @Column({ default: 'upcoming', enum: ['upcoming', 'completed', 'cancelled'] })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
