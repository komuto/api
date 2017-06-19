import { Address } from './model/address';
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
