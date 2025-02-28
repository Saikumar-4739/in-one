export class CreateUserModel {
    username: string;
    password: string;
    profilePicture: string;
    constructor(
      username: string,
      password: string,
      profilePicture: string = '',
    ) {
      this.username = username;
      this.password = password;
      this.profilePicture = profilePicture;
    }
  }
  