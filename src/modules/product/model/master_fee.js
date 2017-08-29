import core from '../../core';

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
}

export const MasterFee = bookshelf.model('MasterFee', MasterFeeModel);
export default { MasterFee };
