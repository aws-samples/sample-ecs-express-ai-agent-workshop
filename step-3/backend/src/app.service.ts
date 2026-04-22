import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth(): { status: string; gitSha: string | null } {
    return {
      status: 'ok',
      gitSha: process.env.GIT_SHA || null,
    };
  }
}
