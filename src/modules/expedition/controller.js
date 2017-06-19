import { Expedition } from './model/expedition';
import { ExpeditionService } from './model/service';

export const ExpeditionController = {};
export default { ExpeditionController };

/**
 * Get expeditions
 */
ExpeditionController.getExpeditions = async (req, res, next) => {
  const expeditions = await Expedition.get();
  req.resData = {
    status: true,
    message: 'Expeditions Data',
    data: expeditions,
  };
  return next();
};

/**
 * Get expedition services
 */
ExpeditionController.getExpeditionServices = async (req, res, next) => {
  const services = await ExpeditionService.get();
  req.resData = {
    status: true,
    message: 'Expedition services Data',
    data: services,
  };
  return next();
};
