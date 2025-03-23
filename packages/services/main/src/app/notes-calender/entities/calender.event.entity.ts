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

  @Column({ nullable: true })
  description: string;

  @Column()
  startDate: Date; // Changed to match entity (was startTime in model)

  @Column()
  endDate: Date;   // Changed to match entity (was endTime in model)

  @Column()
  meetLink: string; // Added for Google Meet

  @Column({ type: 'json', nullable: true })
  participants: string[]; // Array of participant user IDs

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}