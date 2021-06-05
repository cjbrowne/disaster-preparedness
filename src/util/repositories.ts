import CachingRepository from '@/util/CachingRepository';
import BaseModel from '@/models/BaseModel';

const repositoryCache: Record<string, CachingRepository<any>> = {};
let token: string;

// todo: get base URL from environment
const baseUrl = 'http://localhost:9090/';

export const getRepository:
    <T extends BaseModel>(endpoint: string, clazz: new() => T) => CachingRepository<T> =
    <T extends BaseModel>(endpoint: string, clazz: new() => T): CachingRepository<T> => {
        if (!repositoryCache[endpoint]) {
            repositoryCache[endpoint] = new CachingRepository<T>(
                new URL(endpoint, baseUrl).href,
                token,
                endpoint,
            );
        }
        return repositoryCache[endpoint];
    };
