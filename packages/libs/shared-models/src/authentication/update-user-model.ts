export class UpdateUserModel {
    username: string;
    password: string;
    profilePicture: string;
    contacts: string[];
    constructor(
      username: string,
      password: string,
      profilePicture: string = '',
      contacts: string[] = []
    ) {
      this.username = username;
      this.password = password;
      this.profilePicture = profilePicture;
      this.contacts = contacts;
    }

  }
  