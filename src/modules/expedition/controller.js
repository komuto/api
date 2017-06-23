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
  const services = await ExpeditionService.get();
  req.resData = {
    message: 'Expedition services Data',
    data: services.serialize(false),
  };
  return next();
};

/**
 * Get expedition service
 */
ExpeditionController.getExpeditionService = async (req, res, next) => {
  const services = await ExpeditionService.get({ id_ekspedisi: req.params.id });
  req.resData = {
    message: 'Expedition services Data',
    data: services,
  };
  return next();
};
