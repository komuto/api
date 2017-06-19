import { Address } from './model/address';
import { Province } from './model/province';
// import { BadRequestError } from '../../../common/errors';

export const AddressController = {};
export default { AddressController };

AddressController.getAddress = async (req, res, next) => {
  const address = await Address.getFullAddress(req.user.id);
  req.resData = {
    status: true,
    message: 'Address Information',
    data: address,
  };
  return next();
};

AddressController.getProvinces = async (req, res, next) => {
  const provinces = await Province.get();
  req.resData = {
    status: true,
    message: 'Provinces Data',
    data: provinces,
  };
  return next();
};
