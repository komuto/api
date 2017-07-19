import _ from 'lodash';
import { Expedition, ExpeditionService } from './model';
import { Product } from './../product/model';
import { BadRequestError } from '../../../common/errors';

export const ExpeditionController = {};
export default { ExpeditionController };

/**
 * Get expeditions
 */
ExpeditionController.getExpeditions = async (req, res, next) => {
  const expeditions = await Expedition.getServices();
  req.resData = {
    message: 'Expeditions Data',
    data: expeditions,
  };
  return next();
};

/**
 * Get expedition services
 */
ExpeditionController.getListExpeditionServices = async (req, res, next) => {
  const expeditions = await Expedition.getServices();
  const services = [];

  _.forEach(expeditions, (expedition) => {
    services.push(...expedition.services);
  });

  req.resData = {
    message: 'Expedition Services Data',
    data: services,
  };
  return next();
};

/**
 * Get expedition service
 */
ExpeditionController.getExpeditionService = async (req, res, next) => {
  const services = await ExpeditionService.get({ id_ekspedisi: req.params.id });
  req.resData = {
    message: 'Expedition Services Data',
    data: services,
  };
  return next();
};

/**
 * Get expedition cost
 */
ExpeditionController.getExpeditionCost = async (req, res, next) => {
  const cost = await Expedition.getCost(req.params.id, req.query);
  if (cost.length === 0) throw new BadRequestError('No expedition found');
  req.resData = {
    message: 'Expedition Cost Data',
    data: cost,
  };
  return next();
};

/**
 * Get expedition cost by product id
 */
ExpeditionController.getExpeditionCostByProduct = async (req, res, next) => {
  const costs = [];
  const expeditionIds = await Product.getExpeditionsById(req.query.product_id);
  _.forEach(expeditionIds, async (id) => {
    costs.push(await Expedition.getCost(id, req.query));
  });
  if (costs.length === 0) throw new BadRequestError('No expedition found');
  req.resData = {
    message: 'Expedition Cost Data',
    data: costs,
  };
  return next();
};
