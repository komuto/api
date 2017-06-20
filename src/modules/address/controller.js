import { Address, Province, District, SubDistrict, Village } from './model';
import { BadRequestError } from '../../../common/errors';

export const AddressController = {};
export default { AddressController };

AddressController.getAddress = async (req, res, next) => {
  const address = await Address.getFullAddress(req.user.id);
  req.resData = {
    message: 'Address Information',
    data: address,
  };
  return next();
};

AddressController.getProvinces = async (req, res, next) => {
  const provinces = await Province.get();
  req.resData = {
    message: 'Provinces Data',
    data: provinces,
  };
  return next();
};

AddressController.getDistricts = async (req, res, next) => {
  const condition = typeof req.param('province_id') === 'undefined' ? {} : { id_provinsi: req.param('province_id') };
  const districts = await District.get(condition);
  req.resData = {
    message: 'Districts Data',
    data: districts,
  };
  return next();
};

AddressController.getSubDistricts = async (req, res, next) => {
  const condition = typeof req.param('district_id') === 'undefined' ? {} : { id_kotakab: req.param('district_id') };
  const subDistricts = await SubDistrict.get(condition);
  req.resData = {
    message: 'Sub Districts Data',
    data: subDistricts,
  };
  return next();
};

AddressController.getVillages = async (req, res, next) => {
  const condition = typeof req.param('sub_district_id') === 'undefined' ? {} : { id_kecamatan: req.param('sub_district_id') };
  const villages = await Village.get(condition);
  req.resData = {
    message: 'Villages Data',
    data: villages,
  };
  return next();
};

AddressController.createAddress = async (req, res, next) => {
  if (req.body.is_primary) {
    if (await Address.checkPrimary(req.user.id)) {
      throw new BadRequestError('Email primary sudah terdaftar');
    }
  }
  req.body.user_id = req.user.id;
  req.body.is_primary = req.body.is_primary ? '1' : '0';
  req.body.is_sale_address = '0';
  await Address.create(Address.matchDBColumn(req.body));
  return next();
};

AddressController.updatePrimaryAddress = async (req, res, next) => {
  await Address.update(
    { id_users: req.user.id, alamat_primary: '1' },
    Address.matchDBColumn(req.body));
  return next();
};

AddressController.deleteAddress = async (req, res, next) => {
  if (req.body.is_primary) {
    if (await Address.checkPrimary(req.user.id)) {
      throw new BadRequestError('Email primary sudah terdaftar');
    }
  }
  req.body.user_id = req.user.id;
  req.body.is_primary = req.body.primary ? '1' : '0';
  req.body.is_sale_address = '0';
  await Address.create(Address.matchDBColumn(req.body));
  return next();
};
