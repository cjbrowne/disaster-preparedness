import axios from 'axios';

// todo: auth support
// todo: different baseURL in production
export const shtfpApi = axios.create({
    baseURL: 'http://localhost:9090/',
})