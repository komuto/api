import _ from 'lodash';
import { Expedition, ExpeditionService } from './model';

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
  const cost = await Expedition.getCost(req.params.id, req.body);
  req.resData = {
    message: 'Expedition Cost Data',
    data: cost,
  };
  return next();
};
