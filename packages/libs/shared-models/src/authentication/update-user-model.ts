export class UpdateUserModel {
    username: string;
    password: string;
    email: string;
    profilePicture: string;
    contacts: string[];
    constructor(
      username: string,
      password: string,
      email: string,
      profilePicture: string = '',
      contacts: string[] = []
    ) {
      this.username = username;
      this.password = password;
      this.email = email;
      this.profilePicture = profilePicture;
      this.contacts = contacts;
    }

  }
  