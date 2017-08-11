import express from 'express';

const routes = express.Router();

routes.get('/status', (req, res) => res.status(200).json({ status: 'ok' }));
routes.get('/_sub/foo/', (req, res) => res.json({ code: 200, status: true, message: 'komuto api' }));

export default routes;
