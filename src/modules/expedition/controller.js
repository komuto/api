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
  const expeditions = await Expedition.getAllServices();
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
  const expeditions = await Expedition.getAllServices();
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
  const { expedition, services } = await Expedition.getExpeditionNameAndServices(req.params.id);
  const cost = await Expedition.getCost(expedition, services, req.query);
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
  const expeditions = await Product.getExpeditionsById(req.query.product_id);
  // eslint-disable-next-line no-restricted-syntax
  for (const val of expeditions) {
    const cost = await Expedition.getCost(val.expedition, val.services, req.query);
    costs.push(...cost.map(o => ({ ...o, expedition_id: val.expedition_id })));
  }
  if (costs.length === 0) throw new BadRequestError('No expedition found');
  req.resData = {
    message: 'Expedition Cost Data',
    data: costs,
  };
  return next();
};
