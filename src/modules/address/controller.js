import _ from 'lodash';
import { Address, Province, District, SubDistrict, Village } from './model';
import { getAddressError, deleteAddressError } from './messages';

export const AddressController = {};
export default { AddressController };

AddressController.getPrimaryAddress = async (req, res, next) => {
  let address = await Address.getFullAddress(req.user.id, true);
  if (!address) address = {};
  req.resData = {
    message: 'Address Information',
    data: address,
  };
  return next();
};

AddressController.getAddress = async (req, res, next) => {
  const address = await Address.getFullAddress(req.user.id, false, req.params.id);
  if (!address) throw getAddressError('address', 'not_found');
  req.resData = {
    message: 'Address Information',
    data: address,
  };
  return next();
};

AddressController.getListAddress = async (req, res, next) => {
  let addresses = await Address.getFullAddressAll(req.user.id);
  if (!addresses) addresses = [];
  req.resData = {
    message: 'Address Information',
    data: addresses,
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
  const condition = typeof req.param('province_id') === 'undefined'
    ? {} : { id_provinsi: req.param('province_id') };
  const districts = await District.get(condition, req.param('q'));
  req.resData = {
    message: 'Districts Data',
    data: districts,
  };
  return next();
};

AddressController.getSubDistricts = async (req, res, next) => {
  const condition = typeof req.param('district_id') === 'undefined'
    ? {} : { id_kotakab: req.param('district_id') };
  const subDistricts = await SubDistrict.get(condition);
  req.resData = {
    message: 'Sub Districts Data',
    data: subDistricts,
  };
  return next();
};

AddressController.getVillages = async (req, res, next) => {
  const condition = typeof req.param('sub_district_id') === 'undefined' ?
    {} : { id_kecamatan: req.param('sub_district_id') };
  const villages = await Village.get(condition);
  req.resData = {
    message: 'Villages Data',
    data: villages,
  };
  return next();
};

AddressController.createAddress = async (req, res, next) => {
  _.assign(req.body, {
    user_id: req.user.id,
    is_primary: 0,
    is_sale_address: 0,
    email: req.user.email,
  });
  const address = await Address.create(Address.matchDBColumn(req.body));
  req.resData = {
    message: 'Address Data',
    data: address,
  };
  return next();
};

AddressController.updateAddress = async (req, res, next) => {
  if (req.body.is_primary !== undefined) {
    // Change primary address status to this if there are other primary address
    if (req.body.is_primary) {
      const address = await Address.checkOtherPrimary(req.user.id, req.params.id);
      if (address) {
        await Address.update({ id_alamatuser: address.id }, { alamat_primary: '0' });
      }
    }
    req.body.is_primary = req.body.is_primary ? '1' : '0';
  }
  const address = await Address.update({ id_alamatuser: req.params.id },
    Address.matchDBColumn(req.body));
  req.resData = {
    message: 'Address Data',
    data: address,
  };
  return next();
};

AddressController.deleteAddress = async (req, res, next) => {
  const address = await Address.where({ id_alamatuser: req.params.id,
    id_users: req.user.id }).fetch();
  if (!address) throw deleteAddressError('address', 'address_not_found');
  await Address.destroy(req.params.id);
  return next();
};
