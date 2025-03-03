import { UserEntity } from 'src/app/authentication/entities/user.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { CalendarEventEntity } from './calender.event.entity';


@Entity('calendars')
export class CalendarEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => UserEntity, (user) => user.calendars)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity; 

  @OneToMany(() => CalendarEventEntity, (event) => event.calendar)
  events: CalendarEventEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
