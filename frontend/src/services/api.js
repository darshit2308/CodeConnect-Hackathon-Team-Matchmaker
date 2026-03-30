import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:3000/api', // Mock Backend URL
});

export default API;
