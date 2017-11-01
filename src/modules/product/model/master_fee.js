import _ from 'lodash';
import core from '../../core';
import { getFeeError } from '../messages';

const bookshelf = core.postgres.db;
const { parseNum, parseDec } = core.utils;

class MasterFeeModel extends bookshelf.Model {
  // eslint-disable-next-line class-methods-use-this
  get tableName() {
    return 'master_fee';
  }

  // eslint-disable-next-line class-methods-use-this
  get idAttribute() {
    return 'id_masterfee';
  }

  // eslint-disable-next-line class-methods-use-this
  get hasTimestamps() {
    return false;
  }

  serialize() {
    return {
      id: this.get('id_masterfee'),
      marketplace_id: this.get('identifier_marketplace_fee'),
      min: parseNum(this.get('min_fee')),
      max: parseNum(this.get('max_fee')),
      fee: parseDec(this.get('biaya_fee')),
      sibisnis_fee: this.get('sharesibisnis_fee'),
      marketplace_fee: this.get('sharemarketplace_fee'),
      dropshipper_fee: this.get('sharedropshipper_fee'),
    };
  }

  static async calculateCommission(marketplaceId, price, isDropship) {
    let masterFee = await this.where({ identifier_marketplace_fee: marketplaceId })
      .query(qb => qb.where('max_fee', '>=', price).orderBy('max_fee'))
      .fetch();

    if (!masterFee) return 0;

    masterFee = masterFee.serialize();
    if (!isDropship) return masterFee.fee;
    return (masterFee.fee * masterFee.dropshipper_fee) / 100;
  }

  static findByMarketplaceId(marketplaceId) {
    return this.where({ identifier_marketplace_fee: marketplaceId }).orderBy('max_fee').fetchAll();
  }

  static calculateCommissionByFees(masterFee, price, isPercentage = false, isDropship = true) {
    if (!masterFee.models.length) throw getFeeError('master_fee', 'not_found');

    let found = _.find(masterFee.models, o => o.serialize().max >= price);
    if (!found) return 0;

    found = found.serialize();
    if (!isDropship) return found.fee;
    const fee = (found.fee * found.dropshipper_fee) / 100;
    if (isPercentage) return fee;
    return (fee * price) / 100;
  }
}

export const MasterFee = bookshelf.model('MasterFee', MasterFeeModel);
export default { MasterFee };
