export class CreateUserModel {
    username: string;
    password: string;
    email: string;
    profilePicture: string;
    constructor(
      username: string,
      password: string,
      email: string,
      profilePicture: string = '',
    ) {
      this.username = username;
      this.password = password;
      this.email = email;
      this.profilePicture = profilePicture;
    }
  }
  