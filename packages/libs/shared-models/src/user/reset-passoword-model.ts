export class ResetPassowordModel{
    email: string
    newPassword: string
    token?: string;
    otp?: string;
    constructor(email: string, newPassword: string, token?: string, otp?: string){
        this.email = email
        this.newPassword = newPassword
        this.token = token
        this.otp = otp
    }
}