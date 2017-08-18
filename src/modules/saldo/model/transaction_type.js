import core from '../../core';

const bookshelf = core.postgres.db;

class TransTypeModel extends bookshelf.Model {
  // eslint-disable-next-line class-methods-use-this
  get tableName() {
    return 'tipe_transaksi';
  }

  // eslint-disable-next-line class-methods-use-this
  get idAttribute() {
    return 'kode_tipetransaksi';
  }

  serialize() {
    return {
      type_code: this.get('kode_tipetransaksi'),
      type_name: this.get('nama_tipetransaksi'),
    };
  }
}

export const TransType = bookshelf.model('TransType', TransTypeModel);
export default { TransType };
