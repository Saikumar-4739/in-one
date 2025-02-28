import { MongooseModule } from '@nestjs/mongoose';
import * as dotenv from 'dotenv';

dotenv.config(); 

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/in-one';

export const DatabaseModule = MongooseModule.forRoot(MONGO_URI);
