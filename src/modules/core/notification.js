import firebaseadmin from 'firebase-admin';

export const sellerNotification = {
  MESSAGE: {
    body: 'Anda memiliki pesan baru',
    type: 'SELLER_MESSAGE',
  },
  CREATE_DISCUSSION: {
    body: 'Anda memiliki diskusi baru',
    type: 'SELLER_DISCUSSION',
  },
  COMMENT_DISCUSSION: {
    body: 'Anda memiliki komentar baru',
    type: 'SELLER_COMMENT_DISCUSSION',
  },
  REVIEW: {
    body: 'Anda memiliki review baru',
    type: 'SELLER_REVIEW',
  },
  TRANSACTION: {
    body: 'Anda memiliki pesanan baru',
    type: 'SELLER_TRANSACTION',
  },
  ORDER_RECEIVED: {
    body: 'Pesanan telah diterima oleh pembeli',
    type: 'SELLER_ORDER_RECEIVED',
  },
  ORDER_COMPLAINED_REFUND: {
    body: 'Pembeli mengajukan refund',
    type: 'SELLER_ORDER_COMPLAINED_REFUND',
  },
  ORDER_COMPLAINED_EXCHANGE: {
    body: 'Pembeli mengajukan tukar barang baru',
    type: 'SELLER_ORDER_COMPLAINED_EXCHANGE',
  },
};

export const buyerNotification = {
  MESSAGE: {
    body: 'Anda memiliki pesan baru',
    type: 'BUYER_MESSAGE',
  },
  COMMENT_DISCUSSION: {
    body: 'Penjual mengomentari diskusi Anda',
    type: 'BUYER_COMMENT_DISCUSSION',
  },
  ORDER_PROCEED: {
    body: 'Pesanan Anda sedang diproses',
    type: 'BUYER_ORDER_PROCEED',
  },
  ORDER_SENT: {
    body: 'Pesanan Anda telah dikirim',
    type: 'BUYER_ORDER_SENT',
  },
  ORDER_REJECTED: {
    body: 'Pesanan Anda ditolak oleh penjual',
    type: 'BUYER_ORDER_REJECTED',
  },
};

class NotificationClass {
  static getPayload(notification, title, data) {
    // TODO: This is ugly
    data = {
      ...data,
      type: notification.type,
    };
    data.custom_notification = JSON.stringify({
      ...data,
      title,
      body: notification.body,
      content_available: true,
      priority: 'high',
      show_in_foreground: true,
    });
    return {
      notification: {
        title,
        body: notification.body,
        content_available: 'true',
        priority: 'high',
        sound: 'default',
      },
      data,
    };
  }

  static send(notification, token, title, data) {
    const payload = this.getPayload(notification, title, data);
    firebaseadmin.messaging().sendToDevice(token, payload)
      .then((response) => {
        console.log('Successfully sent message:');
        console.logFull(response);
      })
      .catch((error) => {
        console.log('Error sending message:');
        console.logFull(error);
      });
  }
}

export const Notification = NotificationClass;
