import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getStatus() {
    return {
      success: true,
      status: 'ok',
      message: 'Welcome to the Smart Dine API',
    };
  }
}
