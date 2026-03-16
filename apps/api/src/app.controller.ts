import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import {
  AllowAnonymous,
  OptionalAuth,
  Session,
  type UserSession,
} from '@thallesp/nestjs-better-auth';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @AllowAnonymous()
  getStatus() {
    return this.appService.getStatus();
  }

  @Get('users/me')
  getProfile(@Session() session: UserSession) {
    return session.user;
  }

  @Get('users/name')
  @OptionalAuth()
  getUsername(@Session() session?: UserSession) {
    if (!session) {
      return { name: 'Guest' };
    }
    return { name: session.user.name };
  }
}
