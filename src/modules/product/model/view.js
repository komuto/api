import _ from 'lodash';
import core from '../../core';

const bookshelf = core.postgres.db;

class ViewModel extends bookshelf.Model {
  // eslint-disable-next-line class-methods-use-this
  get tableName() {
    return 'views';
  }

  // eslint-disable-next-line class-methods-use-this
  get idAttribute() {
    return 'id_views';
  }

  serialize() {
    return {
      id: this.get('id_views'),
      product_id: this.get('id_produk'),
      ip: this.get('ip'),
    };
  }

  static async store(id, ip) {
    const view = await this.where({ id_produk: id }).fetch().catch(() => {});
    if (!view) {
      return await new this({
        id_produk: id,
        ip: [{ ip }],
      }).save();
    }
    const ips = view.serialize().ip;
    const found = _.find(ips, o => (o.ip === ip));
    if (found !== undefined) return view;
    ips.push({ ip });
    return await view.save({ ip: ips }, { patch: true });
  }
}

export const View = bookshelf.model('View', ViewModel);
export default { View };
