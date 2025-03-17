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

  @Column({nullable: true })
  reminder: Date;

  @Column({ default: false })
  isAllDay: boolean;

  @Column({ type: 'json', nullable: true })  // ✅ Use JSON instead of array
  participants: string[];

  @Column({ type: 'boolean', default: false })  // ✅ Explicit boolean type
  isRecurring: boolean;

  @Column({ type: 'json', nullable: true })
  recurringRule: any; 

  @Column({ type: 'enum', enum: ['upcoming', 'completed', 'cancelled'], default: 'upcoming' })  // ✅ Enum type corrected
  status: 'upcoming' | 'completed' | 'cancelled';

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
