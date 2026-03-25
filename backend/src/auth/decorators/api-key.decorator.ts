import { SetMetadata } from '@nestjs/common';

export const IS_API_KEY = 'isApiKey';
export const ApiKeyAuth = () => SetMetadata(IS_API_KEY, true);
