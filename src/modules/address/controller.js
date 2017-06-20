import { Address } from './model/address';
import { Province } from './model/province';
import { District } from './model/district';
import { SubDistrict } from './model/sub_district';
import { Village } from './model/village';
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

AddressController.getDistricts = async (req, res, next) => {
  const condition = typeof req.param('province_id') === 'undefined' ? {} : { id_provinsi: req.param('province_id') };
  const districts = await District.get(condition);
  req.resData = {
    status: true,
    message: 'Districts Data',
    data: districts,
  };
  return next();
};

AddressController.getSubDistricts = async (req, res, next) => {
  const condition = typeof req.param('district_id') === 'undefined' ? {} : { id_kotakab: req.param('district_id') };
  const subDistricts = await SubDistrict.get(condition);
  req.resData = {
    status: true,
    message: 'Sub Districts Data',
    data: subDistricts,
  };
  return next();
};

AddressController.getVillages = async (req, res, next) => {
  const condition = typeof req.param('sub_district_id') === 'undefined' ? {} : { id_kecamatan: req.param('sub_district_id') };
  const villages = await Village.get(condition);
  req.resData = {
    status: true,
    message: 'Villages Data',
    data: villages,
  };
  return next();
};
