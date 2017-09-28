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

  static async store(id, ip, idDropship) {
    const where = { id_produk: id };
    if (idDropship) where.id_dropshipper = idDropship;
    const view = await this.where(where).fetch();
    if (!view) {
      const save = { id_produk: id, ip: [{ ip }] };
      if (idDropship) save.id_dropshipper = idDropship;
      return await new this(save).save();
    }
    const ips = view.get('ip');
    const found = ips.some(vIp => vIp.ip === ip);
    if (found) return view;
    ips.push({ ip });
    return await view.save({ ip: ips }, { patch: true });
  }
}

export const View = bookshelf.model('View', ViewModel);
export default { View };
