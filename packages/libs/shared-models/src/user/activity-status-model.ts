export class UserActivityStatus {
  status: string;
  isOnline: boolean;
  lastSeen: Date;
  firstLogin: Date;
  lastActivity: Date;

  constructor(
    status: string,
    isOnline: boolean,
    lastSeen: Date,
    firstLogin: Date,
    lastActivity: Date
  ) {
    this.status = status;
    this.isOnline = status === 'online';
    this.lastSeen = lastSeen;
    this.firstLogin = firstLogin;
    this.lastActivity = lastActivity;
  }
}
